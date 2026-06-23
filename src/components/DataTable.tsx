import { useState, useEffect } from 'react'
import { Card } from './Card'
import { SkeletonTable } from './Skeleton'
import { EmptyState } from './EmptyState'
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'

export const statusFilters = [
  { value: '', label: 'All Statuses' },
  { value: 'Received', label: 'Received' },
  { value: 'Awaiting Approval', label: 'Awaiting Approval' },
  { value: 'Repairing', label: 'Repairing' },
  { value: 'Ready for Collection', label: 'Ready for Collection' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Completed — Under Warranty', label: 'Warranty' },
  { value: 'Declined', label: 'Declined' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Closed', label: 'Closed' },
]

interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'right' | 'center'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRowClick?: (item: T) => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (key: string) => void
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: React.ReactNode
  className?: string
}

export function DataTable<T extends { repair?: { id?: string }; id?: string }>({
  columns, data, loading, emptyTitle = 'No data found', emptyDescription, emptyAction,
  onRowClick, sortBy, sortOrder, onSort, pageSize = 50, searchable, searchPlaceholder = 'Search...',
  searchValue, onSearchChange, filters, className = '',
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(data.length / pageSize)
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize)

  useEffect(() => { setPage(0) }, [data.length])

  return (
    <div className={`space-y-3 ${className}`}>
      {(searchable || filters) && (
        <div className="flex flex-wrap items-center gap-3">
          {searchable && (
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input value={searchValue || ''} onChange={(e) => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder}
                className="w-full bg-bg-surface border border-border-subtle rounded-md pl-9 pr-3 py-2 text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent-brand/40 focus:ring-1 focus:ring-accent-brand/20 hover:border-border-default" />
            </div>
          )}
          {filters}
        </div>
      )}
      <Card className={loading ? 'opacity-60 pointer-events-none' : ''}>
        {loading ? (
          <SkeletonTable rows={5} />
        ) : data.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border-subtle">
                    {columns.map((col) => (
                      <th key={col.key}
                        className={`py-2.5 pr-3 font-medium tracking-wide ${col.sortable ? 'cursor-pointer hover:text-text-secondary select-none' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        style={{ width: col.width }}
                        onClick={() => col.sortable && onSort?.(col.key)}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.sortable && sortBy === col.key && (
                            <ArrowUpDown size={10} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((item, idx) => {
                    const key = (item as any).repair?.id || (item as any).id || idx
                    return (
                      <tr key={key}
                        onClick={() => onRowClick?.(item)}
                        className={`border-b border-border-subtle last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-bg-raised/50' : ''} transition-colors`}
                      >
                        {columns.map((col) => (
                          <td key={col.key} className={`py-2.5 pr-3 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}>
                            {col.render(item)}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                <span className="text-xs text-text-muted">{data.length} total</span>
                <div className="flex items-center gap-1">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={12} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                    const p = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                    if (p >= totalPages) return null
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? 'bg-accent-brand text-white' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}>
                        {p + 1}
                      </button>
                    )
                  })}
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
