import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { useDashboardStats } from '@/hooks/useInsuranceData'

interface DashboardStatsProps {
  // Made optional since we'll fetch data internally
  stats?: {
    totalProperties: number;
    activeClaims: number;
    automatedClaims: number;
    avgRiskScore: number;
    riskTrend: string;
  };
}

export function DashboardStats({ stats: propStats }: DashboardStatsProps) {
  const { stats: fetchedStats, loading, error, refetch } = useDashboardStats()
  
  // Use prop stats if provided (for backward compatibility), otherwise use fetched stats
  const stats = propStats || fetchedStats

  const statItems = [
    {
      name: 'Total Properties',
      value: stats.totalProperties.toLocaleString(),
      icon: BuildingOfficeIcon,
      color: 'from-pink-500 to-primary-600',
      bg: 'from-pink-500/20 to-primary-600/20',
      change: '+12.5%',
      positive: true,
    },
    {
      name: 'Active Claims',
      value: stats.activeClaims.toLocaleString(),
      icon: ExclamationTriangleIcon,
      color: 'from-warning-400 to-danger-500',
      bg: 'from-warning-400/20 to-danger-500/20',
      change: '-8.2%',
      positive: true,
    },
    {
      name: 'Automated Claims',
      value: stats.automatedClaims.toLocaleString(),
      icon: CheckCircleIcon,
      color: 'from-success-400 to-success-600',
      bg: 'from-success-400/20 to-success-600/20',
      change: '+24.1%',
      positive: true,
    },
    {
      name: 'Avg Risk Score',
      value: `${stats.avgRiskScore}%`,
      icon: ChartBarIcon,
      color: 'from-primary-400 to-pink-600',
      bg: 'from-primary-400/20 to-pink-600/20',
      change: stats.riskTrend,
      positive: !stats.riskTrend.startsWith('-'),
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl"></div>
              <div className="w-16 h-6 bg-pink-500/20 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="w-20 h-8 bg-pink-500/20 rounded"></div>
              <div className="w-24 h-4 bg-pink-500/20 rounded"></div>
            </div>
            <div className="mt-4 w-full h-1 bg-dark-700 rounded-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6">
        <div className="flex items-center justify-between text-pink-200">
          <span>Failed to load dashboard stats: {error}</span>
          <button
            onClick={refetch}
            className="flex items-center space-x-2 px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="relative overflow-hidden"
        >
          <div className={`bg-gradient-to-br from-dark-800/80 to-dark-900/80 backdrop-blur-sm rounded-2xl shadow-dark border border-pink-500/20 p-6 hover:shadow-pink-lg hover:border-pink-400/40 transition-all duration-300 relative overflow-hidden group`}>
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${item.color} shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  item.positive 
                    ? 'bg-success-500/20 text-success-300' 
                    : 'bg-danger-500/20 text-danger-300'
                }`}>
                  <span className={`text-xs ${!item.positive ? 'rotate-180' : ''}`}>↗</span>
                  <span>{item.change}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-2xl font-bold text-pink-100 group-hover:text-white transition-colors">
                  {item.value}
                </p>
                <p className="text-sm font-medium text-pink-300/70 group-hover:text-pink-200/90 transition-colors">
                  {item.name}
                </p>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 w-full h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (index + 1) * 25)}%` }}
                  transition={{ duration: 1, delay: index * 0.2 }}
                />
              </div>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 group-hover:animate-shimmer"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}