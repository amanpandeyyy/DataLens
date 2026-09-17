import React, { useState, useEffect } from 'react'
import {
  Terminal,
  Play,
  Copy,
  Check,
  Sparkles,
  HelpCircle,
  History,
  Trash2,
  Clock,
  Database,
  ArrowRight,
  Code
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { TableSkeleton } from '../components/SkeletonLoader'
import { formatNumber } from '../utils/formatters'
import api from '../services/api'

export const SQLLabPage = ({ onNavigate }) => {
  const { activeDataset, showToast } = useDataLens()

  const [nlPrompt, setNlPrompt] = useState('Which products generated over ₹1L revenue?')
  const [sqlQuery, setSqlQuery] = useState(
    'SELECT product_name, SUM(revenue) AS total_revenue\nFROM dataset\nGROUP BY product_name\nHAVING SUM(revenue) > 100000\nORDER BY total_revenue DESC;'
  )
  const [generating, setGenerating] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [queryResult, setQueryResult] = useState(null)
  const [explainPlan, setExplainPlan] = useState(null)
  const [history, setHistory] = useState([])
  const [copied, setCopied] = useState(false)

  const fetchHistory = async () => {
    if (!activeDataset) return
    try {
      const res = await api.get(`/sql/${activeDataset.id}/history`)
      setHistory(res.data)
    } catch (err) {
      console.error('Failed to load SQL history:', err)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [activeDataset])

  // Generate SQL from Natural Language
  const handleGenerateSQL = async () => {
    if (!nlPrompt.trim() || !activeDataset) return
    try {
      setGenerating(true)
      const res = await api.post(`/sql/${activeDataset.id}/generate`, {
        prompt: nlPrompt
      })
      setSqlQuery(res.data.sql_query)
      showToast('Generated SQL from intent!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setGenerating(false)
    }
  }

  // Execute SQL in DuckDB
  const handleRunQuery = async (queryToRun) => {
    const q = queryToRun || sqlQuery
    if (!q.trim() || !activeDataset) return

    try {
      setExecuting(true)
      setExplainPlan(null)
      const res = await api.post(`/sql/${activeDataset.id}/execute`, {
        query: q,
        natural_language_prompt: nlPrompt || undefined
      })
      setQueryResult(res.data)
      if (res.data.success) {
        showToast(`Executed query in ${res.data.execution_time_ms} ms (${res.data.row_count} rows)`, 'success')
        fetchHistory()
      } else {
        showToast(res.data.error || 'Query execution failed', 'error')
      }
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setExecuting(false)
    }
  }

  // Explain Query
  const handleExplainQuery = async () => {
    if (!sqlQuery.trim() || !activeDataset) return
    try {
      setExecuting(true)
      const res = await api.post(`/sql/${activeDataset.id}/explain`, {
        query: sqlQuery
      })
      setExplainPlan(res.data)
      showToast('Generated DuckDB execution plan', 'info')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setExecuting(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlQuery)
    setCopied(true)
    showToast('Copied SQL to clipboard', 'info')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/sql/history/${id}`)
      setHistory((prev) => prev.filter((h) => h.id !== id))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to write and execute high-speed DuckDB SQL queries."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">DuckDB SQL Lab</h1>
        <p className="text-sm sm:text-base text-[#71717A] mt-1">
          In-memory analytical querying powered by DuckDB. Convert natural language questions into safe SQL or author custom SELECT statements.
        </p>
      </div>

      {/* 1. Natural Language -> SQL Generator Box */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-5 sm:p-6 space-y-3.5">
        <label className="text-sm font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          Ask Your Data (Natural Language)
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="e.g. Which categories generated over 500k revenue?"
            value={nlPrompt}
            onChange={(e) => setNlPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateSQL()}
            className="flex-1 bg-[#111111] border border-[#242424] rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleGenerateSQL}
            disabled={generating || !nlPrompt.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Formulating...' : 'Generate SQL'}</span>
          </button>
        </div>
      </div>

      {/* Quick SQL Templates Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-[#71717A] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Code className="w-4 h-4 text-blue-400" /> Templates:
        </span>
        {[
          { label: 'Top 10 Records', query: 'SELECT * FROM dataset LIMIT 10;' },
          { label: 'Count & Summary', query: 'SELECT COUNT(*) AS total_rows FROM dataset;' },
          { label: 'Group Aggregation', query: 'SELECT product_name, COUNT(*) AS count, SUM(revenue) AS total_revenue\nFROM dataset\nGROUP BY product_name\nORDER BY total_revenue DESC\nLIMIT 10;' },
          { label: 'Check Missing', query: 'SELECT * FROM dataset WHERE revenue IS NULL OR customer_name IS NULL LIMIT 20;' }
        ].map((tmpl, idx) => {
          const isTmplActive = sqlQuery.trim() === tmpl.query.trim()
          return (
            <button
              key={idx}
              onClick={() => setSqlQuery(tmpl.query)}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                isTmplActive
                  ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-500/50 shadow-md shadow-blue-600/30'
                  : 'bg-[#111111] hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white border border-[#242424]'
              }`}
            >
              {isTmplActive && <Check className="w-3.5 h-3.5 text-white" />}
              <span>{tmpl.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2. SQL Editor & Query History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl overflow-hidden">
            {/* Editor Toolbar */}
            <div className="h-12 px-4 border-b border-[#242424] bg-[#0E0E0E] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-[#A1A1AA]">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>dataset (in-memory table)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#202020] text-[#A1A1AA] hover:text-white border border-[#242424] text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleExplainQuery}
                  disabled={executing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] hover:bg-[#202020] text-[#A1A1AA] hover:text-white border border-[#242424] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span>Explain</span>
                </button>

                <button
                  onClick={() => handleRunQuery()}
                  disabled={executing || !sqlQuery.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{executing ? 'Executing...' : 'Run Query'}</span>
                </button>
              </div>
            </div>

            {/* SQL Code Textarea */}
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              rows={6}
              spellCheck={false}
              className="w-full bg-[#080808] p-4 text-sm sm:text-base font-mono text-emerald-400 focus:outline-none resize-y border-none leading-relaxed"
            />
          </div>

          {/* Explain Plan Banner */}
          {explainPlan && (
            <div className="p-4 rounded-xl bg-[#0B0B0B] border border-blue-500/30 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-sm text-blue-400 font-bold">
                <span>DuckDB Physical Plan Summary</span>
                <span>In-Memory Execution</span>
              </div>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {explainPlan.summary}
              </p>
              <pre className="p-3 rounded bg-[#080808] font-mono text-xs text-[#71717A] overflow-x-auto">
                {explainPlan.explain_plan}
              </pre>
            </div>
          )}

          {/* Execution Results View */}
          {queryResult && (
            <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl overflow-hidden space-y-3">
              {/* Metrics Status Bar */}
              <div className="px-5 py-3.5 border-b border-[#242424] bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">Execution Output</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#161616] text-emerald-400 border border-emerald-500/20">
                    {queryResult.execution_time_ms} ms
                  </span>
                  <span className="text-[#A1A1AA] font-medium">
                    {formatNumber(queryResult.row_count)} rows • {queryResult.column_count} columns
                  </span>
                </div>
              </div>

              {/* Result Table */}
              {!queryResult.success ? (
                <div className="p-6 text-sm text-rose-400 bg-rose-500/5 font-mono">
                  {queryResult.error}
                </div>
              ) : queryResult.rows?.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#71717A]">
                  Query executed successfully, returning 0 rows.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-[#111111] z-10">
                      <tr className="border-b border-[#242424] text-[#A1A1AA]">
                        {queryResult.columns.map((col) => (
                          <th key={col.name} className="px-4 py-3 font-bold whitespace-nowrap">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1A1A] text-[#D4D4D8]">
                      {queryResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#141414] transition-colors">
                          {queryResult.columns.map((col) => (
                            <td key={col.name} className="px-4 py-2.5 whitespace-nowrap font-mono text-sm">
                              {row[col.name] !== null ? String(row[col.name]) : <span className="text-[#52525B]">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Query History Sidebar (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Recent Queries
            </h3>
            <span className="text-xs text-[#71717A] font-mono font-medium">{history.length} saved</span>
          </div>

          {history.length === 0 ? (
            <div className="bg-[#0B0B0B] border border-[#242424] rounded-xl p-6 text-center text-sm text-[#71717A]">
              Executed queries will appear here.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {history.map((item) => {
                const isSelected = sqlQuery.trim() === item.query_text.trim()
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSqlQuery(item.query_text)
                      if (item.natural_language_prompt) setNlPrompt(item.natural_language_prompt)
                    }}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all space-y-2 group relative border ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/40 shadow-md shadow-blue-500/10'
                        : 'bg-[#0B0B0B] border-[#242424] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
                        )}
                        <span className={`text-sm font-bold truncate max-w-[150px] ${
                          isSelected ? 'text-blue-300' : 'text-white'
                        }`}>
                          {item.title || 'SQL Query'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-600 text-white shrink-0">
                            Loaded
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="text-[#71717A] hover:text-rose-400 p-1 transition-colors"
                          title="Delete query"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <pre className={`text-xs font-mono truncate ${
                      isSelected ? 'text-blue-200/80' : 'text-[#71717A]'
                    }`}>
                      {item.query_text.split('\n')[0]}
                    </pre>

                    <div className="flex items-center justify-between text-xs text-[#71717A] font-medium pt-1.5 border-t border-[#1C1C1C]">
                      <span>{item.execution_time_ms} ms</span>
                      <span>{item.row_count} rows</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

