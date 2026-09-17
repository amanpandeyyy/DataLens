import React, { useState, useEffect } from 'react'
import { DataLensProvider, useDataLens } from './hooks/useDataLens'
import { AppLayout } from './layouts/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { UploadPage } from './pages/Upload'
import { DatasetsPage } from './pages/Datasets'
import { OverviewPage } from './pages/Overview'
import { CleaningPage } from './pages/Cleaning'
import { StatisticsPage } from './pages/Statistics'
import { VisualizationPage } from './pages/Visualization'
import { AIAnalystPage } from './pages/AIAnalyst'
import { ChatDataPage } from './pages/ChatData'
import { SQLLabPage } from './pages/SQLLab'
import { ReportsPage } from './pages/Reports'
import { SettingsPage } from './pages/Settings'
import { LoginPage } from './pages/Login'

export const AppContent = () => {
  const { user } = useDataLens()
  const [activeTab, setActiveTab] = useState(() => {
    if (!user && localStorage.getItem('datalens_logged_out') === 'true') {
      return 'login'
    }
    return 'dashboard'
  })

  // Smooth auto-navigation if user is explicitly logged out
  useEffect(() => {
    if (!user && localStorage.getItem('datalens_logged_out') === 'true') {
      setActiveTab('login')
    }
  }, [user])

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />
      case 'upload':
        return <UploadPage onNavigate={setActiveTab} />
      case 'datasets':
        return <DatasetsPage onNavigate={setActiveTab} />
      case 'overview':
        return <OverviewPage onNavigate={setActiveTab} />
      case 'cleaning':
        return <CleaningPage onNavigate={setActiveTab} />
      case 'statistics':
        return <StatisticsPage onNavigate={setActiveTab} />
      case 'visualization':
        return <VisualizationPage onNavigate={setActiveTab} />
      case 'ai-analyst':
        return <AIAnalystPage onNavigate={setActiveTab} />
      case 'chat-data':
        return <ChatDataPage onNavigate={setActiveTab} />
      case 'sql-lab':
        return <SQLLabPage onNavigate={setActiveTab} />
      case 'reports':
        return <ReportsPage onNavigate={setActiveTab} />
      case 'settings':
      case 'profile':
        return <SettingsPage onNavigate={setActiveTab} />
      case 'login':
      case 'auth':
        return <LoginPage onNavigate={setActiveTab} />
      default:
        return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActivePage()}
    </AppLayout>
  )
}

export default function App() {
  return (
    <DataLensProvider>
      <AppContent />
    </DataLensProvider>
  )
}

