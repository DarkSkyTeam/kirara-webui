import { t } from '@/i18n'
import { ref } from 'vue'
import { http } from '@/utils/http'
import { useMessage } from 'naive-ui'
import type { FormRules } from 'naive-ui'
import router from '@/router'

export interface PasswordForm {
  old_password: string
  new_password: string
  confirm_password: string
}

export function usePasswordViewModel() {
  const loading = ref(false)
  const message = useMessage()

  const formData = ref<PasswordForm>({
    old_password: '',
    new_password: '',
    confirm_password: ''
  })

  const rules: FormRules = {
    old_password: {
      required: true,
      message: t('请输入当前密码'),
      trigger: 'blur'
    },
    new_password: {
      required: true,
      message: t('请输入新密码'),
      trigger: 'blur'
    },
    confirm_password: {
      required: true,
      message: t('请确认新密码'),
      trigger: 'blur',
      validator: (rule: any, value: string) => {
        return value === formData.value.new_password || new Error(t('两次输入的密码不一致'))
      }
    }
  }

  const handleSubmit = async () => {
    if (formData.value.new_password !== formData.value.confirm_password) {
      message.error(t('两次输入的密码不一致'))
      return
    }
    loading.value = true
    try {
      const response: { error?: boolean; message?: string } = await http.post<{
        error?: boolean
        message?: string
      }>('/auth/change-password', {
        old_password: formData.value.old_password,
        new_password: formData.value.new_password
      })
      console.log(response)
      if (response.error) {
        message.error(response.message || t('密码修改失败'))
        return
      }
      message.success(t('密码修改成功'))
      formData.value = {
        old_password: '',
        new_password: '',
        confirm_password: ''
      }
      // 刷新下
      router.push('/login')
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message)
      } else {
        message.error(t('密码修改失败'))
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    formData,
    rules,
    handleSubmit
  }
}
