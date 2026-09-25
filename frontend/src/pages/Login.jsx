import React, { useState, useEffect } from 'react'
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
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Radio
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { pingServer } from '../services/api'

export const LoginPage = ({ onNavigate }) => {
  const { user, login, register, demoLogin, logout, showToast } = useDataLens()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('Data Analyst')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [serverOnline, setServerOnline] = useState(null) // null (checking) | true | false
  const [slowServerNotice, setSlowServerNotice] = useState(false)

  // Pre-warm the backend immediately upon page load to eliminate Render cold start
  useEffect(() => {
    let isMounted = true
    pingServer().then((online) => {
      if (isMounted) setServerOnline(online)
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Timer for displaying cold-start feedback if request takes > 2 seconds
  useEffect(() => {
    let timer
    if (loading) {
      timer = setTimeout(() => {
        setSlowServerNotice(true)
      }, 2000)
    } else {
      setSlowServerNotice(false)
    }
    return () => clearTimeout(timer)
  }, [loading])

  const handleLoginSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')
    const cleanEmail = email.trim()
    const cleanPass = password.trim()

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      await login(cleanEmail, cleanPass)
      if (onNavigate) onNavigate('dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault()
    setErrorMsg('')
    const cleanEmail = email.trim()
    const cleanPass = password.trim()
    const cleanName = fullName.trim()

    if (!cleanEmail || !cleanPass || !cleanName) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    if (cleanPass.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }

    try {
      setLoading(true)
      await register({
        email: cleanEmail,
        password: cleanPass,
        full_name: cleanName,
        role: role.trim()
      })
      if (onNavigate) onNavigate('dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Email might already exist.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setErrorMsg('')
    try {
      setLoading(true)
      await demoLogin()
      if (onNavigate) onNavigate('dashboard')
    } catch (err) {
      setErrorMsg(err.message || 'Demo login could not connect.')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemoCreds = () => {
    setMode('login')
    setEmail('demo@datalens.ai')
    setPassword('datalens123')
    setErrorMsg('')
    showToast('Demo credentials filled! Click Sign In.', 'info')
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-blue-500 mb-1 shadow-lg shadow-blue-500/10">
            <Layers className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">DataLens</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              AI Analytics
            </span>
          </div>
          <p className="text-sm text-[#71717A] max-w-xs mx-auto">
            Autonomous data analytics, in-memory DuckDB queries, and executive intelligence.
          </p>

          {/* Cloud Server Connectivity Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#111111] border border-[#242424] text-[#A1A1AA] mt-1">
            <span
              className={`w-2 h-2 rounded-full ${
                serverOnline === true
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                  : serverOnline === false
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-blue-400 animate-pulse'
              }`}
            />
            <span>
              {serverOnline === true
                ? 'Render Cloud: Ready & Online'
                : serverOnline === false
                ? 'Render Cloud: Standby (Waking up on request)'
                : 'Connecting to Cloud Backend...'}
            </span>
          </div>
        </div>

        {/* Active Session Info Banner (if already logged in) */}
        {user && (
          <div className="bg-[#0E1526] border border-blue-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg shadow-blue-500/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate">{user.full_name}</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </div>
                <div className="text-xs text-[#71717A] truncate font-mono">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                Dashboard →
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-lg bg-[#141414] hover:bg-rose-500/15 text-[#71717A] hover:text-rose-400 border border-[#242424] transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Authentication Card */}
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#111111] border border-[#242424]">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setErrorMsg('')
              }}
              className={`py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
              onClick={() => {
                setMode('register')
                setErrorMsg('')
              }}
              className={`py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </div>

          {/* 1-Click Fast Demo Login Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-blue-600/15 border border-blue-500/35 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-blue-400" /> 1-Click Fast Demo Access
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Instant
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Skip typing credentials and jump straight into analytics as <strong>Alex Mercer</strong> (Lead Data Analyst).
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/25 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>1-Click Demo Login</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#1F1F1F] w-full" />
            <span className="bg-[#0B0B0B] px-3 text-xs text-[#71717A] uppercase font-semibold shrink-0">
              Or Use Your Credentials
            </span>
            <div className="border-t border-[#1F1F1F] w-full" />
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {mode === 'login' && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={handleFillDemoCreds}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Fill demo account credentials instead?
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Render Cloud Cold-Start Helpful Notice */}
          {slowServerNotice && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-2 text-xs text-blue-300 animate-in fade-in">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              <span>
                Render cloud server is spinning up from sleep mode (~15-20s on first request). Almost there!
              </span>
            </div>
          )}

          {/* Forms */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-[#A1A1AA]">Email Address</label>
                  <button
                    type="button"
                    onClick={handleFillDemoCreds}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors cursor-pointer"
                  >
                    Fill Demo
                  </button>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="demo@datalens.ai"
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white p-1 transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
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
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111111] border border-[#2E2E2E] focus:border-blue-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white p-1 transition-colors"
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Test Credentials Footer */}
          <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-xs text-[#71717A]">
            <span>Demo Credentials:</span>
            <button
              type="button"
              onClick={handleFillDemoCreds}
              className="font-mono text-[#D4D4D8] hover:text-blue-400 transition-colors cursor-pointer"
              title="Click to copy into form"
            >
              demo@datalens.ai / datalens123
            </button>
          </div>
        </div>

        {/* Back navigation link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="text-sm text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Analytics Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
