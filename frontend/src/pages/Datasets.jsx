import React, { useState } from 'react'
import {
  Database,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Plus,
  Clock,
  Sparkles,
  Info
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { formatNumber, formatBytes, formatDate } from '../utils/formatters'
import api from '../services/api'

export const DatasetsPage = ({ onNavigate }) => {
  const { datasets, activeDataset, setActiveDataset, fetchDatasets, showToast, loadSampleDataset } = useDataLens()
  const [deletingId, setDeletingId] = useState(null)

  const handleDelete = async (id, name, e) => {
    e.stopPropagation()
    if (!window.confirm(`Are you sure you want to delete dataset "${name}"?`)) return

    try {
      setDeletingId(id)
      await api.delete(`/datasets/${id}`)
      showToast(`Deleted "${name}"`, 'success')
      await fetchDatasets()
      if (activeDataset?.id === id) {
        setActiveDataset(null)
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Dataset Repository</h1>
          <p className="text-sm sm:text-base text-[#71717A] mt-1">
            Manage your loaded datasets, inspect schemas, and switch your active analytics context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('upload')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Upload New
          </button>
          <button
            onClick={loadSampleDataset}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111111] hover:bg-[#161616] text-[#A1A1AA] hover:text-white border border-[#242424] text-sm font-semibold rounded-xl transition-all"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            Add Sample
          </button>
        </div>
      </div>

      {datasets.length === 0 ? (
        <div className="bg-[#111111] border border-[#242424] rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-center text-blue-400 mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Datasets In Repository</h3>
          <p className="text-sm text-[#71717A]">
            Upload a CSV, XLSX, or JSON file, or load the built-in enterprise sample dataset.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('upload')}
              className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20"
            >
              Upload Dataset
            </button>
            <button
              onClick={loadSampleDataset}
              className="px-5 py-2.5 bg-[#161616] border border-[#242424] text-[#A1A1AA] hover:text-white text-sm font-semibold rounded-xl"
            >
              Try Sample
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((d) => {
            const isSelected = activeDataset?.id === d.id
            return (
              <div
                key={d.id}
                onClick={() => setActiveDataset(d)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#0E1526] border-blue-500 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10'
                    : 'bg-[#111111] border-[#242424] hover:bg-[#161616] hover:border-[#383838]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-400" />
                )}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-[#161616] border-[#242424] text-blue-400'
                      }`}>
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                          {d.name}
                        </h3>
                        <div className="text-xs text-[#71717A] mt-0.5 truncate max-w-[170px]">
                          {d.original_filename}
                        </div>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Selected
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1A1A1A] text-[#71717A] border border-[#242424] uppercase">
                        {d.file_type}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#1C1C1C] my-3 text-center">
                    <div>
                      <div className="text-xs text-[#71717A] uppercase font-semibold">Rows</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">{formatNumber(d.row_count)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#71717A] uppercase font-semibold">Columns</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">{d.col_count}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#71717A] uppercase font-semibold">Size</div>
                      <div className="text-sm sm:text-base font-bold text-white mt-0.5">{formatBytes(d.file_size_bytes)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-xs text-[#71717A] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(d.created_at)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveDataset(d)
                        onNavigate('overview')
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#222222] text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Preview
                    </button>
                    <button
                      disabled={deletingId === d.id}
                      onClick={(e) => handleDelete(d.id, d.name, e)}
                      className="p-2 rounded-lg text-[#71717A] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Dataset"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

