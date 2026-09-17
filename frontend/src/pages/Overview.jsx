import React, { useState, useEffect, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  SlidersHorizontal,
  Table,
  Download,
  Filter
} from 'lucide-react'
import { useDataLens } from '../hooks/useDataLens'
import { EmptyState } from '../components/EmptyState'
import { TableSkeleton } from '../components/SkeletonLoader'
import { formatNumber } from '../utils/formatters'
import api from '../services/api'

export const OverviewPage = ({ onNavigate }) => {
  const { activeDataset } = useDataLens()
  const [data, setData] = useState([])
  const [columnsData, setColumnsData] = useState([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState(null)
  const [sortDesc, setSortDesc] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch dataset preview page
  useEffect(() => {
    if (!activeDataset) return

    const fetchPreview = async () => {
      try {
        setLoading(true)
        const params = {
          page,
          page_size: pageSize,
          search: search.trim() || undefined,
          sort_by: sortBy || undefined,
          sort_desc: sortDesc
        }
        const res = await api.get(`/datasets/${activeDataset.id}/preview`, { params })
        setData(res.data.rows)
        setColumnsData(res.data.columns)
        setTotalRows(res.data.total_rows)
        setTotalPages(res.data.total_pages)
      } catch (err) {
        console.error('Failed to load dataset preview:', err)
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(() => {
      fetchPreview()
    }, 200)

    return () => clearTimeout(timeout)
  }, [activeDataset, page, pageSize, search, sortBy, sortDesc])

  // Build TanStack Table columns
  const columns = useMemo(() => {
    if (!columnsData.length) return []
    return columnsData.map((col) => ({
      id: col.name,
      accessorKey: col.name,
      header: () => (
        <div
          onClick={() => {
            if (sortBy === col.name) {
              if (sortDesc) {
                setSortBy(null)
                setSortDesc(false)
              } else {
                setSortDesc(true)
              }
            } else {
              setSortBy(col.name)
              setSortDesc(false)
            }
          }}
          className="flex items-center justify-between gap-2 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-bold text-white truncate text-sm">
              {col.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-[#1E1E1E] text-blue-400 uppercase tracking-wider shrink-0 font-medium">
              {col.type}
            </span>
          </div>
          <div className="text-[#71717A] group-hover:text-white transition-colors shrink-0">
            {sortBy === col.name ? (
              sortDesc ? (
                <ArrowDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ArrowUp className="w-4 h-4 text-blue-400" />
              )
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
            )}
          </div>
        </div>
      ),
      cell: ({ getValue }) => {
        const val = getValue()
        if (val === null || val === undefined) {
          return <span className="text-[#52525B] italic font-mono text-xs">null</span>
        }
        return <span className="truncate block max-w-[260px] text-sm text-[#F4F4F5] font-normal">{String(val)}</span>
      }
    }))
  }, [columnsData, sortBy, sortDesc])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true
  })

  if (!activeDataset) {
    return (
      <EmptyState
        title="No Dataset Selected"
        subtitle="Select or upload a dataset to preview its full schema, rows, and data types."
        actionText="Upload Dataset"
        onAction={() => onNavigate('upload')}
      />
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0B0B0B] border border-[#242424] rounded-xl p-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rows..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-[#111111] border border-[#242424] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Right Controls: Column Visibility, Page Size */}
        <div className="flex items-center gap-2.5">
          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#161616] border border-[#242424] text-sm font-semibold text-[#A1A1AA] hover:text-white transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Columns</span>
            </button>

            {showVisibilityMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 max-h-80 overflow-y-auto bg-[#111111] border border-[#242424] rounded-xl shadow-2xl p-2 z-30 space-y-1">
                <div className="text-xs font-semibold text-[#71717A] uppercase px-2.5 py-1">
                  Toggle Columns
                </div>
                {table.getAllLeafColumns().map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-sm text-[#A1A1AA] hover:text-white hover:bg-[#161616] rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="rounded bg-[#1A1A1A] border-[#333333] text-blue-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="truncate">{column.id}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Page size dropdown */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="appearance-none bg-[#111111] hover:bg-[#161616] border border-[#2E2E2E] hover:border-blue-500/50 rounded-xl pl-3.5 pr-8 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-blue-500 cursor-pointer transition-colors"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#A1A1AA] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      {loading && data.length === 0 ? (
        <TableSkeleton rows={8} />
      ) : (
        <div className="bg-[#0B0B0B] border border-[#242424] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-[#242424] bg-[#0E0E0E]">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3.5 text-sm text-[#A1A1AA] font-semibold border-r border-[#1C1C1C] last:border-r-0 whitespace-nowrap"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-sm text-[#71717A]"
                    >
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#111111] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-[#F4F4F5] border-r border-[#161616] last:border-r-0 whitespace-nowrap"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination Controls */}
          <div className="px-5 py-4 border-t border-[#242424] bg-[#0E0E0E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#A1A1AA]">
            <div>
              Showing{' '}
              <span className="text-white font-bold">
                {totalRows === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="text-white font-bold">
                {Math.min(page * pageSize, totalRows)}
              </span>{' '}
              of <span className="text-white font-bold">{formatNumber(totalRows)}</span> rows
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 text-sm font-semibold text-white">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg hover:bg-[#1A1A1A] text-[#A1A1AA] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

