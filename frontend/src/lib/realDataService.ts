/**
 * Utility functions for loading and managing real data from JSON files
 * Replaces static hardcoded data with actual realistic datasets
 */

import propertiesData from '../../../data/properties.json';
import claimsData from '../../../data/claims.json'; 
import alertsData from '../../../data/alerts.json';
import dashboardData from '../../../data/dashboard-stats.json';
import usersData from '../../../data/users.json';

// Type definitions for our real data
export interface Property {
  propertyId: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  propertyType: string;
  constructionYear: number;
  squareFootage: number;
  value: number;
  insurancePremium: number;
  riskFactors: {
    wildfire: number;
    earthquake: number;
    flood: number;
    hurricane: number;
  };
  lastInspection: string;
  owner: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface Claim {
  claimId: string;
  propertyId: string;
  claimType: string;
  status: 'submitted' | 'processing' | 'under_review' | 'approved' | 'denied';
  incidentDate: string;
  submittedDate: string;
  claimAmount: number;
  approvedAmount: number | null;
  description: string;
  documents: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  satelliteEvidence: {
    preDisasterImagery: string;
    postDisasterImagery: string;
    damageAnalysis: {
      damagePercentage: number;
      analysisConfidence: number;
      affectedAreas: string[];
    };
  };
  automation: {
    isAutomated: boolean;
    confidenceScore: number;
    automationReason: string;
    humanReviewRequired: boolean;
  };
  fraudRisk: {
    riskLevel: 'low' | 'medium' | 'high';
    riskScore: number;
    factors: string[];
  };
  processingTime: number | null;
  adjusterNotes: Array<{
    note: string;
    adjusterName: string;
    timestamp: string;
  }>;
}

export interface Alert {
  alertId: string;
  type: 'severe_weather' | 'wildfire' | 'flood' | 'earthquake';
  severity: 'low' | 'moderate' | 'high' | 'extreme';
  title: string;
  description: string;
  affectedProperties: string[];
  location: {
    region: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  timeframe: {
    issued: string;
    effective: string;
    expires: string;
  };
  recommendations: string[];
  source: string;
  impact: Record<string, any>;
  automatedActions: {
    notificationsSent: number;
    preventiveMeasuresTriggered: boolean;
    claimsTeamAlerted: boolean;
  };
}

export interface DashboardStats {
  overview: {
    totalPolicies: number;
    totalClaims: number;
    totalClaimValue: number;
    averageProcessingTime: number;
    automationRate: number;
    fraudDetectionRate: number;
  };
  recentActivity: {
    newClaims: {
      count: number;
      period: string;
      trend: 'up' | 'down' | 'stable';
      percentage: number;
    };
    claimsProcessed: {
      count: number;
      period: string;
      trend: 'up' | 'down' | 'stable';
      percentage: number;
    };
    alertsIssued: {
      count: number;
      period: string;
      trend: 'up' | 'down' | 'stable';
      percentage: number;
    };
  };
  [key: string]: any; // For additional dashboard metrics
}

// Data access functions
export class RealDataService {
  
  /**
   * Get all properties
   */
  static getProperties(): Property[] {
    return propertiesData as Property[];
  }

  /**
   * Get property by ID
   */
  static getProperty(propertyId: string): Property | undefined {
    return propertiesData.find(p => p.propertyId === propertyId) as Property | undefined;
  }

  /**
   * Get all claims
   */
  static getClaims(): Claim[] {
    return claimsData as Claim[];
  }

  /**
   * Get claims by status
   */
  static getClaimsByStatus(status: string): Claim[] {
    return claimsData.filter(c => c.status === status) as Claim[];
  }

  /**
   * Get claims summary for dashboard
   */
  static getClaimsSummary() {
    const claims = this.getClaims();
    
    const summary = claims.reduce((acc, claim) => {
      acc.total++;
      acc.totalValue += claim.claimAmount;
      
      if (claim.status === 'submitted') acc.pending++;
      else if (claim.status === 'processing') acc.processing++;
      else if (claim.status === 'approved') acc.approved++;
      else if (claim.status === 'denied') acc.denied++;
      
      if (claim.automation.isAutomated) acc.automated++;
      
      return acc;
    }, {
      total: 0,
      pending: 0,
      processing: 0,
      approved: 0,
      denied: 0,
      automated: 0,
      totalValue: 0
    });

    return {
      ...summary,
      automationRate: summary.total > 0 ? (summary.automated / summary.total) * 100 : 0,
      averageClaimValue: summary.total > 0 ? summary.totalValue / summary.total : 0
    };
  }

