import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'

export const ToastContainer = () => {
  const { toasts, removeToast } = useDataLens()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = Info
        let borderClass = 'border-[#242424]'
        let iconClass = 'text-blue-400'

        if (toast.type === 'success') {
          Icon = CheckCircle2
          borderClass = 'border-emerald-500/30'
          iconClass = 'text-emerald-400'
        } else if (toast.type === 'error') {
          Icon = AlertCircle
          borderClass = 'border-rose-500/30'
          iconClass = 'text-rose-400'
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-3.5 bg-[#111111] border ${borderClass} rounded-lg shadow-xl shadow-black/50 text-sm animate-in fade-in slide-in-from-bottom-2 duration-200`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
              <span className="text-[#FFFFFF] text-xs sm:text-sm">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#71717A] hover:text-[#FFFFFF] ml-3 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

