const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
const RiskAssessment = require("../models/RiskAssessment");
const logger = require("../utils/logger");
const aiService = require("../services/aiService");
const satelliteService = require("../services/satelliteService");
const weatherService = require("../services/weatherService");

/**
 * @route   GET /api/risk/property/:propertyId
 * @desc    Get current risk assessment for a property
 * @access  Private
 */
router.get("/property/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    // Get property details
    const property = await Property.findOne({ propertyId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get latest risk assessment
    const riskAssessment = await RiskAssessment.findOne({ propertyId }).sort({
      createdAt: -1,
    });

    if (!riskAssessment || riskAssessment.needsReassessment()) {
      // Trigger new risk assessment
      const newAssessment = await generateRiskAssessment(property);
      return res.json({
        success: true,
        data: {
          property,
          riskAssessment: newAssessment,
          isNew: true,
        },
      });
    }

    res.json({
      success: true,
      data: {
        property,
        riskAssessment,
        isNew: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/risk/assess
 * @desc    Perform risk assessment for coordinates or property
 * @access  Private
 */
router.post("/assess", async (req, res, next) => {
  try {
    const {
      coordinates,
      propertyId,
      assessmentType = "on_demand",
      forceRefresh = false,
    } = req.body;

    let property;

    if (propertyId) {
      property = await Property.findOne({ propertyId });
      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }
    } else if (coordinates) {
      // Create temporary property object for assessment
      property = {
        coordinates: {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        },
        propertyId: `temp_${Date.now()}`,
        propertyType: "unknown",
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Either propertyId or coordinates required",
      });
    }

    // Check for existing recent assessment
    if (!forceRefresh && propertyId) {
      const recentAssessment = await RiskAssessment.findOne({
        propertyId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24 hours
      }).sort({ createdAt: -1 });

      if (recentAssessment) {
        return res.json({
          success: true,
          data: recentAssessment,
          fromCache: true,
        });
      }
    }

    // Generate new risk assessment
    const riskAssessment = await generateRiskAssessment(
      property,
      assessmentType
    );

    res.json({
      success: true,
      data: riskAssessment,
      fromCache: false,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/risk/heatmap
 * @desc    Get risk heatmap data for a geographic area
 * @access  Private
 */
router.get("/heatmap", async (req, res, next) => {
  try {
    const {
      bounds, // {north, south, east, west}
      riskType = "overall",
      gridSize = 0.01, // degrees
    } = req.query;

    if (!bounds) {
      return res.status(400).json({
        success: false,
        message: "Geographic bounds required",
      });
    }

    const boundsObj = JSON.parse(bounds);

    // Generate heatmap data
    const heatmapData = await generateHeatmapData(
      boundsObj,
      riskType,
      gridSize
    );

    res.json({
      success: true,
      data: heatmapData,
      meta: {
        riskType,
        gridSize,
        bounds: boundsObj,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/risk/monitor/:propertyId
 * @desc    Get real-time risk monitoring data
 * @access  Private
 */
router.get("/monitor/:propertyId", async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findOne({ propertyId });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Get real-time monitoring data
    const monitoringData = await getRealTimeMonitoringData(property);

    res.json({
      success: true,
      data: monitoringData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/risk/batch-assess
 * @desc    Perform batch risk assessment for multiple properties
 * @access  Private
 */
router.post("/batch-assess", async (req, res, next) => {
  try {
    const { propertyIds, assessmentType = "scheduled" } = req.body;

    if (!propertyIds || !Array.isArray(propertyIds)) {
      return res.status(400).json({
        success: false,
        message: "PropertyIds array required",
      });
    }

    const results = [];
    const errors = [];

    for (const propertyId of propertyIds) {
      try {
        const property = await Property.findOne({ propertyId });
        if (!property) {
          errors.push({ propertyId, error: "Property not found" });
          continue;
        }

        const assessment = await generateRiskAssessment(
          property,
          assessmentType
        );
        results.push(assessment);
      } catch (error) {
        errors.push({ propertyId, error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        assessments: results,
        errors,
        summary: {
          total: propertyIds.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate risk assessment
async function generateRiskAssessment(property, assessmentType = "on_demand") {
  try {
    const assessmentId = `risk_${property.propertyId}_${Date.now()}`;

    // Gather data from multiple sources
    const [satelliteData, weatherData, aiAnalysis] = await Promise.all([
      satelliteService.getPropertyData(property.coordinates),
      weatherService.getWeatherRisk(property.coordinates),
      aiService.analyzeRisk(property),
    ]);

    // Calculate risk scores
    const riskScores = calculateRiskScores(
      property,
      satelliteData,
      weatherData,
      aiAnalysis
    );

    // Generate recommendations
    const recommendations = generateRecommendations(riskScores, property);

    // Create risk assessment record
    const riskAssessment = new RiskAssessment({
      assessmentId,
      propertyId: property.propertyId,
      assessmentType,
      riskScores,
      dataInputs: {
        satelliteData,
        weatherData,
        geospatialData: {
          elevation: property.elevation || 0,
          proximityToWater: property.riskFactors?.proximityToWater || 0,
        },
      },
      modelMetadata: {
        modelVersion: "1.0.0",
        algorithmUsed: "ensemble_ml",
        validationScore: 87.5,
      },
      recommendations,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    if (property.propertyId && !property.propertyId.startsWith("temp_")) {
      await riskAssessment.save();

      // Update property with current risk score
      await Property.findOneAndUpdate(
        { propertyId: property.propertyId },
        { currentRiskScore: riskScores.overall }
      );
    }

    logger.info(
      `Risk assessment generated for property ${property.propertyId}`
    );
    return riskAssessment;
  } catch (error) {
    logger.error(`Error generating risk assessment: ${error.message}`);
    throw error;
  }
}

// Helper function to calculate risk scores
function calculateRiskScores(property, satelliteData, weatherData, aiAnalysis) {
  const scores = {
    flood: calculateFloodRisk(property, satelliteData, weatherData),
    wildfire: calculateWildfireRisk(property, satelliteData, weatherData),
    hurricane: calculateHurricaneRisk(property, weatherData),
    earthquake: calculateEarthquakeRisk(property),
  };

  // Calculate overall risk as weighted average
  const weights = {
    flood: 0.3,
    wildfire: 0.25,
    hurricane: 0.25,
    earthquake: 0.2,
  };
  const overallScore = Object.keys(weights).reduce((sum, risk) => {
    return sum + scores[risk].score * weights[risk];
  }, 0);

  return {
    overall: {
      score: Math.round(overallScore),
      level: RiskAssessment.getRiskLevel(overallScore),
      confidence: aiAnalysis.confidence || 85,
    },
    flood: scores.flood,
    wildfire: scores.wildfire,
    hurricane: scores.hurricane,
    earthquake: scores.earthquake,
  };
}

function calculateFloodRisk(property, satelliteData, weatherData) {
  let score = 0;
  const factors = [];

  // FEMA flood zone
  if (property.riskFactors?.floodZone) {
    switch (property.riskFactors.floodZone) {
      case "AE":
        score += 40;
        factors.push("High risk flood zone");
        break;
      case "A":
        score += 35;
        factors.push("Flood zone A");
        break;
      case "X":
        score += 10;
        factors.push("Moderate flood zone");
        break;
    }
  }

  // Elevation and proximity to water
  if (property.elevation < 10) {
    score += 20;
    factors.push("Low elevation");
  }

  if (property.riskFactors?.proximityToWater < 1000) {
    score += 15;
    factors.push("Close to water body");
  }

  // Weather patterns
  if (weatherData.historical?.avgPrecipitation > 100) {
    score += 10;
    factors.push("High historical precipitation");
  }

  return {
    score: Math.min(score, 100),
    level: RiskAssessment.getRiskLevel(score),
    factors,
  };
}

function calculateWildfireRisk(property, satelliteData, weatherData) {
  let score = 0;
  const factors = [];

  // Vegetation index (NDVI)
  if (satelliteData.indices?.ndvi > 0.6) {
    score += 20;
    factors.push("Dense vegetation");
  }

  // Moisture content
  if (satelliteData.indices?.moisture < 0.3) {
    score += 25;
    factors.push("Low vegetation moisture");
  }

  // Temperature and humidity
  if (
    weatherData.current?.temperature > 30 &&
    weatherData.current?.humidity < 30
  ) {
    score += 15;
    factors.push("Hot and dry conditions");
  }

  // Historical fire activity
  if (property.riskFactors?.wildfireRisk === "high") {
    score += 30;
    factors.push("High wildfire risk zone");
  }

  return {
    score: Math.min(score, 100),
    level: RiskAssessment.getRiskLevel(score),
    factors,
  };
}

function calculateHurricaneRisk(property, weatherData) {
  let score = 0;
  const factors = [];

  // Hurricane zone
  if (property.riskFactors?.hurricaneZone) {
    score += 40;
    factors.push("Hurricane prone area");
  }

  // Coastal proximity
  if (property.riskFactors?.proximityToWater < 5000) {
    score += 20;
    factors.push("Close to coast");
  }

  // Current storm activity
  if (weatherData.forecast?.stormProbability > 0.5) {
    score += 15;
    factors.push("High storm probability");
  }

  return {
    score: Math.min(score, 100),
    level: RiskAssessment.getRiskLevel(score),
    factors,
  };
}

function calculateEarthquakeRisk(property) {
  let score = 0;
  const factors = [];

  // Earthquake zone
  if (property.riskFactors?.earthquakeZone) {
    score += 30;
    factors.push("Seismic activity zone");
  }

  return {
    score: Math.min(score, 100),
    level: RiskAssessment.getRiskLevel(score),
    factors,
  };
}

function generateRecommendations(riskScores, property) {
  const recommendations = [];

  // High flood risk recommendations
  if (riskScores.flood.score > 60) {
    recommendations.push({
      type: "protective",
      priority: "high",
      description: "Install flood barriers and improve drainage",
      estimatedCost: 15000,
      potentialSavings: 50000,
    });
  }

  // High wildfire risk recommendations
  if (riskScores.wildfire.score > 60) {
    recommendations.push({
      type: "preventive",
      priority: "high",
      description: "Create defensible space and use fire-resistant materials",
      estimatedCost: 8000,
      potentialSavings: 200000,
    });
  }

  return recommendations;
}

// Helper function to generate heatmap data
async function generateHeatmapData(bounds, riskType, gridSize) {
  const heatmapPoints = [];

  for (let lat = bounds.south; lat <= bounds.north; lat += gridSize) {
    for (let lng = bounds.west; lng <= bounds.east; lng += gridSize) {
      // Simplified risk calculation for demo
      const mockRisk = Math.random() * 100;

      heatmapPoints.push({
        lat,
        lng,
        intensity: mockRisk,
        level: RiskAssessment.getRiskLevel(mockRisk),
      });
    }
  }

  return heatmapPoints;
}

// Helper function to get real-time monitoring data
async function getRealTimeMonitoringData(property) {
  try {
    const [currentWeather, satelliteAlerts] = await Promise.all([
      weatherService.getCurrentConditions(property.coordinates),
      satelliteService.getActiveAlerts(property.coordinates),
    ]);

    return {
      property: property.propertyId,
      currentConditions: currentWeather,
      activeAlerts: satelliteAlerts,
      lastUpdated: new Date(),
      riskTrends: {
        flood: { trend: "stable", change: 0 },
        wildfire: { trend: "increasing", change: 5 },
        hurricane: { trend: "stable", change: 0 },
      },
    };
  } catch (error) {
    logger.error(`Error getting monitoring data: ${error.message}`);
    throw error;
  }
}

module.exports = router;
