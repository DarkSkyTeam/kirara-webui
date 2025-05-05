import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
export interface SystemStatus {
  status: string
  apiConnected: boolean
  memoryUsage: {
    percent: number
    total: number
    used: number
    free: number
  }
  cpuUsage: number
  uptime: number
  activeAdapters: number
  activeBackends: number
  loadedPlugins: number
  workflowCount: number
  version: string
  platform: string
  cpuInfo: string
  pythonVersion: string
  hasProxy: boolean
}

interface UpdateInfo {
  current_backend_version: string
  latest_backend_version: string
  current_webui_version: string
  latest_webui_version: string
  backend_update_available: boolean
  webui_update_available: boolean
  backend_download_url: string | null
  webui_download_url: string | null
}

interface SkipVersions {
  backend: string
  webui: string
}

export const useAppStore = defineStore('app', () => {
  // 状态
  const siderCollapsed = ref(localStorage.getItem('siderCollapsed') === 'true' || false)
  const secondarySiderCollapsed = ref(
    localStorage.getItem('secondarySiderCollapsed') === 'true' || false
  )
  const currentModule = ref('home')
  const currentSubModule = ref('')
  const systemStatus = ref<SystemStatus>({
    status: 'normal',
    apiConnected: true,
    memoryUsage: {
      percent: 0,
      total: 0,
      used: 0,
      free: 0
    },
    cpuUsage: 0,
    uptime: 0,
    activeAdapters: 0,
    activeBackends: 0,
    loadedPlugins: 0,
    workflowCount: 0,
    version: 'unknown',
    platform: 'unknown',
    cpuInfo: 'unknown',
    pythonVersion: 'unknown',
    hasProxy: false
  })

  const updateInfo = ref<UpdateInfo | null>(null)
  // 持久化
  const skipVersions = ref<SkipVersions>(
    JSON.parse(localStorage.getItem('skipVersions') || '{}') as SkipVersions
  )
  const lastRemindTime = ref<number>(0)

  const showDrawer = ref(false)

  // 计算属性
  const isSystemHealthy = computed(() => {
    return systemStatus.value.status === 'normal' && systemStatus.value.apiConnected
  })

  // 动作
  const toggleSider = () => {
    siderCollapsed.value = !siderCollapsed.value
    localStorage.setItem('siderCollapsed', siderCollapsed.value.toString())
  }

  const toggleSecondarySider = () => {
    secondarySiderCollapsed.value = !secondarySiderCollapsed.value
    localStorage.setItem('secondarySiderCollapsed', secondarySiderCollapsed.value.toString())
  }

  const setCurrentModule = (module: string) => {
    currentModule.value = module
  }

  const setCurrentSubModule = (subModule: string) => {
    currentSubModule.value = subModule
  }

  const updateSystemStatus = (status: SystemStatus) => {
    systemStatus.value = status
  }

  const setUpdateInfo = (info: UpdateInfo) => {
    // 如果版本已被跳过，不显示更新
    if (
      skipVersions.value.backend === info.latest_backend_version ||
      skipVersions.value.webui === info.latest_webui_version
    ) {
      return false
    }

    // 如果在提醒冷却时间内，不显示更新
    const now = Date.now()
    if (now - lastRemindTime.value < 24 * 60 * 60 * 1000) {
      // 24小时
      return false
    }

    updateInfo.value = info
    return true
  }

  const setUpdateRemindLater = () => {
    lastRemindTime.value = Date.now()
  }

  const setSkipVersion = () => {
    if (updateInfo.value) {
      if (updateInfo.value.latest_backend_version) {
        skipVersions.value.backend = updateInfo.value.latest_backend_version
      }
      if (updateInfo.value.latest_webui_version) {
        skipVersions.value.webui = updateInfo.value.latest_webui_version
      }
      localStorage.setItem('skipVersions', JSON.stringify(skipVersions.value))
    }
  }

  const setShowDrawer = (show: boolean) => {
    showDrawer.value = show
  }

  return {
    // 状态
    siderCollapsed,
    secondarySiderCollapsed,
    currentModule,
    currentSubModule,
    systemStatus,
    updateInfo,
    // 计算属性
    isSystemHealthy,
    showDrawer,
    // 动作
    toggleSider,
    toggleSecondarySider,
    setCurrentModule,
    setCurrentSubModule,
    updateSystemStatus,
    setUpdateInfo,
    setUpdateRemindLater,
    setSkipVersion,
    setShowDrawer
  }
})
