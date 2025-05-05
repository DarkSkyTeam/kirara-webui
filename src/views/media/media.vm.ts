import { ref, reactive, computed } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import type { Ref } from 'vue'

export interface MediaMetadata {
  filename: string
  content_type: string
  size: number
  upload_time: string
  source?: string
  tags: string[]
  references: string[]
}

export interface MediaItem {
  id: string
  url: string
  thumbnail_url?: string
  metadata: MediaMetadata
}

export interface MediaListResponse {
  items: MediaItem[]
  total: number
  has_more: boolean
}

export interface MediaSearchParams {
  query?: string
  content_type?: string
  start_date?: string
  end_date?: string
  tags?: string[]
  page: number
  page_size: number
}

// 引用处理接口
export interface ReferenceHandler {
  view: (key: string, module?: string) => void
  delete: (key: string, module?: string) => Promise<boolean>
}

export interface ReferenceRow {
  module: string
  key: string
}

// 新增：系统信息接口
export interface SystemInfo {
  cleanup_duration: number
  auto_remove_unreferenced: boolean
  last_cleanup_time?: number
  total_media_count: number
  total_media_size: number
  disk_total: number
  disk_used: number
  disk_free: number
}

export function useMediaViewModel() {
  // 状态
  const mediaList = ref<MediaItem[]>([])
  const loading = ref(false)
  const total = ref(0)
  const selectedMediaIds = ref<string[]>([])

  // 预览状态
  const showPreviewModal = ref(false)
  const previewItem = ref<MediaItem | null>(null)

  // 搜索参数
  const searchParams = reactive<MediaSearchParams>({
    query: '',
    content_type: undefined,
    start_date: undefined,
    end_date: undefined,
    tags: [],
    page: 1,
    page_size: 20
  })

  // 日期范围
  const dateRange = ref<[string, string] | null>(null)

  const message = useMessage()
  const dialog = useDialog()

  // 新增：系统信息和配置状态
  const systemInfo = ref<SystemInfo | null>(null)
  const systemInfoLoading = ref(false)
  const showConfigModal = ref(false)
  // 用于模态框编辑，初始值在获取系统信息后设置
  const configCleanupDuration = ref<number | null>(null)
  const configAutoRemoveUnreferenced = ref<boolean | null>(null)

  // 引用处理策略
  const referenceHandlers: Record<string, ReferenceHandler> = {
    // 默认处理器 - 用于未实现的模块
    default: {
      view: (key: string, module?: string) => {
        message.info(`查看${module || ''}引用功能暂未实现`)
        console.log('未实现的引用查看:', module, key)
      },
      delete: async (key: string, module?: string) => {
        message.info(`删除${module || ''}引用功能暂未实现`)
        console.log('未实现的引用删除:', module, key)
        return false
      }
    }
  }

  // 查看引用
  const viewReference = (module: string, key: string) => {
    const handler = referenceHandlers[module] || referenceHandlers.default
    handler.view(key, module)
  }

  // 删除引用
  const deleteReference = async (reference: ReferenceRow) => {
    const { module, key } = reference

    // 使用策略模式处理不同类型的引用
    const handler = referenceHandlers[module] || referenceHandlers.default
    const success = await handler.delete(key, module)

    // 如果删除成功，从UI中移除该引用
    if (success && previewItem.value && previewItem.value.metadata.references) {
      const index = previewItem.value.metadata.references.indexOf(key)
      if (index !== -1) {
        // 创建一个新的引用数组（避免直接修改原数组）
        const newReferences = [...previewItem.value.metadata.references]
        newReferences.splice(index, 1)
        previewItem.value.metadata.references = newReferences
        message.success('引用删除成功')
      }
    }
  }

  // 注册引用处理器
  const registerReferenceHandler = (module: string, handler: ReferenceHandler) => {
    referenceHandlers[module] = handler
  }

  // 错误处理
  const handleError = (error: any, defaultMessage: string) => {
    console.error('媒体管理错误:', error)
    if (error.response?.data?.error) {
      message.error(error.response.data.error)
    } else if (error.message) {
      message.error(error.message)
    } else {
      message.error(defaultMessage)
    }
  }

  // 新增：获取系统信息
  const fetchSystemInfo = async () => {
    systemInfoLoading.value = true
    try {
      const response = await http.get<SystemInfo>('/media/system')
      systemInfo.value = response
      // 初始化配置模态框的值
      configCleanupDuration.value = response.cleanup_duration
      configAutoRemoveUnreferenced.value = response.auto_remove_unreferenced
    } catch (error) {
      handleError(error, '获取系统信息失败')
      systemInfo.value = null // 出错时清空
    } finally {
      systemInfoLoading.value = false
    }
  }

  const saveConfig = async () => {
    if (configCleanupDuration.value === null || configAutoRemoveUnreferenced.value === null) {
      message.error('配置项不能为空')
      return
    }
    try {
      await http.post('/media/system/config', {
        cleanup_duration: configCleanupDuration.value,
        auto_remove_unreferenced: configAutoRemoveUnreferenced.value
      })
      message.success('配置保存成功')
      showConfigModal.value = false
      // 重新获取系统信息以更新显示
      fetchSystemInfo()
    } catch (error) {
      handleError(error, '保存配置失败')
    }
  }

  // 打开配置模态框
  const openConfigModal = () => {
    // 确保打开时加载的是最新的配置
    if (systemInfo.value) {
      configCleanupDuration.value = systemInfo.value.cleanup_duration
      configAutoRemoveUnreferenced.value = systemInfo.value.auto_remove_unreferenced
      showConfigModal.value = true
    } else {
      // 如果还没有加载系统信息，先加载
      fetchSystemInfo().then(() => {
        if (systemInfo.value) {
          showConfigModal.value = true
        }
      })
    }
  }

  // 加载媒体列表
  const fetchMediaList = async () => {
    try {
      // 转换日期
      if (dateRange.value) {
        searchParams.start_date = dateRange.value[0]
        searchParams.end_date = dateRange.value[1]
      } else {
        searchParams.start_date = undefined
        searchParams.end_date = undefined
      }

      const response = await http.post<MediaListResponse>('/media/list', searchParams)

      mediaList.value = response.items

      total.value = response.total
    } catch (error) {
      handleError(error, '获取媒体列表失败')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const handleSearch = () => {
    fetchMediaList()
  }

  // 重置搜索
  const resetSearch = () => {
    searchParams.query = ''
    searchParams.content_type = undefined
    dateRange.value = null
    searchParams.start_date = undefined
    searchParams.end_date = undefined
    fetchMediaList()
  }

  // 选择媒体
  const toggleSelectMedia = (id: string) => {
    const index = selectedMediaIds.value.indexOf(id)
    if (index === -1) {
      selectedMediaIds.value.push(id)
    } else {
      selectedMediaIds.value.splice(index, 1)
    }
  }

  // 复选框变化
  const handleCheckboxChange = (checked: boolean, id: string) => {
    if (checked) {
      if (!selectedMediaIds.value.includes(id)) {
        selectedMediaIds.value.push(id)
      }
    } else {
      const index = selectedMediaIds.value.indexOf(id)
      if (index !== -1) {
        selectedMediaIds.value.splice(index, 1)
      }
    }
  }

  // 预览媒体
  const handlePreview = (item: MediaItem) => {
    previewItem.value = item
    showPreviewModal.value = true
  }

  // 删除单个媒体
  const handleDeleteMedia = async (item: MediaItem | null) => {
    if (!item) return

    dialog.warning({
      title: '确认删除',
      content: `确定要删除文件 "${item.metadata.filename}" 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await http.delete(`/media/delete/${item.id}`)
          message.success('删除成功')
          showPreviewModal.value = false
          fetchMediaList()
          // 如果在选中列表中，也要移除
          const index = selectedMediaIds.value.indexOf(item.id)
          if (index !== -1) {
            selectedMediaIds.value.splice(index, 1)
          }
        } catch (error) {
          handleError(error, '删除失败')
        }
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedMediaIds.value.length === 0) return

    dialog.warning({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedMediaIds.value.length} 个文件吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await http.post('/media/batch-delete', {
            ids: selectedMediaIds.value
          })
          message.success(`成功删除 ${selectedMediaIds.value.length} 个文件`)
          selectedMediaIds.value = []
          fetchMediaList()
        } catch (error) {
          handleError(error, '批量删除失败')
        }
      }
    })
  }

  const getPreviewUrl = (id: string) => {
    return http.url(`/media/preview/${id}?auth_token=${http.getAuthToken()}`)
  }

  const getRawUrl = (id: string) => {
    return http.url(`/media/file/${id}?auth_token=${http.getAuthToken()}`)
  }

  // 下载媒体
  const downloadMedia = (item: MediaItem | null) => {
    if (!item) return

    const link = document.createElement('a')
    link.href = getRawUrl(item.id)
    link.download = item.metadata.filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 内容类型选项
  const contentTypeOptions = [
    { label: '图片', value: 'image/' },
    { label: '视频', value: 'video/' },
    { label: '音频', value: 'audio/' },
    { label: '文档', value: 'application/' }
  ]

  // 格式化函数
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return size + ' B'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    } else if (size < 1024 * 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    } else {
      return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const formatDateTime = (dateInput: string | number | Date | undefined | null) => {
    if (!dateInput) {
      return 'N/A' // 处理空值或无效值
    }
    // 如果输入是数字（时间戳），先转换为毫秒
    const timestamp = typeof dateInput === 'number' ? dateInput * 1000 : dateInput
    try {
      const date = new Date(timestamp)
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '无效日期'
      }
      return date.toLocaleString()
    } catch (e) {
      console.error('Error formatting date:', dateInput, e)
      return '格式化错误'
    }
  }

  const selectAll = () => {
    selectedMediaIds.value = mediaList.value.map((item) => item.id)
  }

  // 选择无引用资源
  const cleanupUnreferenced = async () => {
    dialog.warning({
      title: '确认操作',
      content: `这个操作将会清理所有未被引用的资源，确认继续吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await http.post('/media/system/cleanup-unreferenced')
          message.success('清理成功')
          await fetchMediaList()
          await fetchSystemInfo()
        } catch (error) {
          handleError(error, '清理失败')
        }
      }
    })
  }

  return {
    // 状态
    mediaList,
    loading,
    total,
    selectedMediaIds,
    showPreviewModal,
    previewItem,
    searchParams,
    dateRange,
    contentTypeOptions,
    systemInfo,
    systemInfoLoading,
    showConfigModal,
    configCleanupDuration,
    configAutoRemoveUnreferenced,

    // 方法
    fetchMediaList,
    handleSearch,
    resetSearch,
    toggleSelectMedia,
    handleCheckboxChange,
    handlePreview,
    handleDeleteMedia,
    handleBatchDelete,
    getPreviewUrl,
    getRawUrl,
    downloadMedia,
    selectAll,
    cleanupUnreferenced,
    // 新增方法
    fetchSystemInfo,
    saveConfig,
    openConfigModal,

    // 引用相关
    viewReference,
    deleteReference,
    registerReferenceHandler,

    // 工具函数
    formatFileSize,
    formatDate,
    formatDateTime
  }
}
