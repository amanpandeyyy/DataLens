import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileText,
  MessageSquare,
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { CardSkeleton } from '../components/SkeletonLoader'
import api from '../services/api'

export const AIAnalystPage = ({ onNavigate }) => {
  const { activeDataset, showToast } = useDataLens()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!activeDataset) return

    try {
      setLoading(true)
      const res = await api.post(`/ai/${activeDataset.id}/analyze`)
      setAnalysis(res.data)
      showToast('AI analysis completed successfully!', 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Auto-run analysis when landing on page if not yet run
  useEffect(() => {
    if (activeDataset && !analysis && !loading) {
      handleAnalyze()
    }
  }, [activeDataset])

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to generate automated AI insights, anomalies, and business recommendations."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242424] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">AI Data Analyst</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Autonomous
            </span>
          </div>
          <p className="text-sm sm:text-base text-[#71717A] mt-1">
            In-depth analytical synthesis powered by statistical computing & heuristic pattern recognition.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Synthesizing...' : 'Re-Analyze Dataset'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-[#0B0B0B] border border-[#242424] text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto animate-pulse">
              <Cpu className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Synthesizing Dataset Intelligence...</h3>
            <p className="text-sm text-[#71717A] max-w-md mx-auto">
              Scanning dimensional distributions, computing statistical anomalies, evaluating correlations, and generating executive takeaways.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-8">
          {/* Executive Summary Card */}
          <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Executive Brief
                  </h2>
                  <div className="text-xs text-[#71717A] font-medium mt-0.5">
                    {analysis.model_used}
                  </div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Zero Hallucination
              </span>
            </div>

            <div className="prose prose-invert max-w-none text-sm sm:text-base text-[#D4D4D8] leading-relaxed space-y-3">
              {analysis.executive_summary.split('\n').map((line, idx) => {
                const trimmed = line.trim()
                if (!trimmed || trimmed.startsWith('###')) return null
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2.5 pl-2">
                      <span className="text-blue-400 font-bold mt-0.5">•</span>
                      <span dangerouslySetInnerHTML={{ __html: trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                    </div>
                  )
                }
                return (
                  <p key={idx} dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>') }} />
                )
              })}
            </div>
          </div>

          {/* Key Insights Section */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Key Analytical Insights ({analysis.key_insights.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.key_insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-5 hover:border-[#333333] transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded text-xs font-semibold bg-[#161616] text-blue-400 border border-[#242424] uppercase tracking-wider">
                      {insight.category}
                    </span>
                    {insight.metric && (
                      <span className="text-sm font-bold text-white font-mono">
                        {insight.metric}
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {insight.title}
                  </h4>

                  <p className="text-sm text-[#D4D4D8] leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Anomalies & Statistical Outliers */}
          {analysis.anomalies?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Detected Anomalies & Outliers ({analysis.anomalies.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.anomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0B0B0B] border border-amber-500/20 rounded-2xl p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-white text-base">
                        {anom.entity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                        {anom.anomaly_type}
                      </span>
                    </div>

                    <p className="text-sm text-[#D4D4D8] leading-relaxed">
                      {anom.detail}
                    </p>

                    <div className="text-xs text-[#71717A] pt-1 font-medium">
                      Variable: <span className="text-white font-mono font-semibold">{anom.column}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strategic Business Recommendations */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2.5">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              Actionable Business Recommendations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-[#0B0B0B] border border-[#242424] rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-white flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      {rec.title}
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500/10 text-blue-400 uppercase tracking-wider">
                      {rec.priority}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-[#71717A] font-medium">Action: </span>
                      <span className="text-[#D4D4D8]">{rec.action}</span>
                    </div>
                    <div>
                      <span className="text-[#71717A] font-medium">Expected Outcome: </span>
                      <span className="text-emerald-400 font-semibold">{rec.expected_outcome}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps Banner */}
          <div className="bg-[#111111] border border-[#242424] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-white">Have specific follow-up questions?</h4>
              <p className="text-sm text-[#A1A1AA] mt-0.5">
                Query your dataset naturally with SQL translation, or generate a full executive PDF report.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('chat-data')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat with Data</span>
              </button>
              <button
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] text-white border border-[#333333] text-sm font-semibold transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

