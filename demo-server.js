const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3001;

// Load environment variables if available
require("dotenv").config({ path: "./backend/.env" });

// API configuration
const NASA_KEY = process.env.NASA_API_KEY || null;
const WEATHER_KEY = process.env.WEATHER_API_KEY || null;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "AlphaInsure Backend API - Demo Mode",
    status: "online",
    timestamp: new Date().toISOString(),
  });
});

// Dashboard stats endpoint
app.get("/api/dashboard/stats", (req, res) => {
  res.json({
    success: true,
    data: {
      totalPolicies: 1247,
      activeClaims: 23,
      monthlyPremiums: 2850000,
      riskScore: 72,
      claimsResolved: 145,
      avgProcessingTime: 3.2,
    },
  });
});

// Risk assessment endpoint with real API integration
app.post("/api/risk/assess", async (req, res) => {
  const { coordinates, assessmentType = "on_demand" } = req.body;

  if (!coordinates || !coordinates.lat || !coordinates.lng) {
    return res.status(400).json({
      success: false,
      error: "Coordinates are required",
    });
  }

  const lat = coordinates.lat;
  const lng = coordinates.lng;

  try {
    // Get real weather data if API key available
    let realWeatherData = null;
    if (WEATHER_KEY) {
      try {
        console.log(`🌤️  Fetching real weather data for ${lat}, ${lng}`);
        const weatherResponse = await axios.get(
          "https://api.openweathermap.org/data/2.5/weather",
          {
            params: {
              lat: lat,
              lon: lng,
              units: "metric",
              appid: WEATHER_KEY,
            },
            timeout: 10000,
          }
        );
        realWeatherData = weatherResponse.data;
        console.log(
          `✅ Real weather data received: ${realWeatherData.weather[0]?.main}, ${realWeatherData.main?.temp}°C`
        );
      } catch (weatherError) {
        console.log(`❌ Weather API failed: ${weatherError.message}`);
      }
    }

    // Get real satellite/imagery data if NASA key available
    let realImageryData = null;
    if (NASA_KEY && NASA_KEY !== "your_nasa_key_here") {
      try {
        console.log(`🛰️  Fetching NASA imagery for ${lat}, ${lng}`);
        const date = new Date().toISOString().split("T")[0];
        const nasaResponse = await axios.get(
          "https://api.nasa.gov/planetary/earth/imagery",
          {
            params: {
              lat: lat,
              lon: lng,
              date: date,
              api_key: NASA_KEY,
            },
            timeout: 15000,
          }
        );
        realImageryData = nasaResponse.data;
        console.log(`✅ NASA imagery received for ${date}`);
      } catch (nasaError) {
        console.log(`❌ NASA API failed: ${nasaError.message}`);
      }
    }

    // Calculate enhanced risk score using real data
    let overallScore = Math.abs(Math.sin(lat) * Math.cos(lng) * 100);
    overallScore = Math.max(10, Math.min(95, Math.round(overallScore)));

    // Enhance score with real weather data
    if (realWeatherData) {
      const temp = realWeatherData.main?.temp || 20;
      const humidity = realWeatherData.main?.humidity || 50;
      const windSpeed = realWeatherData.wind?.speed || 0;

      // Adjust risk based on real conditions
      if (temp > 35 && humidity < 30) overallScore += 15; // Hot and dry
      if (windSpeed > 10) overallScore += 10; // High winds
      if (realWeatherData.weather[0]?.main === "Rain") overallScore += 20; // Rain increases flood risk
      if (realWeatherData.weather[0]?.main === "Clear" && temp > 30)
        overallScore += 10; // Clear hot weather increases fire risk

      overallScore = Math.max(10, Math.min(95, Math.round(overallScore)));
    }

    let level = "low";
    if (overallScore > 30 && overallScore <= 60) level = "medium";
    else if (overallScore > 60 && overallScore <= 80) level = "high";
    else if (overallScore > 80) level = "very_high";

    // Generate specific risk factors with real data influence
    const floodScore = Math.max(
      5,
      Math.min(90, overallScore + Math.round((Math.random() - 0.5) * 30))
    );
    const wildfireScore = Math.max(
      5,
      Math.min(90, overallScore + Math.round((Math.random() - 0.5) * 25))
    );

    const response = {
      success: true,
      data: {
        assessmentId: `risk_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        coordinates: { lat, lng },
        assessmentType,
        timestamp: new Date().toISOString(),
        dataSource: {
          weather: realWeatherData ? "OpenWeatherMap" : "simulated",
          imagery: realImageryData ? "NASA" : "simulated",
          realDataUsed: !!(realWeatherData || realImageryData),
        },
        riskScores: {
          overall: {
            score: overallScore,
            level,
            confidence: Math.round(85 + Math.random() * 10),
            lastUpdated: new Date().toISOString(),
          },
          flood: {
            score: floodScore,
            level:
              floodScore > 60 ? "high" : floodScore > 30 ? "medium" : "low",
            confidence: Math.round(80 + Math.random() * 15),
            factors: [
              "Historical precipitation data",
              "Elevation analysis",
              "Proximity to water bodies",
              realWeatherData
                ? `Current conditions: ${realWeatherData.weather[0]?.main}`
                : "Simulated weather patterns",
            ],
          },
          wildfire: {
            score: wildfireScore,
            level:
              wildfireScore > 60
                ? "high"
                : wildfireScore > 30
                ? "medium"
                : "low",
            confidence: Math.round(75 + Math.random() * 20),
            factors: [
              "Vegetation density analysis",
              "Historical fire patterns",
              realWeatherData
                ? `Current temp: ${realWeatherData.main?.temp}°C, humidity: ${realWeatherData.main?.humidity}%`
                : "Simulated weather conditions",
              realImageryData
                ? "Real satellite imagery analysis"
                : "Historical satellite data",
            ],
          },
        },
        recommendations: [
          "Consider flood insurance options",
          "Implement fire-resistant landscaping",
          realWeatherData
            ? "Monitor current weather alerts"
            : "Install weather monitoring systems",
          "Regular property maintenance required",
        ],
        realWeatherData: realWeatherData
          ? {
              temperature: realWeatherData.main?.temp,
              humidity: realWeatherData.main?.humidity,
              conditions: realWeatherData.weather[0]?.main,
              windSpeed: realWeatherData.wind?.speed,
            }
          : null,
      },
    };

    console.log(
      `🎯 Risk assessment complete: ${level} (${overallScore}%) - Real data: ${response.data.dataSource.realDataUsed}`
    );
    res.json(response);
  } catch (error) {
    console.error("❌ Error in risk assessment:", error.message);

    // Fallback to basic simulation
    let overallScore = Math.abs(Math.sin(lat) * Math.cos(lng) * 100);
    overallScore = Math.max(10, Math.min(95, Math.round(overallScore)));

    let level = "low";
    if (overallScore > 30 && overallScore <= 60) level = "medium";
    else if (overallScore > 60 && overallScore <= 80) level = "high";
    else if (overallScore > 80) level = "very_high";

    res.json({
      success: true,
      data: {
        assessmentId: `risk_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        coordinates: { lat, lng },
        assessmentType,
        timestamp: new Date().toISOString(),
        dataSource: {
          weather: "simulated",
          imagery: "simulated",
          realDataUsed: false,
          error: "API integration failed, using fallback",
        },
        riskScores: {
          overall: {
            score: overallScore,
            level,
            confidence: Math.round(85 + Math.random() * 10),
            lastUpdated: new Date().toISOString(),
          },
          flood: {
            score: Math.max(
              5,
              Math.min(
                90,
                overallScore + Math.round((Math.random() - 0.5) * 30)
              )
            ),
            level: "medium",
            confidence: 75,
            factors: ["Simulated data (API unavailable)"],
          },
          wildfire: {
            score: Math.max(
              5,
              Math.min(
                90,
                overallScore + Math.round((Math.random() - 0.5) * 25)
              )
            ),
            level: "medium",
            confidence: 75,
            factors: ["Simulated data (API unavailable)"],
          },
        },
        recommendations: [
          "Get real API keys for accurate assessment",
          "Contact support for detailed analysis",
        ],
      },
    });
  }
});

