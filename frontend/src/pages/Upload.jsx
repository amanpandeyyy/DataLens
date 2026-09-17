import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Table,
  Wand2
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { formatNumber, formatBytes } from '../utils/formatters'
import api from '../services/api'

export const UploadPage = ({ onNavigate }) => {
  const { fetchDatasets, setActiveDataset, showToast } = useDataLens()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedOverview, setUploadedOverview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    const file = files[0]

    const validExtensions = ['.csv', '.xlsx', '.xls', '.json']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    if (!hasValidExt) {
      showToast('Unsupported file format. Please upload CSV, XLSX, or JSON.', 'error')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File exceeds 50MB limit.', 'error')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploading(true)
      const res = await api.post('/datasets/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      showToast(`Uploaded "${file.name}" successfully!`, 'success')
      setUploadedOverview(res.data)
      await fetchDatasets()
      setActiveDataset(res.data)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const onDragLeave = () => {
    setDragOver(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload Dataset</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Add your tabular data to start cleaning, querying, and extracting automated AI insights.
        </p>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-[#0B0B0B] ${
          dragOver
            ? 'border-blue-500 bg-blue-500/5 ring-4 ring-blue-500/10'
            : 'border-[#242424] hover:border-[#333333] hover:bg-[#111111]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-center text-blue-400 mb-5 shadow-inner">
          <UploadCloud className={`w-8 h-8 ${uploading ? 'animate-bounce text-blue-400' : ''}`} />
        </div>

        {uploading ? (
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-white">Uploading & Parsing Dataset...</h3>
            <p className="text-xs text-[#71717A]">
              Extracting schema, detecting column types, and validating data integrity.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white">
              Drop your dataset here
            </h3>
            <p className="text-sm text-[#71717A]">
              or <span className="text-blue-400 font-semibold hover:underline">browse files</span> from your computer
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#161616] text-[#A1A1AA] border border-[#242424]">
                CSV
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#161616] text-[#A1A1AA] border border-[#242424]">
                XLSX
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#161616] text-[#A1A1AA] border border-[#242424]">
                JSON
              </span>
            </div>
            <div className="text-xs text-[#71717A] font-medium">
              Maximum file size: 50MB
            </div>
          </div>
        )}
      </div>

      {/* Dataset Overview Summary Card (After Upload) */}
      {uploadedOverview && (
        <div className="bg-[#111111] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {uploadedOverview.name}
                </h3>
                <p className="text-sm text-[#71717A] mt-0.5 font-medium">
                  Parsed successfully • Ready for analytical workflows
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onNavigate('overview')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/20"
              >
                <Table className="w-4 h-4" />
                View Preview
              </button>
              <button
                onClick={() => onNavigate('ai-analyst')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-white border border-[#333333] text-sm font-semibold transition-all"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                Analyze with AI
              </button>
            </div>
          </div>

          {/* Metric Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-[#161616] border border-[#242424] rounded-xl p-4">
              <div className="text-xs text-[#71717A] uppercase font-semibold">Rows</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {formatNumber(uploadedOverview.row_count)}
              </div>
            </div>
            <div className="bg-[#161616] border border-[#242424] rounded-xl p-4">
              <div className="text-xs text-[#71717A] uppercase font-semibold">Columns</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {uploadedOverview.col_count}
              </div>
            </div>
            <div className="bg-[#161616] border border-[#242424] rounded-xl p-4">
              <div className="text-xs text-[#71717A] uppercase font-semibold">Missing Cells</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                {formatNumber(uploadedOverview.missing_values_count)}
              </div>
            </div>
            <div className="bg-[#161616] border border-[#242424] rounded-xl p-4">
              <div className="text-xs text-[#71717A] uppercase font-semibold">Duplicates</div>
              <div className="text-2xl font-extrabold text-rose-400 mt-1">
                {uploadedOverview.duplicate_rows_count}
              </div>
            </div>
            <div className="bg-[#161616] border border-[#242424] rounded-xl p-4 col-span-2 sm:col-span-1">
              <div className="text-xs text-[#71717A] uppercase font-semibold">Memory Usage</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {uploadedOverview.memory_usage_mb} MB
              </div>
            </div>
          </div>

          {/* Inferred Column Types List */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              Detected Schema & Column Classifications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {uploadedOverview.columns?.slice(0, 12).map((col) => (
                <div
                  key={col.name}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#161616] border border-[#242424] text-sm"
                >
                  <span className="text-white font-medium truncate mr-2">{col.name}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#202020] text-blue-400 uppercase tracking-wider shrink-0">
                    {col.detected_type}
                  </span>
                </div>
              ))}
            </div>
            {uploadedOverview.columns?.length > 12 && (
              <p className="text-xs text-[#71717A] font-medium mt-2">
                + {uploadedOverview.columns.length - 12} more columns detected
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

