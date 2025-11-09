const axios = require("axios");
const logger = require("../utils/logger");

class AIService {
  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || "http://localhost:5000";
    this.apiKey = process.env.AI_ENGINE_API_KEY;
  }

  /**
   * Analyze risk for a property using AI models
   */
  async analyzeRisk(propertyData) {
    try {
      logger.info(`Analyzing risk for property ${propertyData.propertyId}`);

      const response = await axios.post(
        `${this.aiEngineUrl}/api/ai/analyze-risk`,
        {
          property: propertyData,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "AI risk analysis failed");
      }
    } catch (error) {
      logger.error(`Error in AI risk analysis: ${error.message}`);

      // Return fallback result if AI service is unavailable
      return this.getFallbackRiskAnalysis(propertyData);
    }
  }

  /**
   * Analyze damage from satellite imagery using AI
   */
  async analyzeDamage(preDisasterImagery, postDisasterImagery) {
    try {
      logger.info("Analyzing damage from satellite imagery");

      const response = await axios.post(
        `${this.aiEngineUrl}/api/ai/analyze-damage`,
        {
          preDisasterImagery,
          postDisasterImagery,
        },
        {
          headers: this.getHeaders(),
          timeout: 60000, // Longer timeout for image processing
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "AI damage analysis failed");
      }
    } catch (error) {
      logger.error(`Error in AI damage analysis: ${error.message}`);

      // Return fallback result
      return this.getFallbackDamageAnalysis();
    }
  }

  /**
   * Detect fraud using AI models
   */
  async detectFraud(claimData) {
    try {
      logger.info(`Detecting fraud for claim ${claimData.claimId}`);

      const response = await axios.post(
        `${this.aiEngineUrl}/api/ai/detect-fraud`,
        {
          claim: claimData,
        },
        {
          headers: this.getHeaders(),
          timeout: 30000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || "AI fraud detection failed");
      }
    } catch (error) {
      logger.error(`Error in AI fraud detection: ${error.message}`);

      // Return fallback result
      return this.getFallbackFraudAnalysis();
    }
  }

  /**
   * Process multiple AI requests in batch
   */
  async batchProcess(requests) {
    try {
      logger.info(`Processing batch of ${requests.length} AI requests`);

      const response = await axios.post(
        `${this.aiEngineUrl}/api/ai/batch-process`,
        {
          requests,
        },
        {
          headers: this.getHeaders(),
          timeout: 120000, // Longer timeout for batch processing
        }
      );

      if (response.data.success) {
        return response.data.data.results;
      } else {
        throw new Error(response.data.error || "AI batch processing failed");
      }
    } catch (error) {
      logger.error(`Error in AI batch processing: ${error.message}`);

      // Process each request individually as fallback
      const results = [];
      for (const request of requests) {
        try {
          let result;
          switch (request.type) {
            case "risk_analysis":
              result = await this.analyzeRisk(request.data);
              break;
            case "damage_analysis":
              result = await this.analyzeDamage(
                request.data.preImageUrl,
                request.data.postImageUrl
              );
              break;
            case "fraud_detection":
              result = await this.detectFraud(request.data);
              break;
            default:
              result = { error: "Unknown request type" };
          }

          results.push({
            id: request.id,
            type: request.type,
            success: !result.error,
            result,
          });
        } catch (err) {
          results.push({
            id: request.id,
            type: request.type,
            success: false,
            result: { error: err.message },
          });
        }
      }

      return results;
    }
  }

  /**
   * Get AI model information
   */
  async getModelInfo() {
    try {
      const response = await axios.get(
        `${this.aiEngineUrl}/api/ai/model-info`,
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error("Failed to get model info");
      }
    } catch (error) {
      logger.error(`Error getting AI model info: ${error.message}`);
      return {
        models: {
          damage_detection: { status: "unavailable" },
          risk_scoring: { status: "unavailable" },
          fraud_detection: { status: "unavailable" },
        },
        error: error.message,
      };
    }
  }

  /**
   * Check if AI service is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.aiEngineUrl}/health`, {
        timeout: 5000,
      });

      return response.status === 200 && response.data.status === "healthy";
    } catch (error) {
      logger.warn(`AI service health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get request headers
   */
  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Fallback risk analysis when AI service is unavailable
   */
  getFallbackRiskAnalysis(propertyData) {
    logger.info("Using fallback risk analysis");

    // Simple rule-based risk assessment
    let overallScore = 50; // Base score
    const topRiskFactors = [];

    // Basic geographic risk factors
    if (propertyData.riskFactors?.floodZone === "AE") {
      overallScore += 20;
      topRiskFactors.push({ factor: "flood_zone", importance: 0.8 });
    }

    if (propertyData.riskFactors?.wildfireRisk === "high") {
      overallScore += 15;
      topRiskFactors.push({ factor: "wildfire_risk", importance: 0.7 });
    }

    if (propertyData.riskFactors?.proximityToWater < 1000) {
      overallScore += 10;
      topRiskFactors.push({ factor: "water_proximity", importance: 0.6 });
    }

    if (propertyData.construction?.yearBuilt < 1980) {
      overallScore += 10;
      topRiskFactors.push({ factor: "building_age", importance: 0.5 });
    }

    return {
      overallRiskScore: Math.min(overallScore, 100),
      confidence: 60, // Lower confidence for fallback
      topRiskFactors,
      modelVersion: "Fallback_v1.0",
      fallback: true,
    };
  }

  /**
   * Fallback damage analysis when AI service is unavailable
   */
  getFallbackDamageAnalysis() {
    logger.info("Using fallback damage analysis");

    // Return conservative estimate
    return {
      damagePercentage: 25, // Conservative estimate
      damageType: ["structural_assessment_required"],
      analysisConfidence: 30, // Low confidence
      aiModelVersion: "Fallback_v1.0",
      estimatedLoss: 25000, // Conservative estimate
      fallback: true,
      note: "Manual assessment recommended - AI service unavailable",
    };
  }

  /**
   * Fallback fraud analysis when AI service is unavailable
   */
  getFallbackFraudAnalysis() {
    logger.info("Using fallback fraud analysis");

    // Return medium risk to ensure human review
    return {
      riskLevel: "medium",
      fraudProbability: 0.5,
      riskFactors: ["ai_service_unavailable"],
      flaggedForReview: true,
      fallback: true,
      note: "Human review required - AI service unavailable",
    };
  }

  /**
   * Validate AI response data
   */
  validateResponse(data, expectedFields) {
    for (const field of expectedFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }

  /**
   * Retry mechanism for AI requests
   */
  async retryRequest(requestFn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          logger.warn(
            `AI request attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Format property data for AI analysis
   */
  formatPropertyData(property) {
    return {
      propertyId: property.propertyId,
      coordinates: property.coordinates,
      propertyType: property.propertyType,
      construction: property.construction,
      riskFactors: property.riskFactors,
      currentRiskScore: property.currentRiskScore,
    };
  }

  /**
   * Format claim data for fraud detection
   */
  formatClaimData(claim) {
    return {
      claimId: claim.claimId,
      propertyId: claim.propertyId,
      claimType: claim.claimType,
      incidentDate: claim.incidentDate,
      reportedDate: claim.reportedDate,
      claimAmount: claim.claimAmount,
      documents: claim.documents,
      satelliteEvidence: claim.satelliteEvidence,
      weatherData: claim.weatherData,
    };
  }
}

module.exports = new AIService();
