import React from 'react'
import { Database, Plus, Sparkles } from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'

export const EmptyState = ({
  title = "No dataset selected",
  subtitle = "Upload a dataset or load the enterprise sample to start your analysis.",
  actionText = "Upload Dataset",
  onAction,
  icon: Icon = Database,
  showSampleButton = true
}) => {
  const { loadSampleDataset } = useDataLens()

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border border-dashed border-[#242424] rounded-2xl bg-[#0B0B0B]/60 max-w-2xl mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#242424] flex items-center justify-center text-blue-500 mb-4 shadow-lg shadow-blue-500/5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-[#FFFFFF] tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#71717A] max-w-md mb-6 leading-relaxed">
        {subtitle}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onAction && (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            {actionText}
          </button>
        )}
        {showSampleButton && (
          <button
            onClick={loadSampleDataset}
            className="flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#202020] text-[#A1A1AA] hover:text-[#FFFFFF] border border-[#242424] text-xs sm:text-sm font-medium rounded-lg transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Try Sample Dataset
          </button>
        )}
      </div>
    </div>
  )
}

