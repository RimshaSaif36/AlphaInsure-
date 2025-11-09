const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    message: "AlphaInsure Backend API is running",
    timestamp: new Date().toISOString(),
  });
});

// Demo risk assessment endpoint
app.post("/api/risk/assess", (req, res) => {
  const { coordinates } = req.body;

  // Generate mock risk assessment data
  const riskScore = Math.floor(Math.random() * 100);
  const level =
    riskScore < 30
      ? "low"
      : riskScore < 60
      ? "medium"
      : riskScore < 80
      ? "high"
      : "very_high";

  res.json({
    success: true,
    data: {
      assessmentId: `risk_${Date.now()}`,
      riskScores: {
        overall: {
          score: riskScore,
          level: level,
          confidence: Math.floor(Math.random() * 30) + 70,
        },
        flood: {
          score: Math.floor(Math.random() * 100),
          level: "medium",
          confidence: 85,
          factors: [
            "High precipitation",
            "Low elevation",
            "Proximity to water bodies",
          ],
        },
        wildfire: {
          score: Math.floor(Math.random() * 100),
          level: "high",
          confidence: 92,
          factors: ["Dry vegetation", "High temperatures", "Wind patterns"],
        },
      },
      coordinates,
      timestamp: new Date().toISOString(),
    },
  });
});

// Demo claims endpoint
app.post("/api/claims/submit", (req, res) => {
  const claimData = req.body;

  res.json({
    success: true,
    data: {
      claim: {
        claimId: `CLM_${Date.now()}`,
        status: "processing",
        submittedAt: new Date().toISOString(),
        ...claimData,
      },
      automation: {
        automated: true,
        confidence: 89,
        decision: "approved",
        reason: "AI analysis confirms valid claim with high confidence",
      },
    },
  });
});

// Demo monitoring alerts endpoint
app.get("/api/monitoring/alerts", (req, res) => {
  const alerts = [
    {
      id: "alert_1",
      type: "wildfire",
      severity: "high",
      title: "Wildfire Risk Alert - California",
      description: "High fire danger due to dry conditions and strong winds",
      location: { city: "Los Angeles", state: "CA" },
      affectedProperties: 1250,
      timestamp: new Date().toISOString(),
    },
    {
      id: "alert_2",
      type: "flood",
      severity: "critical",
      title: "Flash Flood Warning - Florida",
      description: "Heavy rainfall causing rapid water rise in low-lying areas",
      location: { city: "Miami", state: "FL" },
      affectedProperties: 890,
      timestamp: new Date().toISOString(),
    },
  ];

  res.json({
    success: true,
    data: alerts,
  });
});

// Demo dashboard data endpoint
app.get("/api/monitoring/dashboard", (req, res) => {
  res.json({
    success: true,
    data: {
      totalProperties: 15420,
      activeClaims: 234,
      automatedClaims: 87,
      avgRiskScore: 42,
      recentAlerts: 15,
      claimsProcessed: 1245,
      riskTrend: "+2.1%",
    },
  });
});

// Demo satellite data endpoint
app.get("/api/satellite/imagery/:lat/:lng", (req, res) => {
  const { lat, lng } = req.params;

  res.json({
    success: true,
    data: {
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
      imagery: {
        source: "NASA MODIS",
        date: new Date().toISOString(),
        resolution: "250m",
        cloudCover: Math.floor(Math.random() * 20),
        quality: "high",
      },
      analysis: {
        vegetation: Math.random(),
        moisture: Math.random(),
        temperature: 25 + Math.random() * 15,
        changeDetection:
          Math.random() > 0.7 ? "significant_change" : "no_change",
      },
    },
  });
});

// Demo auth endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  res.json({
    success: true,
    data: {
      user: {
        id: "1",
        email: email,
        name: "Demo User",
        roles: ["user"],
        company: "AlphaInsure Demo",
      },
      token: "demo_jwt_token_" + Date.now(),
    },
  });
});

app.get("/api/auth/me", (req, res) => {
  res.json({
    success: true,
    data: {
      id: "1",
      email: "demo@alphainsure.com",
      name: "Demo User",
      roles: ["user"],
      company: "AlphaInsure Demo",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AlphaInsure Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🎯 Ready for frontend connections!`);
});

module.exports = app;
