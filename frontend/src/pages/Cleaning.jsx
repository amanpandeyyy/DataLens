import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Trash2,
  Undo2,
  RotateCcw,
  Sliders,
  Filter,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Zap,
  Activity,
  ChevronDown,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  Table,
  ExternalLink
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/SkeletonLoader'
import { formatNumber } from '../utils/formatters'
import api from '../services/api'

export const CleaningPage = ({ onNavigate }) => {
  const { activeDataset, fetchDatasets, showToast } = useDataLens()
  const [quality, setQuality] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [lastCleanResult, setLastCleanResult] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  // Imputation modal / state
  const [selectedCol, setSelectedCol] = useState('')
  const [imputeStrategy, setImputeStrategy] = useState('mean')

  // Typecast state
  const [castCol, setCastCol] = useState('')
  const [targetType, setTargetType] = useState('string')

  // Outlier state
  const [outlierCol, setOutlierCol] = useState('')
  const [outlierMethod, setOutlierMethod] = useState('iqr')
  const [outlierThreshold, setOutlierThreshold] = useState(1.5)
  const [outlierResult, setOutlierResult] = useState(null)
  const [detectingOutliers, setDetectingOutliers] = useState(false)

  const fetchQuality = async () => {
    if (!activeDataset) return
    try {
      setLoading(true)
      const res = await api.get(`/clean/${activeDataset.id}/quality`)
      setQuality(res.data)
      if (res.data.missing_columns?.length > 0 && !selectedCol) {
        setSelectedCol(res.data.missing_columns[0].column)
      }
    } catch (err) {
      console.error('Failed to load quality data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuality()
  }, [activeDataset])

  // Download cleaned dataset directly
  const handleDownloadCleaned = async (format = 'csv') => {
    if (!activeDataset) return
    try {
      setDownloading(true)
      setShowDownloadMenu(false)
      const res = await api.get(`/clean/${activeDataset.id}/download`, {
        params: { format },
        responseType: 'blob'
      })
      const mimeTypes = {
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json'
      }
      const blob = new Blob([res.data], { type: mimeTypes[format] || 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeName = activeDataset.name.replace(/[^a-zA-Z0-9_-]/g, '_')
      a.download = `cleaned_${safeName}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast(`Cleaned dataset downloaded as ${format.toUpperCase()}!`, 'success')
    } catch (err) {
      showToast(`Download failed: ${err.message}`, 'error')
    } finally {
      setDownloading(false)
    }
  }

  // Execute missing value imputation
  const handleImpute = async () => {
    if (!selectedCol) return
    try {
      setActionLoading(true)
      const res = await api.post(`/clean/${activeDataset.id}/impute`, {
        column: selectedCol,
        strategy: imputeStrategy
      })
      showToast(res.data.message, 'success')
      setLastCleanResult({
        action: 'Missing Value Imputation',
        message: res.data.message,
        rowsAffected: res.data.rows_affected,
        time: new Date().toLocaleTimeString()
      })
      await fetchQuality()
      await fetchDatasets()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Remove duplicates
  const handleRemoveDuplicates = async () => {
    try {
      setActionLoading(true)
      const res = await api.post(`/clean/${activeDataset.id}/duplicates`, {
        keep: 'first'
      })
      showToast(res.data.message, 'success')
      setLastCleanResult({
        action: 'Duplicate Removal',
        message: res.data.message,
        rowsAffected: res.data.rows_affected,
        time: new Date().toLocaleTimeString()
      })
      await fetchQuality()
      await fetchDatasets()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Type cast
  const handleCastType = async () => {
    if (!castCol) return
    try {
      setActionLoading(true)
      const res = await api.post(`/clean/${activeDataset.id}/typecast`, {
        column: castCol,
        target_type: targetType
      })
      showToast(res.data.message, 'success')
      setLastCleanResult({
        action: 'Schema Type Cast',
        message: res.data.message,
        rowsAffected: res.data.rows_affected,
        time: new Date().toLocaleTimeString()
      })
      await fetchQuality()
      await fetchDatasets()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Detect outliers
  const handleDetectOutliers = async () => {
    if (!outlierCol) return
    try {
      setDetectingOutliers(true)
      const res = await api.post(`/clean/${activeDataset.id}/outliers/detect`, {
        column: outlierCol,
        method: outlierMethod,
        threshold: Number(outlierThreshold)
      })
      setOutlierResult(res.data)
      showToast(`Detected ${res.data.outlier_count} outliers in ${outlierCol}`, 'info')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDetectingOutliers(false)
    }
  }

  // Handle outliers remediation
  const handleOutlierAction = async (action) => {
    if (!outlierCol) return
    try {
      setActionLoading(true)
      const res = await api.post(`/clean/${activeDataset.id}/outliers/handle`, {
        column: outlierCol,
        method: outlierMethod,
        threshold: Number(outlierThreshold),
        action
      })
      showToast(res.data.message, 'success')
      setLastCleanResult({
        action: 'Outlier Remediation',
        message: res.data.message,
        rowsAffected: res.data.rows_affected,
        time: new Date().toLocaleTimeString()
      })
      setOutlierResult(null)
      await fetchQuality()
      await fetchDatasets()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Undo last cleaning action
  const handleUndo = async () => {
    try {
      setActionLoading(true)
      const res = await api.post(`/clean/${activeDataset.id}/undo`)
      showToast(res.data.message, 'success')
      setLastCleanResult(null)
      await fetchQuality()
      await fetchDatasets()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to run automated data cleaning and outlier remediation."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  const numericColumns = activeDataset.schema_metadata?.columns?.filter(c => c.detected_type === 'numeric') || []
  const allColumns = activeDataset.schema_metadata?.columns || []

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Undo Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Data Cleaning Studio</h1>
          <p className="text-sm text-[#71717A] mt-1">
            Resolve missing values, eliminate duplicate rows, cast schema datatypes, and remediate statistical outliers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQuality}
            disabled={loading || actionLoading}
            className="p-2 rounded-lg bg-[#111111] hover:bg-[#161616] text-[#A1A1AA] hover:text-white border border-[#242424] text-xs font-medium transition-all"
            title="Refresh Quality"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleUndo}
            disabled={!quality?.recent_history?.length || actionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161616] hover:bg-[#202020] text-white border border-[#242424] text-sm font-medium transition-all disabled:opacity-40 disabled:hover:bg-[#161616]"
          >
            <Undo2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Undo Action</span> ({quality?.history_count || 0})
          </button>

          {/* Download Cleaned Dataset Toolbar Button */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={downloading || actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/25 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : 'Download Cleaned Data'}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#111111] border border-[#2E2E2E] rounded-xl shadow-2xl p-2 z-30 space-y-1">
                <button
                  onClick={() => handleDownloadCleaned('csv')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-white hover:bg-blue-600/20 hover:text-blue-300 rounded-lg transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>CSV Format</span>
                  </span>
                  <span className="text-xs text-[#71717A] uppercase font-mono">.csv</span>
                </button>
                <button
                  onClick={() => handleDownloadCleaned('xlsx')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-white hover:bg-emerald-600/20 hover:text-emerald-300 rounded-lg transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Excel (.xlsx)</span>
                  </span>
                  <span className="text-xs text-[#71717A] uppercase font-mono">.xlsx</span>
                </button>
                <button
                  onClick={() => handleDownloadCleaned('json')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-white hover:bg-amber-600/20 hover:text-amber-300 rounded-lg transition-colors text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>JSON Array</span>
                  </span>
                  <span className="text-xs text-[#71717A] uppercase font-mono">.json</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cleaned Dataset Export Banner */}
      {(lastCleanResult || (quality?.history_count > 0)) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0E1526] to-[#0B0B0B] border border-blue-500/40 shadow-xl shadow-blue-500/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-white">
                    Cleaned Dataset Ready for Download
                  </h3>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {quality ? `${formatNumber(quality.total_rows)} rows` : 'Updated'}
                  </span>
                </div>
                <p className="text-sm text-[#A1A1AA] mt-1">
                  {lastCleanResult
                    ? `${lastCleanResult.message} (${lastCleanResult.rowsAffected || 0} rows updated)`
                    : `${quality?.history_count || 0} cleaning actions recorded. Export the purified dataset below.`}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleDownloadCleaned('csv')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/25 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Downloading...' : 'Download CSV'}</span>
              </button>

              <button
                onClick={() => handleDownloadCleaned('xlsx')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-white border border-[#2E2E2E] hover:border-emerald-500/50 text-sm font-semibold transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => handleDownloadCleaned('json')}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white border border-[#2E2E2E] text-sm font-semibold transition-all"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('overview')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#181818] text-[#A1A1AA] hover:text-[#D4D4D8] border border-[#242424] text-sm font-medium transition-all"
                title="Inspect in spreadsheet overview"
              >
                <Table className="w-4 h-4" />
                <span className="hidden md:inline">Inspect Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Overview Score Banner */}
      {quality && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5">
            <div className="text-sm text-[#A1A1AA] uppercase font-semibold">Health Score</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-2">
              {quality.quality_score}%
            </div>
            <div className="text-xs text-[#71717A] mt-2">
              {quality.quality_score > 90 ? 'Production Grade Integrity' : 'Cleaning Recommended'}
            </div>
          </div>

          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5">
            <div className="text-sm text-[#A1A1AA] uppercase font-semibold">Missing Cells</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mt-2">
              {quality.total_missing_cells}
            </div>
            <div className="text-xs text-[#71717A] mt-2">
              Across {quality.missing_columns?.length || 0} columns
            </div>
          </div>

          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5">
            <div className="text-sm text-[#A1A1AA] uppercase font-semibold">Duplicate Rows</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 mt-2">
              {quality.duplicate_rows_count}
            </div>
            <div className="text-xs text-[#71717A] mt-2">
              Redundant records detected
            </div>
          </div>

          <div className="bg-[#111111] border border-[#242424] rounded-xl p-5">
            <div className="text-sm text-[#A1A1AA] uppercase font-semibold">Active Records</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              {formatNumber(quality.total_rows)}
            </div>
            <div className="text-xs text-[#71717A] mt-2">
              {quality.total_columns} columns registered
            </div>
          </div>
        </div>
      )}

      {/* Cleaning Workstations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Missing Values Imputation */}
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Missing Values Studio</h3>
                <p className="text-sm text-[#71717A]">
                  Select a column and apply an automated statistical imputation strategy.
                </p>
              </div>
            </div>
          </div>

          {quality?.missing_columns?.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-300 flex items-center gap-2.5 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Zero missing values detected! All data cells in this dataset are fully populated.</span>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Target Column</label>
                  <div className="relative">
                    <select
                      value={selectedCol || (allColumns[0]?.name || '')}
                      onChange={(e) => setSelectedCol(e.target.value)}
                      className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                    >
                      {allColumns.map((c) => (
                        <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                          {c.name} ({c.dtype})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Imputation Strategy</label>
                  <div className="relative">
                    <select
                      value={imputeStrategy}
                      onChange={(e) => setImputeStrategy(e.target.value)}
                      className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                    >
                      <option value="mean" className="bg-[#141414] text-white">Fill with Mean (Numeric)</option>
                      <option value="median" className="bg-[#141414] text-white">Fill with Median (Numeric)</option>
                      <option value="mode" className="bg-[#141414] text-white">Fill with Mode (Frequent)</option>
                      <option value="ffill" className="bg-[#141414] text-white">Forward Fill</option>
                      <option value="bfill" className="bg-[#141414] text-white">Backward Fill</option>
                      <option value="drop_rows" className="bg-[#141414] text-white">Drop Null Rows</option>
                      <option value="drop_column" className="bg-[#141414] text-white">Drop Entire Column</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleImpute}
                disabled={actionLoading || (!selectedCol && !allColumns.length)}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-600/25 disabled:opacity-40 cursor-pointer"
              >
                Apply Imputation on {selectedCol || allColumns[0]?.name}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-[#A1A1AA] font-semibold flex items-center justify-between">
                  <span>Detected Columns with Nulls:</span>
                  <span className="text-xs text-amber-400 font-medium">Click to select target</span>
                </div>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {quality?.missing_columns?.map((m) => {
                    const isSelected = selectedCol === m.column
                    return (
                      <div
                        key={m.column}
                        onClick={() => setSelectedCol(m.column)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white ring-2 ring-amber-500/30 font-semibold shadow-md'
                            : 'bg-[#141414] border-[#2E2E2E] text-[#A1A1AA] hover:border-amber-500/50 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-400 bg-amber-400' : 'border-[#52525B]'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                          </div>
                          <span className="font-semibold">{m.column}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/30 text-amber-300 uppercase">
                              Selected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[#71717A] text-xs font-medium">{m.null_count} rows</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {m.null_percentage}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Target Column</label>
                  <div className="relative">
                    <select
                      value={selectedCol}
                      onChange={(e) => setSelectedCol(e.target.value)}
                      className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                    >
                      {quality?.missing_columns?.map((m) => (
                        <option key={m.column} value={m.column} className="bg-[#141414] text-white py-1">
                          {m.column} ({m.null_percentage}%)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Imputation Strategy</label>
                  <div className="relative">
                    <select
                      value={imputeStrategy}
                      onChange={(e) => setImputeStrategy(e.target.value)}
                      className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                    >
                      <option value="mean" className="bg-[#141414] text-white">Fill with Mean (Numeric)</option>
                      <option value="median" className="bg-[#141414] text-white">Fill with Median (Numeric)</option>
                      <option value="mode" className="bg-[#141414] text-white">Fill with Mode (Frequent)</option>
                      <option value="ffill" className="bg-[#141414] text-white">Forward Fill</option>
                      <option value="bfill" className="bg-[#141414] text-white">Backward Fill</option>
                      <option value="drop_rows" className="bg-[#141414] text-white">Drop Null Rows</option>
                      <option value="drop_column" className="bg-[#141414] text-white">Drop Entire Column</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleImpute}
                disabled={actionLoading || !selectedCol}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-amber-600/25 disabled:opacity-40 cursor-pointer"
              >
                Apply Imputation on {selectedCol}
              </button>
            </div>
          )}
        </div>

        {/* 2. Duplicate Rows Resolution */}
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Copy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Duplicate Rows</h3>
                <p className="text-sm text-[#71717A]">
                  Scan and prune duplicate transaction records.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#111111] border border-[#242424] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA] font-semibold">Duplicates Detected:</span>
                <span className="text-2xl font-bold text-rose-400">
                  {quality?.duplicate_rows_count || 0} rows
                </span>
              </div>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {quality?.duplicate_rows_count > 0
                  ? 'Redundant duplicate rows distort aggregate metrics, inflating sums and skewing averages.'
                  : 'Dataset is clean of duplicate records.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleRemoveDuplicates}
            disabled={actionLoading || quality?.duplicate_rows_count === 0}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-600/25 disabled:opacity-40 cursor-pointer"
          >
            Remove All Duplicates ({quality?.duplicate_rows_count || 0})
          </button>
        </div>

        {/* 3. Data Type Casting */}
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Data Type Casting</h3>
              <p className="text-sm text-[#71717A]">
                Convert schema column datatypes to unlock accurate mathematical modeling.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Target Column</label>
              <div className="relative">
                <select
                  value={castCol}
                  onChange={(e) => setCastCol(e.target.value)}
                  className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                >
                  <option value="" className="bg-[#141414] text-[#71717A]">Select column...</option>
                  {allColumns.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                      {c.name} ({c.dtype})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">New Datatype</label>
              <div className="relative">
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                >
                  <option value="string" className="bg-[#141414] text-white">String / Text</option>
                  <option value="integer" className="bg-[#141414] text-white">Integer</option>
                  <option value="float" className="bg-[#141414] text-white">Float / Decimal</option>
                  <option value="boolean" className="bg-[#141414] text-white">Boolean</option>
                  <option value="date" className="bg-[#141414] text-white">Date</option>
                  <option value="datetime" className="bg-[#141414] text-white">Datetime</option>
                </select>
                <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={handleCastType}
            disabled={actionLoading || !castCol}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 disabled:opacity-40 cursor-pointer"
          >
            Convert Column Type
          </button>
        </div>

        {/* 4. Outliers & Anomaly Detection (IQR, Z-Score, Isolation Forest) */}
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Outlier Detection & Remediation</h3>
              <p className="text-sm text-[#71717A]">
                Detect anomalies using IQR, Z-score, or Scikit-learn Isolation Forest.
              </p>
            </div>
          </div>

          {/* Recognizable Method Pills */}
          <div className="space-y-1.5">
            <label className="text-sm text-[#A1A1AA] font-semibold block">Select Detection Algorithm</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'iqr', label: 'IQR (1.5x)' },
                { id: 'zscore', label: 'Z-Score (|z|>3)' },
                { id: 'isolation_forest', label: 'Isolation Forest' }
              ].map((m) => {
                const isSelected = outlierMethod === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setOutlierMethod(m.id)
                      if (m.id === 'iqr') setOutlierThreshold(1.5)
                      else if (m.id === 'zscore') setOutlierThreshold(3.0)
                      else setOutlierThreshold(0.05)
                    }}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white ring-2 ring-purple-500/40 shadow-sm'
                        : 'bg-[#141414] border-[#2E2E2E] text-[#A1A1AA] hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Target Numeric Column</label>
              <div className="relative">
                <select
                  value={outlierCol}
                  onChange={(e) => setOutlierCol(e.target.value)}
                  className="w-full appearance-none bg-[#141414] border border-[#333333] hover:border-purple-500/60 focus:border-purple-500 rounded-xl px-4 py-2.5 pr-8 text-sm text-white transition-all cursor-pointer font-medium"
                >
                  <option value="" className="bg-[#141414] text-[#71717A]">Select column...</option>
                  {numericColumns.map((c) => (
                    <option key={c.name} value={c.name} className="bg-[#141414] text-white py-1">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm text-[#A1A1AA] font-semibold block mb-1.5">Sensitivity Threshold</label>
              <input
                type="number"
                step="0.1"
                value={outlierThreshold}
                onChange={(e) => setOutlierThreshold(e.target.value)}
                className="w-full bg-[#141414] border border-[#333333] focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-white font-mono"
              />
            </div>
          </div>

          <button
            onClick={handleDetectOutliers}
            disabled={detectingOutliers || !outlierCol}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-purple-600/25 disabled:opacity-40 cursor-pointer"
          >
            {detectingOutliers ? 'Scanning with Scikit-learn...' : 'Detect Outliers'}
          </button>

          {/* Detected Outliers Card */}
          {outlierResult && (
            <div className="p-4 rounded-xl bg-[#111111] border border-[#242424] space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A1A1AA] font-semibold">
                  Outliers in <span className="text-white font-bold">{outlierResult.column}</span>:
                </span>
                <span className="text-base font-bold text-purple-400 font-mono">
                  {outlierResult.outlier_count} ({outlierResult.outlier_percentage}%)
                </span>
              </div>

              {outlierResult.lower_bound !== null && (
                <div className="text-xs text-[#A1A1AA] font-mono">
                  Valid Range: [{outlierResult.lower_bound} to {outlierResult.upper_bound}]
                </div>
              )}

              {outlierResult.outlier_count > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleOutlierAction('remove')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Remove Rows
                  </button>
                  <button
                    onClick={() => handleOutlierAction('replace_median')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Replace (Median)
                  </button>
                  <button
                    onClick={() => handleOutlierAction('clamp')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clamp Bounds
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
