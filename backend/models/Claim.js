const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    propertyId: {
      type: String,
      required: true,
      ref: "Property",
    },
    claimType: {
      type: String,
      enum: [
        "flood",
        "wildfire",
        "hurricane",
        "earthquake",
        "hail",
        "wind",
        "other",
      ],
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
    claimAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedLoss: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "submitted",
        "under_review",
        "investigating",
        "approved",
        "denied",
        "paid",
        "closed",
      ],
      default: "submitted",
    },
    automation: {
      isAutomated: { type: Boolean, default: false },
      confidenceScore: { type: Number, min: 0, max: 100 },
      automationReason: { type: String },
      humanReviewRequired: { type: Boolean, default: true },
    },
    satelliteEvidence: {
      preDisasterImagery: {
        imageUrl: { type: String },
        captureDate: { type: Date },
        source: { type: String },
      },
      postDisasterImagery: {
        imageUrl: { type: String },
        captureDate: { type: Date },
        source: { type: String },
      },
      damageAnalysis: {
        damagePercentage: { type: Number, min: 0, max: 100 },
        damageType: [{ type: String }],
        analysisConfidence: { type: Number, min: 0, max: 100 },
        aiModelVersion: { type: String },
      },
    },
    weatherData: {
      eventType: { type: String },
      severity: { type: String },
      windSpeed: { type: Number },
      rainfall: { type: Number },
      temperature: { type: Number },
      humidity: { type: Number },
    },
    adjusterNotes: [
      {
        note: { type: String },
        adjusterName: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    documents: [
      {
        fileName: { type: String },
        fileType: { type: String },
        uploadDate: { type: Date, default: Date.now },
        fileUrl: { type: String },
      },
    ],
    paymentDetails: {
      approvedAmount: { type: Number, min: 0 },
      approvalDate: { type: Date },
      paymentDate: { type: Date },
      paymentMethod: { type: String },
      transactionId: { type: String },
    },
    fraudRisk: {
      riskLevel: { type: String, enum: ["low", "medium", "high"] },
      riskFactors: [{ type: String }],
      flaggedForReview: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
claimSchema.index({ propertyId: 1, incidentDate: -1 });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ claimType: 1, incidentDate: -1 });

// Virtual for processing time
claimSchema.virtual("processingTime").get(function () {
  if (this.status === "paid" || this.status === "closed") {
    const endDate = this.paymentDetails.paymentDate || this.updatedAt;
    return Math.floor((endDate - this.createdAt) / (1000 * 60 * 60 * 24)); // days
  }
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

// Method to check if claim is eligible for automation
claimSchema.methods.isEligibleForAutomation = function () {
  const hasGoodImagery =
    this.satelliteEvidence?.preDisasterImagery?.imageUrl &&
    this.satelliteEvidence?.postDisasterImagery?.imageUrl;
  const hasHighConfidence = this.automation?.confidenceScore >= 85;
  const isLowValue = this.claimAmount <= 50000; // Threshold for automation

  return hasGoodImagery && hasHighConfidence && isLowValue;
};

// Static method to get claims by status
claimSchema.statics.getClaimsByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

module.exports = mongoose.model("Claim", claimSchema);
