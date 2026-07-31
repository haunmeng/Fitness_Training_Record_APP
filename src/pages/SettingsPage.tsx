import { useState, useRef } from 'react'
import {
  Download, Upload, HelpCircle,
  Plus, Dumbbell, Play, History as HistoryIcon,
  CheckCircle, AlertCircle, Watch, RefreshCw,
} from 'lucide-react'
import { useDataIO } from '../hooks/useDataIO'
import { useWatchSync } from '../hooks/useWatchSync'
import { SYNC_STATUS } from '../services/xlink-protocol'
import Modal from '../components/Modal'
import type { ImportResult } from '../hooks/useDataIO'

const GUIDE_STEPS = [
  {
    icon: Plus,
    title: '添加训练项目',
    desc: '在「项目」页面点击 + 创建自定义训练项目（如卧推、深蹲）。可以设置历史最大重量/组数和日常训练参考重量/组数。',
  },
  {
    icon: Dumbbell,
    title: '选择项目开始训练',
    desc: '进入「训练」页面，从项目列表中选择今天要练的项目。也可以直接在训练页面快速创建新项目。',
  },
  {
    icon: Play,
    title: '逐组记录',
    desc: '每完成一组后输入重量和次数，点击「完成」记录。重量会保留，次数也会保留便于连续输入同次数训练组。组间休息时可以使用内置计时器。',
  },
  {
    icon: CheckCircle,
    title: '结束训练',
    desc: '所有项目训练完成后点击右上角「结束」按钮，训练数据会自动保存。如果不想保留可以选择「丢弃本次训练」。',
  },
  {
    icon: HistoryIcon,
    title: '查看历史与统计',
    desc: '在「历史」页面可以查看所有训练记录，展开详情查看每组数据。点击「统计」可以查看每个项目的最大重量和最多次数。',
  },
]

