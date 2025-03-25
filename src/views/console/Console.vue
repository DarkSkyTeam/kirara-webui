<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { NCard, NSpace, NButton, NInput, NSpin, NText, NIcon, NEmpty, NBadge, NDivider, NTooltip, NTag } from 'naive-ui'
import { RefreshOutline, SearchOutline, AlertCircleOutline, InformationCircleOutline, ArrowDownOutline, PauseCircleOutline, PlayCircleOutline, TrashOutline } from '@vicons/ionicons5'
import { useConsoleViewModel, type LogEntry } from './viewmodels/console.vm'

const {
    logs,
    isConnected,
    isLoading,
    filterText,
    filteredLogs,
    connect,
    disconnect,
    restartServer,
    updateFilterText
} = useConsoleViewModel()

// 自动滚动到底部
const consoleContainer = ref<HTMLElement | null>(null)
const autoScroll = ref(true)
const showScrollToBottom = ref(false) // 控制是否显示浮动按钮

// 监听日志变化，自动滚动到底部
const scrollToBottom = async () => {
    await nextTick()
    if (consoleContainer.value) {
        consoleContainer.value.scrollTo({
            top: consoleContainer.value.scrollHeight,
            behavior: 'auto' // 添加平滑滚动效果
        })
    }
}

// 监听滚动事件
const handleScroll = () => {
    if (consoleContainer.value) {
        const { scrollTop, scrollHeight, clientHeight } = consoleContainer.value
        // 当距离底部超过一定距离时显示浮动按钮
        showScrollToBottom.value = scrollHeight - scrollTop > clientHeight + 20
    }
}

// 根据日志内容确定样式类
function getLogClass(log: LogEntry): string {
    if (log.level === 'ERROR') {
        return 'log-error'
    } else if (log.level === 'WARNING') {
        return 'log-warning'
    } else if (log.level === 'DEBUG') {
        return 'log-debug'
    } else if (log.level === 'INFO') {
        return 'log-info'
    } else if (log.level === 'SUCCESS') {
        return 'log-success'
    }
    return ''
}

function parseTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
        hour12: false
    })
}

// 切换自动滚动
const toggleAutoScroll = () => {
    autoScroll.value = !autoScroll.value
    if (autoScroll.value) {
        scrollToBottom()
    }
}

// 清空日志
const clearLogs = () => {
    logs.value = [{
        type: 'log',
        level: 'INFO',
        content: '日志已清空',
        timestamp: new Date().toISOString(),
        tag: 'WebUI'
    }]
    scrollToBottom()
}

// 监听日志变化
watch(() => logs.value.length, () => {
    if (autoScroll.value) {
        scrollToBottom()
    }
})

onMounted(() => {
    connect()
})

onUnmounted(() => {
    disconnect()
})
</script>

<template>
    <n-card title="服务器控制台" class="console-card">
        <template #header-extra>
            <n-space justify="space-between" align="center">
                <n-button type="primary" tertiary @click="scrollToBottom" :disabled="!showScrollToBottom">
                    <template #icon>
                        <n-icon>
                            <ArrowDownOutline />
                        </n-icon>
                    </template>
                    回到底部
                </n-button>
                <n-input v-model:value="filterText" placeholder="输入关键词过滤日志" clearable @update:value="updateFilterText"
                    style="width: 300px">
                    <template #prefix>
                        <n-icon><search-outline /></n-icon>
                    </template>
                </n-input>
                <n-space align="center" :size="8">
                    <n-button type="default" @click="clearLogs">
                        <template #icon>
                            <n-icon>
                                <TrashOutline />
                            </n-icon>
                        </template>
                        清空日志
                    </n-button>
                    <n-button :type="autoScroll ? 'primary' : 'default'" @click="toggleAutoScroll">
                        <template #icon>
                            <n-icon>
                                <template v-if="autoScroll">
                                    <PauseCircleOutline />
                                </template>
                                <template v-else>
                                    <PlayCircleOutline />
                                </template>
                            </n-icon>
                        </template>
                        {{ autoScroll ? '自动滚动：开启' : '自动滚动：关闭' }}
                    </n-button>
                    <n-button type="error" @click="restartServer" :loading="isLoading" :disabled="!isConnected">
                        <template #icon>
                            <n-icon><refresh-outline /></n-icon>
                        </template>
                        重启服务器
                    </n-button>
                </n-space>
            </n-space>
        </template>

        <div class="console-container" ref="consoleContainer" @scroll="handleScroll">
            <div v-if="filteredLogs.length > 0" class="console-logs">
                <div v-for="(log, index) in filteredLogs" :key="index" class="log-line" :class="getLogClass(log)">
                    <span class="log-index">{{ index + 1 }}</span>
                    <div class="log-line-content">
                        <span class="log-timestamp">{{ parseTimestamp(log.timestamp) }}</span>
                        <span class="log-level">{{ log.level }}</span>
                        <span class="log-tag">{{ log.tag }}</span>
                        <span class="log-content">{{ log.content }}</span>
                    </div>
                </div>
            </div>
            <n-empty v-else description="暂无日志" />
        </div>
    </n-card>
</template>

<style scoped>
.console-card {
    height: calc(100vh - 28px);
    display: flex;
    flex-direction: column;
    animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.console-header {
    display: flex;
    align-items: center;
    gap: 12px;
}

.console-title {
    font-size: 18px;
    font-weight: 500;
    margin-right: 8px;
}

.console-toolbar {
    margin-bottom: 8px;
}

.console-container {
    height: calc(100vh - 130px);
    overflow-y: auto;
    background-color: #1e1e1e;
    border-radius: 4px;
    padding: 8px;
    font-family: 'Courier New', Courier, monospace;
    position: relative;
}

.console-logs {
    white-space: pre-wrap;
    word-break: break-all;
}

.log-line {
    padding: 4px 8px;
    color: #d4d4d4;
    font-size: 14px;
    line-height: 1.5;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
}

.log-line:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

.log-index {
    min-width: 40px;
    color: #666;
    margin-right: 8px;
    user-select: none;
}

.log-timestamp {
    min-width: 160px;
    margin-right: 16px;
    color: #909399;
}

.log-level {
    min-width: 60px;
    margin-right: 16px;
    display: inline-block;
}

.log-tag {
    min-width: 100px;
    margin-right: 16px;
    display: inline-block;
    color: #67c23a;
}

.log-content {
    flex: 1;
}

.log-error {
    color: #f56c6c;
    background-color: rgba(245, 108, 108, 0.1);
}

.log-warning {
    color: #e6a23c;
    background-color: rgba(230, 162, 60, 0.1);
}

.log-debug {
    color: #909399;
}

.log-info {
    color: #D3D3D3;
    /* 浅灰色 */
}

.log-success {
    color: #67c23a;
}

/* 滚动条样式 */
.console-container::-webkit-scrollbar {
    width: 8px;
}

.console-container::-webkit-scrollbar-track {
    background: #2c2c2c;
    border-radius: 4px;
}

.console-container::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
}

.console-container::-webkit-scrollbar-thumb:hover {
    background: #777;
}
</style>
