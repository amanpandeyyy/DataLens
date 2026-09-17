import React, { useState, useEffect } from 'react'
import {
  BarChart2,
  TrendingUp,
  Layers,
  Sparkles,
  PieChart,
  Grid,
  Hash,
  Table as TableIcon
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { TableSkeleton } from '../components/SkeletonLoader'
import { formatNumber } from '../utils/formatters'
import api from '../services/api'

export const StatisticsPage = ({ onNavigate }) => {
  const { activeDataset } = useDataLens()
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('numeric')

  useEffect(() => {
    if (!activeDataset) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/analytics/${activeDataset.id}/overview`)
        setAnalytics(res.data)
      } catch (err) {
        console.error('Failed to load statistics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [activeDataset])

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to compute descriptive statistics and correlation matrices."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Statistical Overview</h1>
          <p className="text-sm sm:text-base text-[#71717A] mt-1">
            Descriptive statistics, distribution skewness benchmarks, and multi-variable Pearson correlation matrices.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center p-1 rounded-xl bg-[#111111] border border-[#2E2E2E] gap-1.5">
          <button
            onClick={() => setActiveTab('numeric')}
            className={`px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'numeric'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] font-medium'
            }`}
          >
            Numerical ({analytics?.numeric_stats?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('categorical')}
            className={`px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'categorical'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] font-medium'
            }`}
          >
            Categorical ({analytics?.categorical_stats?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`px-4 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${
              activeTab === 'correlation'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#1A1A1A] font-medium'
            }`}
          >
            Correlation Matrix
          </button>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          {/* 1. Numerical Statistics Tab */}
          {activeTab === 'numeric' && (
            <div className="bg-[#0B0B0B] border border-[#242424] rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#242424] bg-[#0E0E0E] text-xs sm:text-sm text-[#A1A1AA]">
                      <th className="px-4 py-3.5 font-bold">Column</th>
                      <th className="px-4 py-3.5 font-bold">Count</th>
                      <th className="px-4 py-3.5 font-bold">Mean</th>
                      <th className="px-4 py-3.5 font-bold">Std Dev</th>
                      <th className="px-4 py-3.5 font-bold">Min</th>
                      <th className="px-4 py-3.5 font-bold">25% (Q1)</th>
                      <th className="px-4 py-3.5 font-bold">Median (Q2)</th>
                      <th className="px-4 py-3.5 font-bold">75% (Q3)</th>
                      <th className="px-4 py-3.5 font-bold">Max</th>
                      <th className="px-4 py-3.5 font-bold">Skewness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A] text-sm text-[#D4D4D8]">
                    {analytics?.numeric_stats?.map((stat) => (
                      <tr key={stat.column} className="hover:bg-[#111111] transition-colors">
                        <td className="px-4 py-3.5 font-bold text-white whitespace-nowrap">
                          {stat.column}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{formatNumber(stat.count)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.mean.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.std.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.min.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.q25.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-blue-400">
                          {stat.median.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.q75.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono">{stat.max.toLocaleString()}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-mono font-semibold ${
                              Math.abs(stat.skewness) > 1
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-[#1A1A1A] text-[#71717A]'
                            }`}
                          >
                            {stat.skewness.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. Categorical Statistics Tab */}
          {activeTab === 'categorical' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics?.categorical_stats?.map((cat) => (
                <div
                  key={cat.column}
                  className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-5 sm:p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{cat.column}</h3>
                      <div className="text-xs text-[#71717A] mt-0.5 font-medium">
                        {cat.unique_count} distinct categories
                      </div>
                    </div>
                    {cat.top_value && (
                      <div className="text-right">
                        <div className="text-xs text-[#71717A] uppercase font-semibold">Top Value</div>
                        <div className="text-sm font-bold text-blue-400">
                          {cat.top_value} ({cat.top_frequency})
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Frequency Distribution Bars */}
                  <div className="space-y-2.5">
                    {cat.frequencies.map((freq) => (
                      <div key={freq.value} className="space-y-1">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-[#A1A1AA] truncate max-w-[200px] font-medium">{freq.value}</span>
                          <span className="text-white font-bold font-mono">
                            {formatNumber(freq.count)} ({freq.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#1A1A1A] overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(2, freq.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. Correlation Matrix Heatmap Tab */}
          {activeTab === 'correlation' && (
            <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Pearson Correlation Matrix</h3>
                  <p className="text-xs sm:text-sm text-[#71717A] mt-1">
                    Values range from -1.0 (inverse correlation) to +1.0 (direct correlation).
                  </p>
                </div>
              </div>

              {!analytics?.correlations ? (
                <div className="p-8 text-center text-sm text-[#71717A]">
                  Insufficient numeric variables to compute correlation matrix.
                </div>
              ) : (
                <div className="overflow-x-auto pt-2">
                  <table className="border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr>
                        <th className="p-3"></th>
                        {analytics.correlations.columns.map((col) => (
                          <th
                            key={col}
                            className="p-3 text-center font-bold text-[#A1A1AA] max-w-[120px] truncate"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.correlations.matrix.map((row, rIdx) => (
                        <tr key={rIdx}>
                          <td className="p-3 font-bold text-white whitespace-nowrap text-right pr-4">
                            {analytics.correlations.columns[rIdx]}
                          </td>
                          {row.map((val, cIdx) => {
                            // Heatmap color logic
                            let bg = 'bg-[#111111]'
                            let text = 'text-[#71717A]'
                            if (val > 0.7) {
                              bg = 'bg-blue-600/30'
                              text = 'text-blue-300 font-bold'
                            } else if (val > 0.3) {
                              bg = 'bg-blue-600/15'
                              text = 'text-blue-400 font-semibold'
                            } else if (val < -0.3) {
                              bg = 'bg-rose-600/20'
                              text = 'text-rose-400 font-semibold'
                            }

                            return (
                              <td
                                key={cIdx}
                                className={`p-3 text-center border border-[#1C1C1C] ${bg} ${text} rounded-lg font-mono text-xs sm:text-sm`}
                              >
                                {val.toFixed(2)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

