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
            fontSize: 15,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12,
            color: 'var(--text-color-secondary)'
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        },
        backgroundColor: 'rgba(var(--card-bg-color-rgb), 0.9)',
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '20%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: llmStats.value.daily_stats.map((item: { date: string }) => item.date),
        axisLabel: {
            rotate: 45,
            formatter: (value: string) => value.slice(5), // 只显示月-日
            color: 'var(--text-color-secondary)'
        },
    },
    yAxis: {
        type: 'value',
        name: 'Tokens',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
            color: 'var(--text-color-secondary)',
            fontWeight: 'normal'
        },
        axisLabel: {
            color: 'var(--text-color-secondary)'
        },
    },
    dataZoom: [{
        type: 'slider',
        show: true,
        start: 50,
        end: 100,
        height: 20,
        borderColor: 'transparent',
        backgroundColor: 'rgba(var(--primary-color-rgb), 0.05)',
        handleStyle: {
            color: themeColors[0]
        }
    }],
    series: [{
        name: 'Token 使用量',
        data: llmStats.value.daily_stats.map((item: { tokens: number }) => item.tokens),
        type: 'line',
        smooth: true,
        symbolSize: 6,
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
                    color: themeColors[0] + '20'
                }, {
                    offset: 1,
                    color: themeColors[0] + '05'
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
            fontSize: 15,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12,
            color: 'var(--text-color-secondary)'
        }
    },
    tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)',
        backgroundColor: 'rgba(var(--card-bg-color-rgb), 0.9)',
    },
    legend: {
        orient: 'horizontal',
        bottom: 10,
        icon: 'circle',
        textStyle: {
            color: 'var(--text-color-secondary)'
        }
    },
    series: [{
        type: 'pie',
        radius: ['45%', '70%'],
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
            },
            scaleSize: 10
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
            fontSize: 15,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12,
            color: 'var(--text-color-secondary)'
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
        top: '20%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: llmStats.value.models.map((item: { model_id: string }) => item.model_id),
        axisLabel: {
            rotate: 45,
            interval: 0,
            color: 'var(--text-color-secondary)'
        },
        axisLine: {
        }
    },
    yAxis: [{
        type: 'value',
        name: '请求次数',
        position: 'left',
        axisLabel: {
            color: 'var(--text-color-secondary)'
        },
        nameTextStyle: {
            color: 'var(--text-color-secondary)'
        },
    }, {
        type: 'value',
        name: '响应时间(ms)',
        position: 'right',
        axisLabel: {
            color: 'var(--text-color-secondary)'
        },
        nameTextStyle: {
            color: 'var(--text-color-secondary)'
        },
        splitLine: {
            show: false
        }
    }],
    series: [{
        name: '请求次数',
        type: 'bar',
        data: llmStats.value.models.map((item: { count: number }) => item.count),
        itemStyle: {
            color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                    offset: 0,
                    color: themeColors[1]
                }, {
                    offset: 1,
                    color: themeColors[1] + '80'
                }]
            },
            borderRadius: [4, 4, 0, 0]
        }
    }, {
        name: '平均响应时间',
        type: 'line',
        yAxisIndex: 1,
        data: llmStats.value.models.map((item: { avg_duration: number }) => Math.round(item.avg_duration)),
        itemStyle: {
            color: themeColors[2]
        },
        symbolSize: 6,
        smooth: true
    }]
}))

const hourlyRequestsOption = computed(() => ({
    title: {
        text: '24小时请求趋势',
        subtext: '最近24小时的请求量与Token消耗',
        left: 'center',
        top: 10,
        textStyle: {
            fontSize: 15,
            fontWeight: 'normal'
        },
        subtextStyle: {
            fontSize: 12,
            color: 'var(--text-color-secondary)'
        }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross'
        },
        backgroundColor: 'rgba(var(--card-bg-color-rgb), 0.9)',
        borderColor: 'rgba(var(--primary-color-rgb), 0.1)',
        textStyle: {
            color: 'var(--text-color)'
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
        top: '20%',
        containLabel: true
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: llmStats.value.hourly_stats.map((item: { hour: string }) => item.hour.split(' ')[1]),
        axisLabel: {
            rotate: 45,
            color: 'var(--text-color-secondary)'
        }
    },
    yAxis: [{
        type: 'value',
        name: '请求次数',
        position: 'left',
        axisLabel: {
            color: 'var(--text-color-secondary)'
        },
        nameTextStyle: {
            color: 'var(--text-color-secondary)'
        }
    }, {
        type: 'value',
        name: 'Token数',
        position: 'right',
        axisLabel: {
            color: 'var(--text-color-secondary)'
        },
        nameTextStyle: {
            color: 'var(--text-color-secondary)'
        },
        splitLine: {
            show: false
        }
    }],
    series: [{
        name: '请求次数',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: llmStats.value.hourly_stats.map((item: { requests: number }) => item.requests),
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
                    color: themeColors[0] + '20'
                }, {
                    offset: 1,
                    color: themeColors[0] + '05'
                }]
            }
        }
    }, {
        name: 'Token消耗',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        yAxisIndex: 1,
        data: llmStats.value.hourly_stats.map((item: { tokens: number }) => item.tokens),
        itemStyle: {
            color: themeColors[1]
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
                    color: themeColors[1] + '20'
                }, {
                    offset: 1,
                    color: themeColors[1] + '05'
                }]
            }
        }
    }]
}))