export default function SettingsPage() {
  const { downloadJSON, importData } = useDataIO()
  const {
    status: syncStatus,
    lastSyncAt,
    isSyncing,
    isConnected,
    isBridgeAvailable,
    initConnection,
    pushToWatch,
    pullFromWatch,
    syncBidirectional,
    disconnect,
  } = useWatchSync()
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importConfirm, setImportConfirm] = useState<File | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      await downloadJSON()
    } catch (e) {
      alert('导出失败: ' + String(e))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setImportConfirm(file)
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleImportConfirm = async () => {
    if (!importConfirm) return
    setImportError(null)
    try {
      const result = await importData(importConfirm)
      setImportResult(result)
    } catch (e) {
      setImportError(String(e))
    }
    setImportConfirm(null)
  }

  const handleSyncBidirectional = async () => {
    if (isSyncing) return
    setSyncMessage('正在同步...')
    if (!isConnected) {
      const connected = await initConnection('com.gemn.fitness.watch')
      if (!connected) {
        setSyncMessage('连接失败，无法同步')
        return
      }
    }
    const result = await syncBidirectional()
    if (result.success) {
      setSyncMessage('同步完成 ✓')
      setTimeout(() => setSyncMessage(null), 3000)
    } else {
      setSyncMessage('同步失败: ' + (result.error || '未知错误'))
    }
  }

  const handlePushToWatch = async () => {
    if (isSyncing) return
    setSyncMessage('正在导出到手表...')
    const result = await pushToWatch()
    if (result.success) {
      setSyncMessage('导出成功 ✓')
      setTimeout(() => setSyncMessage(null), 3000)
    } else {
      setSyncMessage('导出失败: ' + (result.error || '未知错误'))
    }
  }

  const handlePullFromWatch = async () => {
    if (isSyncing) return
    setSyncMessage('正在从手表导入...')
    const result = await pullFromWatch()
    if (result.success && result.stats) {
      setSyncMessage(`导入完成: ${result.stats.exercises}项目 ${result.stats.sessions}记录 ${result.stats.sets}组`)
      setTimeout(() => setSyncMessage(null), 4000)
    } else {
      setSyncMessage('导入失败: ' + (result.error || '未知错误'))
    }
  }

  const formatSyncTime = (iso: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
    if (diffMin < 1) return '刚刚'
    if (diffMin < 60) return `${diffMin}分钟前`
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">设置</h1>

      {/* Usage Guide */}
      <div className="mb-6">
        <button
          onClick={() => setShowGuide(true)}
          className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 active:bg-surface2 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <HelpCircle size={20} className="text-accent" />
          </div>
          <div className="text-left flex-1">
            <h3 className="font-medium text-text">使用说明</h3>
            <p className="text-xs text-text3 mt-0.5">查看应用使用方法</p>
          </div>
        </button>
      </div>

      {/* Data Management */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-text2 uppercase tracking-wider mb-3">数据管理</h2>
        <div className="space-y-2">
          {/* Export */}
          <button
            onClick={handleExport}
            className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 active:bg-surface2 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Download size={20} className="text-accent" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium text-text">导出数据</h3>
              <p className="text-xs text-text3 mt-0.5">将所有训练数据保存为 JSON 文件</p>
            </div>
          </button>

          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-surface border border-border rounded-xl p-4 flex items-center gap-4 active:bg-surface2 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-warn/10 flex items-center justify-center">
              <Upload size={20} className="text-warn" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium text-text">导入数据</h3>
              <p className="text-xs text-text3 mt-0.5">从 JSON 文件恢复训练数据（会覆盖现有数据）</p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Watch Sync */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-text2 uppercase tracking-wider mb-3">手表同步</h2>

        {/* Connection Status */}
        <div className="bg-surface border border-border rounded-xl p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' :
              syncStatus === SYNC_STATUS.CONNECTING || syncStatus === SYNC_STATUS.SYNCING ? 'bg-blue-500' :
              syncStatus === SYNC_STATUS.ERROR ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-sm text-text">
              {isConnected ? '已连接' :
               syncStatus === SYNC_STATUS.CONNECTING ? '连接中...' :
               syncStatus === SYNC_STATUS.SYNCING ? '同步中...' :
               syncStatus === SYNC_STATUS.ERROR ? '连接错误' : '未连接'}
            </span>
            {lastSyncAt && (
              <span className="text-xs text-text3 ml-auto">
                上次同步: {formatSyncTime(lastSyncAt)}
              </span>
            )}
          </div>

          {/* Sync message */}
          {syncMessage && (
            <p className={`text-xs mb-3 ${
              syncMessage.includes('失败') || syncMessage.includes('错误')
                ? 'text-red-400' : 'text-green-400'
            }`}>
              {syncMessage}
            </p>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {/* Connect / Sync button */}
            {!isConnected ? (
              <button
                onClick={handleSyncBidirectional}
                disabled={isSyncing}
                className="w-full bg-accent text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              >
                <Watch size={18} />
                <span>{isBridgeAvailable ? '连接并同步' : '连接并同步 (需 SDK)'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleSyncBidirectional}
                  disabled={isSyncing}
                  className="w-full bg-accent text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
                >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? '同步中...' : '一键同步'}</span>
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handlePushToWatch}
                    disabled={isSyncing}
                    className="flex-1 bg-surface2 border border-border text-text py-2.5 rounded-lg text-sm font-medium active:bg-surface transition-colors disabled:opacity-50"
                  >
                    ↑ 导出到手表
                  </button>
                  <button
                    onClick={handlePullFromWatch}
                    disabled={isSyncing}
                    className="flex-1 bg-surface2 border border-border text-text py-2.5 rounded-lg text-sm font-medium active:bg-surface transition-colors disabled:opacity-50"
                  >
                    ↓ 从手表导入
                  </button>
                </div>
                <button
                  onClick={disconnect}
                  className="w-full text-xs text-text3 py-2 active:text-text2 transition-colors"
                >
                  断开连接
                </button>
              </>
            )}
          </div>
        </div>

        {/* SDK Notice */}
        {!isBridgeAvailable && (
          <div className="bg-warn/10 border border-warn/30 rounded-xl p-3">
            <p className="text-xs text-warn/90">
              ⚠️ 手表同步需集成 vivo 智能终端设备 SDK（device-rpc.aar）。
              当前使用 Mock 模式，仅用于开发测试。
            </p>
          </div>
        )}
      </div>

      {/* About */}
      <div>
        <h2 className="text-sm font-medium text-text2 uppercase tracking-wider mb-3">关于</h2>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-sm text-text2">健身训练记录 v1.1.0</p>
          <p className="text-xs text-text3 mt-1">本地存储 · 无需联网 · 数据安全</p>
        </div>
      </div>

      {/* Import Result Modal */}
      <Modal
        open={importResult !== null || importError !== null}
        onClose={() => { setImportResult(null); setImportError(null) }}
        title={importError ? '导入失败' : '导入成功'}
      >
        <div className="space-y-4 text-center">
          {importResult && (
            <>
              <CheckCircle size={40} className="text-accent mx-auto" />
              <div className="text-sm text-text2">
                <p>训练项目: {importResult.exercises} 个</p>
                <p>训练记录: {importResult.sessions} 次</p>
                <p>组数记录: {importResult.sets} 组</p>
              </div>
            </>
          )}
          {importError && (
            <>
              <AlertCircle size={40} className="text-danger mx-auto" />
              <p className="text-sm text-text2">{importError}</p>
            </>
          )}
          <button
            onClick={() => { setImportResult(null); setImportError(null) }}
            className="w-full bg-accent text-black font-semibold py-3 rounded-lg"
          >
            确定
          </button>
        </div>
      </Modal>

      {/* Import Confirmation Modal */}
      <Modal
        open={importConfirm !== null}
        onClose={() => setImportConfirm(null)}
        title="确认导入"
      >
        <div className="space-y-4">
          <p className="text-text2 text-sm">
            导入数据将<strong className="text-danger">覆盖</strong>当前所有数据（项目、训练记录、组数）。此操作不可撤销，建议先导出备份。
          </p>
          <p className="text-text3 text-xs">
            文件: {importConfirm?.name}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setImportConfirm(null)}
              className="flex-1 bg-surface2 text-text border border-border py-3 rounded-lg font-medium"
            >
              取消
            </button>
            <button
              onClick={handleImportConfirm}
              className="flex-1 bg-accent text-black py-3 rounded-lg font-semibold"
            >
              确认导入
            </button>
          </div>
        </div>
      </Modal>

      {/* Usage Guide Modal */}
      <Modal open={showGuide} onClose={() => setShowGuide(false)} title="使用说明">
        <div className="space-y-4">
          {GUIDE_STEPS.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                <step.icon size={16} className="text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-accent font-medium">步骤 {i + 1}</span>
                  <h4 className="text-sm font-medium text-text">{step.title}</h4>
                </div>
                <p className="text-xs text-text3 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
