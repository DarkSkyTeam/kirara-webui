import { http } from '@/utils/http'

export interface LoginResponse {
  access_token: string
}

export const authApi = {
  /**
   * 检查是否首次访问
   */
  checkFirstTime() {
    return http.get<void>('/auth')
  },

  /**
   * 登录或设置密码
   */
  login(password: string) {
    return http.post<LoginResponse>('/auth', { password })
  }
} 