// 格式化持续时间
const formatDuration = (ms: number): string => {
    if (isNaN(ms)) {
        return '0ms'
    }
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
    <n-space vertical :size="12">
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
            <n-grid :cols="24" :x-gap="12" :y-gap="12" responsive="screen" :item-responsive="true">
                <n-gi :span="6" :xs="24" :sm="12" :md="12" :lg="6">
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
                <n-gi :span="6" :xs="24" :sm="12" :md="12" :lg="6">
                    <div class="statistic-item">
                        <div class="statistic-icon success">
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
                <n-gi :span="6" :xs="24" :sm="12" :md="12" :lg="6">
                    <div class="statistic-item">
                        <div class="statistic-icon info">
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
                <n-gi :span="6" :xs="24" :sm="12" :md="12" :lg="6">
                    <div class="statistic-item">
                        <div class="statistic-icon warning">
                            <n-icon size="24" :depth="3">
                                <time-outline />
                            </n-icon>
                        </div>
                        <div class="statistic-content">
                            <div class="statistic-label">平均响应时间</div>
                            <div class="statistic-value">
                                {{ formatDuration(Math.round(llmStats.models.reduce((acc, cur) => acc + cur.avg_duration, 0) / (llmStats.models.length || 1))) }}
                            </div>
                        </div>
                    </div>
                </n-gi>
            </n-grid>
        </n-card>

        <!-- 图表区域 -->
        <n-grid cols="1 s:1 m:2 l:2" :x-gap="12" :y-gap="12" responsive="screen" :item-responsive="true">
            <!-- Token 使用趋势 -->
            <n-gi>
                <n-card :bordered="false" class="chart-card">
                    <v-chart class="chart" :option="dailyTokensOption" autoresize />
                </n-card>
            </n-gi>
            
            <!-- 请求状态和模型使用分析 -->
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
            
            <!-- 24小时趋势 -->
            <n-gi>
                <n-card :bordered="false" class="chart-card">
                    <v-chart class="chart" :option="hourlyRequestsOption" autoresize />
                </n-card>
            </n-gi>
        </n-grid>
    </n-space>
</template>

<style scoped>
.overview-card {
    background: rgba(var(--card-bg-color-rgb), 0.8);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
}

.overview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}

.chart-card {
    background: rgba(var(--card-bg-color-rgb), 0.8);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
    transition: all 0.3s ease;
    height: 100%;
}

.statistic-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 4px;
    border-radius: 12px;
    background: rgba(var(--card-bg-color-rgb), 0.8);
    transition: all 0.3s ease;
    height: 100%;
    border: 1px solid rgba(var(--primary-color-rgb), 0.1);
}

.statistic-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.statistic-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--primary-color-rgb), 0.2) 100%);
    color: var(--primary-color);
}

.statistic-icon.success {
    background: linear-gradient(135deg, rgba(var(--success-color-rgb), 0.1) 0%, rgba(var(--success-color-rgb), 0.2) 100%);
    color: var(--success-color);
}

.statistic-icon.warning {
    background: linear-gradient(135deg, rgba(var(--warning-color-rgb), 0.1) 0%, rgba(var(--warning-color-rgb), 0.2) 100%);
    color: var(--warning-color);
}

.statistic-icon.info {
    background: linear-gradient(135deg, rgba(var(--info-color-rgb), 0.1) 0%, rgba(var(--info-color-rgb), 0.2) 100%);
    color: var(--info-color);
}

.statistic-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.statistic-label {
    font-size: 0.9rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
}

.statistic-value {
    font-size: 1.35rem;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.2;
}

.chart {
    height: 320px;
    width: 100%;
}

@media (max-width: 1400px) {
    .chart {
        height: 300px;
    }
}

@media (max-width: 768px) {
    .statistic-item {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 14px;
    }
    
    .statistic-content {
        width: 100%;
        align-items: center;
    }
    
    .chart {
        height: 280px;
    }
}

@media (max-width: 480px) {
    .chart {
        height: 240px;
    }
    
    .statistic-icon {
        width: 40px;
        height: 40px;
    }
    
    .statistic-value {
        font-size: 1.25rem;
    }
    
    :deep(.n-card-header) {
        padding: 12px 16px;
    }
    
    :deep(.n-card__content) {
        padding: 12px;
    }
}
</style>