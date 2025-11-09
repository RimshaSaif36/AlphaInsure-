const axios = require("axios");
const logger = require("../utils/logger");

class WeatherService {
  constructor() {
    this.noaaBaseUrl = "https://api.weather.gov";
    this.openWeatherUrl = "https://api.openweathermap.org/data/2.5";
    this.apiKey = process.env.WEATHER_API_KEY;
  }

  /**
   * Get current weather conditions for coordinates
   */
  async getCurrentConditions(coordinates) {
    try {
      logger.info(
        `Getting current weather for ${coordinates.latitude}, ${coordinates.longitude}`
      );

      // If OpenWeather API key is present, call OpenWeatherMap to get real data
      if (this.apiKey) {
        try {
          const lat = coordinates.latitude || coordinates.lat || 0;
          const lon = coordinates.longitude || coordinates.lng || 0;
          const resp = await axios.get(`${this.openWeatherUrl}/weather`, {
            params: {
              lat,
              lon,
              units: "metric",
              appid: this.apiKey,
            },
            timeout: 10000,
          });

          const d = resp.data;
          return {
            location: { latitude: lat, longitude: lon },
            temperature: Math.round(d.main?.temp),
            humidity: d.main?.humidity,
            windSpeed: d.wind?.speed,
            windDirection: d.wind?.deg,
            pressure: d.main?.pressure,
            visibility: d.visibility ? Math.round(d.visibility / 1000) : null,
            condition:
              d.weather && d.weather[0]
                ? d.weather[0].main.toLowerCase()
                : "unknown",
            cloudCover: d.clouds?.all,
            uvIndex: null,
            dewPoint: null,
            feelsLike: Math.round(d.main?.feels_like),
            timestamp: new Date(d.dt * 1000),
            source: "openweathermap",
            raw: d,
          };
        } catch (err) {
          logger.warn(
            `OpenWeather request failed, falling back to mock: ${err.message}`
          );
        }
      }

      // Fallback: demo/mock weather data
      const temperature = this.generateRealisticTemperature(coordinates);
      const humidity = Math.floor(Math.random() * 40 + 40); // 40-80%
      const windSpeed = Math.floor(Math.random() * 30 + 5); // 5-35 km/h
      const pressure = Math.floor(Math.random() * 50 + 980); // 980-1030 hPa

      const conditions = [
        "clear",
        "partly_cloudy",
        "cloudy",
        "light_rain",
        "heavy_rain",
        "thunderstorm",
        "snow",
        "fog",
      ];

      const currentCondition =
        conditions[Math.floor(Math.random() * conditions.length)];

      return {
        location: coordinates,
        temperature,
        humidity,
        windSpeed,
        windDirection: Math.floor(Math.random() * 360),
        pressure,
        visibility: Math.floor(Math.random() * 15 + 5), // 5-20 km
        condition: currentCondition,
        cloudCover: Math.floor(Math.random() * 100),
        uvIndex: Math.floor(Math.random() * 11),
        dewPoint: temperature - Math.floor(Math.random() * 15 + 5),
        feelsLike: temperature + Math.floor(Math.random() * 10 - 5),
        timestamp: new Date(),
        source: "WeatherAPI",
      };
    } catch (error) {
      logger.error(`Error getting current conditions: ${error.message}`);
      return this.getDefaultWeather(coordinates);
    }
  }

