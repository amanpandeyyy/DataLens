import React, { useState, useEffect } from 'react'
import {
  Upload,
  Sparkles,
  TrendingUp,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  ChevronRight,
  BarChart2,
  FileSpreadsheet,
  Zap
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/SkeletonLoader'
import { formatCurrency, formatNumber, formatBytes, formatDate } from '../utils/formatters'
import api from '../services/api'

export const Dashboard = ({ onNavigate }) => {
  const { user, activeDataset, datasets, setActiveDataset, loadSampleDataset } = useDataLens()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch overview when active dataset changes
  useEffect(() => {
    if (!activeDataset) {
      setOverview(null)
      return
    }

    const fetchOverview = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/analytics/${activeDataset.id}/overview`)
        setOverview(res.data)
      } catch (err) {
        console.error('Failed to load dashboard overview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOverview()
  }, [activeDataset])

  const greetingTime = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {greetingTime()}, {user?.full_name?.split(' ')[0] || 'Analyst'}
          </h1>
          <p className="text-sm sm:text-base text-[#A1A1AA] mt-1">
            Turn raw data into actionable enterprise decisions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Upload className="w-4 h-4" />
            Upload Dataset
          </button>
          {!activeDataset && (
            <button
              onClick={loadSampleDataset}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#161616] text-[#A1A1AA] hover:text-white border border-[#242424] text-sm font-semibold rounded-xl transition-all"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              Try Sample Dataset
            </button>
          )}
        </div>
      </div>

      {/* No Dataset Empty State */}
      {!activeDataset && datasets.length === 0 && (
        <EmptyState
          title="No Datasets Available"
          subtitle="Upload your CSV, Excel, or JSON files to generate instant statistical models, interactive charts, and AI-driven business insights."
          actionText="Upload Dataset"
          onAction={() => onNavigate('upload')}
          showSampleButton={true}
        />
      )}

      {/* Dynamic KPIs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : overview?.kpis?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {overview.kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-[#111111] border border-[#242424] rounded-xl p-5 hover:border-[#333333] transition-all group"
            >
              <div className="flex items-center justify-between text-sm text-[#A1A1AA] mb-2 font-semibold">
                <span>{kpi.title}</span>
                {kpi.change_direction === 'up' && (
                  <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" /> Lift
                  </span>
                )}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                {kpi.value}
              </div>
              <div className="text-xs sm:text-sm text-[#71717A] mt-2 flex items-center gap-1">
                <span>{kpi.subtitle}</span>
              </div>
            </div>
          ))}

          {/* Data Quality Score KPI */}
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5 hover:border-[#333333] transition-all">
            <div className="flex items-center justify-between text-sm text-[#A1A1AA] mb-2 font-semibold">
              <span>Data Health Score</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight">
              {overview.data_quality_score}%
            </div>
            <div className="text-xs sm:text-sm text-[#71717A] mt-2">
              {overview.summary_badges?.missing_cells === 0
                ? 'Zero missing cells detected'
                : `${overview.summary_badges?.missing_cells} missing values flagged`}
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Dashboard Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Datasets (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Recent Datasets
            </h2>
            <button
              onClick={() => onNavigate('datasets')}
              className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              View all ({datasets.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {datasets.length === 0 ? (
            <div className="bg-[#111111] border border-[#242424] rounded-xl p-8 text-center text-sm text-[#71717A]">
              No datasets uploaded yet. Click "Upload Dataset" to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {datasets.slice(0, 5).map((d) => {
                const isSelected = activeDataset?.id === d.id
                return (
                  <div
                    key={d.id}
                    onClick={() => setActiveDataset(d)}
                    className={`bg-[#111111] border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all hover:bg-[#161616] ${
                      isSelected ? 'border-blue-500/50 ring-1 ring-blue-500/20 shadow-sm' : 'border-[#242424]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-[#161616] border border-[#242424] flex items-center justify-center text-[#A1A1AA] shrink-0">
                        <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white tracking-tight">
                            {d.name}
                          </span>
                          {isSelected && (
                            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                              Active
                            </span>
                          )}
                          {d.is_sample && (
                            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                              Sample
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#A1A1AA] mt-1 font-medium">
                          <span>{formatNumber(d.row_count)} rows</span>
                          <span>•</span>
                          <span>{d.col_count} columns</span>
                          <span>•</span>
                          <span>{formatBytes(d.file_size_bytes)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-[#71717A] shrink-0 border-t sm:border-t-0 border-[#1C1C1C] pt-2 sm:pt-0">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(d.created_at)}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDataset(d)
                          onNavigate('overview')
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] text-white text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Launch & AI Capabilities (1 Col) */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Analytics Workflow
          </h2>

          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5 space-y-3">
            <div
              onClick={() => onNavigate('ai-analyst')}
              className="p-4 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#242424] cursor-pointer transition-all flex items-start justify-between group"
            >
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  AI Data Analyst
                </div>
                <div className="text-xs sm:text-sm text-[#A1A1AA] mt-1 leading-relaxed">
                  1-Click executive insights, anomalies & business strategies.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors shrink-0 mt-0.5" />
            </div>

            <div
              onClick={() => onNavigate('chat-data')}
              className="p-4 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#242424] cursor-pointer transition-all flex items-start justify-between group"
            >
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                  <BarChart2 className="w-4 h-4 text-cyan-400" />
                  Chat with Data
                </div>
                <div className="text-xs sm:text-sm text-[#A1A1AA] mt-1 leading-relaxed">
                  Ask natural questions backed by DuckDB execution.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors shrink-0 mt-0.5" />
            </div>

            <div
              onClick={() => onNavigate('sql-lab')}
              className="p-4 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#242424] cursor-pointer transition-all flex items-start justify-between group"
            >
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                  <Database className="w-4 h-4 text-emerald-400" />
                  SQL Lab
                </div>
                <div className="text-xs sm:text-sm text-[#A1A1AA] mt-1 leading-relaxed">
                  Execute safe in-memory SQL queries in microseconds.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors shrink-0 mt-0.5" />
            </div>

            <div
              onClick={() => onNavigate('reports')}
              className="p-4 rounded-xl bg-[#161616] hover:bg-[#1E1E1E] border border-[#242424] cursor-pointer transition-all flex items-start justify-between group"
            >
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  Generate Report
                </div>
                <div className="text-xs sm:text-sm text-[#A1A1AA] mt-1 leading-relaxed">
                  Download professional PDF, Excel & CSV reports.
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#71717A] group-hover:text-white transition-colors shrink-0 mt-0.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

