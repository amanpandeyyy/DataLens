import React from 'react'
import { Menu, Upload, Sparkles, Database, ShieldCheck, ChevronRight, ChevronDown, LogIn, User } from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'

export const Header = ({ activeTab, setMobileOpen, onNavigateUpload, onNavigateLogin }) => {
  const { activeDataset, datasets, setActiveDataset, loadSampleDataset, user } = useDataLens()

  const getPageTitle = () => {
    const titles = {
      dashboard: 'Analytics Dashboard',
      datasets: 'Dataset Repository',
      upload: 'Upload Dataset',
      overview: 'Data Overview & Preview',
      cleaning: 'Data Cleaning Studio',
      statistics: 'Statistical Analysis',
      visualization: 'Visualization Builder',
      'ai-analyst': 'AI Data Analyst',
      'chat-data': 'Chat with Data',
      'sql-lab': 'DuckDB SQL Lab',
      reports: 'Executive Reports',
      settings: 'System & AI Settings',
      profile: 'User Profile',
      login: 'Account & Authentication',
      auth: 'Account & Authentication'
    }
    return titles[activeTab] || 'Dashboard'
  }

  return (
    <header className="h-16 px-4 lg:px-8 border-b border-[#242424] bg-[#050505]/90 backdrop-blur sticky top-0 z-30 flex items-center justify-between">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1.5 rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#111111] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            {getPageTitle()}
          </span>

          {/* Recognizable Active Dataset Pill with Switcher */}
          {activeDataset && (
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <ChevronRight className="w-4 h-4 text-[#52525B]" />
              <div className="relative flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/40 text-sm text-blue-300 font-medium hover:border-blue-500/70 transition-colors shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="truncate max-w-[180px] font-semibold">{activeDataset.name}</span>
                  {datasets.length > 1 && (
                    <ChevronDown className="w-3.5 h-3.5 text-blue-300 shrink-0 ml-0.5" />
                  )}
                </div>
                {datasets.length > 1 && (
                  <select
                    value={activeDataset?.id || ''}
                    onChange={(e) => {
                      const d = datasets.find((item) => item.id === Number(e.target.value))
                      if (d) setActiveDataset(d)
                    }}
                    className="opacity-0 absolute inset-0 cursor-pointer w-full"
                    title="Switch active dataset"
                  >
                    {datasets.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#141414] text-white">
                        {d.name} ({d.row_count} rows)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section: Quick Actions */}
      <div className="flex items-center gap-2.5">
        {!activeDataset && (
          <button
            onClick={loadSampleDataset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-400 hover:text-blue-300 border border-blue-500/40 text-sm font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Try Sample Dataset</span>
            <span className="sm:hidden">Sample</span>
          </button>
        )}

        <button
          onClick={onNavigateUpload}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all shadow-sm shadow-blue-600/25"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Dataset</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] border border-[#242424] text-xs font-medium text-[#A1A1AA]">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DuckDB Engine Ready</span>
        </div>

        {/* User Account / Login Button */}
        {user ? (
          <button
            onClick={onNavigateLogin}
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600/20 border-blue-500 text-white ring-2 ring-blue-500/40 shadow-sm shadow-blue-500/20'
                : 'bg-[#121212] hover:bg-[#1A1A1A] border-[#2E2E2E] hover:border-blue-500/50 text-[#D4D4D8]'
            }`}
            title="Account & Login Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-semibold max-w-[120px] truncate">
              {user.full_name?.split(' ')[0] || 'User'}
            </span>
          </button>
        ) : (
          <button
            onClick={onNavigateLogin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-sm shadow-blue-600/30"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  )
}
