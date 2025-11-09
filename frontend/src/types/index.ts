export interface Property {
  propertyId: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  propertyType: 'residential' | 'commercial' | 'industrial' | 'agricultural';
  construction: {
    yearBuilt?: number;
    materials?: string[];
    roofType?: string;
    floorCount?: number;
    squareFootage?: number;
  };
  insuranceDetails: {
    policyNumber: string;
    coverageAmount: number;
    deductible: number;
    premiumAnnual?: number;
    effectiveDate: string;
    expirationDate: string;
    coverageTypes: string[];
  };
  riskFactors: {
    floodZone?: string;
    hurricaneZone?: string;
    wildfireRisk?: 'low' | 'moderate' | 'high' | 'extreme';
    earthquakeZone?: string;
    proximityToWater?: number;
    elevation?: number;
  };
  currentRiskScore: {
    overall: number;
    flood: number;
    wildfire: number;
    hurricane: number;
    earthquake: number;
    lastUpdated: string;
  };
  satelliteData?: {
    lastImageryDate?: string;
    vegetationIndex?: number;
    soilMoisture?: number;
    thermalSignature?: number;
  };
}

export interface Claim {
  claimId: string;
  propertyId: string;
  claimType: 'flood' | 'wildfire' | 'hurricane' | 'earthquake' | 'hail' | 'wind' | 'other';
  incidentDate: string;
  reportedDate: string;
  claimAmount: number;
  estimatedLoss?: number;
  status: 'submitted' | 'under_review' | 'investigating' | 'approved' | 'denied' | 'paid' | 'closed';
  automation: {
    isAutomated: boolean;
    confidenceScore: number;
    automationReason: string;
    humanReviewRequired: boolean;
  };
  satelliteEvidence?: {
    preDisasterImagery?: SatelliteImage;
    postDisasterImagery?: SatelliteImage;
    damageAnalysis?: DamageAnalysis;
  };
  weatherData?: WeatherData;
  adjusterNotes: AdjusterNote[];
  documents: ClaimDocument[];
  paymentDetails?: {
    approvedAmount: number;
    approvalDate: string;
    paymentDate?: string;
    paymentMethod?: string;
    transactionId?: string;
  };
  fraudRisk: {
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    flaggedForReview: boolean;
  };
}

export interface RiskAssessment {
  assessmentId: string;
  propertyId: string;
  assessmentType: 'scheduled' | 'event_triggered' | 'on_demand' | 'claim_related';
  riskScores: {
    overall: {
      score: number;
      level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
      confidence: number;
    };
    flood: RiskScore;
    wildfire: RiskScore;
    hurricane: RiskScore;
    earthquake: RiskScore;
  };
  dataInputs: {
    satelliteData: SatelliteData;
    weatherData: WeatherData;
    geospatialData: GeospatialData;
  };
  modelMetadata: {
    modelVersion: string;
    algorithmUsed: string;
    trainingDataDate: string;
    validationScore: number;
  };
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  validUntil: string;
  triggerEvents: TriggerEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskScore {
  score: number;
  level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  factors: string[];
}

export interface SatelliteImage {
  imageUrl: string;
  imageId?: string;
  captureDate: string;
  source: string;
  resolution?: string;
  cloudCover?: number;
  bands?: string[];
  metadata?: any;
}

export interface DamageAnalysis {
  damagePercentage: number;
  damageType: string[];
  analysisConfidence: number;
  aiModelVersion: string;
  estimatedLoss?: number;
}

export interface WeatherData {
  current?: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    pressure: number;
    condition?: string;
    timestamp?: string;
  };
  forecast?: {
    precipitationRisk: number;
    stormProbability: number;
  };
  historical?: {
    avgTemperature: number;
    avgPrecipitation: number;
    extremeEvents: string[];
  };
}

export interface SatelliteData {
  imagery?: SatelliteImage;
  indices?: {
    ndvi: number;
    ndwi: number;
    nbr: number;
    moisture: number;
    temperature?: number;
  };
  analysisDate: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface GeospatialData {
  elevation: number;
  slope?: number;
  proximityToWater: number;
  soilType?: string;
  landUse?: string;
}

export interface AdjusterNote {
  note: string;
  adjusterName: string;
  timestamp: string;
}

export interface ClaimDocument {
  fileName: string;
  fileType: string;
  uploadDate: string;
  fileUrl: string;
}

export interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  mitigation?: string;
}

export interface Recommendation {
  type: 'preventive' | 'protective' | 'financial';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedCost?: number;
  potentialSavings?: number;
}

export interface TriggerEvent {
  eventType: string;
  threshold: number;
  action: string;
}

export interface Alert {
  id: string;
  type: 'wildfire' | 'flood' | 'hurricane' | 'earthquake' | 'severe_weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  issuedAt: string;
  expiresAt?: string;
  source: string;
  affectedProperties?: string[];
  actionRequired: boolean;
}

export interface DashboardStats {
  totalProperties: number;
  activeClaims: number;
  automatedClaims: number;
  avgRiskScore: number;
  riskTrend: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}