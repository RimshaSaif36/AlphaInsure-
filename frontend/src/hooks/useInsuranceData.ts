'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import RealDataService from '@/lib/realDataService'

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
  severity: 'low' | 'medium' | 'high' | 'critical' | 'extreme'
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
  status: 'submitted' | 'processing' | 'approved' | 'denied' | 'pending_review' | 'under_review'
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
    totalProperties: 0,
    activeClaims: 0,
    automatedClaims: 0,
    avgRiskScore: 0,
    riskTrend: '0%'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Simulate realistic loading time
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Load real data from JSON files
      const dashboardData = RealDataService.getDashboardStats()
      const claimsData = RealDataService.getClaims()
      const performanceMetrics = RealDataService.getPerformanceMetrics()
      
      // Transform to component format
      const realStats: DashboardStats = {
        totalProperties: dashboardData.overview.totalPolicies,
        activeClaims: claimsData.filter(c => ['submitted', 'processing', 'under_review'].includes(c.status)).length,
        automatedClaims: claimsData.filter(c => c.automation.isAutomated).length,
        avgRiskScore: Math.round(performanceMetrics.fraudDetectionRate),
        riskTrend: `+${dashboardData.recentActivity.newClaims.percentage.toFixed(1)}%`
      }
      
      setStats(realStats)
      setError(null)
    } catch (err) {
      setError('Failed to load dashboard statistics')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}

export function useAlerts(expanded: boolean = false) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Load real alerts data
      const realAlerts = RealDataService.getActiveAlerts()
      
      // Transform to component format
      const transformedAlerts: Alert[] = realAlerts.map(alert => ({
        id: alert.alertId,
        type: alert.type,
        severity: alert.severity as 'low' | 'medium' | 'high' | 'critical',
        title: alert.title,
        description: alert.description,
        location: {
          city: alert.location.region.split(' ')[0] || alert.location.region,
          state: alert.location.region.includes('California') ? 'CA' : 
                 alert.location.region.includes('Florida') ? 'FL' :
                 alert.location.region.includes('Texas') ? 'TX' :
                 alert.location.region.includes('Oklahoma') ? 'OK' : 'CA',
          coordinates: {
            latitude: alert.location.coordinates.lat,
            longitude: alert.location.coordinates.lng
          }
        },
        issuedAt: alert.timeframe.issued,
        affectedProperties: alert.affectedProperties.length,
        actionRequired: alert.severity === 'high' || alert.severity === 'extreme'
      }))
      
      setAlerts(transformedAlerts)
      setError(null)
    } catch (err) {
      setError('Failed to load alerts')
      console.error('Alerts error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const displayedAlerts = expanded ? alerts : alerts.slice(0, 3)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'extreme').length
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
  const [claims, setClaims] = useState<Claim[]>([])
  const [summary, setSummary] = useState<ClaimsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = async () => {
    try {
      setLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700))
      
      // Load real claims data
      const realClaims = RealDataService.getClaims()
      const claimsSummary = RealDataService.getClaimsSummary()
      const dashboardStats = RealDataService.getDashboardStats()
      
      // Transform claims to component format
      const transformedClaims: Claim[] = realClaims.slice(0, expanded ? realClaims.length : 5).map(claim => ({
        id: claim.claimId,
        propertyId: claim.propertyId,
        type: claim.claimType,
        status: claim.status,
        amount: claim.claimAmount,
        submittedAt: claim.submittedDate,
        automationStatus: {
          automated: claim.automation.isAutomated,
          confidence: claim.automation.confidenceScore,
          reason: claim.automation.automationReason
        }
      }))
      
      // Build comprehensive summary from real data
      const realSummary: ClaimsSummary = {
        totalClaims: claimsSummary.total,
        totalAmount: claimsSummary.totalValue,
        automatedClaims: claimsSummary.automated,
        approvedClaims: claimsSummary.approved,
        deniedClaims: claimsSummary.denied,
        pendingClaims: claimsSummary.pending + claimsSummary.processing,
        claimsByType: dashboardStats.claimsByType ? Object.entries(dashboardStats.claimsByType).map(([type, data]) => ({
          _id: type.charAt(0).toUpperCase() + type.slice(1) + ' Damage',
          count: (data as any).count,
          totalAmount: (data as any).value
        })) : [],
        automation: {
          avgConfidence: claimsSummary.automationRate,
          avgProcessingTime: Math.round(claimsSummary.averageClaimValue / 1000) // Simplified metric
        }
      }
      
      setClaims(transformedClaims)
      setSummary(realSummary)
      setError(null)
    } catch (err) {
      setError('Failed to load claims data')
      console.error('Claims error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [expanded])

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