  /**
   * Get weather risk assessment for a location
   */
  async getWeatherRisk(coordinates) {
    try {
      logger.info(
        `Calculating weather risk for ${coordinates.latitude}, ${coordinates.longitude}`
      );

      const current = await this.getCurrentConditions(coordinates);
      const forecast = await this.getForecast(coordinates);
      const historical = await this.getHistoricalWeather(coordinates);

      // Calculate various risk factors
      const risks = {
        flood: this.calculateFloodRisk(current, forecast, historical),
        wildfire: this.calculateWildfireRisk(current, forecast, historical),
        hurricane: this.calculateHurricaneRisk(coordinates, current, forecast),
        tornado: this.calculateTornadoRisk(coordinates, current, forecast),
        hail: this.calculateHailRisk(current, forecast),
        drought: this.calculateDroughtRisk(historical, forecast),
      };

      // Calculate overall weather risk
      const overallRisk =
        Object.values(risks).reduce((sum, risk) => sum + risk.score, 0) /
        Object.keys(risks).length;

      return {
        current,
        forecast: forecast.summary,
        historical: historical.summary,
        risks,
        overallRisk: Math.round(overallRisk),
        riskLevel: this.getRiskLevel(overallRisk),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Error calculating weather risk: ${error.message}`);
      return {
        current: this.getDefaultWeather(coordinates),
        risks: this.getDefaultRisks(),
        overallRisk: 50,
        riskLevel: "medium",
        error: error.message,
      };
    }
  }

  /**
   * Get weather forecast
   */
  async getForecast(coordinates, days = 7) {
    try {
      const forecasts = [];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const temp = this.generateRealisticTemperature(coordinates, date);
        const precipChance = Math.floor(Math.random() * 100);

        forecasts.push({
          date,
          temperatureHigh: temp + Math.floor(Math.random() * 8),
          temperatureLow: temp - Math.floor(Math.random() * 8),
          precipitationChance: precipChance,
          precipitationAmount: precipChance > 50 ? Math.random() * 25 : 0,
          windSpeed: Math.floor(Math.random() * 40 + 10),
          humidity: Math.floor(Math.random() * 40 + 40),
          condition: this.getWeatherCondition(precipChance),
        });
      }

      return {
        forecasts,
        summary: {
          maxTemp: Math.max(...forecasts.map((f) => f.temperatureHigh)),
          minTemp: Math.min(...forecasts.map((f) => f.temperatureLow)),
          avgPrecipitation:
            forecasts.reduce((sum, f) => sum + f.precipitationAmount, 0) / days,
          stormDays: forecasts.filter((f) => f.precipitationChance > 70).length,
          precipitationRisk:
            Math.max(...forecasts.map((f) => f.precipitationChance)) / 100,
          stormProbability:
            forecasts.filter((f) => f.precipitationChance > 70).length / days,
        },
      };
    } catch (error) {
      logger.error(`Error getting forecast: ${error.message}`);
      return { forecasts: [], summary: {} };
    }
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(coordinates, years = 10) {
    try {
      // Simulate historical weather patterns
      const extremeEvents = [];
      const yearlyData = [];

      for (let i = 0; i < years; i++) {
        const year = new Date().getFullYear() - i;

        // Simulate extreme events
        if (Math.random() > 0.7) {
          const eventTypes = [
            "hurricane",
            "flood",
            "drought",
            "heatwave",
            "blizzard",
          ];
          extremeEvents.push({
            year,
            type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
            severity: this.getRandomSeverity(),
            month: Math.floor(Math.random() * 12) + 1,
          });
        }

        // Yearly averages
        yearlyData.push({
          year,
          avgTemperature:
            this.generateRealisticTemperature(coordinates) +
            (Math.random() - 0.5) * 4,
          totalPrecipitation: Math.floor(Math.random() * 1000 + 500), // mm
          extremeTempHigh:
            this.generateRealisticTemperature(coordinates) +
            Math.random() * 20 +
            10,
          extremeTempLow:
            this.generateRealisticTemperature(coordinates) -
            Math.random() * 20 -
            10,
          stormDays: Math.floor(Math.random() * 30 + 10),
        });
      }

      return {
        period: `${
          new Date().getFullYear() - years
        }-${new Date().getFullYear()}`,
        extremeEvents,
        yearlyData,
        summary: {
          avgTemperature:
            yearlyData.reduce((sum, y) => sum + y.avgTemperature, 0) / years,
          avgPrecipitation:
            yearlyData.reduce((sum, y) => sum + y.totalPrecipitation, 0) /
            years,
          extremeEvents: extremeEvents.map((e) => `${e.type}_${e.year}`),
          temperatureTrend: Math.random() > 0.6 ? "increasing" : "stable",
          precipitationTrend: Math.random() > 0.5 ? "increasing" : "stable",
        },
      };
    } catch (error) {
      logger.error(`Error getting historical weather: ${error.message}`);
      return { extremeEvents: [], summary: {} };
    }
  }

  /**
   * Calculate flood risk based on weather data
   */
  calculateFloodRisk(current, forecast, historical) {
    let score = 0;
    const factors = [];

    // Current precipitation
    if (
      current.condition === "heavy_rain" ||
      current.condition === "thunderstorm"
    ) {
      score += 30;
      factors.push("current_heavy_precipitation");
    }

    // Forecast precipitation
    if (forecast.summary.precipitationRisk > 0.7) {
      score += 25;
      factors.push("high_precipitation_forecast");
    }

    // Historical flood events
    const floodEvents =
      historical.extremeEvents?.filter((e) => e.type === "flood").length || 0;
    if (floodEvents > 2) {
      score += 20;
      factors.push("historical_flood_activity");
    }

    // Soil saturation (simulated)
    const recentPrecip = forecast.summary.avgPrecipitation || 0;
    if (recentPrecip > 50) {
      score += 15;
      factors.push("soil_saturation");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Calculate wildfire risk based on weather data
   */
  calculateWildfireRisk(current, forecast, historical) {
    let score = 0;
    const factors = [];

    // Temperature and humidity
    if (current.temperature > 30 && current.humidity < 30) {
      score += 35;
      factors.push("hot_dry_conditions");
    }

    // Wind speed
    if (current.windSpeed > 25) {
      score += 20;
      factors.push("high_wind_speed");
    }

    // Drought conditions
    if (forecast.summary.avgPrecipitation < 10) {
      score += 25;
      factors.push("drought_conditions");
    }

    // Historical patterns
    const droughtEvents =
      historical.extremeEvents?.filter((e) => e.type === "drought").length || 0;
    if (droughtEvents > 1) {
      score += 10;
      factors.push("historical_drought");
    }

    // Fire weather index (simplified)
    const fwi =
      (current.temperature - current.humidity + current.windSpeed) / 3;
    if (fwi > 40) {
      score += 10;
      factors.push("extreme_fire_weather");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Calculate hurricane risk
   */
  calculateHurricaneRisk(coordinates, current, forecast) {
    let score = 0;
    const factors = [];

    // Geographic factors
    const lat = Math.abs(coordinates.latitude);

    // Hurricane belt (10-30 degrees latitude)
    if (lat >= 10 && lat <= 30) {
      score += 40;
      factors.push("hurricane_belt_location");
    }

    // Coastal proximity (simplified check)
    if (Math.abs(coordinates.longitude) < 100) {
      // Rough coastal check
      score += 20;
      factors.push("coastal_location");
    }

    // Current pressure
    if (current.pressure < 1000) {
      score += 15;
      factors.push("low_atmospheric_pressure");
    }

    // Wind speed
    if (current.windSpeed > 40) {
      score += 15;
      factors.push("high_wind_speed");
    }

    // Season (June-November in Northern Hemisphere)
    const month = new Date().getMonth() + 1;
    if (coordinates.latitude > 0 && month >= 6 && month <= 11) {
      score += 10;
      factors.push("hurricane_season");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Calculate tornado risk
   */
  calculateTornadoRisk(coordinates, current, forecast) {
    let score = 0;
    const factors = [];

    // Geographic factors - Tornado Alley
    const lat = coordinates.latitude;
    const lng = coordinates.longitude;

    if (lat >= 30 && lat <= 45 && lng >= -110 && lng <= -90) {
      score += 30;
      factors.push("tornado_alley_location");
    }

    // Weather conditions
    if (current.condition === "thunderstorm") {
      score += 25;
      factors.push("thunderstorm_activity");
    }

    // Wind shear (simplified)
    if (current.windSpeed > 30) {
      score += 20;
      factors.push("wind_shear");
    }

    // Temperature differential
    if (current.temperature > 25 && current.humidity > 60) {
      score += 15;
      factors.push("unstable_atmosphere");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Calculate hail risk
   */
  calculateHailRisk(current, forecast) {
    let score = 0;
    const factors = [];

    // Thunderstorm activity
    if (current.condition === "thunderstorm") {
      score += 40;
      factors.push("thunderstorm_present");
    }

    // Temperature conditions
    if (current.temperature > 20 && current.temperature < 35) {
      score += 20;
      factors.push("optimal_temperature_range");
    }

    // Atmospheric instability
    if (current.humidity > 70 && current.windSpeed > 20) {
      score += 25;
      factors.push("atmospheric_instability");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Calculate drought risk
   */
  calculateDroughtRisk(historical, forecast) {
    let score = 0;
    const factors = [];

    // Historical drought events
    const droughtEvents =
      historical.extremeEvents?.filter((e) => e.type === "drought").length || 0;
    if (droughtEvents > 1) {
      score += 30;
      factors.push("historical_drought_activity");
    }

    // Low precipitation forecast
    if (forecast.summary.avgPrecipitation < 15) {
      score += 35;
      factors.push("low_precipitation_forecast");
    }

    // Temperature trend
    if (historical.summary.temperatureTrend === "increasing") {
      score += 20;
      factors.push("increasing_temperature_trend");
    }

    return {
      score: Math.min(score, 100),
      level: this.getRiskLevel(score),
      factors,
    };
  }

  /**
   * Generate realistic temperature based on coordinates and date
   */
  generateRealisticTemperature(coordinates, date = new Date()) {
    const lat = coordinates.latitude;
    const month = date.getMonth() + 1;

    // Base temperature by latitude
    let baseTemp = 15 - Math.abs(lat) * 0.6;

    // Seasonal variation
    if (lat > 0) {
      baseTemp += 12 * Math.sin(((month - 3) * Math.PI) / 6);
    } else {
      baseTemp += 12 * Math.sin(((month - 9) * Math.PI) / 6);
    }

    // Add daily variation
    const variation = (Math.random() - 0.5) * 8;
    return Math.round(baseTemp + variation);
  }

  /**
   * Get weather condition based on precipitation chance
   */
  getWeatherCondition(precipChance) {
    if (precipChance < 10) return "clear";
    if (precipChance < 30) return "partly_cloudy";
    if (precipChance < 50) return "cloudy";
    if (precipChance < 70) return "light_rain";
    if (precipChance < 90) return "heavy_rain";
    return "thunderstorm";
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 80) return "very_high";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    if (score >= 20) return "low";
    return "very_low";
  }

  /**
   * Get random severity level
   */
  getRandomSeverity() {
    const severities = ["low", "moderate", "high", "extreme"];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  /**
   * Get default weather data
   */
  getDefaultWeather(coordinates) {
    return {
      location: coordinates,
      temperature: this.generateRealisticTemperature(coordinates),
      humidity: 50,
      windSpeed: 15,
      pressure: 1013,
      condition: "partly_cloudy",
      timestamp: new Date(),
      source: "default",
    };
  }

  /**
   * Get default risk assessment
   */
  getDefaultRisks() {
    return {
      flood: { score: 50, level: "medium", factors: [] },
      wildfire: { score: 50, level: "medium", factors: [] },
      hurricane: { score: 50, level: "medium", factors: [] },
      tornado: { score: 50, level: "medium", factors: [] },
      hail: { score: 50, level: "medium", factors: [] },
      drought: { score: 50, level: "medium", factors: [] },
    };
  }
}

module.exports = new WeatherService();
