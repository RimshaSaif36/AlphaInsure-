import { useState } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Auth token management
let authToken: string | null = null

export const setAuthToken = (token: string) => {
  authToken = token
}

export const getAuthToken = () => authToken

// Simple fetch-based API client to avoid axios issues
const makeApiRequest = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options.headers
      },
      ...options
    }
    
    const response = await fetch(url, defaultOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// API Response types
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface RiskAssessmentRequest {
  lat: number
  lng: number
  assessmentType?: 'on_demand' | 'scheduled'
  forceRefresh?: boolean
}

interface RiskScore {
  score: number
  level: 'low' | 'medium' | 'high' | 'very_high'
  confidence: number
  factors?: string[]
}

interface RiskAssessmentResponse {
  assessmentId: string
  riskScores: {
    overall: RiskScore
    flood?: RiskScore
    wildfire?: RiskScore
    hurricane?: RiskScore
    earthquake?: RiskScore
  }
  satelliteData?: any
  weatherData?: any
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
    roles: string[]
    company: string
  }
  token: string
}

interface ClaimSubmissionRequest {
  propertyId: string
  claimType: string
  incidentDate: string
  claimAmount: number
  description: string
  documents?: File[]
}

interface ClaimSubmissionResponse {
  claim: {
    claimId: string
    propertyId: string
    claimType: string
    status: string
    incidentDate: string
    claimAmount: number
  }
  automation?: {
    automated: boolean
    confidence: number
    decision: string
  }
}

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRequest = async <T>(
    requestFn: () => Promise<T>
  ): Promise<ApiResponse<T>> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await requestFn()
      return {
        success: true,
        data: response as T
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      console.error('API Error:', errorMessage)
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  // Authentication
  const login = async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })
      
      if (response.success && response.data?.token) {
        setAuthToken(response.data.token)
      }
      
      return response.data || {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          roles: ['user'],
          company: 'AlphaInsure Demo'
        },
        token: 'demo_token_' + Date.now()
      }
    })
  }

  const getCurrentUser = async (): Promise<ApiResponse<LoginResponse['user']>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest('/auth/me')
      return response.data
    })
  }

  // Risk Assessment with backend integration
  const assessRisk = async (request: RiskAssessmentRequest): Promise<ApiResponse<RiskAssessmentResponse>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest('/risk/assess', {
        method: 'POST',
        body: JSON.stringify({
          coordinates: {
            lat: request.lat,
            lng: request.lng
          },
          assessmentType: request.assessmentType || 'on_demand',
          forceRefresh: request.forceRefresh || false
        })
      })
      return response.data
    })
  }

  const getPropertyRisk = async (propertyId: string): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest(`/risk/property/${propertyId}`)
      return response.data
    })
  }

  const getRiskHeatmap = async (bounds: any, riskType?: string): Promise<ApiResponse<any[]>> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({
        bounds: JSON.stringify(bounds),
        ...(riskType && { riskType }),
        gridSize: '0.1'
      })
      
      const response = await makeApiRequest(`/risk/heatmap?${params}`)
      return response.data
    })
  }

  // Claims
  const submitClaim = async (request: ClaimSubmissionRequest): Promise<ApiResponse<ClaimSubmissionResponse>> => {
    return handleRequest(async () => {
      const formData = new FormData()
      formData.append('propertyId', request.propertyId)
      formData.append('claimType', request.claimType)
      formData.append('incidentDate', request.incidentDate)
      formData.append('claimAmount', request.claimAmount.toString())
      formData.append('description', request.description)
      
      if (request.documents) {
        request.documents.forEach(file => {
          formData.append('documents', file)
        })
      }
      
      const response = await makeApiRequest('/claims/submit', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set Content-Type for FormData
      })
      return response.data
    })
  }

  const getClaim = async (claimId: string): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest(`/claims/${claimId}`)
      return response.data
    })
  }

  const automateClaimProcessing = async (claimId: string): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest(`/claims/${claimId}/automate`, {
        method: 'POST'
      })
      return response.data
    })
  }

  // Satellite Data
  const getSatelliteImagery = async (lat: number, lng: number, date?: string, source?: string): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({
        ...(date && { date }),
        ...(source && { source })
      })
      
      const response = await makeApiRequest(`/satellite/imagery/${lat}/${lng}?${params}`)
      return response.data
    })
  }

  const getPropertySatelliteData = async (lat: number, lng: number): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest(`/satellite/property-data/${lat}/${lng}`)
      return response.data
    })
  }

  // Monitoring
  const getAlerts = async (lat?: number, lng?: number, radius?: number, severity?: string): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const params = new URLSearchParams({
        ...(lat && { lat: lat.toString() }),
        ...(lng && { lng: lng.toString() }),
        ...(radius && { radius: radius.toString() }),
        ...(severity && { severity })
      })
      
      const response = await makeApiRequest(`/monitoring/alerts?${params}`)
      return response.data
    })
  }

  const getDashboardData = async (): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest('/monitoring/dashboard')
      return response.data
    })
  }

  // Health Check
  const checkHealth = async (): Promise<ApiResponse<any>> => {
    return handleRequest(async () => {
      const response = await makeApiRequest('/health')
      return response.data
    })
  }

  return {
    loading,
    error,
    
    // Auth
    login,
    getCurrentUser,
    
    // Risk Assessment
    assessRisk,
    getPropertyRisk,
    getRiskHeatmap,
    
    // Claims
    submitClaim,
    getClaim,
    automateClaimProcessing,
    
    // Satellite
    getSatelliteImagery,
    getPropertySatelliteData,
    
    // Monitoring
    getAlerts,
    getDashboardData,
    
    // Utilities
    checkHealth
  }
}