import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { LiquidPanel } from '../components/liquid'
import { ErrorBanner } from '../components/ErrorBanner'
import { Database, Server, RefreshCw, HardDrive, Table, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

interface DatabaseStats {
  total_tables: number
  total_records: Record<string, number>
  database_size: string
  last_backup: string | null
  sync_status: string | null
  cloud_status: string | null
}

interface DatabaseHealth {
  is_healthy: boolean
  connection_count: number
  uptime_seconds: number
  warnings: string[]
  errors: string[]
}

interface TableInfo {
  name: string
  row_count: number
  size_bytes: number
  size_human: string
  last_modified: string | null
}

export function DatabaseMonitor() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [health, setHealth] = useState<DatabaseHealth | null>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsData, healthData, tablesData] = await Promise.all([
        api.databaseMonitor.getStats(),
        api.databaseMonitor.getHealth(),
        api.databaseMonitor.getAllTables(),
      ])
      setStats(statsData)
      setHealth(healthData)
      setTables(tablesData)
      setLastRefresh(new Date())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const loadTableInfo = async (tableName: string) => {
    try {
      const info = await api.databaseMonitor.getTableInfo(tableName)
      setTableInfo(info)
      setSelectedTable(tableName)
    } catch (e) {
      setError(String(e))
    }
  }

  const getStatusIcon = (isHealthy: boolean) => {
    if (isHealthy) return <CheckCircle size={20} className="text-emerald-400" />
    return <XCircle size={20} className="text-red-400" />
  }

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Database Monitor</h1>
        </div>
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* Header */}
      <motion.div variants={staggerItem} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tighter font-display">Database Monitor</h1>
          <p className="text-sm text-text-muted">Real-time database health and statistics</p>
        </div>
        <button
          onClick={loadAllData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all bg-white/5 hover:bg-white/10 text-text-primary border border-white/10"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </motion.div>

      {error && <ErrorBanner message={error} onClose={() => setError('')} />}

      {/* Health Status */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Database Health">
          <div className="flex items-center gap-4">
            {getStatusIcon(health?.is_healthy ?? false)}
            <div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(health?.is_healthy ?? false)}`}>
                {health?.is_healthy ? 'Healthy' : 'Unhealthy'}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>

          {health?.warnings && health.warnings.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Warnings</span>
              </div>
              <ul className="space-y-1">
                {health.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-amber-300/80">• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {health?.errors && health.errors.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={14} className="text-red-400" />
                <span className="text-sm font-medium text-red-400">Errors</span>
              </div>
              <ul className="space-y-1">
                {health.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-300/80">• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </LiquidPanel>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Database Statistics">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Table size={14} className="text-blue-400" />
                <span className="text-xs text-text-muted">Tables</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">{stats?.total_tables ?? 0}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Database size={14} className="text-emerald-400" />
                <span className="text-xs text-text-muted">Total Records</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">
                {Object.values(stats?.total_records ?? {}).reduce((a, b) => a + b, 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive size={14} className="text-purple-400" />
                <span className="text-xs text-text-muted">Database Size</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">{stats?.database_size ?? '0 B'}</div>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Server size={14} className="text-amber-400" />
                <span className="text-xs text-text-muted">Cloud Status</span>
              </div>
              <div className="text-lg font-bold text-text-primary">{stats?.cloud_status ?? 'N/A'}</div>
            </div>
          </div>
        </LiquidPanel>
      </motion.div>

      {/* Tables List */}
      <motion.div variants={staggerItem}>
        <LiquidPanel title="Tables">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {tables.map((tableName) => (
              <button
                key={tableName}
                onClick={() => loadTableInfo(tableName)}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  selectedTable === tableName
                    ? 'bg-brand-purple/20 border border-brand-purple/30 text-brand-purple'
                    : 'bg-white/5 border border-white/10 text-text-primary hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-medium">{tableName}</span>
                <span className="text-xs text-text-muted">
                  {(stats?.total_records[tableName] ?? 0).toLocaleString()} rows
                </span>
              </button>
            ))}
          </div>
        </LiquidPanel>
      </motion.div>

      {/* Selected Table Info */}
      {tableInfo && (
        <motion.div variants={staggerItem}>
          <LiquidPanel title={`Table: ${tableInfo.name}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-text-muted mb-1">Row Count</div>
                <div className="text-lg font-bold text-text-primary">{tableInfo.row_count.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-text-muted mb-1">Size</div>
                <div className="text-lg font-bold text-text-primary">{tableInfo.size_human}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-text-muted mb-1">Size (Bytes)</div>
                <div className="text-lg font-bold text-text-primary">{tableInfo.size_bytes.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs text-text-muted mb-1">Last Modified</div>
                <div className="text-lg font-bold text-text-primary">{tableInfo.last_modified ?? 'N/A'}</div>
              </div>
            </div>
          </LiquidPanel>
        </motion.div>
      )}
    </motion.div>
  )
}

export default DatabaseMonitor
