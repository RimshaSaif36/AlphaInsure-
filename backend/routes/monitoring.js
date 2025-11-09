const express = require("express");
const router = express.Router();
const satelliteService = require("../services/satelliteService");
const weatherService = require("../services/weatherService");
const aiService = require("../services/aiService");
const logger = require("../utils/logger");

/**
 * @route   GET /api/monitoring/alerts
 * @desc    Get all active alerts and monitoring data
 * @access  Private
 */
router.get("/alerts", async (req, res, next) => {
  try {
    const { lat, lng, radius = 100, severity } = req.query;

    let alerts = [];

    if (lat && lng) {
      // Get alerts for specific location
      const coordinates = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      };
      alerts = await satelliteService.getActiveAlerts(
        coordinates,
        parseInt(radius)
      );
    } else {
      // Get global alerts from real-time monitoring
      const realtimeEvents = await satelliteService.monitorRealtimeFeeds();
      alerts = realtimeEvents.map((event) => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        title: `${event.type.replace("_", " ").toUpperCase()} Detected`,
        description: `Confidence: ${event.confidence}%`,
        location: event.location,
        issuedAt: event.detectedAt,
        source: event.source,
        actionRequired:
          event.severity === "high" || event.severity === "extreme",
      }));
    }

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter((alert) => alert.severity === severity);
    }

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/monitoring/weather/:lat/:lng
 * @desc    Get weather monitoring data for location
 * @access  Private
 */
router.get("/weather/:lat/:lng", async (req, res, next) => {
  try {
    const { lat, lng } = req.params;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const weatherRisk = await weatherService.getWeatherRisk(coordinates);

    res.json({
      success: true,
      data: weatherRisk,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/monitoring/satellite/:lat/:lng
 * @desc    Get satellite monitoring data for location
 * @access  Private
 */
router.get("/satellite/:lat/:lng", async (req, res, next) => {
  try {
    const { lat, lng } = req.params;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const satelliteData = await satelliteService.getPropertyData(coordinates);

    res.json({
      success: true,
      data: satelliteData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/monitoring/setup-watch
 * @desc    Set up monitoring for a specific property or area
 * @access  Private
 */
router.post("/setup-watch", async (req, res, next) => {
  try {
    const {
      propertyId,
      coordinates,
      alertTypes,
      notificationMethods,
      thresholds,
    } = req.body;

    // In a real implementation, this would set up continuous monitoring
    // For demo, we'll simulate setting up a watch

    const watchId = `watch_${Date.now()}_${propertyId || "coord"}`;

    const watchConfig = {
      watchId,
      propertyId,
      coordinates,
      alertTypes: alertTypes || ["wildfire", "flood", "hurricane"],
      notificationMethods: notificationMethods || ["email", "sms"],
      thresholds: thresholds || {
        riskScoreChange: 20,
        weatherSeverity: "high",
        satelliteChange: 15,
      },
      status: "active",
      createdAt: new Date(),
      lastCheck: new Date(),
    };

    // Emit real-time update
    const io = req.app.get("io");
    io.to("monitoring").emit("watchSetup", watchConfig);

    res.status(201).json({
      success: true,
      data: watchConfig,
      message: "Monitoring watch set up successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/monitoring/dashboard
 * @desc    Get monitoring dashboard data
 * @access  Private
 */
router.get("/dashboard", async (req, res, next) => {
  try {
    // Get recent events and alerts
    const realtimeEvents = await satelliteService.monitorRealtimeFeeds();

    // Simulate some dashboard metrics
    const dashboardData = {
      activeAlerts: realtimeEvents.length,
      monitoredProperties: 15420,
      highRiskProperties: Math.floor(Math.random() * 500 + 100),
      automatedResponses: Math.floor(Math.random() * 50 + 20),
      lastUpdate: new Date(),
      alertBreakdown: {
        critical: realtimeEvents.filter((e) => e.severity === "critical")
          .length,
        high: realtimeEvents.filter((e) => e.severity === "high").length,
        medium: realtimeEvents.filter((e) => e.severity === "medium").length,
        low: realtimeEvents.filter((e) => e.severity === "low").length,
      },
      recentEvents: realtimeEvents.slice(0, 10),
      systemStatus: {
        satelliteFeeds: "operational",
        weatherServices: "operational",
        aiModels: "operational",
        alertSystem: "operational",
      },
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/monitoring/test-alert
 * @desc    Test alert system (for demo purposes)
 * @access  Private
 */
router.post("/test-alert", async (req, res, next) => {
  try {
    const { alertType, severity, coordinates } = req.body;

    const testAlert = {
      id: `test_alert_${Date.now()}`,
      type: alertType || "wildfire",
      severity: severity || "medium",
      title: "TEST ALERT - Demo System",
      description: "This is a test alert for demonstration purposes",
      location: coordinates || { latitude: 34.0522, longitude: -118.2437 },
      issuedAt: new Date(),
      source: "Demo System",
      actionRequired: false,
      isTest: true,
    };

    // Emit real-time alert
    const io = req.app.get("io");
    io.to("alerts").emit("newAlert", testAlert);

    res.json({
      success: true,
      data: testAlert,
      message: "Test alert sent successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/monitoring/system-health
 * @desc    Get system health status
 * @access  Private
 */
router.get("/system-health", async (req, res, next) => {
  try {
    // Check various system components
    const [aiServiceHealth, satelliteServiceHealth] = await Promise.all([
      aiService.healthCheck().catch(() => false),
      Promise.resolve(true), // Satellite service is always "healthy" in demo
    ]);

    const systemHealth = {
      overall:
        aiServiceHealth && satelliteServiceHealth ? "healthy" : "degraded",
      services: {
        aiEngine: aiServiceHealth ? "operational" : "degraded",
        satelliteData: "operational",
        weatherServices: "operational",
        database: "operational",
        alertSystem: "operational",
      },
      uptime: process.uptime(),
      lastCheck: new Date(),
      version: "1.0.0",
    };

    res.json({
      success: true,
      data: systemHealth,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
