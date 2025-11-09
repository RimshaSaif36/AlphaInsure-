const express = require("express");
const router = express.Router();
const satelliteService = require("../services/satelliteService");
const logger = require("../utils/logger");

/**
 * @route   GET /api/satellite/imagery/:lat/:lng
 * @desc    Get satellite imagery for coordinates
 * @access  Private
 */
router.get("/imagery/:lat/:lng", async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const { date, source = "sentinel" } = req.query;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const imageDate = date ? new Date(date) : new Date();
    const imagery = await satelliteService.getImagery(
      coordinates,
      imageDate,
      source
    );

    res.json({
      success: true,
      data: imagery,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/satellite/property-data/:lat/:lng
 * @desc    Get comprehensive satellite data for a property
 * @access  Private
 */
router.get("/property-data/:lat/:lng", async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const { analysisDate } = req.query;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const date = analysisDate ? new Date(analysisDate) : new Date();
    const propertyData = await satelliteService.getPropertyData(
      coordinates,
      date
    );

    res.json({
      success: true,
      data: propertyData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/satellite/alerts/:lat/:lng
 * @desc    Get active alerts for coordinates
 * @access  Private
 */
router.get("/alerts/:lat/:lng", async (req, res, next) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 50 } = req.query;

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const alerts = await satelliteService.getActiveAlerts(
      coordinates,
      parseInt(radius)
    );

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/satellite/search-imagery
 * @desc    Search for satellite imagery in date range
 * @access  Private
 */
router.get("/search-imagery", async (req, res, next) => {
  try {
    const { lat, lng, startDate, endDate, cloudCoverMax = 30 } = req.query;

    if (!lat || !lng || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: lat, lng, startDate, endDate",
      });
    }

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const results = await satelliteService.searchImagery(
      coordinates,
      new Date(startDate),
      new Date(endDate),
      parseInt(cloudCoverMax)
    );

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        searchParams: { lat, lng, startDate, endDate, cloudCoverMax },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/satellite/analyze-change
 * @desc    Analyze change between two satellite images
 * @access  Private
 */
router.post("/analyze-change", async (req, res, next) => {
  try {
    const { beforeImage, afterImage } = req.body;

    if (!beforeImage || !afterImage) {
      return res.status(400).json({
        success: false,
        message: "Both beforeImage and afterImage are required",
      });
    }

    const changeAnalysis = await satelliteService.analyzeChange(
      beforeImage,
      afterImage
    );

    res.json({
      success: true,
      data: changeAnalysis,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/satellite/disaster-footprint
 * @desc    Get disaster footprint for a specific event
 * @access  Private
 */
router.get("/disaster-footprint", async (req, res, next) => {
  try {
    const { disasterType, lat, lng, date, radius = 100 } = req.query;

    if (!disasterType || !lat || !lng || !date) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: disasterType, lat, lng, date",
      });
    }

    const coordinates = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };

    const footprint = await satelliteService.getDisasterFootprint(
      disasterType,
      coordinates,
      new Date(date),
      parseInt(radius)
    );

    res.json({
      success: true,
      data: footprint,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/satellite/monitor-realtime
 * @desc    Get real-time satellite monitoring events
 * @access  Private
 */
router.get("/monitor-realtime", async (req, res, next) => {
  try {
    const events = await satelliteService.monitorRealtimeFeeds();

    res.json({
      success: true,
      data: {
        events,
        timestamp: new Date(),
        eventCount: events.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
