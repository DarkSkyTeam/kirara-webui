import { ref, computed } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'

// 日志条目接口
export interface LogEntry {
    type: string;
    level: string;
    content: string;
    timestamp: string;
    tag: string;
}

export function useConsoleViewModel() {
    const message = useMessage()
    const dialog = useDialog()
    const logs = ref<LogEntry[]>([])
    const isConnected = ref(false)
    const isLoading = ref(false)
    const filterText = ref('')
    let socket: WebSocket | null = null
    let reconnectTimer: number | null = null
    let reconnectAttempts = 0
    const maxReconnectAttempts = 5
    const reconnectInterval = 3000 // 3秒

    // 过滤后的日志
    const filteredLogs = computed(() => {
        if (!filterText.value) {
            return logs.value
        }
        return logs.value.filter(log =>
            log.content.toLowerCase().includes(filterText.value.toLowerCase()) ||
            log.tag.toLowerCase().includes(filterText.value.toLowerCase()) ||
            log.level.toLowerCase().includes(filterText.value.toLowerCase())
        )
    })

    // 更新过滤文本
    const updateFilterText = (value: string) => {
        filterText.value = value
    }

    // 处理日志消息
    const processLogMessage = (data: LogEntry) => {
        if (data.type === 'log') {
            // 添加日志前缀，根据日志级别
            let prefix = ''
            switch (data.level.toUpperCase()) {
                case 'ERROR':
                    prefix = '[ERROR] '
                    break
                case 'WARNING':
                    prefix = '[WARNING] '
                    break
                case 'INFO':
                    prefix = '[INFO] '
                    break
                case 'DEBUG':
                    prefix = '[DEBUG] '
                    break
                default:
                    prefix = ''
            }

            logs.value.push(data)
            // 保持日志数量在合理范围内，避免内存占用过大
            if (logs.value.length > 1000) {
                logs.value = logs.value.slice(-1000)
            }
        }
    }

    // 连接WebSocket
    const connect = () => {
        if (socket) {
            disconnect()
        }

        isLoading.value = true

        try {
            const token = localStorage.getItem('token') || ''

            const socket = http.ws('/system/logs');

            socket.onopen = () => {
                socket!!.send(JSON.stringify({
                    type: 'auth',
                    token: token
                }))

                isConnected.value = true
                isLoading.value = false
                message.success('已连接到服务器日志')
                logs.value = [{
                    type: 'log',
                    level: 'INFO',
                    content: '已连接到服务器日志，正在加载历史日志...',
                    timestamp: new Date().toISOString(),
                    tag: 'WebUI'
                }]
                // 重置重连计数
                reconnectAttempts = 0
                // 清除任何待处理的重连计时器
                if (reconnectTimer !== null) {
                    clearTimeout(reconnectTimer)
                    reconnectTimer = null
                }
            }

            socket.onmessage = (event) => {
                try {
                    const parsedData = JSON.parse(event.data)
                    if (Array.isArray(parsedData)) {
                        parsedData.forEach((item) => {
                            processLogMessage(item)
                        })
                    } else {
                        processLogMessage(parsedData)
                    }
                } catch (error) {
                    // 如果不是JSON格式，直接添加为日志
                    logs.value.push(event.data)
                }
            }

            socket.onclose = (event) => {
                isConnected.value = false
                isLoading.value = false

                // 非正常关闭时尝试重连
                if (!event.wasClean && reconnectAttempts < maxReconnectAttempts) {
                    logs.value.push({
                        type: 'log',
                        level: 'INFO',
                        content: `连接断开，${reconnectInterval / 1000}秒后尝试重新连接...`,
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })
                    reconnectTimer = window.setTimeout(() => {
                        reconnectAttempts++
                        logs.value.push({
                            type: 'log',
                            level: 'INFO',
                            content: `正在尝试重新连接 (${reconnectAttempts}/${maxReconnectAttempts})...`,
                            timestamp: new Date().toISOString(),
                            tag: 'WebUI'
                        })
                        connect()
                    }, reconnectInterval)
                } else if (reconnectAttempts >= maxReconnectAttempts) {
                    logs.value.push({
                        type: 'log',
                        level: 'ERROR',
                        content: '重连次数已达上限，请手动刷新页面重试',
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })
                    message.error('重连次数已达上限，请手动刷新页面重试')
                } else {
                    logs.value.push({
                        type: 'log',
                        level: 'ERROR',
                        content: '与服务器的连接已断开',
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })
                }
            }

            socket.onerror = (error) => {
                isConnected.value = false
                isLoading.value = false
                message.error('连接服务器日志失败')
                logs.value.push({
                    type: 'log',
                    level: 'ERROR',
                    content: '连接服务器日志失败',
                    timestamp: new Date().toISOString(),
                    tag: 'WebUI'
                })
                console.error('WebSocket错误:', error)
            }
        } catch (error) {
            isLoading.value = false
            message.error('连接服务器日志失败')
            console.error('WebSocket连接错误:', error)
        }
    }

    // 断开WebSocket连接
    const disconnect = () => {
        // 清除重连计时器
        if (reconnectTimer !== null) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }

        if (socket) {
            // 标记为正常关闭
            socket.onclose = null
            socket.close()
            socket = null
            isConnected.value = false
        }
    }

    // 重启服务器
    const restartServer = async () => {
        if (!isConnected.value) {
            message.warning('未连接到服务器')
            return
        }

        dialog.warning({
            title: '确认重启',
            content: '确定要重启服务器吗？重启过程中服务将暂时不可用。',
            positiveText: '确认重启',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    isLoading.value = true
                    await http.post('/system/restart')
                    message.success('重启命令已发送')
                    logs.value.push({
                        type: 'log',
                        level: 'INFO',
                        content: '重启命令已发送',
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })

                    // 断开当前连接，等待服务器重启
                    disconnect()

                    // 延迟5秒后尝试重新连接
                    logs.value.push({
                        type: 'log',
                        level: 'INFO',
                        content: '等待服务器重启，5秒后尝试重新连接...',
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })
                    setTimeout(() => {
                        reconnectAttempts = 0 // 重置重连计数
                        connect()
                    }, 5000)
                } catch (error) {
                    isLoading.value = false
                    message.error('重启服务器失败')
                    console.error('重启服务器错误:', error)
                    logs.value.push({
                        type: 'log',
                        level: 'ERROR',
                        content: '重启服务器失败',
                        timestamp: new Date().toISOString(),
                        tag: 'WebUI'
                    })
                }
            }
        })
    }

    return {
        logs,
        isConnected,
        isLoading,
        filterText,
        filteredLogs,
        connect,
        disconnect,
        restartServer,
        updateFilterText
    }
} 