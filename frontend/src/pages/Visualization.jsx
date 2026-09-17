import React, { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import {
  PieChart as PieIcon,
  BarChart2,
  TrendingUp,
  Sliders,
  Play,
  Download,
  Layers,
  Sparkles,
  ChevronDown,
  BarChart3,
  Activity,
  CheckCircle2
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/SkeletonLoader'
import api from '../services/api'

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1'
]

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: TrendingUp },
  { id: 'area', label: 'Area Chart', icon: Layers },
  { id: 'pie', label: 'Pie Chart', icon: PieIcon },
  { id: 'scatter', label: 'Scatter', icon: Activity },
  { id: 'histogram', label: 'Histogram', icon: BarChart2 }
]

export const VisualizationPage = ({ onNavigate }) => {
  const { activeDataset, showToast } = useDataLens()

  const [chartType, setChartType] = useState('bar')
  const [xAxis, setXAxis] = useState('')
  const [yAxis, setYAxis] = useState('')
  const [groupBy, setGroupBy] = useState('')
  const [aggregation, setAggregation] = useState('sum')
  const [sortBy, setSortBy] = useState('y_desc')
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(false)

  const allColumns = activeDataset?.schema_metadata?.columns || []
  const numericColumns = allColumns.filter((c) => c.detected_type === 'numeric')
  const categoricalColumns = allColumns.filter((c) => c.detected_type === 'categorical' || c.detected_type === 'datetime' || c.detected_type === 'text')

  // Auto-set sensible defaults when activeDataset loads
  useEffect(() => {
    if (!activeDataset || allColumns.length === 0) return

    if (!xAxis) {
      const defaultX = categoricalColumns.find(c => ['category', 'city', 'order_date', 'date'].some(k => c.name.toLowerCase().includes(k))) || allColumns[0]
      if (defaultX) setXAxis(defaultX.name)
    }
    if (!yAxis) {
      const defaultY = numericColumns.find(c => ['revenue', 'sales', 'profit', 'total'].some(k => c.name.toLowerCase().includes(k))) || numericColumns[0]
      if (defaultY) setYAxis(defaultY.name)
    }
  }, [activeDataset, allColumns])

  const handleGenerateChart = async () => {
    if (!activeDataset || !xAxis) return

    try {
      setLoading(true)
      const res = await api.post(`/visualize/${activeDataset.id}`, {
        chart_type: chartType,
        x_axis: xAxis,
        y_axis: yAxis || undefined,
        group_by: groupBy || undefined,
        aggregation: aggregation,
        sort_by: sortBy,
        limit: 30
      })
      setChartData(res.data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Auto generate on mount or initial change
  useEffect(() => {
    if (activeDataset && xAxis && yAxis && !chartData) {
      handleGenerateChart()
    }
  }, [activeDataset, xAxis, yAxis])

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to build custom interactive visualizations."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  // Custom tooltip styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-[#242424] p-3 rounded-lg shadow-xl text-xs space-y-1 z-50">
          <div className="font-semibold text-white">{label}</div>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center gap-2" style={{ color: entry.color || '#3B82F6' }}>
              <span>{entry.name}:</span>
              <span className="font-mono font-medium">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Visualization Builder</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Craft customized multi-dimensional charts with flexible aggregations, grouping, and interactive tooltips.
        </p>
      </div>

      {/* 1. Recognizable Chart Type Selector Pills */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-5 space-y-3">
        <div className="text-xs sm:text-sm font-bold text-[#A1A1AA] uppercase tracking-wider px-1">
          Select Chart Visualization Type:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {CHART_TYPES.map((type) => {
            const Icon = type.icon
            const isSelected = chartType === type.id
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setChartType(type.id)}
                className={`flex items-center justify-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-md shadow-blue-500/10'
                    : 'bg-[#111111] border-[#242424] text-[#A1A1AA] hover:border-[#3E3E3E] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-[#71717A]'}`} />
                <span>{type.label}</span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 ml-auto" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 2. Builder Axis & Aggregation Controls */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* X Axis */}
        <div>
          <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5 flex items-center justify-between">
            <span>X Axis (Dimension)</span>
            <span className="text-xs text-blue-400 font-mono">Required</span>
          </label>
          <div className="relative">
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full appearance-none bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-white transition-all cursor-pointer"
            >
              {allColumns.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                  {c.name} ({c.detected_type})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Y Axis */}
        <div>
          <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5 flex items-center justify-between">
            <span>Y Axis (Metric)</span>
            <span className="text-xs text-[#71717A]">Optional</span>
          </label>
          <div className="relative">
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full appearance-none bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-white transition-all cursor-pointer"
            >
              <option value="" className="bg-[#141414] text-[#71717A]">None (Record Count)</option>
              {numericColumns.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Group By */}
        <div>
          <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5 flex items-center justify-between">
            <span>Group By</span>
            <span className="text-xs text-[#71717A]">Multi-series</span>
          </label>
          <div className="relative">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full appearance-none bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-white transition-all cursor-pointer"
            >
              <option value="" className="bg-[#141414] text-[#71717A]">None</option>
              {categoricalColumns.map((c) => (
                <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Aggregation */}
        <div>
          <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5 flex items-center justify-between">
            <span>Aggregation</span>
            <span className="text-xs text-emerald-400 font-mono">Math</span>
          </label>
          <div className="relative">
            <select
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value)}
              className="w-full appearance-none bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-white transition-all cursor-pointer"
            >
              <option value="sum" className="bg-[#141414] text-white">Sum (Total)</option>
              <option value="avg" className="bg-[#141414] text-white">Average / Mean</option>
              <option value="count" className="bg-[#141414] text-white">Count of Records</option>
              <option value="min" className="bg-[#141414] text-white">Minimum Value</option>
              <option value="max" className="bg-[#141414] text-white">Maximum Value</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Generate Button */}
        <div>
          <button
            onClick={handleGenerateChart}
            disabled={loading || !xAxis}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{loading ? 'Generating...' : 'Update Chart'}</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas Card */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {chartData?.title || 'Interactive Chart'}
            </h3>
            <p className="text-sm text-[#71717A] mt-0.5">
              X: {chartData?.x_label || xAxis} • Y: {chartData?.y_label || yAxis || 'Count'} • Type: {chartType.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="h-[460px] w-full pt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-sm text-[#71717A]">
              Rendering chart...
            </div>
          ) : !chartData || !chartData.data?.length ? (
            <div className="h-full flex flex-col items-center justify-center text-sm text-[#71717A] space-y-2">
              <BarChart2 className="w-10 h-10 text-[#333333]" />
              <span>Select dimensions above and click "Update Chart".</span>
            </div>
          ) : chartData.chart_type === 'pie' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.data}
                  dataKey={chartData.series_keys[0]}
                  nameKey={xAxis}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  innerRadius={60}
                  paddingAngle={3}
                >
                  {chartData.data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : chartData.chart_type === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                <XAxis dataKey={xAxis} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {chartData.series_keys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                    strokeWidth={2.5}
                    dot={{ fill: COLOR_PALETTE[i % COLOR_PALETTE.length], r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : chartData.chart_type === 'area' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                <XAxis dataKey={xAxis} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {chartData.series_keys.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                    fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                    fillOpacity={0.2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : chartData.chart_type === 'scatter' ? (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                <XAxis dataKey={xAxis} name={xAxis} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <YAxis dataKey={yAxis} name={yAxis} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={chartData.data} fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                <XAxis dataKey={xAxis} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {chartData.series_keys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
