const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    propertyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: "US" },
    },
    coordinates: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    propertyType: {
      type: String,
      enum: ["residential", "commercial", "industrial", "agricultural"],
      required: true,
    },
    construction: {
      yearBuilt: { type: Number, min: 1800 },
      materials: [{ type: String }],
      roofType: { type: String },
      floorCount: { type: Number, min: 1 },
      squareFootage: { type: Number, min: 1 },
    },
    insuranceDetails: {
      policyNumber: { type: String, required: true },
      coverageAmount: { type: Number, required: true },
      deductible: { type: Number, required: true },
      premiumAnnual: { type: Number },
      effectiveDate: { type: Date, required: true },
      expirationDate: { type: Date, required: true },
      coverageTypes: [{ type: String }],
    },
    riskFactors: {
      floodZone: { type: String },
      hurricaneZone: { type: String },
      wildfireRisk: {
        type: String,
        enum: ["low", "moderate", "high", "extreme"],
      },
      earthquakeZone: { type: String },
      proximityToWater: { type: Number }, // meters
      elevation: { type: Number }, // meters above sea level
    },
    currentRiskScore: {
      overall: { type: Number, min: 0, max: 100 },
      flood: { type: Number, min: 0, max: 100 },
      wildfire: { type: Number, min: 0, max: 100 },
      hurricane: { type: Number, min: 0, max: 100 },
      earthquake: { type: Number, min: 0, max: 100 },
      lastUpdated: { type: Date, default: Date.now },
    },
    satelliteData: {
      lastImageryDate: { type: Date },
      vegetationIndex: { type: Number },
      soilMoisture: { type: Number },
      thermalSignature: { type: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Geospatial index for location-based queries
propertySchema.index({ coordinates: "2dsphere" });

// Virtual for full address
propertySchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Method to calculate distance to a point
propertySchema.methods.distanceTo = function (lat, lng) {
  const earthRadiusKm = 6371;
  const dLat = ((lat - this.coordinates.latitude) * Math.PI) / 180;
  const dLng = ((lng - this.coordinates.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((this.coordinates.latitude * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

module.exports = mongoose.model("Property", propertySchema);
