/**
 * BlueXlink Capacitor 插件 — TypeScript 桥接层
 *
 * 调用 Android 原生 BlueXlinkPlugin.java
 * SDK 就绪前使用 mock 模式进行开发测试。
 */

import type { SyncStatusDetail, SyncMessage } from './xlink-protocol'

// ===================== Capacitor 插件接口 =====================

interface BlueXlinkPluginInterface {
  init(options: { package: string; encryStr?: string }): Promise<{ success: boolean; message?: string; error?: string }>
  connect(): Promise<{ success: boolean; status?: string; error?: string }>
  disconnect(): Promise<{ success: boolean }>
  send(options: Record<string, unknown>): Promise<{ success: boolean; message?: string; error?: string }>
  getStatus(): Promise<{ initialized: boolean; connected: boolean }>
  addListener(event: 'connectionStatusChange', callback: (data: { status: string }) => void): void
  addListener(event: 'messageReceived', callback: (data: { data: SyncMessage }) => void): void
  removeAllListeners(): void
}

// ===================== 动态加载插件 =====================

function getPlugin(): BlueXlinkPluginInterface | null {
  try {
    // Capacitor 插件通过 @CapacitorPlugin 注解自动注册
    // 在 window 上暴露为 Capacitor.Plugins.BlueXlink
    const win = window as unknown as Record<string, unknown>
    const capacitor = win.Capacitor as Record<string, unknown> | undefined
    if (capacitor?.Plugins) {
      const plugins = capacitor.Plugins as Record<string, unknown>
      if (plugins.BlueXlink) {
        return plugins.BlueXlink as BlueXlinkPluginInterface
      }
    }
  } catch {
    // 非原生环境（浏览器开发）
  }
  return null
}

// ===================== Mock Bridge =====================

function createMockBridge(): BlueXlinkPluginInterface {
  let messageListener: ((data: { data: SyncMessage }) => void) | null = null
  let statusListener: ((data: { status: string }) => void) | null = null
  let connected = false

  return {
    init: async (_options) => {
      console.log('[BlueXlink Bridge Mock] init:', _options)
      return { success: true, message: 'SDK initialized (mock)' }
    },
    connect: async () => {
      console.log('[BlueXlink Bridge Mock] connecting...')
      await new Promise(r => setTimeout(r, 500))
      connected = true
      statusListener?.({ status: 'connected' })
      return { success: true, status: 'connected' }
    },
    disconnect: async () => {
      connected = false
      statusListener?.({ status: 'disconnected' })
      return { success: true }
    },
    send: async (_options) => {
      if (!connected) return { success: false, error: 'Not connected' }
      return { success: true, message: 'sent (mock)' }
    },
    getStatus: async () => {
      return { initialized: true, connected }
    },
    addListener: (event, callback) => {
      if (event === 'messageReceived') {
        messageListener = callback as typeof messageListener
      } else if (event === 'connectionStatusChange') {
        statusListener = callback as typeof statusListener
      }
    },
    removeAllListeners: () => {
      messageListener = null
      statusListener = null
    },
  }
}

// ===================== 对外 API =====================

class BlueXlinkBridge {
  private plugin: BlueXlinkPluginInterface
  private isMock: boolean

  constructor() {
    const native = getPlugin()
    if (native) {
      this.plugin = native
      this.isMock = false
    } else {
      this.plugin = createMockBridge()
      this.isMock = true
    }
  }

  get isAvailable(): boolean {
    return !this.isMock
  }

  async init(packageName: string, encryStr?: string): Promise<void> {
    const result = await this.plugin.init({
      package: packageName,
      encryStr: encryStr || undefined,
    })
    if (!result.success) throw new Error(result.error || 'Init failed')
  }

  async connect(): Promise<void> {
    const result = await this.plugin.connect()
    if (!result.success) throw new Error(result.error || 'Connect failed')
  }

  async disconnect(): Promise<void> {
    await this.plugin.disconnect()
  }

  async send(data: SyncMessage): Promise<void> {
    const result = await this.plugin.send(data as unknown as Record<string, unknown>)
    if (!result.success) throw new Error(result.error || 'Send failed')
  }

  async getStatus(): Promise<{ initialized: boolean; connected: boolean }> {
    return this.plugin.getStatus()
  }

  onMessage(callback: (msg: SyncMessage) => void): void {
    this.plugin.addListener('messageReceived', (data) => {
      if (data?.data) callback(data.data)
    })
  }

  onStatusChange(callback: (status: string, detail: SyncStatusDetail) => void): void {
    this.plugin.addListener('connectionStatusChange', (data) => {
      callback(data.status, {})
    })
  }

  cleanup(): void {
    this.plugin.removeAllListeners()
  }
}

export const blueXlinkBridge = new BlueXlinkBridge()
