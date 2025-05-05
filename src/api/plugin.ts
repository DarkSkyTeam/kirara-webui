import { http } from '@/utils/http'

export interface PyPiInfo {
  version: string
  description: string
  author: string
  homePage?: string
  bugTrackerUrl?: string
  documentUrl?: string
}

export interface MarketPlugin {
  name: string
  description: string
  author: string
  pypiPackage: string
  pypiInfo: PyPiInfo
  isInstalled?: boolean
  isUpgradable?: boolean
  installedVersion?: string
  isEnabled?: boolean
  requiresRestart?: boolean
}

export interface SearchResponse {
  plugins: MarketPlugin[]
  totalCount: number
  totalPages: number
  page: number
  pageSize: number
}

export interface PluginInfo {
  name: string
  package_name: string
  description: string
  version: string
  author: string
  homepage?: string
  license?: string
  is_internal: boolean
  is_enabled: boolean
  metadata?: {
    category?: string
    tags?: string[]
  }
}

export const pluginApi = {
  /**
   * 搜索插件市场
   */
  searchPlugins(query: string = '', page: number = 1, pageSize: number = 10) {
    const searchParams = new URLSearchParams({
      query,
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return http.get<SearchResponse>(`/plugin/v1/search?${searchParams.toString()}`)
  },

  /**
   * 获取插件市场中插件详情
   */
  getMarketPluginInfo(pluginName: string) {
    return http.get<MarketPlugin>(`/plugin/v1/info/${pluginName}`)
  },

  /**
   * 获取已安装插件列表
   */
  getInstalledPlugins() {
    return http.get<{ plugins: PluginInfo[] }>('/plugin/plugins')
  },

  /**
   * 安装插件
   */
  installPlugin(packageName: string, version?: string) {
    return http.post<void>('/plugin/plugins', { package_name: packageName, version })
  },

  /**
   * 卸载插件
   */
  uninstallPlugin(packageName: string) {
    return http.delete<void>(`/plugin/plugins/${packageName}`)
  },

  /**
   * 启用/禁用插件
   */
  togglePlugin(packageName: string, enable: boolean) {
    return http.post<void>(`/plugin/plugins/${packageName}/${enable ? 'enable' : 'disable'}`)
  },

  /**
   * 更新插件
   */
  updatePlugin(packageName: string) {
    return http.put<void>(`/plugin/plugins/${packageName}`)
  }
}
