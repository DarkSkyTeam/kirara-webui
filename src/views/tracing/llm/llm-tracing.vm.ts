import { ref, computed, h } from 'vue'
import { useTracingViewModel } from '../tracing.vm'
import type { TraceBase, TracerDelegate, TraceStatistics } from '../tracing.vm'
import { NTag, NButton } from 'naive-ui'

// LLM 追踪记录接口
export interface LLMTrace extends TraceBase {
    model_id: string
    backend_name: string
    prompt_tokens: number | null
    completion_tokens: number | null
    total_tokens: number | null
    cached_tokens: number | null
}

// LLM 统计信息接口
export interface LLMStatistics  {
    overview: {
        total_tokens: number
        total_requests: number
        pending_requests: number
        success_requests: number
        failed_requests: number
    }
    daily_stats: Array<{
        date: string
        requests: number
        tokens: number
        success: number
        failed: number
    }>
    hourly_stats: Array<{
        hour: string
        requests: number
        tokens: number
    }>
    models: Array<{
        model_id: string
        count: number
        tokens: number
        avg_duration: number
    }>
    backends: Array<{
        backend_name: string
        count: number
        tokens: number
        avg_duration: number
    }>
}

// LLM 追踪器委托实现
class LLMTracerDelegate implements TracerDelegate<LLMTrace, LLMStatistics> {
    private filterOptions = ref({
        modelId: [] as { label: string, value: string }[],
        backendName: [] as { label: string, value: string }[],
        status: [
            { label: '请求中', value: 'pending' },
            { label: '成功', value: 'success' },
            { label: '失败', value: 'failed' }
        ]
    })

    getFilterOptions() {
        return this.filterOptions.value
    }

    updateFilterOptions(stats: LLMStatistics) {
        this.filterOptions.value = {
            ...this.filterOptions.value,
            modelId: stats.models.map(model => ({
                label: model.model_id,
                value: model.model_id
            })),
            backendName: stats.backends.map(backend => ({
                label: backend.backend_name,
                value: backend.backend_name
            }))
        }
        console.log(this.filterOptions.value)
    }

    getTableColumns(baseVM: ReturnType<typeof useTracingViewModel>) {
        return [
            {
                title: 'ID',
                key: 'trace_id',
                width: 120,
                ellipsis: {
                    tooltip: true
                }
            },
            {
                title: '模型',
                key: 'model_id',
                width: 160
            },
            {
                title: '后端',
                key: 'backend_name',
                width: 120
            },
            {
                title: '请求时间',
                key: 'request_time',
                width: 180,
                render: (row: LLMTrace) => baseVM.formatDate(row.request_time)
            },
            {
                title: '状态',
                key: 'status',
                width: 100,
                render: (row: LLMTrace) => {
                    const statusMap = {
                        pending: { type: 'warning' as const, text: '请求中' },
                        success: { type: 'success' as const, text: '成功' },
                        failed: { type: 'error' as const, text: '失败' }
                    }
                    const status = statusMap[row.status] || statusMap.pending
                    return h(NTag, { type: status.type, size: 'small' }, { default: () => status.text })
                }
            },
            {
                title: '耗时',
                key: 'duration',
                width: 100,
                render: (row: LLMTrace) => baseVM.formatDuration(row.duration)
            },
            {
                title: 'Tokens',
                key: 'total_tokens',
                width: 100,
                render: (row: LLMTrace) => baseVM.formatTokens(row.total_tokens)
            },
            {
                title: '操作',
                key: 'actions',
                width: 100,
                render: (row: LLMTrace) => {
                    return h(
                        NButton,
                        {
                            text: true,
                            type: 'primary',
                            onClick: () => baseVM.viewTraceDetail(row.trace_id)
                        },
                        { default: () => '查看详情' }
                    )
                }
            }
        ]
    }

    formatStatistics(stats: LLMStatistics) {
        return [
            { label: '总请求数', value: stats.overview.total_requests },
            { label: '请求中', value: stats.overview.pending_requests, type: 'warning' },
            { label: '成功请求', value: stats.overview.success_requests, type: 'success' },
            { label: '失败请求', value: stats.overview.failed_requests, type: 'error' },
            { label: '总Token数', value: stats.overview.total_tokens, type: 'info' }
        ]
    }

    getDetailFields() {
        return [
            { label: '模型', key: 'model_id' },
            { label: '后端', key: 'backend_name' },
            { label: '提示Token', key: 'prompt_tokens' },
            { label: '补全Token', key: 'completion_tokens' },
            { label: '总Token', key: 'total_tokens' },
            { label: '缓存Token', key: 'cached_tokens' }
        ]
    }
}

/**
 * LLM 追踪视图模型
 * 扩展基础追踪视图模型,添加 LLM 特定的功能
 */
export function useLLMTracingViewModel() {
    const delegate = new LLMTracerDelegate()
    const baseVM = useTracingViewModel('llm', delegate)

    // 状态选项
    const statusOptions = delegate.getFilterOptions().status

    // 表格列定义
    const columns = computed(() => delegate.getTableColumns(baseVM))

    return {
        ...baseVM,
        statusOptions,
        columns,
    }
} 