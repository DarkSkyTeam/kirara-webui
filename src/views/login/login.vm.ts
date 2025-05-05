import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormRules } from 'naive-ui'
import { authApi } from '@/api/auth'

export function useLoginViewModel() {
  const router = useRouter()
  const isFirstTime = ref(false)
  const loading = ref(false)
  const formModel = ref({
    password: '',
    confirmPassword: ''
  })

  // 表单验证规则
  const rules: FormRules = {
    password: [
      { required: true, message: '请输入密码' },
      { min: 6, message: '密码长度不能小于6位' }
    ],
    confirmPassword: [
      {
        required: true,
        message: '请确认密码',
        trigger: ['input', 'blur']
      },
      {
        validator: (rule, value) => {
          return value === formModel.value.password
        },
        message: '两次输入的密码不一致',
        trigger: ['input', 'blur']
      }
    ]
  }

  // 检查是否首次访问
  const checkFirstTime = async () => {
    try {
      const { is_first_time } = await authApi.checkFirstTime()
      isFirstTime.value = is_first_time
    } catch (error) {
      if (error instanceof Error && error.message === 'No password set') {
        isFirstTime.value = true
      }
    }
  }

  // 处理登录/设置密码
  const handleSubmit = async () => {
    if (isFirstTime.value && formModel.value.password !== formModel.value.confirmPassword) {
      return
    }

    loading.value = true
    try {
      const { access_token } = await authApi.login(formModel.value.password)
      localStorage.setItem('token', access_token)
      router.push('/')
    } finally {
      loading.value = false
    }
  }

  return {
    isFirstTime,
    loading,
    formModel,
    rules,
    handleSubmit,
    checkFirstTime
  }
}
