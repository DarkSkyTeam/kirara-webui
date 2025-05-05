import { ref, onUnmounted } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import type { FormRules, FormItemRule } from 'naive-ui'

export interface FrpcForm {
  enable: boolean
  server_addr: string
  server_port: number
  token: string
  remote_port: number
  custom_domains: string
}

export interface FrpcStatus {
  is_running: boolean
  is_installed: boolean
  config: FrpcForm
  version: string
  remote_url: string
  error_message: string
  download_progress: number
}

export function useFrpcViewModel() {
  const loading = ref(false)
  const downloading = ref(false)
  const message = useMessage()
  const status = ref<FrpcStatus | null>(null)
  const downloadProgress = ref(0)
  const downloadStatus = ref<'idle' | 'downloading' | 'completed' | 'error'>('idle')
  const downloadErrorMessage = ref('')
  let eventSource: EventSource | null = null

  const formData = ref<FrpcForm>({
    enable: false,
    server_addr: '',
    server_port: 7000,
    token: '',
    remote_port: 0,
    custom_domains: ''
  })

  const rules: FormRules = {
    server_addr: {
      required: true,
      message: '请输入服务器地址',
      trigger: ['input', 'blur']
    },
    server_port: [
      {
        validator: (rule: FormItemRule, value: number) => {
          return value > 0 && value < 65536
        }
      }
    ],
    remote_port: [
      {
        validator: (rule: FormItemRule, value: number) => {
          return (
            (value >= 0 && value < 65536) || new Error('端口号必须在0-65535之间，0表示随机分配')
          )
        }
      }
    ]
  }

  const fetchStatus = async () => {
    loading.value = true
    try {
      const response = await http.get<FrpcStatus>('/frpc/status')
      status.value = response
      formData.value = response.config
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('获取FRP状态失败')
      }
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      const response = await http.post<FrpcStatus>('/frpc/config', formData.value)
      status.value = response
      message.success('配置已保存')
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('保存配置失败')
      }
    } finally {
      loading.value = false
    }
  }

  const startFrpc = async () => {
    loading.value = true
    try {
      const response = await http.post<FrpcStatus>('/frpc/start')
      status.value = response
      message.success('FRP服务已启动')
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('启动FRP服务失败')
      }
    } finally {
      loading.value = false
    }
  }

  const stopFrpc = async () => {
    loading.value = true
    try {
      const response = await http.post<FrpcStatus>('/frpc/stop')
      status.value = response
      message.success('FRP服务已停止')
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('停止FRP服务失败')
      }
    } finally {
      loading.value = false
    }
  }

  const downloadFrpc = async () => {
    // 如果已经在下载中，不重复下载
    if (downloading.value) return

    // 重置下载状态
    downloading.value = true
    downloadStatus.value = 'downloading'
    downloadProgress.value = 0
    downloadErrorMessage.value = ''

    // 关闭之前的连接
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    try {
      // 获取当前协议和主机
      const host = window.location.host
      const baseUrl = `${window.location.protocol}//${host}/backend-api/api`

      // 使用fetch替代EventSource实现SSE
      const response = await http.fetch(`/frpc/download`, {
        credentials: 'include',
        headers: {
          Accept: 'text/event-stream'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`)
      }

      // 获取响应的reader
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      // 用于解析SSE消息的函数
      const processSSE = async () => {
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              console.log('SSE流已关闭')
              break
            }

            // 将Uint8Array转换为字符串并添加到缓冲区
            buffer += new TextDecoder().decode(value)

            // 处理缓冲区中的所有完整消息
            const lines = buffer.split('\n\n')
            buffer = lines.pop() || '' // 保留最后一个不完整的消息

            for (const line of lines) {
              if (line.trim() === '') continue

              // 提取data字段
              const dataMatch = line.match(/^data: (.+)$/m)
              if (dataMatch && dataMatch[1]) {
                try {
                  const data = JSON.parse(dataMatch[1])
                  downloadProgress.value = data.progress
                  downloadStatus.value = data.status

                  if (data.error_message) {
                    downloadErrorMessage.value = data.error_message
                  }

                  // 如果下载完成或出错，关闭连接
                  if (data.status === 'completed') {
                    message.success('FRP 客户端下载成功')
                    fetchStatus() // 刷新状态
                    downloading.value = false // 更新下载状态
                    reader.cancel()
                    break
                  } else if (data.status === 'error') {
                    message.error(data.error_message || '下载 FRP 客户端失败')
                    downloading.value = false
                    reader.cancel()
                    break
                  }
                } catch (error) {
                  console.error('解析 SSE 消息失败', error)
                }
              }
            }
          }
        } catch (error) {
          console.error('处理SSE流时出错', error)
          downloadStatus.value = 'error'
          downloadErrorMessage.value = '处理下载进度数据失败'
          message.error('处理下载进度数据失败')
          downloading.value = false
        }
      }

      // 开始处理SSE流
      processSSE()
    } catch (error: any) {
      downloadStatus.value = 'error'
      downloadErrorMessage.value = error.message || '下载 FRP 客户端失败'
      message.error(error.message || '下载 FRP 客户端失败')
      downloading.value = false
    }
  }

  // 组件卸载时不再需要关闭EventSource
  onUnmounted(() => {
    // 如果有活跃的下载，可以在这里取消
    if (downloading.value) {
      downloading.value = false
    }
  })

  return {
    loading,
    downloading,
    status,
    formData,
    rules,
    downloadProgress,
    downloadStatus,
    downloadErrorMessage,
    fetchStatus,
    handleSubmit,
    startFrpc,
    stopFrpc,
    downloadFrpc
  }
}
