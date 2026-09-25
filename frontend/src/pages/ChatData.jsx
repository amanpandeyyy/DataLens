import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Terminal,
  Code,
  ChevronDown,
  ChevronUp,
  Table,
  BarChart2,
  Clock,
  CheckCircle2
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import api from '../services/api'

export const ChatDataPage = ({ onNavigate }) => {
  const { activeDataset, showToast } = useDataLens()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSqlIdx, setExpandedSqlIdx] = useState(null)
  const [quickPrompts, setQuickPrompts] = useState([])
  const messagesEndRef = useRef(null)
  const prevDatasetIdRef = useRef(null)

  // Initialize/reset greeting message when active dataset changes
  useEffect(() => {
    if (!activeDataset) return

    if (prevDatasetIdRef.current !== activeDataset.id) {
      prevDatasetIdRef.current = activeDataset.id
      setMessages([
        {
          role: 'assistant',
          content: `Hello! I am your AI Analyst for **${activeDataset.name}** (${activeDataset.row_count?.toLocaleString() || 0} records, ${activeDataset.col_count || 0} attributes). Ask me any question about distributions, comparisons, top cohorts, or trends. Every answer is computed in real time using DuckDB.`,
          sql_query: null
        }
      ])
    }
  }, [activeDataset])

  // Dynamically load tailored suggested prompts for the active dataset
  useEffect(() => {
    if (!activeDataset) return
    let isCancelled = false

    // 1. Generate immediate local suggestions from activeDataset metadata
    const cols = activeDataset.schema_metadata?.columns || activeDataset.schema_metadata?.columns_info || []
    const numCols = cols.filter(c => c.detected_type === 'numeric' || ['int', 'float', 'num'].some(t => c.dtype?.toLowerCase().includes(t)))
    const catCols = cols.filter(c => c.detected_type === 'categorical' || ['object', 'string', 'str'].some(t => c.dtype?.toLowerCase().includes(t)))
    const dateCols = cols.filter(c => c.detected_type === 'datetime' || ['date', 'time'].some(t => (c.name || '').toLowerCase().includes(t)))

    const localPrompts = []
    if (catCols.length > 0 && numCols.length > 0) {
      localPrompts.push(`Which ${catCols[0].name} has highest ${numCols[0].name}?`)
      if (catCols[0].sample_values && catCols[0].sample_values.length >= 2) {
        localPrompts.push(`Compare ${catCols[0].sample_values[0]} and ${catCols[0].sample_values[1]} on ${numCols[0].name}.`)
      }
      localPrompts.push(`Average ${numCols[0].name} by ${catCols[0].name}.`)
    } else if (numCols.length > 0) {
      localPrompts.push(`Show top 5 records by ${numCols[0].name}`)
      localPrompts.push(`Summary statistics for ${numCols[0].name}`)
    } else if (catCols.length > 0) {
      localPrompts.push(`Breakdown of records by ${catCols[0].name}`)
    }

    if (dateCols.length > 0) {
      localPrompts.push(`Show trend over ${dateCols[0].name}`)
    }
    localPrompts.push('What columns are in this dataset?')
    localPrompts.push('Show first 5 rows')

    setQuickPrompts(localPrompts.slice(0, 5))

    // 2. Fetch refined dynamic suggestions from backend
    api.get(`/ai/${activeDataset.id}/suggestions`)
      .then(res => {
        if (!isCancelled && res.data?.suggestions && res.data.suggestions.length > 0) {
          setQuickPrompts(res.data.suggestions)
        }
      })
      .catch(() => {
        // Fallback already set
      })

    return () => {
      isCancelled = true
    }
  }, [activeDataset?.id])


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (textToSend) => {
    const queryText = textToSend || input
    if (!queryText.trim() || !activeDataset || loading) return

    const newMessages = [...messages, { role: 'user', content: queryText }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post(`/ai/${activeDataset.id}/chat`, {
        message: queryText,
        conversation_history: messages.slice(-6)
      })

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: res.data.response,
          sql_query: res.data.sql_query,
          execution_time_ms: res.data.execution_time_ms,
          chart_spec: res.data.chart_spec,
          data_table: res.data.data_table
        }
      ])
    } catch (err) {
      showToast(err.message, 'error')
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `An analytical error occurred: ${err.message}. Your dataset remains intact.`,
          sql_query: null
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to start a conversational data exploration session."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#242424] pb-5 shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Chat with your data</h1>
        <p className="text-sm sm:text-base text-[#71717A] mt-1">
          Ask questions. Get answers backed by your dataset.
        </p>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-xs sm:text-sm font-bold text-[#A1A1AA] uppercase tracking-wider shrink-0 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-400" /> Suggestions:
        </span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-4 py-2 rounded-full bg-[#121212] hover:bg-blue-600/15 border border-[#2E2E2E] hover:border-blue-500/60 text-sm font-semibold text-[#D4D4D8] hover:text-blue-300 transition-all shrink-0 flex items-center gap-2 shadow-sm hover:shadow-blue-500/10 disabled:opacity-50 active:scale-95"
          >
            <span>{prompt}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-[#0B0B0B] border border-[#242424] rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user'

          return (
            <div
              key={index}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#161616] border border-[#242424] text-blue-400'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content */}
              <div className={`space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-[#111111] border border-[#242424] text-[#D4D4D8] rounded-tl-none'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    }}
                  />
                </div>

                {/* Embedded Interactive Chart (if generated) */}
                {msg.chart_spec && msg.chart_spec.data?.length > 1 && (
                  <div className="bg-[#111111] border border-[#242424] rounded-xl p-4 sm:p-5 w-full sm:w-[520px] space-y-3">
                    <div className="text-sm sm:text-base font-bold text-white flex items-center justify-between">
                      <span>{msg.chart_spec.title}</span>
                      <span className="text-xs text-[#A1A1AA] uppercase tracking-wider font-semibold">
                        {msg.chart_spec.type} chart
                      </span>
                    </div>

                    <div className="h-52 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        {msg.chart_spec.type === 'line' ? (
                          <LineChart data={msg.chart_spec.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                            <XAxis dataKey={msg.chart_spec.xKey} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                            <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ background: '#111111', border: '1px solid #242424', borderRadius: '8px', fontSize: '13px' }}
                            />
                            <Line type="monotone" dataKey={msg.chart_spec.yKey} stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
                          </LineChart>
                        ) : (
                          <BarChart data={msg.chart_spec.data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                            <XAxis dataKey={msg.chart_spec.xKey} stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                            <YAxis stroke="#71717A" tick={{ fill: '#A1A1AA', fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ background: '#111111', border: '1px solid #242424', borderRadius: '8px', fontSize: '13px' }}
                            />
                            <Bar dataKey={msg.chart_spec.yKey} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Expandable DuckDB Query Accordion */}
                {msg.sql_query && (
                  <div className="w-full sm:w-[520px]">
                    <button
                      onClick={() => setExpandedSqlIdx(expandedSqlIdx === index ? null : index)}
                      className="flex items-center gap-2 text-xs sm:text-sm text-[#A1A1AA] hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-[#161616] border border-[#242424] font-medium"
                    >
                      <Terminal className="w-4 h-4 text-emerald-400" />
                      <span>DuckDB Query</span>
                      {msg.execution_time_ms !== undefined && (
                        <span className="text-emerald-400 font-mono font-bold">({msg.execution_time_ms} ms)</span>
                      )}
                      {expandedSqlIdx === index ? (
                        <ChevronUp className="w-4 h-4 ml-auto" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      )}
                    </button>

                    {expandedSqlIdx === index && (
                      <div className="mt-2 p-3.5 rounded-xl bg-[#0E0E0E] border border-[#242424] font-mono text-xs sm:text-sm text-blue-300 overflow-x-auto whitespace-pre">
                        {msg.sql_query}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex gap-3 items-center text-sm font-medium text-[#A1A1AA]">
            <div className="w-9 h-9 rounded-xl bg-[#161616] border border-[#242424] flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <span>Formulating DuckDB query & computing response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="relative shrink-0"
      >
        <input
          type="text"
          placeholder={activeDataset ? `Ask anything about ${activeDataset.name} (e.g. 'Show summary statistics')...` : "Ask anything about this dataset..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="w-full bg-[#0B0B0B] border border-[#242424] rounded-xl pl-4 pr-14 py-3.5 text-sm sm:text-base text-white placeholder-[#71717A] focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 transition-all shadow-md shadow-blue-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

