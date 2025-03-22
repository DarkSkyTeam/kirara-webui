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

export function useMediaViewModel() {
    // 状态
    const mediaList = ref<MediaItem[]>([])
    const loading = ref(false)
    const loadingMore = ref(false)
    const hasMore = ref(false)
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
            hasMore.value = response.has_more
        } catch (error) {
            handleError(error, '获取媒体列表失败')
        } finally {
            loading.value = false
            loadingMore.value = false
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

    // 加载更多
    const loadMore = () => {
        fetchMediaList(true)
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
        link.href = item.url
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

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    return {
        // 状态
        mediaList,
        loading,
        loadingMore,
        hasMore,
        total,
        selectedMediaIds,
        showPreviewModal,
        previewItem,
        searchParams,
        dateRange,
        contentTypeOptions,

        // 方法
        fetchMediaList,
        handleSearch,
        resetSearch,
        loadMore,
        toggleSelectMedia,
        handleCheckboxChange,
        handlePreview,
        handleDeleteMedia,
        handleBatchDelete,
        getPreviewUrl,
        getRawUrl,
        downloadMedia,

        // 工具函数
        formatFileSize,
        formatDate,
        formatDateTime
    }
} 