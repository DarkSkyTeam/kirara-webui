import { http } from '@/utils/http'

export interface IMPlatform {
  name: string
  adapter: string
  config: Record<string, any>
  enable: boolean
  accounts: IMAccount[]
}

export interface IMAccount {
  id: string
  platform: string
  name: string
  status: 'online' | 'offline'
  config: Record<string, any>
}

export interface IMAdapterInfo {
  name: string
  localized_name: string | null
  localized_description: string | null
  detail_info_markdown: string | null
}

export interface UserProfile {
  user_id: string
  username: string
  display_name: string
  description: string
  avatar_url: string
}

export interface IMAdapter {
  name: string
  adapter: string
  is_running: boolean
  enable: boolean
  config: Record<string, any>
  bot_profile: UserProfile | null
}

// 适配器类型枚举
export enum AdapterType {
  // 主动类 - 一个配置项对应一个bot实例
  ACTIVE = 'active',
  // 被动类 - 1对多，一个配置项对应多个bot实例
  PASSIVE_MANY = 'passive_many',
  // 被动类 - 1对1，一个配置项对应一个bot实例
  PASSIVE_ONE = 'passive_one'
}

// 适配器实例接口
export interface IMAdapterInstance {
  id: string
  adapter_name: string
  name: string
  status: 'online' | 'offline'
  config: Record<string, any>
  created_at: string
  updated_at: string
}

// 适配器详情接口
export interface IMAdapterDetail {
  name: string
  adapter: string
  type: AdapterType
  is_running: boolean
  config: Record<string, any>
  bot_profile: UserProfile | null
}

export interface ConfigSchema {
  title: string
  type: string
  properties: Record<
    string,
    {
      title: string
      type: string
      description?: string
      default?: any
      minimum?: number
      maximum?: number
      enum?: any[]
      enumNames?: string[]
      readonly?: boolean
    }
  >
  required?: string[]
}

export const imApi = {
  /**
   * 获取适配器类型列表
   */
  getAdapterTypes() {
    return http.get<{ types: string[]; adapters: Record<string, IMAdapterInfo> }>('/im/types')
  },

  /**
   * 获取适配器列表
   */
  getAdapters() {
    return http.get<{ adapters: IMAdapter[] }>('/im/adapters')
  },

  /**
   * 获取适配器详情
   */
  getAdapter(adapterId: string) {
    return http.get<{ adapter: IMAdapter }>(`/im/adapters/${adapterId}`)
  },

  /**
   * 获取适配器详细信息（包含类型和实例）
   */
  getAdapterDetail(adapterId: string) {
    return http.get<{ adapter: IMAdapterDetail }>(`/im/adapters/${adapterId}`)
  },

  /**
   * 创建适配器
   */
  createAdapter(adapter: Omit<IMAdapter, 'is_running'>) {
    return http.post<{ adapter: IMAdapter }>('/im/adapters', adapter)
  },

  /**
   * 更新适配器
   */
  updateAdapter(adapterId: string, adapter: Omit<IMAdapter, 'is_running'>) {
    return http.put<{ adapter: IMAdapter }>(`/im/adapters/${adapterId}`, adapter)
  },

  /**
   * 删除适配器
   */
  deleteAdapter(adapterId: string) {
    return http.delete<void>(`/im/adapters/${adapterId}`)
  },

  /**
   * 启动适配器
   */
  startAdapter(adapterId: string) {
    return http.post<void>(`/im/adapters/${adapterId}/start`)
  },

  /**
   * 停止适配器
   */
  stopAdapter(adapterId: string) {
    return http.post<void>(`/im/adapters/${adapterId}/stop`)
  },

  /**
   * 获取适配器配置模式
   */
  getAdapterConfigSchema(adapterType: string) {
    return http.get<{ configSchema: ConfigSchema }>(`/im/types/${adapterType}/config-schema`)
  }
}
