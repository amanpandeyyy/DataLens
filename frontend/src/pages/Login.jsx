import React, { useState } from 'react'
import {
  Layers,
  Sparkles,
  Lock,
  Mail,
  User,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  UserPlus,
  LogOut,
  Database,
  Cpu
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'

export const LoginPage = ({ onNavigate }) => {
  const { user, login, register, demoLogin, logout, showToast } = useDataLens()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('Data Analyst')
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password.trim()) {
      showToast('Please enter both email and password.', 'error')
      return
    }

    try {
      setLoading(true)
      await login(email.trim(), password)
      if (onNavigate) onNavigate('dashboard')
    } catch {
      // toast is triggered inside login
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault()
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      showToast('Please fill in all required fields.', 'error')
      return
    }

    try {
      setLoading(true)
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        role: role.trim()
      })
      if (onNavigate) onNavigate('dashboard')
    } catch {
      // toast is triggered inside register
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    try {
      setLoading(true)
      await demoLogin()
      if (onNavigate) onNavigate('dashboard')
    } catch {
      // toast is triggered inside demoLogin
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemoCreds = () => {
    setEmail('demo@datalens.ai')
    setPassword('datalens123')
    showToast('Demo credentials filled!', 'info')
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-500 mb-2 shadow-lg shadow-blue-500/10">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">DataLens</h1>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              AI Analytics
            </span>
          </div>
          <p className="text-sm text-[#71717A] max-w-xs mx-auto">
            Autonomous data analytics, in-memory DuckDB queries, and executive intelligence.
          </p>
        </div>

        {user ? (
          <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-[#1C1C1C] pb-4">
              <span className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" /> Active Session
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111111] border border-[#242424]">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-blue-600/25 shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-white truncate">{user.full_name}</h3>
                <p className="text-sm text-[#71717A] truncate font-mono">{user.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-600/10 text-blue-400 border border-blue-500/20">
                    {user.role || 'Data Analyst'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/25 cursor-pointer"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#141414] hover:bg-[#1C1C1C] text-[#A1A1AA] hover:text-rose-400 border border-[#282828] hover:border-rose-500/30 text-sm font-medium transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch Account / Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Form Card */
          <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 rounded-xl bg-[#111111] border border-[#242424]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </button>
            </div>

            {/* 1-Click Demo Login Banner */}
            <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" /> Quick Demo Access
                </span>
                <span className="text-xs text-emerald-400 font-semibold">Instant</span>
              </div>
              <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                Skip typing and log in immediately as Lead Data Analyst Alex Mercer.
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>1-Click Demo Login</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#222222] w-full" />
              <span className="bg-[#0B0B0B] px-3.5 text-xs text-[#71717A] uppercase font-semibold shrink-0">
                Or Sign In With Email
              </span>
              <div className="border-t border-[#222222] w-full" />
            </div>

            {/* Form */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5 flex items-center justify-between">
                    <span>Email Address</span>
                    <button
                      type="button"
                      onClick={handleFillDemoCreds}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Fill Demo
                    </button>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex@datalens.ai"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Alex Mercer"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="alex@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#A1A1AA] block mb-1.5">Role / Designation</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                    >
                      <option value="Lead Data Analyst">Lead Data Analyst</option>
                      <option value="Business Intelligence Specialist">Business Intelligence Specialist</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="Executive / Decision Maker">Executive / Decision Maker</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>
              </form>
            )}

            {/* Test Credentials Footer */}
            <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-xs text-[#71717A]">
              <span>Demo Account:</span>
              <span className="font-mono text-[#D4D4D8]">demo@datalens.ai / datalens123</span>
            </div>
          </div>
        )}

        {/* Back navigation link */}
        <div className="text-center">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-sm text-[#A1A1AA] hover:text-white transition-colors"
          >
            ← Back to Analytics Workspace
          </button>
        </div>
      </div>
    </div>
  )
}

