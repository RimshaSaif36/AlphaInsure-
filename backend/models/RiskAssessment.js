const mongoose = require("mongoose");

const riskAssessmentSchema = new mongoose.Schema(
  {
    assessmentId: {
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
    assessmentType: {
      type: String,
      enum: ["scheduled", "event_triggered", "on_demand", "claim_related"],
      required: true,
    },
    riskScores: {
      overall: {
        score: { type: Number, min: 0, max: 100, required: true },
        level: {
          type: String,
          enum: ["very_low", "low", "medium", "high", "very_high"],
        },
        confidence: { type: Number, min: 0, max: 100 },
      },
      flood: {
        score: { type: Number, min: 0, max: 100 },
        level: {
          type: String,
          enum: ["very_low", "low", "medium", "high", "very_high"],
        },
        factors: [{ type: String }],
      },
      wildfire: {
        score: { type: Number, min: 0, max: 100 },
        level: {
          type: String,
          enum: ["very_low", "low", "medium", "high", "very_high"],
        },
        factors: [{ type: String }],
      },
      hurricane: {
        score: { type: Number, min: 0, max: 100 },
        level: {
          type: String,
          enum: ["very_low", "low", "medium", "high", "very_high"],
        },
        factors: [{ type: String }],
      },
      earthquake: {
        score: { type: Number, min: 0, max: 100 },
        level: {
          type: String,
          enum: ["very_low", "low", "medium", "high", "very_high"],
        },
        factors: [{ type: String }],
      },
    },
    dataInputs: {
      satelliteData: {
        imagery: {
          source: { type: String },
          captureDate: { type: Date },
          resolution: { type: String },
          cloudCover: { type: Number, min: 0, max: 100 },
        },
        indices: {
          ndvi: { type: Number }, // Vegetation health
          ndwi: { type: Number }, // Water content
          nbr: { type: Number }, // Burn ratio
          moisture: { type: Number },
        },
      },
      weatherData: {
        historical: {
          avgTemperature: { type: Number },
          avgPrecipitation: { type: Number },
          extremeEvents: [{ type: String }],
        },
        current: {
          temperature: { type: Number },
          humidity: { type: Number },
          windSpeed: { type: Number },
          pressure: { type: Number },
        },
        forecast: {
          precipitationRisk: { type: Number },
          stormProbability: { type: Number },
          droughtIndex: { type: Number },
        },
      },
      geospatialData: {
        elevation: { type: Number },
        slope: { type: Number },
        proximityToWater: { type: Number },
        soilType: { type: String },
        landUse: { type: String },
      },
    },
    modelMetadata: {
      modelVersion: { type: String, required: true },
      algorithmUsed: { type: String },
      trainingDataDate: { type: Date },
      validationScore: { type: Number, min: 0, max: 100 },
    },
    riskFactors: [
      {
        factor: { type: String, required: true },
        impact: { type: String, enum: ["low", "medium", "high"] },
        description: { type: String },
        mitigation: { type: String },
      },
    ],
    recommendations: [
      {
        type: { type: String, enum: ["preventive", "protective", "financial"] },
        priority: { type: String, enum: ["low", "medium", "high", "critical"] },
        description: { type: String },
        estimatedCost: { type: Number },
        potentialSavings: { type: Number },
      },
    ],
    validUntil: {
      type: Date,
      required: true,
    },
    triggerEvents: [
      {
        eventType: { type: String },
        threshold: { type: Number },
        action: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient queries
riskAssessmentSchema.index({ propertyId: 1, createdAt: -1 });
riskAssessmentSchema.index({ "riskScores.overall.level": 1 });
riskAssessmentSchema.index({ validUntil: 1 });

// Virtual to check if assessment is current
riskAssessmentSchema.virtual("isCurrent").get(function () {
  return this.validUntil > new Date();
});

// Method to get risk level from score
riskAssessmentSchema.statics.getRiskLevel = function (score) {
  if (score >= 80) return "very_high";
  if (score >= 60) return "high";
  if (score >= 40) return "medium";
  if (score >= 20) return "low";
  return "very_low";
};

// Method to check if reassessment is needed
riskAssessmentSchema.methods.needsReassessment = function () {
  const daysSinceAssessment =
    (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const isHighRisk =
    this.riskScores.overall.level === "high" ||
    this.riskScores.overall.level === "very_high";

  if (isHighRisk && daysSinceAssessment > 30) return true;
  if (daysSinceAssessment > 90) return true;
  if (this.validUntil < new Date()) return true;

  return false;
};

module.exports = mongoose.model("RiskAssessment", riskAssessmentSchema);
