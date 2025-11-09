'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  MapIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon,
  CloudIcon,
  FireIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { RiskMap } from '../components/risk/RiskMap'
import { DashboardStats } from '../components/dashboard/DashboardStats'
import { RecentAlerts } from '../components/alerts/RecentAlerts'
import { ClaimsSummary } from '../components/claims/ClaimsSummary'
import { useSocketIO } from '../hooks/useSocketIO'
import toast, { Toaster } from 'react-hot-toast'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')

  // Real-time updates handlers
  const handleNewAlert = useCallback((alert: any) => {
    console.log('New alert in HomePage:', alert)
    // Force refresh of alerts component by triggering a re-render
    // The useAlerts hook will automatically fetch new data
  }, [])

  const handleClaimUpdate = useCallback((claim: any) => {
    console.log('Claim update in HomePage:', claim)
    // Force refresh of claims component
  }, [])

  const handleMonitoringUpdate = useCallback((data: any) => {
    console.log('Monitoring update in HomePage:', data)
    // Force refresh of dashboard stats
  }, [])

  // Enable real-time updates
  const { isConnected, emitTestAlert } = useSocketIO({
    onNewAlert: handleNewAlert,
    onClaimUpdate: handleClaimUpdate,
    onMonitoringUpdate: handleMonitoringUpdate,
    enabled: true
  })

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'map', name: 'Risk Map', icon: MapIcon },
    { id: 'alerts', name: 'Live Alerts', icon: ExclamationTriangleIcon },
    { id: 'claims', name: 'Claims', icon: EyeIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-pink-950">
      {/* Hero Section */}
      <div className="bg-gradient-pink-black relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-96 h-96 bg-pink-500 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-primary-400 rounded-full blur-3xl animate-float [animation-delay:2s]"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-300 rounded-full blur-3xl animate-float [animation-delay:4s]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-pink-200 via-primary-300 to-pink-100 bg-clip-text text-transparent animate-glow"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              AlphaInsure
            </motion.h1>
            <motion.p 
              className="text-xl md:text-3xl mb-8 text-pink-100 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              AI-Powered Risk Assessment & Claims Automation
              <span className="block text-lg text-pink-200 mt-2">From Space to Your Portfolio</span>
            </motion.p>
            
            {/* Real-time status indicator */}
            <motion.div 
              className="flex items-center justify-center space-x-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-pink-200 text-sm">
                {isConnected ? 'Demo Mode: Real-time simulated' : 'Demo Mode: Loading...'}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-6 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center space-x-2 bg-dark-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-pink-500/20">
                <CloudIcon className="w-5 h-5 text-pink-300" />
                <span className="text-pink-100">Satellite Intelligence</span>
              </div>
              <div className="flex items-center space-x-2 bg-dark-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-pink-500/20">
                <FireIcon className="w-5 h-5 text-pink-300" />
                <span className="text-pink-100">Real-time Risk Scoring</span>
              </div>
              <div className="flex items-center space-x-2 bg-dark-800/50 backdrop-blur-sm rounded-full px-4 py-2 border border-pink-500/20">
                <EyeIcon className="w-5 h-5 text-pink-300" />
                <span className="text-pink-100">Automated Claims</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-dark-900/90 backdrop-blur-sm border-b border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-3 border-b-2 text-sm font-medium transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'border-pink-500 text-pink-300 shadow-pink'
                    : 'border-transparent text-pink-200/70 hover:text-pink-200 hover:border-pink-500/50'
                }`}
              >
                <tab.icon className={`w-5 h-5 transition-colors ${activeTab === tab.id ? 'text-pink-400' : ''}`} />
                <span>{tab.name}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-primary-500/10 rounded-t-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Overview - Now using dynamic data internally */}
              <DashboardStats />

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link href="/risk-assessment" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 hover:shadow-pink-lg hover:border-pink-400/40 transition-all duration-300 hover:scale-105"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-pink-100 mb-1">Risk Assessment</h3>
                        <p className="text-sm text-pink-300/70">Analyze property risk</p>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors group-hover:translate-x-1 transform duration-300" />
                    </div>
                    <div className="mt-3 w-full h-1 bg-gradient-to-r from-pink-500 to-primary-400 rounded-full opacity-30"></div>
                  </motion.div>
                </Link>

                <Link href="/claims" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 hover:shadow-pink-lg hover:border-pink-400/40 transition-all duration-300 hover:scale-105"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-pink-100 mb-1">Submit Claim</h3>
                        <p className="text-sm text-pink-300/70">File new claim</p>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors group-hover:translate-x-1 transform duration-300" />
                    </div>
                    <div className="mt-3 w-full h-1 bg-gradient-to-r from-primary-500 to-pink-400 rounded-full opacity-30"></div>
                  </motion.div>
                </Link>

                <Link href="/properties" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 hover:shadow-pink-lg hover:border-pink-400/40 transition-all duration-300 hover:scale-105"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-pink-100 mb-1">Properties</h3>
                        <p className="text-sm text-pink-300/70">Manage portfolio</p>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors group-hover:translate-x-1 transform duration-300" />
                    </div>
                    <div className="mt-3 w-full h-1 bg-gradient-to-r from-pink-400 to-primary-500 rounded-full opacity-30"></div>
                  </motion.div>
                </Link>

                <Link href="/monitoring" className="group">
                  <motion.div 
                    className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 hover:shadow-pink-lg hover:border-pink-400/40 transition-all duration-300 hover:scale-105"
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-pink-100 mb-1">Live Monitoring</h3>
                        <p className="text-sm text-pink-300/70">Real-time alerts</p>
                      </div>
                      <ArrowRightIcon className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors group-hover:translate-x-1 transform duration-300" />
                    </div>
                    <div className="mt-3 w-full h-1 bg-gradient-to-r from-primary-400 to-pink-500 rounded-full opacity-30"></div>
                  </motion.div>
                </Link>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ClaimsSummary />
                <RecentAlerts />
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-6">
              <motion.div 
                className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-pink-100">Global Risk Map</h2>
                </div>
                <p className="text-pink-300/70 mb-6">
                  Real-time risk assessment visualization powered by satellite data and AI analysis.
                </p>
                <div className="h-96 rounded-xl overflow-hidden border border-pink-500/30 bg-dark-900/50">
                  <RiskMap />
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <motion.div 
                className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-danger-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-pink-100">Live Risk Alerts</h2>
                </div>
                <RecentAlerts expanded={true} />
              </motion.div>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="space-y-6">
              <motion.div 
                className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                  <h2 className="text-2xl font-bold text-pink-100">Claims Overview</h2>
                </div>
                <ClaimsSummary expanded={true} />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Demo Banner */}
      <div className="bg-gradient-to-r from-pink-950/80 to-dark-900/80 backdrop-blur-sm border-t border-pink-500/30 relative overflow-hidden">
        {/* Sparkle effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-1/4 w-1 h-1 bg-pink-400 rounded-full animate-sparkle"></div>
          <div className="absolute top-8 right-1/3 w-1 h-1 bg-primary-400 rounded-full animate-sparkle [animation-delay:0.5s]"></div>
          <div className="absolute bottom-6 left-2/3 w-1 h-1 bg-pink-300 rounded-full animate-sparkle [animation-delay:1s]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-pink-300 to-primary-300 bg-clip-text text-transparent">
                Hackathon Demo System
              </h3>
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse [animation-delay:0.5s]"></div>
            </div>
            <p className="text-pink-200/80 max-w-4xl mx-auto leading-relaxed">
              This is a demonstration of AI-powered insurance risk assessment using satellite data, 
              machine learning, and automated claims processing. Built for the{' '}
              <span className="text-pink-300 font-semibold">AI Earth Intelligence Challenge 2025</span>.
            </p>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-pink-300/60">
              <span>🚀 Next.js 14</span>
              <span>•</span>
              <span>🤖 AI/ML Engine</span>
              <span>•</span>
              <span>🛰️ Satellite Data</span>
              <span>•</span>
              <span>⚡ Real-time Processing</span>
              <span>•</span>
              <span className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                🔴 Live Updates {isConnected ? 'Active' : 'Offline'}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Toast notifications container */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-dark-800/90 text-pink-100 border border-pink-500/20',
          duration: 4000,
          style: {
            background: 'rgba(30, 23, 44, 0.9)',
            color: '#f8fafc',
            border: '1px solid rgba(236, 72, 153, 0.2)',
          },
        }}
      />
    </div>
  )
}