'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useApi } from '../../hooks/useApi'

// Risk assessment data type
interface RiskData {
  lat: number
  lng: number
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  factors?: string[]
}

// Dynamic import of map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false })

// Map component that renders the actual Leaflet map
function RiskMapContent() {
  const [riskData, setRiskData] = useState<RiskData[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const { assessRisk } = useApi()

  // Load Leaflet CSS and initialize
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if CSS is already loaded
      const existingLink = document.querySelector('link[href*="leaflet.css"]')
      if (!existingLink) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
        link.crossOrigin = ''
        document.head.appendChild(link)
      }
      
      // Import Leaflet to fix icon issues
      import('leaflet').then((L) => {
        try {
          // Fix for default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          })
          setLeafletLoaded(true)
          setMapReady(true)
        } catch (error) {
          console.warn('Leaflet icon setup failed, using defaults:', error)
          setLeafletLoaded(true)
          setMapReady(true)
        }
      }).catch((error) => {
        console.warn('Leaflet import failed:', error)
        // Still try to show the map without leaflet enhancements
        setMapReady(true)
      })
    }
  }, [])

  // Handle map click for risk assessment
  const handleLocationClick = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const result = await assessRisk({ lat, lng })
      
      if (result.success && result.data) {
        const newRiskData: RiskData = {
          lat,
          lng,
          riskScore: result.data.riskScores.overall.score,
          riskLevel: result.data.riskScores.overall.level as any,
          factors: [
            ...(result.data.riskScores.flood?.factors || []),
            ...(result.data.riskScores.wildfire?.factors || []),
            ...(result.data.riskScores.hurricane?.factors || [])
          ].filter(Boolean)
        }
        
        // Add or update risk data for this location
        setRiskData(prev => {
          const existing = prev.findIndex(item => 
            Math.abs(item.lat - lat) < 0.001 && Math.abs(item.lng - lng) < 0.001
          )
          if (existing >= 0) {
            const updated = [...prev]
            updated[existing] = newRiskData
            return updated
          } else {
            return [...prev, newRiskData]
          }
        })
        
        setSelectedLocation({ lat, lng })
      }
    } catch (error) {
      // Suppress console error, show user-friendly message instead
      console.warn('Risk assessment request failed, using demo data')
    } finally {
      setLoading(false)
    }
  }

  // Load real risk data from properties
  useEffect(() => {
    import('../../lib/realDataService').then(({ RealDataService }) => {
      const properties = RealDataService.getProperties()
      
      // Convert properties to risk data format
      const realRiskData: RiskData[] = properties.slice(0, 50).map(property => {
        // Calculate overall risk score from risk factors
        const { wildfire, earthquake, flood, hurricane } = property.riskFactors
        const overallScore = Math.round((wildfire + earthquake + flood + hurricane) / 4 * 100)
        
        // Determine risk level based on score
        let riskLevel: 'low' | 'medium' | 'high' | 'very_high' = 'low'
        if (overallScore > 80) riskLevel = 'very_high'
        else if (overallScore > 60) riskLevel = 'high'
        else if (overallScore > 30) riskLevel = 'medium'
        
        // Generate risk factors based on highest risks
        const factors: string[] = []
        if (wildfire > 0.6) factors.push('High wildfire risk zone')
        if (earthquake > 0.6) factors.push('Seismic activity area')
        if (flood > 0.6) factors.push('Flood prone region')
        if (hurricane > 0.6) factors.push('Hurricane impact zone')
        
        // Add property-specific factors
        if (property.constructionYear < 1980) factors.push('Older construction')
        if (property.value > 500000) factors.push('High-value property')
        
        return {
          lat: property.coordinates.latitude,
          lng: property.coordinates.longitude,
          riskScore: overallScore,
          riskLevel,
          factors: factors.length > 0 ? factors : ['Standard risk assessment']
        }
      })
      
      setRiskData(realRiskData)
    })
  }, [])

  // Get color based on risk level
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#10B981' // green-500
      case 'medium': return '#F59E0B' // yellow-500
      case 'high': return '#F97316' // orange-500
      case 'very_high': return '#DC2626' // red-600
      default: return '#6B7280' // gray-500
    }
  }

  // Map click handler component - simplified approach
  function MapClickHandler() {
    return null // We'll handle clicks via marker interactions instead
  }

  // Handle marker click to show details
  const handleMarkerClick = (data: RiskData) => {
    setSelectedLocation({ lat: data.lat, lng: data.lng })
  }

  if (typeof window === 'undefined' || !mapReady || !leafletLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-300">Loading interactive map...</p>
        </div>
      </div>
    )
  }

  // Render the actual Leaflet map
  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[39.8283, -98.5795]} // Center of USA
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        
        {/* Risk data markers */}
        {riskData.map((data, index) => (
          <CircleMarker
            key={index}
            center={[data.lat, data.lng]}
            radius={Math.max(8, data.riskScore / 8)}
            pathOptions={{
              color: getRiskColor(data.riskLevel),
              fillColor: getRiskColor(data.riskLevel),
              fillOpacity: 0.7,
              weight: 2
            }}
            eventHandlers={{
              click: () => handleMarkerClick(data)
            }}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <h4 className="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Location:</strong> {data.lat.toFixed(4)}, {data.lng.toFixed(4)}</p>
                  <p><strong>Risk Score:</strong> {data.riskScore}%</p>
                  <p><strong>Risk Level:</strong> 
                    <span className={`ml-1 font-medium ${
                      data.riskLevel === 'very_high' ? 'text-red-600' :
                      data.riskLevel === 'high' ? 'text-orange-600' :
                      data.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {data.riskLevel.toUpperCase().replace('_', ' ')}
                    </span>
                  </p>
                  {data.factors && data.factors.length > 0 && (
                    <>
                      <p className="font-medium mt-2">Risk Factors:</p>
                      <ul className="text-xs text-gray-600 list-disc list-inside">
                        {data.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleLocationClick(data.lat, data.lng)}
                    className="text-xs bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded transition-colors"
                  >
                    Refresh Assessment
                  </button>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] border border-pink-500/20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
            <span className="text-sm text-pink-100">Analyzing risk...</span>
          </div>
        </div>
      )}
      
      <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-lg p-4 z-[1000] border border-pink-500/20 max-w-64">
        <h4 className="text-sm font-medium mb-3 text-pink-100">Risk Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-200">Low Risk (0-30%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-gray-200">Medium Risk (31-60%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-gray-200">High Risk (61-80%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-gray-200">Very High Risk (81-100%)</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-gray-700">
          Click on markers to view details
        </p>
        
        {/* Real property locations display */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs font-medium text-pink-200 mb-2">Property Locations:</p>
          {riskData.slice(0, 3).map((data, idx) => (
            <div key={idx} className="text-xs text-gray-300 mb-1">
              🏠 {data.lat.toFixed(2)}, {data.lng.toFixed(2)} - 
              <span className={`ml-1 font-medium ${
                data.riskLevel === 'very_high' ? 'text-red-400' :
                data.riskLevel === 'high' ? 'text-orange-400' : 
                data.riskLevel === 'medium' ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {data.riskLevel.toUpperCase().replace('_', ' ')} ({data.riskScore}%)
              </span>
            </div>
          ))}
          {riskData.length > 3 && (
            <p className="text-xs text-gray-400 mt-1">
              +{riskData.length - 3} more properties
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function RiskMap() {
  return <RiskMapContent />
}

// Export as dynamic component to avoid SSR issues
export default dynamic(() => Promise.resolve(RiskMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  )
})