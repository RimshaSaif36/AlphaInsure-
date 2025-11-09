const axios = require("axios");
const logger = require("../utils/logger");

class SatelliteService {
  constructor() {
    this.earthEngineUrl = "https://earthengine.googleapis.com";
    this.nasaUrl = "https://api.nasa.gov";
    this.sentinelUrl = "https://scihub.copernicus.eu/dhus";
    this.nasaKey = process.env.NASA_API_KEY || null;
    this.googleAppCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
    this.eeInitialized = false;
    this.ee = null;

    // Initialize Earth Engine if credentials are available
    this.initializeEarthEngine();
  }

  /**
   * Initialize Google Earth Engine
   */
  async initializeEarthEngine() {
    if (!this.googleAppCreds) {
      logger.info(
        "Google Earth Engine credentials not found, skipping EE initialization"
      );
      return;
    }

    try {
      this.ee = require("@google/earthengine");

      // Read the service account key
      const fs = require("fs");
      const keyData = JSON.parse(fs.readFileSync(this.googleAppCreds, "utf8"));

      // Initialize Earth Engine with service account
      await new Promise((resolve, reject) => {
        this.ee.data.authenticateViaPrivateKey(
          keyData,
          () => {
            this.ee.initialize(null, null, resolve, reject);
          },
          reject
        );
      });

      this.eeInitialized = true;
      logger.info("Google Earth Engine initialized successfully");
    } catch (error) {
      logger.warn(`Failed to initialize Google Earth Engine: ${error.message}`);
      this.eeInitialized = false;
    }
  }

  /**
   * Get satellite imagery for a specific location and date
   */
  async getImagery(coordinates, date, source = "sentinel") {
    try {
      logger.info(
        `Getting ${source} imagery for ${coordinates.latitude}, ${coordinates.longitude} on ${date}`
      );

      switch (source.toLowerCase()) {
        case "sentinel":
          return await this.getSentinelImagery(coordinates, date);
        case "landsat":
          return await this.getLandsatImagery(coordinates, date);
        case "modis":
          return await this.getModisImagery(coordinates, date);
        default:
          return await this.getMockImagery(coordinates, date);
      }
    } catch (error) {
      logger.error(`Error getting satellite imagery: ${error.message}`);
      return await this.getMockImagery(coordinates, date);
    }
  }

  /**
   * Get Sentinel-2 imagery from Copernicus
   */
  async getSentinelImagery(coordinates, date) {
    try {
      // If Earth Engine is available, use it for Sentinel-2 data
      if (this.eeInitialized && this.ee) {
        return await this.getSentinelFromEarthEngine(coordinates, date);
      }

      // Fallback to mock data
      return this.getMockImagery(coordinates, date, "sentinel");
    } catch (error) {
      logger.error(`Error getting Sentinel imagery: ${error.message}`);
      return this.getMockImagery(coordinates, date, "sentinel");
    }
  }