// Claims processing endpoint
app.post("/api/claims", (req, res) => {
  const { policyNumber, incidentType, description, coordinates } = req.body;

  const claimId = `CLM-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 6)
    .toUpperCase()}`;

  res.json({
    success: true,
    data: {
      claimId,
      policyNumber,
      status: "submitted",
      incidentType,
      description,
      coordinates,
      submittedAt: new Date().toISOString(),
      estimatedProcessingTime: "3-5 business days",
      nextSteps: [
        "Initial review and validation",
        "Site inspection scheduling",
        "Damage assessment",
        "Settlement processing",
      ],
    },
  });
});

// Get claims endpoint
app.get("/api/claims", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        claimId: "CLM-1730123456-ABC123",
        policyNumber: "POL-2024-001",
        status: "processing",
        incidentType: "flood",
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        estimatedAmount: 25000,
      },
      {
        claimId: "CLM-1730023456-DEF456",
        policyNumber: "POL-2024-002",
        status: "approved",
        incidentType: "wildfire",
        submittedAt: new Date(Date.now() - 172800000).toISOString(),
        estimatedAmount: 75000,
      },
    ],
  });
});

// Monitoring alerts endpoint
app.get("/api/monitoring/alerts", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: "alert_" + Date.now(),
        type: "weather",
        severity: "high",
        title: "Severe Storm Warning",
        description:
          "High winds and heavy rainfall expected in coastal regions",
        coordinates: { lat: 25.7617, lng: -80.1918 },
        timestamp: new Date().toISOString(),
        affectedPolicies: 245,
      },
      {
        id: "alert_" + (Date.now() - 1000),
        type: "wildfire",
        severity: "medium",
        title: "Fire Risk Elevated",
        description: "Dry conditions increase wildfire probability",
        coordinates: { lat: 34.0522, lng: -118.2437 },
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        affectedPolicies: 156,
      },
    ],
  });
});

// Recent activities endpoint
app.get("/api/dashboard/activities", (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: "claim_submitted",
        description: "New flood damage claim submitted",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        metadata: { claimId: "CLM-2024-1101-001", amount: 15000 },
      },
      {
        id: 2,
        type: "risk_assessment",
        description: "High-risk area identified in coastal zone",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        metadata: { location: "Miami Beach, FL", riskScore: 85 },
      },
      {
        id: 3,
        type: "policy_updated",
        description: "Premium adjustment for wildfire coverage",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        metadata: { policyId: "POL-2024-156", adjustment: "+12%" },
      },
    ],
  });
});

// User authentication endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  // Demo authentication - accept any email/password
  res.json({
    success: true,
    data: {
      token: "demo_jwt_token_" + Date.now(),
      user: {
        id: "user_demo_001",
        email: email || "demo@alphainsure.com",
        name: "Demo User",
        role: "admin",
        permissions: ["view_dashboard", "manage_claims", "assess_risk"],
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AlphaInsure Backend API running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:3000`);
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
  console.log(`⚡ Mode: Demo (No database required)`);
});
