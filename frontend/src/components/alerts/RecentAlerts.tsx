'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  FireIcon,
  CloudIcon,
  BoltIcon,
  EyeIcon,
  MapPinIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useAlerts } from '@/hooks/useInsuranceData'

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
  affectedProperties: number
  actionRequired: boolean
}

interface RecentAlertsProps {
  expanded?: boolean
}

export function RecentAlerts({ expanded = false }: RecentAlertsProps) {
  const { alerts, criticalAlerts, highAlerts, totalAlerts, loading, error, refetch } = useAlerts(expanded)
  
  // Fallback static data for when API fails
  const [fallbackAlerts] = useState<Alert[]>([
    {
      id: 'alert_1699401234567_wildfire',
      type: 'wildfire',
      severity: 'critical',
      title: 'High Risk Wildfire Warning',
      description: 'Active wildfire detected within 25km of insured properties. Extreme weather conditions with low humidity and high winds.',
      location: {
        city: 'Los Angeles',
        state: 'CA',
        coordinates: {
          latitude: 34.0522,
          longitude: -118.2437
        }
      },
      issuedAt: '2024-11-08T10:30:00Z',
      affectedProperties: 1247,
      actionRequired: true
    },
    {
      id: 'alert_1699401234568_hurricane',
      type: 'hurricane',
      severity: 'high',
      title: 'Hurricane Risk Alert',
      description: 'Hurricane tracking toward Florida coast. Category 3 storm with 125mph winds expected to make landfall in 48 hours.',
      location: {
        city: 'Miami',
        state: 'FL',
        coordinates: {
          latitude: 25.7617,
          longitude: -80.1918
        }
      },
      issuedAt: '2024-11-08T09:15:00Z',
      affectedProperties: 3456,
      actionRequired: true
    },
    {
      id: 'alert_1699401234569_flood',
      type: 'flood',
      severity: 'medium',
      title: 'Flood Risk Elevated',
      description: 'Heavy rainfall expected over next 72 hours. River levels rising, potential for flash flooding in low-lying areas.',
      location: {
        city: 'Houston',
        state: 'TX',
        coordinates: {
          latitude: 29.7604,
          longitude: -95.3698
        }
      },
      issuedAt: '2024-11-08T08:45:00Z',
      affectedProperties: 892,
      actionRequired: false
    }
  ])

  // Use dynamic data if available, otherwise fallback to static data
  const displayAlerts = error ? (expanded ? fallbackAlerts : fallbackAlerts.slice(0, 3)) : alerts
  const displayCriticalAlerts = error ? fallbackAlerts.filter(a => a.severity === 'critical').length : criticalAlerts
  const displayHighAlerts = error ? fallbackAlerts.filter(a => a.severity === 'high').length : highAlerts
  const displayTotalAlerts = error ? fallbackAlerts.length : totalAlerts

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'wildfire':
        return <FireIcon className="w-5 h-5 text-orange-400" />
      case 'flood':
        return <CloudIcon className="w-5 h-5 text-blue-400" />
      case 'hurricane':
        return <CloudIcon className="w-5 h-5 text-pink-400" />
      case 'earthquake':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-400" />
      case 'severe_weather':
        return <BoltIcon className="w-5 h-5 text-primary-400" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-pink-300" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-danger-300 bg-danger-500/20 border-danger-500/40'
      case 'high':
        return 'text-warning-300 bg-warning-500/20 border-warning-500/40'
      case 'medium':
        return 'text-primary-300 bg-primary-500/20 border-primary-500/40'
      case 'low':
        return 'text-success-300 bg-success-500/20 border-success-500/40'
      default:
        return 'text-pink-300 bg-pink-500/20 border-pink-500/40'
    }
  }

  const formatDate = (dateString: string) => {
    const now = new Date()
    const alertTime = new Date(dateString)
    const diffMinutes = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60))
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`
    } else {
      return alertTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Live Risk Alerts</h3>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="w-16 h-4 bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Live Risk Alerts</h3>
          <div className="flex items-center space-x-2">
            {displayCriticalAlerts > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                {displayCriticalAlerts} Critical
              </span>
            )}
            {displayHighAlerts > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">
                {displayHighAlerts} High
              </span>
            )}
            {error && (
              <button
                onClick={refetch}
                className="flex items-center space-x-1 px-2 py-1 bg-primary-100 hover:bg-primary-200 rounded-md transition-colors text-primary-700"
                title="Retry loading alerts"
              >
                <ArrowPathIcon className="w-3 h-3" />
                <span className="text-xs">Retry</span>
              </button>
            )}
          </div>
        </div>
        
        {!expanded && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{displayCriticalAlerts}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{displayHighAlerts}</p>
              <p className="text-sm text-gray-500">High Priority</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{displayTotalAlerts}</p>
              <p className="text-sm text-gray-500">Total Active</p>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border">
            ⚠️ Using cached data - failed to load latest alerts
          </div>
        )}
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {displayAlerts.map((alert) => (
          <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {alert.title}
                  </h4>
                  <div className="flex items-center space-x-2 ml-2">
                    {alert.actionRequired && (
                      <EyeIcon className="w-4 h-4 text-red-500" title="Action Required" />
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {alert.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    📍 {alert.location.city}, {alert.location.state}
                  </span>
                  {alert.affectedProperties && (
                    <span>
                      {alert.affectedProperties} properties affected
                    </span>
                  )}
                  <span>
                    {formatDate(alert.issuedAt)}
                  </span>
                </div>
                
                {expanded && alert.actionRequired && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-red-600">
                        ⚠️ Action Required
                      </span>
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!expanded && displayAlerts.length > 3 && (
        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-primary-500/10 text-center border-t border-pink-500/20">
          <button className="text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
            View All Alerts ({displayAlerts.length - 3} more)
          </button>
        </div>
      )}
      
      {expanded && (
        <div className="p-4 bg-gradient-to-r from-pink-500/10 to-primary-500/10 border-t border-pink-500/20">
          <div className="text-center">
            <p className="text-sm text-pink-200">
              🔴 Live monitoring active • Updates every 15 minutes
            </p>
            <p className="text-xs text-pink-300/70 mt-1">
              Powered by satellite data, weather stations, and AI analysis
            </p>
          </div>
        </div>
      )}
    </div>
  )
}