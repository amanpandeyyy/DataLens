import React from 'react'
import {
  LayoutDashboard,
  Database,
  Upload,
  Table,
  Sparkles,
  BarChart3,
  PieChart,
  Bot,
  MessageSquare,
  Terminal,
  FileText,
  Settings,
  User,
  X,
  Layers,
  ChevronDown,
  LogIn,
  LogOut
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'

export const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const { activeDataset, datasets, setActiveDataset, user } = useDataLens()

  const navGroups = [
    {
      group: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      group: 'DATA',
      items: [
        { id: 'datasets', label: 'Datasets', icon: Database, badge: datasets.length },
        { id: 'upload', label: 'Upload', icon: Upload }
      ]
    },
    {
      group: 'ANALYSIS',
      items: [
        { id: 'overview', label: 'Overview', icon: Table },
        { id: 'cleaning', label: 'Data Cleaning', icon: Sparkles },
        { id: 'statistics', label: 'Statistics', icon: BarChart3 },
        { id: 'visualization', label: 'Visualization', icon: PieChart }
      ]
    },
    {
      group: 'AI',
      items: [
        { id: 'ai-analyst', label: 'AI Analyst', icon: Bot, isNew: true },
        { id: 'chat-data', label: 'Chat with Data', icon: MessageSquare }
      ]
    },
    {
      group: 'DEVELOPER',
      items: [
        { id: 'sql-lab', label: 'SQL Lab', icon: Terminal }
      ]
    },
    {
      group: 'REPORTS',
      items: [
        { id: 'reports', label: 'Reports', icon: FileText }
      ]
    }
  ]

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'login', label: user ? 'Account & Session' : 'Login / Sign In', icon: LogIn }
  ]

  const handleSelect = (id) => {
    setActiveTab(id)
    if (setMobileOpen) setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Persistent Desktop Sidebar & Sliding Drawer on Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0B0B0B] border-r border-[#242424] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#242424]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 font-bold shadow-sm shadow-blue-500/20">
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base sm:text-lg">DataLens</span>
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-[#71717A] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Dataset Selection Box - Recognizable and Interactive */}
        <div className="px-3 pt-3 pb-2 border-b border-[#1C1C1C]">
          <div className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
            <span>ACTIVE DATASET</span>
            <span className="text-emerald-400 flex items-center gap-1.5 font-mono text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </div>

          <div className="relative">
            <select
              value={activeDataset?.id || ''}
              onChange={(e) => {
                const d = datasets.find((item) => item.id === Number(e.target.value))
                if (d) setActiveDataset(d)
              }}
              className="w-full appearance-none bg-[#141414] hover:bg-[#1A1A1A] border border-[#333333] hover:border-blue-500/60 focus:border-blue-500 rounded-xl px-3.5 py-2.5 pr-8 text-sm font-semibold text-white transition-all cursor-pointer shadow-sm"
            >
              {datasets.length === 0 ? (
                <option value="" className="bg-[#141414] text-[#71717A]">
                  No dataset loaded
                </option>
              ) : (
                datasets.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#141414] text-white py-1">
                    {d.name} ({d.row_count} rows)
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Navigation Sections with Highly Recognizable Active State */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <div className="px-3 text-xs font-bold tracking-wider text-[#71717A] uppercase mb-2">
                {grp.group}
              </div>
              <nav className="space-y-1">
                {grp.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600/15 text-white font-semibold border-l-4 border-l-blue-500 border-y border-r border-blue-500/25 shadow-sm shadow-blue-500/5'
                          : 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#111111]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                            isActive ? 'text-blue-400' : 'text-[#71717A]'
                          }`}
                        />
                        <span className={isActive ? 'text-white' : 'text-[#A1A1AA]'}>
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badge !== undefined && (
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isActive
                              ? 'bg-blue-500/20 text-blue-300 font-semibold'
                              : 'bg-[#1A1A1A] text-[#71717A] border border-[#242424]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">
                            AI
                          </span>
                        )}
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer Navigation */}
        <div className="p-3 border-t border-[#242424] space-y-1 bg-[#080808]">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/15 text-white font-semibold border-l-4 border-l-blue-500 border-y border-r border-blue-500/25'
                    : 'text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-[#111111]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-blue-400' : 'text-[#71717A]'}`} />
                  <span className={isActive ? 'text-white' : 'text-[#A1A1AA]'}>{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-400 shadow-sm shadow-blue-400" />
                )}
              </button>
            )
          })}

          {/* User Profile Badge & Quick Login/Switch */}
          <div
            onClick={() => handleSelect('login')}
            className={`pt-2 mt-2 border-t border-[#1C1C1C] flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
              activeTab === 'login'
                ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                : 'hover:bg-[#141414] text-[#A1A1AA]'
            }`}
            title="Click to view Account / Login page"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm shadow-blue-500/20">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="overflow-hidden text-left">
                <div className="text-sm font-semibold text-white truncate">{user?.full_name || 'Alex Mercer'}</div>
                <div className="text-xs text-[#8E8E93] truncate">{user?.email || 'demo@datalens.ai'}</div>
              </div>
            </div>
            <LogIn className="w-4 h-4 text-[#8E8E93] hover:text-blue-400 shrink-0 ml-1" />
          </div>
        </div>
      </aside>
    </>
  )
}
