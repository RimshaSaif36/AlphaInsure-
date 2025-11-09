'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'

interface DashboardStats {
  totalProperties: number
  activeClaims: number
  automatedClaims: number
  avgRiskScore: number
  riskTrend: string
}

interface Alert {
  id: string
  type: 'wildfire' | 'flood' | 'hurricane' | 'earthquake' | 'severe_weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: {
    city: string
    state: string
    coordinates: {
      latitude: number
      longitude: number
    }
  }
  issuedAt: string
  affectedProperties?: number
  actionRequired: boolean
}

interface Claim {
  id: string
  propertyId: string
  type: string
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'pending_review'
  amount: number
  submittedAt: string
  automationStatus?: {
    automated: boolean
    confidence?: number
    reason?: string
  }
}

interface BackendClaim {
  claimId?: string
  id: string
  propertyId: string
  claimType?: string
  type: string
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'pending_review'
  claimAmount?: number
  amount: number
  createdAt?: string
  submittedAt: string
  automation?: {
    isAutomated: boolean
    confidenceScore?: number
    automationReason?: string
  }
}

interface MonitoringData {
  activeAlerts: number
  monitoredProperties: number
  highRiskProperties: number
  automatedResponses: number
  lastUpdate: string
  alertBreakdown: {
    critical: number
    high: number
    medium: number
    low: number
  }
  recentEvents: any[]
  systemStatus: {
    satelliteFeeds: string
    weatherServices: string
    aiModels: string
    alertSystem: string
  }
}

interface ClaimsSummary {
  totalClaims: number
  totalAmount: number
  automatedClaims: number
  approvedClaims: number
  deniedClaims: number
  pendingClaims: number
  claimsByType: Array<{
    _id: string
    count: number
    totalAmount: number
  }>
  automation: {
    avgConfidence: number
    avgProcessingTime: number
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 15420,
    activeClaims: 234,
    automatedClaims: 87,
    avgRiskScore: 42,
    riskTrend: '+2.1%'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    // Using static data for quick demo
    setLoading(false)
    setError(null)
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}

export function useAlerts(expanded: boolean = false) {
  const staticAlerts: Alert[] = [
    {
      id: '1',
      type: 'wildfire',
      severity: 'critical',
      title: 'High Risk Wildfire Warning',
      description: 'Active wildfire detected within 25km of insured properties. Extreme weather conditions with low humidity and high winds.',
      location: {
        city: 'Los Angeles',
        state: 'CA',
        coordinates: { latitude: 34.0522, longitude: -118.2437 }
      },
      issuedAt: '2025-11-08T10:30:00Z',
      affectedProperties: 1247,
      actionRequired: true
    },
    {
      id: '2',
      type: 'hurricane',
      severity: 'high',
      title: 'Hurricane Risk Alert',
      description: 'Hurricane tracking toward Florida coast. Category 3 storm with 125mph winds expected to make landfall in 48 hours.',
      location: {
        city: 'Miami',
        state: 'FL',
        coordinates: { latitude: 25.7617, longitude: -80.1918 }
      },
      issuedAt: '2025-11-08T08:15:00Z',
      affectedProperties: 3456,
      actionRequired: true
    },
    {
      id: '3',
      type: 'flood',
      severity: 'medium',
      title: 'Flood Risk Elevated',
      description: 'Heavy rainfall expected over next 72 hours. River levels rising, potential for flash flooding in low-lying areas.',
      location: {
        city: 'Houston',
        state: 'TX',
        coordinates: { latitude: 29.7604, longitude: -95.3698 }
      },
      issuedAt: '2025-11-08T06:45:00Z',
      affectedProperties: 892,
      actionRequired: false
    }
  ]

  const [alerts, setAlerts] = useState<Alert[]>(staticAlerts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    // Using static data for quick demo - always success
    setLoading(false)
    setError(null)
    setAlerts(staticAlerts)
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const displayedAlerts = expanded ? alerts : alerts.slice(0, 3)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
  const highAlerts = alerts.filter(a => a.severity === 'high').length

  return { 
    alerts: displayedAlerts, 
    criticalAlerts, 
    highAlerts, 
    totalAlerts: alerts.length,
    loading, 
    error,
    refetch: fetchAlerts
  }
}

export function useClaimsSummary(expanded: boolean = false) {
  const staticClaims: Claim[] = [
    {
      id: 'CLM_001',
      propertyId: 'PROP_1001',
      type: 'Wildfire Damage',
      status: 'processing',
      amount: 125000,
      submittedAt: '2025-11-07T14:30:00Z',
      automationStatus: {
        automated: true,
        confidence: 92,
        reason: 'High confidence satellite verification'
      }
    },
    {
      id: 'CLM_002', 
      propertyId: 'PROP_1002',
      type: 'Hurricane Damage',
      status: 'approved',
      amount: 85000,
      submittedAt: '2025-11-06T09:15:00Z',
      automationStatus: {
        automated: true,
        confidence: 88,
        reason: 'Automated damage assessment completed'
      }
    },
    {
      id: 'CLM_003',
      propertyId: 'PROP_1003', 
      type: 'Flood Damage',
      status: 'pending_review',
      amount: 67500,
      submittedAt: '2025-11-05T16:45:00Z',
      automationStatus: {
        automated: false,
        confidence: 45,
        reason: 'Requires human review - complex case'
      }
    }
  ]

  const staticSummary: ClaimsSummary = {
    totalClaims: 156,
    totalAmount: 12450000,
    automatedClaims: 87,
    approvedClaims: 89,
    deniedClaims: 12,
    pendingClaims: 55,
    claimsByType: [
      { _id: 'Wildfire Damage', count: 45, totalAmount: 4200000 },
      { _id: 'Hurricane Damage', count: 38, totalAmount: 3800000 },
      { _id: 'Flood Damage', count: 42, totalAmount: 2650000 },
      { _id: 'Earthquake Damage', count: 31, totalAmount: 1800000 }
    ],
    automation: {
      avgConfidence: 78,
      avgProcessingTime: 24
    }
  }

  const [claims, setClaims] = useState<Claim[]>(staticClaims)
  const [summary, setSummary] = useState<ClaimsSummary | null>(staticSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = async () => {
    // Using static data for quick demo - always success
    setLoading(false)
    setError(null)
    setClaims(staticClaims)
    setSummary(staticSummary)
  }

  useEffect(() => {
    fetchClaims()
  }, [])

  const displayedClaims = expanded ? claims : claims.slice(0, 3)
  
  const stats = summary ? {
    total: summary.totalClaims,
    approved: summary.approvedClaims,
    processing: summary.pendingClaims,
    automated: summary.automatedClaims
  } : {
    total: claims.length,
    approved: claims.filter(c => c.status === 'approved').length,
    processing: claims.filter(c => c.status === 'processing').length,
    automated: claims.filter(c => c.automationStatus?.automated).length
  }

  return { 
    claims: displayedClaims, 
    stats, 
    summary,
    loading, 
    error,
    refetch: fetchClaims
  }
}

export function useSystemHealth() {
  const staticHealth = {
    status: 'healthy',
    uptime: '99.9%',
    services: {
      satelliteFeeds: 'operational',
      weatherServices: 'operational', 
      aiModels: 'operational',
      alertSystem: 'operational'
    },
    lastUpdate: new Date().toISOString()
  }

  const [health, setHealth] = useState<any>(staticHealth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    // Using static data for quick demo
    setLoading(false)
    setError(null)
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return { health, loading, error, refetch: fetchHealth }
}