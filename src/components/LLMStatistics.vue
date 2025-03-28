<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
    NCard,
    NGrid,
    NGi,
    NStatistic,
    NProgress,
    NNumberAnimation,
    NSpace,
    NTabs,
    NTabPane,
    NDivider,
    NIcon,
    NTooltip
} from 'naive-ui'
import { http } from '@/utils/http'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
    LineChart,
    BarChart,
    PieChart
} from 'echarts/charts'
import {
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
    TrendingUpOutline,
    TimeOutline,
    PieChartOutline,
    ServerOutline
} from '@vicons/ionicons5'
import type { LLMStatistics } from '@/views/tracing/llm/llm-tracing.vm'
// 注册 ECharts 组件
use([
    CanvasRenderer,
    LineChart,
    BarChart,
    PieChart,
    GridComponent,
    TooltipComponent,
    LegendComponent,
    TitleComponent,
    DataZoomComponent
])

// LLM 统计数据
const llmStats = ref<LLMStatistics>({
    overview: {
        total_tokens: 0,
        total_requests: 0,
        pending_requests: 0,
        success_requests: 0,
        failed_requests: 0
    },
    daily_stats: [],
    hourly_stats: [],
    models: [],
    backends: []
})

// 获取 LLM 统计数据
const fetchLLMStats = async () => {
    try {
        const data = await http.get<LLMStatistics>('/tracing/llm/statistics')
        llmStats.value = data
    } catch (error) {
        console.error('获取 LLM 统计数据失败:', error)
    }
}

// 图表主题色
const themeColors = [
    '#3b82f6', // 蓝色
    '#10b981', // 绿色
    '#6366f1', // 靛蓝色
    '#8b5cf6', // 紫色
    '#f59e0b', // 橙色
    '#ef4444', // 红色
    '#64748b', // 灰色
    '#0ea5e9'  // 浅蓝色
]

// 更新图表配置
const dailyTokensOption = computed(() => ({
    title: {
        text: '每日 Token 使用趋势',
        subtext: '最近30天的 Token 消耗统计',
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: llmStats.value.daily_stats.map((item: { date: string }) => item.date),
        axisLabel: {
            rotate: 45,
            formatter: (value: string) => value.slice(5) // 只显示月-日
        }
    },
    yAxis: {
        type: 'value',
        name: 'Tokens',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
            fontWeight: 'bold'
        }
    },
    dataZoom: [{
        type: 'slider',
        show: true,
        start: 50,
        end: 100
    }],
    series: [{
        name: 'Token 使用量',
        data: llmStats.value.daily_stats.map((item: { tokens: number }) => item.tokens),
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: {
            color: themeColors[0]
        },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                    offset: 0,
                    color: themeColors[0] + 'AA'
                }, {
                    offset: 1,
                    color: themeColors[0] + '11'
                }]
            }
        }
    }]
}))

const requestStatusOption = computed(() => ({
    title: {
        text: '请求状态分布',
        subtext: '各状态请求数量占比',
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
    },
    legend: {
        orient: 'horizontal',
        bottom: 10,
        icon: 'circle'
    },
    series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
        },
        label: {
            show: false
        },
        emphasis: {
            label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
            }
        },
        labelLine: {
            show: false
        },
        data: [
            {
                value: llmStats.value.overview.success_requests,
                name: '成功',
                itemStyle: { color: themeColors[1] }
            },
            {
                value: llmStats.value.overview.failed_requests,
                name: '失败',
                itemStyle: { color: themeColors[5] }
            },
            {
                value: llmStats.value.overview.pending_requests,
                name: '处理中',
                itemStyle: { color: themeColors[4] }
            }
        ]
    }]
}))

const modelUsageOption = computed(() => ({
    title: {
        text: '模型使用分析',
        subtext: '各模型请求量与平均响应时间',
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    legend: {
        data: ['请求次数', '平均响应时间'],
        bottom: 10
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: llmStats.value.models.map((item: { model_id: string }) => item.model_id),
        axisLabel: {
            rotate: 45,
            interval: 0
        }
    },
    yAxis: [{
        type: 'value',
        name: '请求次数',
        position: 'left'
    }, {
        type: 'value',
        name: '响应时间(ms)',
        position: 'right'
    }],
    series: [{
        name: '请求次数',
        type: 'bar',
        data: llmStats.value.models.map((item: { count: number }) => item.count),
        itemStyle: {
            color: themeColors[1]
        }
    }, {
        name: '平均响应时间',
        type: 'line',
        yAxisIndex: 1,
        data: llmStats.value.models.map((item: { avg_duration: number }) => Math.round(item.avg_duration * 1000)),
        itemStyle: {
            color: themeColors[2]
        }
    }]
}))

const hourlyRequestsOption = computed(() => ({
    title: {
        text: '24小时请求趋势',
        subtext: '最近24小时的请求量与Token消耗',
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        }
    },
    legend: {
        data: ['请求次数', 'Token消耗'],
        bottom: 10
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: llmStats.value.hourly_stats.map((item: { hour: string }) => item.hour.split(' ')[1]),
        axisLabel: {
            rotate: 45
        }
    },
    yAxis: [{
        type: 'value',
        name: '请求次数',
        position: 'left'
    }, {
        type: 'value',
        name: 'Token数',
        position: 'right'
    }],
    series: [{
        name: '请求次数',
        type: 'line',
        smooth: true,
        data: llmStats.value.hourly_stats.map((item: { requests: number }) => item.requests),
        itemStyle: {
            color: themeColors[0]
        }
    }, {
        name: 'Token消耗',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: llmStats.value.hourly_stats.map((item: { tokens: number }) => item.tokens),
        itemStyle: {
            color: themeColors[1]
        }
    }]
}))