  /**
   * Get recent claims (last 30 days)
   */
  static getRecentClaims(days: number = 30): Claim[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return claimsData.filter(claim => {
      const submittedDate = new Date(claim.submittedDate);
      return submittedDate >= cutoffDate;
    }) as Claim[];
  }

  /**
   * Get all alerts
   */
  static getAlerts(): Alert[] {
    return alertsData as Alert[];
  }

  /**
   * Get active alerts (not expired)
   */
  static getActiveAlerts(): Alert[] {
    const now = new Date();
    return alertsData.filter(alert => {
      const expiryDate = new Date(alert.timeframe.expires);
      return expiryDate > now;
    }) as Alert[];
  }

  /**
   * Get recent alerts (last 7 days)
   */
  static getRecentAlerts(days: number = 7): Alert[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return alertsData.filter(alert => {
      const issuedDate = new Date(alert.timeframe.issued);
      return issuedDate >= cutoffDate;
    }) as Alert[];
  }

  /**
   * Get dashboard statistics
   */
  static getDashboardStats(): DashboardStats {
    return dashboardData as DashboardStats;
  }

  /**
   * Get all users
   */
  static getUsers() {
    return usersData;
  }

  /**
   * Get user by property ID
   */
  static getUserByProperty(propertyId: string) {
    return usersData.find(user => user.properties.includes(propertyId));
  }

  /**
   * Get risk analysis for properties
   */
  static getRiskAnalysis() {
    const properties = this.getProperties();
    
    const riskAnalysis = properties.map(p => {
      // Calculate overall risk score from individual risk factors
      const overallScore = (p.riskFactors.wildfire + p.riskFactors.earthquake + 
                           p.riskFactors.flood + p.riskFactors.hurricane) / 4;
      
      let riskLevel = 'low';
      if (overallScore > 0.7) riskLevel = 'high';
      else if (overallScore > 0.4) riskLevel = 'medium';
      
      return { ...p, overallScore, riskLevel };
    });
    
    return {
      highRisk: riskAnalysis.filter(p => p.riskLevel === 'high').length,
      mediumRisk: riskAnalysis.filter(p => p.riskLevel === 'medium').length,
      lowRisk: riskAnalysis.filter(p => p.riskLevel === 'low').length,
      averageRiskScore: riskAnalysis.reduce((sum, p) => sum + p.overallScore, 0) / riskAnalysis.length
    };
  }

  /**
   * Get geographic distribution of claims
   */
  static getGeographicClaims() {
    const claims = this.getClaims();
    const properties = this.getProperties();
    
    const distributionMap = new Map();
    
    claims.forEach(claim => {
      const property = properties.find(p => p.propertyId === claim.propertyId);
      if (property) {
        // Extract state from address string (format: "address, city, state zipcode")
        const addressParts = property.address.split(', ');
        const stateZip = addressParts[addressParts.length - 1];
        const state = stateZip.split(' ')[0]; // Get state part before zip code
        
        if (!distributionMap.has(state)) {
          distributionMap.set(state, { count: 0, totalValue: 0 });
        }
        
        const stateData = distributionMap.get(state);
        stateData.count++;
        stateData.totalValue += claim.claimAmount;
      }
    });
    
    return Object.fromEntries(distributionMap);
  }

  /**
   * Get performance metrics
   */
  static getPerformanceMetrics() {
    const claims = this.getClaims();
    const automatedClaims = claims.filter(c => c.automation.isAutomated);
    const manualClaims = claims.filter(c => !c.automation.isAutomated);
    
    return {
      automationRate: (automatedClaims.length / claims.length) * 100,
      averageProcessingTime: claims.reduce((sum, c) => sum + (c.processingTime || 0), 0) / claims.length,
      automatedProcessingTime: automatedClaims.reduce((sum, c) => sum + (c.processingTime || 0), 0) / automatedClaims.length,
      manualProcessingTime: manualClaims.reduce((sum, c) => sum + (c.processingTime || 0), 0) / manualClaims.length,
      fraudDetectionRate: claims.filter(c => c.fraudRisk.riskLevel === 'high').length / claims.length * 100
    };
  }
}

export default RealDataService;