import React, { useState, useEffect } from 'react'
import {
  Settings,
  User,
  Cpu,
  Key,
  Database,
  Save,
  ShieldCheck,
  CheckCircle2,
  HardDrive
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import api from '../services/api'

export const SettingsPage = ({ onNavigate }) => {
  const { user, datasets, showToast } = useDataLens()

  const [provider, setProvider] = useState('demo')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [baseUrl, setBaseUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [providerInfo, setProviderInfo] = useState(null)

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await api.get('/ai/provider-info')
        setProviderInfo(res.data)
        setProvider(res.data.provider || 'demo')
        if (res.data.model) setModel(res.data.model)
      } catch (err) {
        console.error('Failed to fetch AI provider info:', err)
      }
    }
    fetchInfo()
  }, [])

  const handleSaveAIConfig = async () => {
    try {
      setSaving(true)
      const res = await api.post('/ai/configure', {
        provider,
        api_key: apiKey || undefined,
        model,
        base_url: baseUrl || undefined
      })
      setProviderInfo(res.data.provider_info)
      showToast('AI configuration saved successfully!', 'success')
      setApiKey('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-[#71717A] mt-1">
          Configure AI intelligence engines, manage user profiles, and view underlying analytics storage.
        </p>
      </div>

      {/* 1. Profile Section */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">User Profile</h2>
            <p className="text-xs text-[#71717A]">
              Current logged-in session credentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-[#71717A] block mb-1 font-medium">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.full_name || 'Alex Mercer'}
              className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#71717A] block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || 'demo@datalens.ai'}
              className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-[#71717A] block mb-1 font-medium">Role</label>
            <input
              type="text"
              readOnly
              value={user?.role || 'Lead Data Analyst'}
              className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. AI Intelligence Settings */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Provider Configuration</h2>
              <p className="text-sm text-[#71717A] mt-0.5">
                Switch between built-in Heuristic Analysis or connect external LLM providers.
              </p>
            </div>
          </div>

          <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-[#161616] text-blue-400 border border-[#242424]">
            Active: {providerInfo?.is_demo_mode ? 'Deterministic Local Engine' : providerInfo?.provider}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#A1A1AA] block mb-2 font-bold">Select AI Provider</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { id: 'demo', name: 'Heuristic', desc: 'Zero-Key Local' },
                { id: 'openai', name: 'OpenAI', desc: 'GPT-4o / Mini' },
                { id: 'anthropic', name: 'Anthropic', desc: 'Claude 3.5' },
                { id: 'groq', name: 'Groq', desc: 'Llama 3 (Ultra-Fast)' },
                { id: 'ollama', name: 'Ollama', desc: 'Local Self-Hosted' }
              ].map((p) => {
                const isSelected = provider === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setProvider(p.id)
                      if (p.id === 'openai') setModel('gpt-4o-mini')
                      if (p.id === 'groq') setModel('llama-3.3-70b-versatile')
                      if (p.id === 'anthropic') setModel('claude-3-5-sonnet-20241022')
                      if (p.id === 'ollama') setModel('llama3')
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/40 text-white shadow-md shadow-blue-500/10'
                        : 'bg-[#111111] border-[#242424] hover:bg-[#161616] hover:border-[#383838] text-[#A1A1AA]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#D4D4D8]'}`}>
                        {p.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-[#71717A] block truncate font-medium">
                      {p.desc}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#71717A] block mb-1.5 font-medium">Model ID</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. gpt-4o-mini, llama-3.3-70b-versatile"
                className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {provider !== 'demo' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
              <div>
                <label className="text-xs text-[#71717A] block mb-1.5 font-medium flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-... (leave blank to keep current key)"
                  className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-[#71717A] block mb-1.5 font-medium">
                  Custom Base URL (Optional)
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSaveAIConfig}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save AI Configuration'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Storage & Analytics Environment */}
      <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Storage & Analytics Sandbox</h2>
            <p className="text-sm text-[#71717A] mt-0.5">
              In-memory DuckDB virtual engine with persistent SQLite/PostgreSQL metadata.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-4">
            <div className="text-xs text-[#71717A] uppercase font-semibold">Datasets Stored</div>
            <div className="text-xl font-extrabold text-white mt-1.5">{datasets.length}</div>
          </div>
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-4">
            <div className="text-xs text-[#71717A] uppercase font-semibold">Execution Engine</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-1.5">DuckDB In-Memory</div>
          </div>
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-4">
            <div className="text-xs text-[#71717A] uppercase font-semibold">SQL Sandbox</div>
            <div className="text-xl font-extrabold text-blue-400 mt-1.5">Read-Only Safe</div>
          </div>
          <div className="bg-[#111111] border border-[#242424] rounded-xl p-4">
            <div className="text-xs text-[#71717A] uppercase font-semibold">ReportLab PDF</div>
            <div className="text-xl font-extrabold text-white mt-1.5">Active</div>
          </div>
        </div>
      </div>
    </div>
  )
}

