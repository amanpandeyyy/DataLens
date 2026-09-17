import React from 'react'

export const Skeleton = ({ className = '', height = 'h-4', width = 'w-full' }) => {
  return (
    <div
      className={`bg-[#1A1A1A] animate-pulse rounded ${height} ${width} ${className}`}
    />
  )
}

export const CardSkeleton = () => {
  return (
    <div className="bg-[#111111] border border-[#242424] rounded-xl p-5 space-y-3">
      <Skeleton height="h-4" width="w-1/3" />
      <Skeleton height="h-8" width="w-2/3" />
      <Skeleton height="h-3" width="w-1/2" />
    </div>
  )
}

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="bg-[#111111] border border-[#242424] rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton height="h-8" width="w-48" />
        <Skeleton height="h-8" width="w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} height="h-10" width="w-full" />
        ))}
      </div>
    </div>
  )
}

