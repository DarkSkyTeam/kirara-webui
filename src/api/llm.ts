import type { ModelInfo } from '@/components/form/types'
import { http } from '@/utils/http'

export interface LLMBackend {
  name: string
  adapter: string
  config: Record<string, any>
  enable: boolean
  models: ModelInfo[]
}

export interface ConfigSchema {
  title: string
  type: string
  properties: Record<string, {
    title: string
    type: string
    description?: string
    default?: any
    minimum?: number
    maximum?: number
    enum?: any[]
    enumNames?: string[]
  }>
  required?: string[]
}

export const llmApi = {
  /**
   * 获取适配器类型列表
   */
  getAdapterTypes() {
    return http.get<{ types: string[] }>('/llm/types')
  },

  /**
   * 获取后端列表
   */
  getBackends() {
    return http.get<{ data: { backends: LLMBackend[] } }>('/llm/backends')
  },

  /**
   * 创建后端
   */
  createBackend(backend: LLMBackend) {
    return http.post<{ data: LLMBackend }>('/llm/backends', backend)
  },

  /**
   * 更新后端
   */
  updateBackend(name: string, backend: LLMBackend) {
    return http.put<{ data: LLMBackend }>(`/llm/backends/${name}`, backend)
  },

  /**
   * 删除后端
   */
  deleteBackend(name: string) {
    return http.delete<void>(`/llm/backends/${name}`)
  },

  /**
   * 启用/禁用后端
   */
  toggleBackend(name: string, enable: boolean) {
    return http.post<void>(`/llm/backends/${name}/${enable ? 'enable' : 'disable'}`)
  },

  /**
   * 获取适配器配置模式
   */
  getAdapterConfigSchema(adapterType: string) {
    return http.get<{ configSchema: ConfigSchema }>(`/llm/types/${adapterType}/config-schema`)
  },

  /**
   * 获取适配器支持自动检测模型
   */
  getAdapterSupportsAutoDetectModels(adapterType: string) {
    return http.get<{ supportsAutoDetectModels: boolean }>(`/llm/types/${adapterType}/supports-auto-detect-models`)
  },

  /**
   * 获取后端支持的模型列表
   */
  getBackendModels(backendName: string) {
    return http.get<{ models: ModelInfo[] }>(`/llm/backends/${backendName}/auto-detect-models`)
  }
} 