  /**
   * Get Sentinel-2 data from Google Earth Engine
   */
  async getSentinelFromEarthEngine(coordinates, date) {
    try {
      const lat = coordinates.latitude || coordinates.lat || 0;
      const lon = coordinates.longitude || coordinates.lng || 0;

      // Create a point geometry
      const point = this.ee.Geometry.Point([lon, lat]);

      // Define date range (30 days before and after the target date)
      const startDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Get Sentinel-2 collection
      const s2 = this.ee
        .ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(point)
        .filterDate(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
        .filter(this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        .sort("system:time_start", false)
        .first();

      // Get image info
      const imageInfo = await new Promise((resolve, reject) => {
        s2.getInfo((info, error) => {
          if (error) reject(error);
          else resolve(info);
        });
      });

      if (!imageInfo || !imageInfo.properties) {
        throw new Error("No suitable Sentinel-2 imagery found");
      }

      // Calculate NDVI from Sentinel-2 bands
      const ndvi = s2.normalizedDifference(["B8", "B4"]); // NIR, Red
      const ndviValue = await this.getPixelValue(ndvi, point);

      // Calculate NDWI (water index)
      const ndwi = s2.normalizedDifference(["B3", "B8"]); // Green, NIR
      const ndwiValue = await this.getPixelValue(ndwi, point);

      // Generate thumbnail URL
      const visualParams = {
        bands: ["B4", "B3", "B2"], // RGB
        min: 0,
        max: 3000,
        format: "png",
      };

      const thumbnailUrl = await new Promise((resolve, reject) => {
        s2.getThumbURL(visualParams, (url, error) => {
          if (error) reject(error);
          else resolve(url);
        });
      });

      return {
        imageUrl: thumbnailUrl,
        imageId: imageInfo.properties["system:id"] || `ee_${Date.now()}`,
        source: "sentinel",
        captureDate: new Date(imageInfo.properties["system:time_start"]),
        coordinates,
        resolution: "10m",
        cloudCover: imageInfo.properties["CLOUDY_PIXEL_PERCENTAGE"],
        bands: [
          "B1",
          "B2",
          "B3",
          "B4",
          "B5",
          "B6",
          "B7",
          "B8",
          "B8A",
          "B9",
          "B11",
          "B12",
        ],
        indices: {
          ndvi: ndviValue,
          ndwi: ndwiValue,
        },
        metadata: {
          satellite: "Sentinel-2",
          processingLevel: "L2A",
          projection: "EPSG:4326",
          earthEngine: true,
          properties: imageInfo.properties,
        },
      };
    } catch (error) {
      logger.error(`Earth Engine Sentinel query failed: ${error.message}`);
      return this.getMockImagery(coordinates, date, "sentinel");
    }
  }

  /**
   * Get pixel value from Earth Engine image at a point
   */
  async getPixelValue(image, point) {
    try {
      const value = await new Promise((resolve, reject) => {
        const sample = image.sample({
          region: point,
          scale: 30,
          numPixels: 1,
        });

        sample
          .first()
          .get("first")
          .evaluate((result, error) => {
            if (error) reject(error);
            else resolve(result);
          });
      });

      return value || 0;
    } catch (error) {
      logger.warn(`Failed to get pixel value: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get Landsat imagery from NASA
   */
  async getLandsatImagery(coordinates, date) {
    try {
      // If NASA API key is present, use NASA Earth imagery API as a simple landsat endpoint
      if (this.nasaKey) {
        const lat = coordinates.latitude || coordinates.lat || 0;
        const lon = coordinates.longitude || coordinates.lng || 0;
        const dateStr = date.toISOString().split("T")[0];
        const url = `${this.nasaUrl}/planetary/earth/imagery`;
        try {
          const resp = await axios.get(url, {
            params: {
              lat,
              lon,
              date: dateStr,
              api_key: this.nasaKey,
            },
            responseType: "json",
            timeout: 15000,
          });

          // NASA returns a url to the image or raw JSON depending on query. Normalize it.
          const imageUrl = resp.data.url || resp.data;
          return {
            imageUrl:
              typeof imageUrl === "string"
                ? imageUrl
                : `${this.nasaUrl}/planetary/earth/imagery?lat=${lat}&lon=${lon}&date=${dateStr}&api_key=${this.nasaKey}`,
            imageId: `nasa_${Date.now()}`,
            source: "landsat",
            captureDate: date,
            coordinates,
            resolution: "varies",
            cloudCover: resp.data.cloud_score || null,
            bands: ["red", "green", "blue", "nir"],
            metadata: {
              provider: "NASA",
              raw: resp.data,
            },
          };
        } catch (err) {
          logger.warn(
            `NASA imagery request failed, falling back to mock: ${err.message}`
          );
          return this.getMockImagery(coordinates, date, "landsat");
        }
      }

      // Fallback to mock if no key present
      return this.getMockImagery(coordinates, date, "landsat");
    } catch (error) {
      logger.error(`Error getting Landsat imagery: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get MODIS imagery from NASA
   */
  async getModisImagery(coordinates, date) {
    try {
      // In production, implement actual MODIS API calls
      return this.getMockImagery(coordinates, date, "modis");
    } catch (error) {
      logger.error(`Error getting MODIS imagery: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mock imagery data for demo purposes
   */
  async getMockImagery(coordinates, date, source = "demo") {
    const baseUrl = "https://via.placeholder.com/512x512";
    const imageId = `img_${Math.floor(Math.random() * 1000)}`;

    return {
      imageUrl: `${baseUrl}/0066cc/ffffff?text=${source.toUpperCase()}+${imageId}`,
      imageId,
      source: source,
      captureDate: date,
      coordinates,
      resolution: source === "modis" ? "250m" : "10m",
      cloudCover: Math.floor(Math.random() * 30),
      bands:
        source === "modis"
          ? ["red", "nir", "blue"]
          : ["red", "green", "blue", "nir"],
      metadata: {
        satellite:
          source === "sentinel"
            ? "Sentinel-2A"
            : source === "landsat"
            ? "Landsat-8"
            : "Terra/Aqua",
        processingLevel: "L2A",
        projection: "EPSG:4326",
      },
    };
  }

  /**
   * Get property data including satellite indices
   */
  async getPropertyData(coordinates, analysisDate = new Date()) {
    try {
      logger.info(
        `Getting property satellite data for ${coordinates.latitude}, ${coordinates.longitude}`
      );

      // Get recent imagery
      const imagery = await this.getImagery(coordinates, analysisDate);

      // Calculate vegetation and water indices (mock for demo)
      const indices = await this.calculateIndices(coordinates, analysisDate);

      return {
        imagery,
        indices,
        analysisDate,
        coordinates,
      };
    } catch (error) {
      logger.error(`Error getting property data: ${error.message}`);
      return {
        imagery: null,
        indices: this.getMockIndices(),
        analysisDate,
        coordinates,
        error: error.message,
      };
    }
  }

  /**
   * Calculate satellite indices (NDVI, NDWI, NBR, etc.)
   */
  async calculateIndices(coordinates, date) {
    try {
      // If Earth Engine is available, get real satellite indices
      if (this.eeInitialized && this.ee) {
        return await this.getIndicesFromEarthEngine(coordinates, date);
      }

      // Fallback to realistic mock values
      return {
        ndvi: this.generateRealisticNDVI(coordinates, date),
        ndwi: this.generateRealisticNDWI(coordinates),
        nbr: this.generateRealisticNBR(coordinates, date),
        moisture: this.generateRealisticMoisture(coordinates),
        temperature: this.generateRealisticTemperature(coordinates, date),
        lastUpdated: date,
        source: "mock",
      };
    } catch (error) {
      logger.error(`Error calculating indices: ${error.message}`);
      return this.getMockIndices();
    }
  }

  /**
   * Get real satellite indices from Google Earth Engine
   */
  async getIndicesFromEarthEngine(coordinates, date) {
    try {
      const lat = coordinates.latitude || coordinates.lat || 0;
      const lon = coordinates.longitude || coordinates.lng || 0;
      const point = this.ee.Geometry.Point([lon, lat]);

      // Get recent Sentinel-2 image
      const startDate = new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);

      const s2 = this.ee
        .ImageCollection("COPERNICUS/S2_SR")
        .filterBounds(point)
        .filterDate(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
        .filter(this.ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 50))
        .sort("system:time_start", false)
        .first();

      // Calculate various indices
      const ndvi = s2.normalizedDifference(["B8", "B4"]); // NIR, Red
      const ndwi = s2.normalizedDifference(["B3", "B8"]); // Green, NIR
      const nbr = s2.normalizedDifference(["B8", "B12"]); // NIR, SWIR

      // Get land surface temperature from MODIS (if available)
      const modisLST = this.ee
        .ImageCollection("MODIS/061/MOD11A1")
        .filterBounds(point)
        .filterDate(
          startDate.toISOString().split("T")[0],
          endDate.toISOString().split("T")[0]
        )
        .sort("system:time_start", false)
        .first()
        .select("LST_Day_1km")
        .multiply(0.02)
        .subtract(273.15); // Convert to Celsius

      // Sample the values at the point
      const [ndviValue, ndwiValue, nbrValue, tempValue] = await Promise.all([
        this.getPixelValue(ndvi, point),
        this.getPixelValue(ndwi, point),
        this.getPixelValue(nbr, point),
        this.getPixelValue(modisLST, point),
      ]);

      return {
        ndvi: Math.max(-1, Math.min(1, ndviValue || 0)),
        ndwi: Math.max(-1, Math.min(1, ndwiValue || 0)),
        nbr: Math.max(-1, Math.min(1, nbrValue || 0)),
        moisture: Math.max(0, Math.min(1, (ndwiValue + 1) / 2 || 0.5)), // Derived from NDWI
        temperature:
          tempValue || this.generateRealisticTemperature(coordinates, date),
        lastUpdated: date,
        source: "earthengine",
      };
    } catch (error) {
      logger.warn(`Earth Engine indices calculation failed: ${error.message}`);
      // Fallback to mock data
      return {
        ndvi: this.generateRealisticNDVI(coordinates, date),
        ndwi: this.generateRealisticNDWI(coordinates),
        nbr: this.generateRealisticNBR(coordinates, date),
        moisture: this.generateRealisticMoisture(coordinates),
        temperature: this.generateRealisticTemperature(coordinates, date),
        lastUpdated: date,
        source: "mock_fallback",
      };
    }
  }

  /**
   * Generate realistic NDVI (Normalized Difference Vegetation Index)
   */
  generateRealisticNDVI(coordinates, date) {
    // Simulate seasonal variation and geographic patterns
    const lat = coordinates.latitude;
    const month = date.getMonth() + 1;

    let baseNDVI = 0.5;

    // Latitude effect (more vegetation in temperate zones)
    if (Math.abs(lat) > 60) baseNDVI = 0.2; // Arctic/Antarctic
    else if (Math.abs(lat) < 30) baseNDVI = 0.7; // Tropical

    // Seasonal effect (Northern Hemisphere)
    if (lat > 0) {
      if (month >= 6 && month <= 8) baseNDVI += 0.2; // Summer
      else if (month >= 12 || month <= 2) baseNDVI -= 0.2; // Winter
    } else {
      if (month >= 12 || month <= 2) baseNDVI += 0.2; // Southern summer
      else if (month >= 6 && month <= 8) baseNDVI -= 0.2; // Southern winter
    }

    // Add some randomness
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(-1, Math.min(1, baseNDVI + variation));
  }

  /**
   * Generate realistic NDWI (Normalized Difference Water Index)
   */
  generateRealisticNDWI(coordinates) {
    // Simulate water presence
    const variation = (Math.random() - 0.5) * 0.4;
    return Math.max(-1, Math.min(1, 0.1 + variation));
  }

  /**
   * Generate realistic NBR (Normalized Burn Ratio)
   */
  generateRealisticNBR(coordinates, date) {
    // Simulate burn patterns (lower values indicate burned areas)
    const lat = Math.abs(coordinates.latitude);
    let baseNBR = 0.5;

    // Higher fire risk in certain latitudes and seasons
    if (lat > 30 && lat < 50) {
      const month = date.getMonth() + 1;
      if (month >= 6 && month <= 10) baseNBR -= 0.2; // Fire season
    }

    const variation = (Math.random() - 0.5) * 0.3;
    return Math.max(-1, Math.min(1, baseNBR + variation));
  }

  /**
   * Generate realistic soil moisture
   */
  generateRealisticMoisture(coordinates) {
    const variation = (Math.random() - 0.5) * 0.4;
    return Math.max(0, Math.min(1, 0.4 + variation));
  }

  /**
   * Generate realistic land surface temperature
   */
  generateRealisticTemperature(coordinates, date) {
    const lat = coordinates.latitude;
    const month = date.getMonth() + 1;

    // Base temperature by latitude
    let baseTemp = 15 - Math.abs(lat) * 0.6;

    // Seasonal variation
    if (lat > 0) {
      baseTemp += 10 * Math.sin(((month - 3) * Math.PI) / 6);
    } else {
      baseTemp += 10 * Math.sin(((month - 9) * Math.PI) / 6);
    }

    // Add variation
    const variation = (Math.random() - 0.5) * 10;
    return baseTemp + variation;
  }

  /**
   * Get mock indices when calculation fails
   */
  getMockIndices() {
    return {
      ndvi: 0.5,
      ndwi: 0.1,
      nbr: 0.4,
      moisture: 0.4,
      temperature: 20,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get active alerts for a location
   */
  async getActiveAlerts(coordinates, radius = 50) {
    try {
      logger.info(
        `Getting active alerts for ${coordinates.latitude}, ${coordinates.longitude}`
      );

      // In production, query actual alert systems
      // For demo, return mock alerts based on location and current conditions
      const alerts = [];

      // Simulate wildfire alerts for certain regions
      if (
        Math.abs(coordinates.latitude) > 30 &&
        Math.abs(coordinates.latitude) < 50
      ) {
        if (Math.random() > 0.7) {
          alerts.push({
            id: `alert_${Date.now()}_wildfire`,
            type: "wildfire",
            severity: "high",
            title: "Wildfire Warning",
            description: "Active wildfire detected within 25km of location",
            distance: Math.floor(Math.random() * 25) + 5,
            direction: "Northwest",
            issuedAt: new Date(
              Date.now() - Math.random() * 24 * 60 * 60 * 1000
            ),
            source: "NOAA Fire Weather",
            actionRequired: true,
          });
        }
      }

      // Simulate flood alerts for low elevation areas
      if (coordinates.elevation && coordinates.elevation < 50) {
        if (Math.random() > 0.8) {
          alerts.push({
            id: `alert_${Date.now()}_flood`,
            type: "flood",
            severity: "medium",
            title: "Flood Watch",
            description: "Heavy rainfall expected, flood risk elevated",
            effectiveUntil: new Date(Date.now() + 48 * 60 * 60 * 1000),
            issuedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            source: "National Weather Service",
            actionRequired: false,
          });
        }
      }

      return alerts;
    } catch (error) {
      logger.error(`Error getting active alerts: ${error.message}`);
      return [];
    }
  }

  /**
   * Search for satellite imagery in a date range
   */
  async searchImagery(coordinates, startDate, endDate, cloudCoverMax = 30) {
    try {
      const results = [];
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      // Generate mock search results
      const imageCount = Math.min(daysDiff, 10); // Limit results

      for (let i = 0; i < imageCount; i++) {
        const imageDate = new Date(
          startDate.getTime() +
            i * 24 * 60 * 60 * 1000 * Math.random() * daysDiff
        );
        const cloudCover = Math.random() * 50;

        if (cloudCover <= cloudCoverMax) {
          const imagery = await this.getMockImagery(coordinates, imageDate);
          imagery.cloudCover = Math.floor(cloudCover);
          results.push(imagery);
        }
      }

      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.captureDate) - new Date(a.captureDate));

      return results;
    } catch (error) {
      logger.error(`Error searching imagery: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze change detection between two images
   */
  async analyzeChange(beforeImage, afterImage) {
    try {
      // In production, perform actual change detection analysis
      // For demo, simulate change detection results

      const changeDetected = Math.random() > 0.6;
      const changePercentage = changeDetected
        ? Math.random() * 50 + 10
        : Math.random() * 5;

      const changeTypes = [];
      if (changeDetected) {
        const possibleChanges = [
          "vegetation_loss",
          "water_level_change",
          "infrastructure_damage",
          "burn_scar",
        ];
        const numChanges = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < numChanges; i++) {
          const change =
            possibleChanges[Math.floor(Math.random() * possibleChanges.length)];
          if (!changeTypes.includes(change)) {
            changeTypes.push(change);
          }
        }
      }

      return {
        changeDetected,
        changePercentage: Math.round(changePercentage * 100) / 100,
        changeTypes,
        confidence: Math.random() * 30 + 70, // 70-100% confidence
        analysisDate: new Date(),
        beforeImage: {
          id: beforeImage.imageId,
          date: beforeImage.captureDate,
        },
        afterImage: {
          id: afterImage.imageId,
          date: afterImage.captureDate,
        },
      };
    } catch (error) {
      logger.error(`Error analyzing change: ${error.message}`);
      return {
        changeDetected: false,
        changePercentage: 0,
        changeTypes: [],
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * Get disaster footprint for a specific event
   */
  async getDisasterFootprint(disasterType, coordinates, date, radius = 100) {
    try {
      logger.info(
        `Getting ${disasterType} footprint for ${coordinates.latitude}, ${coordinates.longitude}`
      );

      // Simulate disaster footprint based on type
      const footprint = {
        disasterType,
        center: coordinates,
        date,
        radius,
        severity: this.getRandomSeverity(),
        affectedArea: Math.PI * Math.pow(radius, 2), // km²
        estimatedProperties: Math.floor((Math.PI * Math.pow(radius, 2)) / 10), // Rough estimate
        confidence: Math.random() * 20 + 80, // 80-100%
      };

      // Add disaster-specific details
      switch (disasterType.toLowerCase()) {
        case "hurricane":
          footprint.windSpeed = Math.floor(Math.random() * 100 + 100); // 100-200 km/h
          footprint.eyeRadius = Math.floor(Math.random() * 20 + 10); // 10-30 km
          break;
        case "wildfire":
          footprint.burnIntensity = this.getRandomSeverity();
          footprint.firePerimeter = radius * 2 * Math.PI;
          break;
        case "flood":
          footprint.waterLevel = Math.random() * 5 + 0.5; // 0.5-5.5 meters
          footprint.flowRate = Math.random() * 1000; // m³/s
          break;
        case "earthquake":
          footprint.magnitude = Math.random() * 3 + 5; // 5.0-8.0
          footprint.depth = Math.random() * 30 + 5; // 5-35 km
          break;
      }

      return footprint;
    } catch (error) {
      logger.error(`Error getting disaster footprint: ${error.message}`);
      return null;
    }
  }

  /**
   * Get random severity level
   */
  getRandomSeverity() {
    const severities = ["low", "moderate", "high", "extreme"];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  /**
   * Monitor real-time satellite feeds for events
   */
  async monitorRealtimeFeeds() {
    try {
      // In production, set up real-time monitoring of satellite feeds
      // For demo, simulate real-time events

      const events = [];

      // Simulate random events
      if (Math.random() > 0.9) {
        events.push({
          id: `event_${Date.now()}`,
          type: "wildfire_detection",
          location: {
            latitude: 34.0522 + (Math.random() - 0.5) * 2,
            longitude: -118.2437 + (Math.random() - 0.5) * 2,
          },
          severity: this.getRandomSeverity(),
          confidence: Math.random() * 30 + 70,
          detectedAt: new Date(),
          source: "MODIS_Thermal",
        });
      }

      return events;
    } catch (error) {
      logger.error(`Error monitoring real-time feeds: ${error.message}`);
      return [];
    }
  }
}

module.exports = new SatelliteService();
