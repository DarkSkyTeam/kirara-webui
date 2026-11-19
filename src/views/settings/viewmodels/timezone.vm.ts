import { t } from '@/i18n'
import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage, useDialog } from 'naive-ui'
import type { FormRules } from 'naive-ui'

export interface TimezoneForm {
  timezone: string
}

export interface SystemConfig {
  system: {
    timezone: string
  }
}

export function useTimezoneViewModel() {
  const loading = ref(false)
  const message = useMessage()
  const dialog = useDialog()

  // 常用时区列表
  const timezoneOptions = ref([
    { label: t('亚洲/上海 (UTC+8)'), value: 'Asia/Shanghai' },
    { label: t('亚洲/香港 (UTC+8)'), value: 'Asia/Hong_Kong' },
    { label: t('亚洲/东京 (UTC+9)'), value: 'Asia/Tokyo' },
    { label: t('亚洲/新加坡 (UTC+8)'), value: 'Asia/Singapore' },
    { label: t('欧洲/伦敦 (UTC+0)'), value: 'Europe/London' },
    { label: t('欧洲/巴黎 (UTC+1)'), value: 'Europe/Paris' },
    { label: t('美国/纽约 (UTC-5)'), value: 'America/New_York' },
    { label: t('美国/洛杉矶 (UTC-8)'), value: 'America/Los_Angeles' },
    { label: t('澳大利亚/悉尼 (UTC+10)'), value: 'Australia/Sydney' }
  ])

  const formData = ref<TimezoneForm>({
    timezone: 'Asia/Shanghai'
  })

  const rules: FormRules = {
    timezone: {
      required: true,
      message: t('请选择时区'),
      trigger: 'blur'
    }
  }

  const fetchConfig = async () => {
    loading.value = true
    try {
      const response = await http.get<SystemConfig>('/system/config')
      formData.value = {
        timezone: response.system.timezone
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error(t('获取配置失败'))
      }
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    loading.value = true
    try {
      dialog.warning({
        title: t('修改确认'),
        content: t('修改时区设置将影响系统的时间显示，确定要修改吗？'),
        positiveText: t('确定'),
        negativeText: t('取消'),
        onPositiveClick: async () => {
          try {
            await http.post('/system/config/system', {
              timezone: formData.value.timezone
            })
            message.success(t('时区设置已保存'))
          } catch (error: any) {
            if (error.response?.data?.message) {
              message.error(error.response.data.message)
            } else {
              message.error(t('保存配置失败'))
            }
          }
        }
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    formData,
    rules,
    timezoneOptions,
    fetchConfig,
    handleSubmit
  }
}
