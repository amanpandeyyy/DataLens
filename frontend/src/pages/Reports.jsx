import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileType,
  Sparkles,
  CheckCircle2,
  Trash2,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { formatBytes, formatDate } from '../utils/formatters'
import api from '../services/api'

export const ReportsPage = ({ onNavigate }) => {
  const { activeDataset, showToast } = useDataLens()

  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [reportFormat, setReportFormat] = useState('pdf')
  const [reportTitle, setReportTitle] = useState('')

  const fetchReports = async () => {
    if (!activeDataset) return
    try {
      setLoading(true)
      const res = await api.get('/reports', {
        params: { dataset_id: activeDataset.id }
      })
      setReports(res.data)
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [activeDataset])

  const handleGenerate = async () => {
    if (!activeDataset) return

    try {
      setGenerating(true)
      const res = await api.post(`/reports/${activeDataset.id}`, {
        title: reportTitle.trim() || `Executive Analysis: ${activeDataset.name}`,
        format: reportFormat
      })
      showToast(`Generated ${reportFormat.toUpperCase()} report successfully!`, 'success')
      await fetchReports()
      // Trigger instant download
      window.open(res.data.download_url, '_blank')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/reports/${id}`)
      setReports((prev) => prev.filter((r) => r.id !== id))
      showToast('Report deleted', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to generate publication-ready PDF, Excel, and CSV executive reports."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Executive Report Generator</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Compile automated publication-grade PDF documents, multi-tab Excel workbooks, and cleaned CSV datasets.
        </p>
      </div>

      {/* Generator Configuration Card */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Compile Comprehensive Analysis
            </h2>
            <p className="text-xs text-[#71717A]">
              Aggregates data health score, KPIs, executive summary, statistical distributions, and strategic recommendations.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm text-[#A1A1AA] block mb-1.5 font-semibold">
              Report Title (Optional)
            </label>
            <input
              type="text"
              placeholder={`Executive Analysis: ${activeDataset.name}`}
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-[#A1A1AA] block mb-1.5 font-semibold">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReportFormat('pdf')}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  reportFormat === 'pdf'
                    ? 'bg-rose-500/25 border-rose-500 text-rose-300 ring-2 ring-rose-500/40 shadow-md shadow-rose-500/10'
                    : 'bg-[#141414] border-[#2E2E2E] text-[#A1A1AA] hover:text-white hover:border-[#3E3E3E]'
                }`}
              >
                <FileType className="w-4 h-4" />
                <span>PDF</span>
                {reportFormat === 'pdf' && <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setReportFormat('xlsx')}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  reportFormat === 'xlsx'
                    ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10'
                    : 'bg-[#141414] border-[#2E2E2E] text-[#A1A1AA] hover:text-white hover:border-[#3E3E3E]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel</span>
                {reportFormat === 'xlsx' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => setReportFormat('csv')}
                className={`py-3 px-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  reportFormat === 'csv'
                    ? 'bg-blue-500/25 border-blue-500 text-blue-300 ring-2 ring-blue-500/40 shadow-md shadow-blue-500/10'
                    : 'bg-[#141414] border-[#2E2E2E] text-[#A1A1AA] hover:text-white hover:border-[#3E3E3E]'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>CSV</span>
                {reportFormat === 'csv' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 ml-0.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          {generating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Compiling Document...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate & Download {reportFormat.toUpperCase()}</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Reports Archive */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400" />
          Generated Report Archive ({reports.length})
        </h3>

        {reports.length === 0 ? (
          <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-8 text-center text-sm text-[#71717A]">
            No reports generated yet. Click above to generate your first document.
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              const isPdf = rep.format === 'pdf'
              const isXlsx = rep.format === 'xlsx'

              return (
                <div
                  key={rep.id}
                  className="bg-[#0B0B0B] border border-[#242424] hover:border-[#333333] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPdf
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : isXlsx
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {rep.format.toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{rep.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-[#A1A1AA] mt-0.5 font-medium">
                        <span>{formatBytes(rep.file_size_bytes)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-xs text-[#71717A]">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(rep.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <a
                      href={rep.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-[#222222] text-white border border-[#242424] text-xs sm:text-sm font-semibold transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </a>

                    <button
                      onClick={(e) => handleDelete(rep.id, e)}
                      className="p-2 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