// 格式化持续时间
const formatDuration = (ms: number): string => {
    if (ms < 1000) {
        return `${ms}ms`
    } else if (ms < 60000) {
        return `${(ms / 1000).toFixed(1)}s`
    } else {
        const minutes = Math.floor(ms / 60000)
        const seconds = ((ms % 60000) / 1000).toFixed(1)
        return `${minutes}m ${seconds}s`
    }
}

// 自动获取数据
onMounted(() => {
    fetchLLMStats()
    // 每5分钟刷新一次数据
    setInterval(fetchLLMStats, 5 * 60 * 1000)
})
</script>

<template>
    <n-space vertical size="large">
        <!-- 概览统计卡片 -->
        <n-card title="LLM 使用分析" :bordered="false" class="overview-card">
            <template #header-extra>
                <n-tooltip trigger="hover">
                    <template #trigger>
                        <n-icon size="18">
                            <time-outline />
                        </n-icon>
                    </template>
                    每5分钟刷新一次
                </n-tooltip>
            </template>
            <n-grid :cols="4" :x-gap="24" :y-gap="24" responsive="screen">
                <n-gi>
                    <div class="statistic-item">
                        <div class="statistic-icon">
                            <n-icon size="24" :depth="3">
                                <trending-up-outline />
                            </n-icon>
                        </div>
                        <div class="statistic-content">
                            <div class="statistic-label">30天请求数</div>
                            <div class="statistic-value">
                                <n-number-animation :from="0" :to="llmStats.overview.total_requests" :duration="1000" />
                            </div>
                        </div>
                    </div>
                </n-gi>
                <n-gi>
                    <div class="statistic-item">
                        <div class="statistic-icon">
                            <n-icon size="24" :depth="3">
                                <pie-chart-outline />
                            </n-icon>
                        </div>
                        <div class="statistic-content">
                            <div class="statistic-label">成功率</div>
                            <div class="statistic-value">
                                {{ llmStats.overview.total_requests ? Math.round((llmStats.overview.success_requests / llmStats.overview.total_requests) * 100) : 0 }}%
                            </div>
                        </div>
                    </div>
                </n-gi>
                <n-gi>
                    <div class="statistic-item">
                        <div class="statistic-icon">
                            <n-icon size="24" :depth="3">
                                <server-outline />
                            </n-icon>
                        </div>
                        <div class="statistic-content">
                            <div class="statistic-label">Token 消耗</div>
                            <div class="statistic-value">
                                <n-number-animation 
                                    :from="0" 
                                    :to="llmStats.overview.total_tokens" 
                                    :duration="1000"
                                    :precision="0" />
                            </div>
                        </div>
                    </div>
                </n-gi>
                <n-gi>
                    <div class="statistic-item">
                        <div class="statistic-icon">
                            <n-icon size="24" :depth="3">
                                <time-outline />
                            </n-icon>
                        </div>
                        <div class="statistic-content">
                            <div class="statistic-label">平均响应时间</div>
                            <div class="statistic-value">
                                {{ formatDuration(Math.round(llmStats.models.reduce((acc, cur) => acc + cur.avg_duration, 0) / llmStats.models.length)) }}
                            </div>
                        </div>
                    </div>
                </n-gi>
            </n-grid>
        </n-card>

        <!-- Token 使用趋势卡片 -->
        <n-card :bordered="false" class="chart-card">
            <v-chart class="chart" :option="dailyTokensOption" autoresize />
        </n-card>

        <!-- 请求状态分布卡片 -->
        <n-grid :cols="2" :x-gap="24" responsive="screen">
            <n-gi>
                <n-card :bordered="false" class="chart-card">
                    <v-chart class="chart" :option="requestStatusOption" autoresize />
                </n-card>
            </n-gi>
            <n-gi>
                <n-card :bordered="false" class="chart-card">
                    <v-chart class="chart" :option="modelUsageOption" autoresize />
                </n-card>
            </n-gi>
        </n-grid>

        <!-- 24小时趋势卡片 -->
        <n-card :bordered="false" class="chart-card">
            <v-chart class="chart" :option="hourlyRequestsOption" autoresize />
        </n-card>
    </n-space>
</template>

<style scoped>
.overview-card {
    background: var(--card-bg-color);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
}

.chart-card {
    background: var(--card-bg-color);
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    transition: all 0.3s ease;
}

.chart-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.statistic-item {
    display: flex;
    align-items: flex-start;  /* 改为顶部对齐 */
    gap: 16px;
    padding: 20px;  /* 稍微减小内边距 */
    border-radius: var(--border-radius-small);
    background: rgba(99, 102, 241, 0.03);
    transition: all 0.3s ease;
    height: 100%;  /* 确保所有卡片高度一致 */
}

.statistic-item:hover {
    background: rgba(99, 102, 241, 0.06);
}

.statistic-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;  /* 使用 min-width 确保图标不会被压缩 */
    height: 48px;
    border-radius: 12px;
    background: rgba(99, 102, 241, 0.1);
    color: var(--primary-color);
}

.statistic-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.statistic-label {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
}

.statistic-value {
    font-size: 2rem;  /* 增大数值字体 */
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.2;
}

.progress-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 60px;  /* 固定高度以匹配其他统计项 */
}

.chart {
    height: 400px;
    width: 100%;
}

@media (max-width: 768px) {
    :deep(.n-grid) {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .chart {
        height: 300px;
    }

    .statistic-item {
        padding: 16px;
    }
}
</style>