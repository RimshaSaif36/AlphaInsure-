const express = require("express");
const router = express.Router();
const multer = require("multer");
const sharp = require("sharp");
const Claim = require("../models/Claim");
const Property = require("../models/Property");
const logger = require("../utils/logger");
const aiService = require("../services/aiService");
const satelliteService = require("../services/satelliteService");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

/**
 * @route   POST /api/claims/submit
 * @desc    Submit a new insurance claim
 * @access  Private
 */
router.post(
  "/submit",
  upload.array("documents", 10),
  async (req, res, next) => {
    try {
      const { propertyId, claimType, incidentDate, claimAmount, description } =
        req.body;

      // Validate property exists
      const property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }

      // Generate claim ID
      const claimId = `CLM_${Date.now()}_${propertyId}`;

      // Process uploaded documents
      const documents = [];
      if (req.files) {
        for (const file of req.files) {
          // Optimize image
          const optimizedBuffer = await sharp(file.buffer)
            .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();

          // In production, save to cloud storage
          const fileUrl = `uploads/claims/${claimId}/${file.originalname}`;

          documents.push({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileUrl,
          });
        }
      }

      // Get satellite imagery for the incident location
      const satelliteEvidence = await getSatelliteEvidence(
        property,
        new Date(incidentDate)
      );

      // Create claim record
      const claim = new Claim({
        claimId,
        propertyId,
        claimType,
        incidentDate: new Date(incidentDate),
        claimAmount: parseFloat(claimAmount),
        status: "submitted",
        documents,
        satelliteEvidence,
        automation: {
          isAutomated: false,
          humanReviewRequired: true,
        },
      });

      await claim.save();

      // Trigger automated assessment
      const automationResult = await processClaimAutomation(claim);

      // Emit real-time update
      const io = req.app.get("io");
      io.to("claims").emit("newClaim", {
        claimId: claim.claimId,
        status: claim.status,
        automation: automationResult,
      });

      res.status(201).json({
        success: true,
        data: {
          claim,
          automation: automationResult,
        },
        message: "Claim submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/claims/dashboard/summary
 * @desc    Get claims dashboard summary
 * @access  Private
 */
router.get("/dashboard/summary", async (req, res, next) => {
  try {
    const { timeframe = "30d" } = req.query;

    // Calculate date range
    const days = timeframe === "7d" ? 7 : timeframe === "90d" ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate claims data
    const summary = await Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalAmount: { $sum: "$claimAmount" },
          automatedClaims: {
            $sum: { $cond: ["$automation.isAutomated", 1, 0] },
          },
          approvedClaims: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
          },
          deniedClaims: {
            $sum: { $cond: [{ $eq: ["$status", "denied"] }, 1, 0] },
          },
          pendingClaims: {
            $sum: {
              $cond: [
                { $in: ["$status", ["submitted", "under_review"]] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Get claims by type
    const claimsByType = await Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$claimType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$claimAmount" },
        },
      },
    ]);

    // Get automation statistics
    const automationStats = await Claim.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          "automation.isAutomated": true,
        },
      },
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$automation.confidenceScore" },
          avgProcessingTime: { $avg: "$processingTime" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {},
        claimsByType,
        automation: automationStats[0] || {},
        timeframe,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/claims/pending
 * @desc    Get pending claims requiring attention
 * @access  Private
 */
router.get("/pending", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, priority = "all" } = req.query;

    const query = {
      status: { $in: ["submitted", "under_review", "investigating"] },
    };

    // Add priority filter
    if (priority === "high") {
      query.$or = [
        { claimAmount: { $gt: 100000 } },
        { "automation.humanReviewRequired": true },
        { "fraudRisk.riskLevel": "high" },
      ];
    }

    const claims = await Claim.find(query)
      .sort({
        "fraudRisk.riskLevel": -1,
        claimAmount: -1,
        createdAt: -1,
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("propertyId", "address coordinates");

    const total = await Claim.countDocuments(query);

    res.json({
      success: true,
      data: {
        claims,
        pagination: {
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/claims/:claimId
 * @desc    Get claim details
 * @access  Private
 */
router.get("/:claimId", async (req, res, next) => {
  try {
    const { claimId } = req.params;

    const claim = await Claim.findOne({ claimId }).populate(
      "propertyId",
      "address coordinates propertyType"
    );

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/claims/:claimId/status
 * @desc    Update claim status
 * @access  Private
 */
router.put("/:claimId/status", async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const { status, adjusterNotes, paymentDetails } = req.body;

    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    // Update claim status
    claim.status = status;

    // Add adjuster notes if provided
    if (adjusterNotes) {
      claim.adjusterNotes.push({
        note: adjusterNotes,
        adjusterName: req.user.name || "System",
        timestamp: new Date(),
      });
    }

    // Add payment details if approved
    if (status === "approved" && paymentDetails) {
      claim.paymentDetails = {
        ...paymentDetails,
        approvalDate: new Date(),
      };
    }

    await claim.save();

    // Emit real-time update
    const io = req.app.get("io");
    io.to("claims").emit("claimUpdate", {
      claimId: claim.claimId,
      status: claim.status,
      updatedAt: claim.updatedAt,
    });

    res.json({
      success: true,
      data: claim,
      message: `Claim status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/claims/:claimId/automate
 * @desc    Trigger automated claim processing
 * @access  Private
 */
router.post("/:claimId/automate", async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const { forceProcess = false } = req.body;

    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: "Claim not found",
      });
    }

    // Check if claim is eligible for automation
    if (!forceProcess && !claim.isEligibleForAutomation()) {
      return res.status(400).json({
        success: false,
        message: "Claim not eligible for automation",
        reasons: getIneligibilityReasons(claim),
      });
    }

    // Process automation
    const automationResult = await processClaimAutomation(claim);

    res.json({
      success: true,
      data: {
        claim,
        automation: automationResult,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get satellite evidence
async function getSatelliteEvidence(property, incidentDate) {
  try {
    const preDisasterDate = new Date(
      incidentDate.getTime() - 30 * 24 * 60 * 60 * 1000
    ); // 30 days before
    const postDisasterDate = new Date(
      incidentDate.getTime() + 7 * 24 * 60 * 60 * 1000
    ); // 7 days after

    const [preImagery, postImagery] = await Promise.all([
      satelliteService.getImagery(property.coordinates, preDisasterDate),
      satelliteService.getImagery(property.coordinates, postDisasterDate),
    ]);

    return {
      preDisasterImagery: preImagery,
      postDisasterImagery: postImagery,
    };
  } catch (error) {
    logger.error(`Error getting satellite evidence: ${error.message}`);
    return {};
  }
}

// Helper function to process claim automation
async function processClaimAutomation(claim) {
  try {
    logger.info(`Processing automation for claim ${claim.claimId}`);

    // Analyze satellite imagery for damage
    let damageAnalysis = {};
    if (
      claim.satelliteEvidence?.preDisasterImagery &&
      claim.satelliteEvidence?.postDisasterImagery
    ) {
      damageAnalysis = await aiService.analyzeDamage(
        claim.satelliteEvidence.preDisasterImagery,
        claim.satelliteEvidence.postDisasterImagery
      );
    }

    // Fraud detection
    const fraudAnalysis = await aiService.detectFraud(claim);

    // Calculate confidence score
    const confidenceScore = calculateConfidenceScore(
      damageAnalysis,
      fraudAnalysis,
      claim
    );

    // Determine if automation should proceed
    const shouldAutomate =
      confidenceScore >= 80 &&
      fraudAnalysis.riskLevel !== "high" &&
      claim.claimAmount <= 50000;

    // Update claim with automation results
    claim.automation = {
      isAutomated: shouldAutomate,
      confidenceScore,
      automationReason: shouldAutomate
        ? "High confidence automated assessment"
        : "Requires human review",
      humanReviewRequired: !shouldAutomate,
    };

    claim.satelliteEvidence.damageAnalysis = damageAnalysis;
    claim.fraudRisk = fraudAnalysis;

    // Auto-approve low-risk claims
    if (
      shouldAutomate &&
      confidenceScore > 90 &&
      fraudAnalysis.riskLevel === "low"
    ) {
      claim.status = "approved";
      claim.paymentDetails = {
        approvedAmount: Math.min(
          claim.claimAmount,
          damageAnalysis.estimatedLoss || claim.claimAmount
        ),
        approvalDate: new Date(),
      };
    }

    await claim.save();

    const result = {
      automated: shouldAutomate,
      confidence: confidenceScore,
      damageDetected: damageAnalysis.damagePercentage > 0,
      fraudRisk: fraudAnalysis.riskLevel,
      decision: claim.status,
      reasoning: generateReasoningExplanation(
        damageAnalysis,
        fraudAnalysis,
        confidenceScore
      ),
    };

    logger.info(`Automation completed for claim ${claim.claimId}:`, result);
    return result;
  } catch (error) {
    logger.error(
      `Error processing automation for claim ${claim.claimId}: ${error.message}`
    );

    // Update claim to require human review on automation failure
    claim.automation = {
      isAutomated: false,
      confidenceScore: 0,
      automationReason: `Automation failed: ${error.message}`,
      humanReviewRequired: true,
    };
    await claim.save();

    return {
      automated: false,
      error: error.message,
      requiresHumanReview: true,
    };
  }
}

// Helper function to calculate confidence score
function calculateConfidenceScore(damageAnalysis, fraudAnalysis, claim) {
  let confidence = 50; // Base confidence

  // Satellite imagery analysis confidence
  if (damageAnalysis.analysisConfidence) {
    confidence += damageAnalysis.analysisConfidence * 0.3;
  }

  // Fraud analysis confidence
  if (fraudAnalysis.riskLevel === "low") confidence += 20;
  else if (fraudAnalysis.riskLevel === "high") confidence -= 30;

  // Claim completeness
  if (claim.documents && claim.documents.length > 0) confidence += 10;
  if (
    claim.satelliteEvidence?.preDisasterImagery &&
    claim.satelliteEvidence?.postDisasterImagery
  ) {
    confidence += 15;
  }

  // Weather correlation
  // This would check if weather events align with the claim type and date
  confidence += 5; // Simplified for demo

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

// Helper function to generate reasoning explanation
function generateReasoningExplanation(
  damageAnalysis,
  fraudAnalysis,
  confidenceScore
) {
  const reasons = [];

  if (damageAnalysis.damagePercentage > 0) {
    reasons.push(
      `Satellite imagery shows ${damageAnalysis.damagePercentage}% damage`
    );
  }

  if (fraudAnalysis.riskLevel === "low") {
    reasons.push("Low fraud risk indicators");
  } else if (fraudAnalysis.riskLevel === "high") {
    reasons.push("High fraud risk detected - requires investigation");
  }

  if (confidenceScore >= 90) {
    reasons.push("Very high confidence in automated assessment");
  } else if (confidenceScore >= 70) {
    reasons.push("Good confidence in automated assessment");
  } else {
    reasons.push("Low confidence - human review recommended");
  }

  return reasons.join("; ");
}

// Helper function to get ineligibility reasons
function getIneligibilityReasons(claim) {
  const reasons = [];

  if (claim.claimAmount > 50000) {
    reasons.push("Claim amount exceeds automation threshold");
  }

  if (
    !claim.satelliteEvidence?.preDisasterImagery ||
    !claim.satelliteEvidence?.postDisasterImagery
  ) {
    reasons.push("Insufficient satellite imagery evidence");
  }

  if (claim.fraudRisk?.riskLevel === "high") {
    reasons.push("High fraud risk detected");
  }

  return reasons;
}

module.exports = router;
