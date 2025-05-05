import { ref, h } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'

export interface TracingForm {
  llm_tracing_content: boolean
}

export interface TracingConfig {
  tracing: {
    llm_tracing_content: boolean
  }
}

export function useTracingViewModel() {
  const loading = ref(false)
  const message = useMessage()
  const dialog = useDialog()

  const formData = ref<TracingForm>({
    llm_tracing_content: false
  })

  const fetchConfig = async () => {
    loading.value = true
    try {
      const response = await http.get<TracingConfig>('/system/config')
      formData.value = {
        llm_tracing_content: response.tracing.llm_tracing_content
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error('获取配置失败')
      }
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      if (formData.value.llm_tracing_content) {
        dialog.warning({
          title: 'LLM 内容追踪功能启用告知书',
          style: {
            width: '550px',
            fontSize: '14px'
          },
          content: () =>
            h(
              'div',
              { style: { whiteSpace: 'pre-line' } },
              `
您即将启用 LLM 内容追踪功能。请您仔细阅读以下条款，充分了解相关风险与责任：

1. 功能说明：
   - 启用本功能后，系统将完整记录所有 LLM 交互请求及响应内容，包括用户输入的原始请求内容、系统生成的响应内容以及交互时间等元数据。
   - 所有记录数据将至少保留 30 个自然日。

2. 风险提示：
   - 数据可能包含敏感信息，如个人身份信息、商业机密等。
   - 数据存在安全风险，包括但不限于未经授权的访问、系统漏洞导致的数据泄露等。

3. 用户义务：
   - 若您将服务提供给第三方使用，您必须在用户协议中明确告知数据记录条款，并取得用户对数据记录的明确同意。
   - 您承诺遵守相关法律法规，建立数据访问审计机制，并定期进行安全风险评估。

4. 免责声明：
   - 本功能产生的数据均保存在您的服务器上，Kirara AI 开发团队不处理或访问任何记录数据，亦不承担因启用本功能导致的任何法律责任。
   - 因您未履行告知义务、安全防护措施不足或违反相关法律法规而导致的损失，由您全权承担。

请您确认已充分理解并接受以上条款，并承诺对启用本功能后的数据安全负责。
        `
            ),
          positiveText: '确认开启',
          negativeText: '取消操作',
          onPositiveClick: async () => {
            await saveConfig()
          },
          onNegativeClick: () => {
            formData.value.llm_tracing_content = false
            loading.value = false
          }
        })
      } else {
        await saveConfig()
      }
    } catch (error) {
      loading.value = false
    }
  }

  const saveConfig = async () => {
    try {
      await http.post('/system/config/tracing', {
        llm_tracing_content: formData.value.llm_tracing_content
      })
      message.success('追踪设置已保存')
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

  return {
    loading,
    formData,
    fetchConfig,
    handleSubmit
  }
}
