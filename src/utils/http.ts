// import { useMessage } from 'naive-ui'

const BASE_URL = '/backend-api/api'

class Http {
  //   private message = useMessage()

  private async request<T>(path: string, config: RequestInit): Promise<T> {
    try {
      let actualPath = path
      let headers: Record<string, any> = {}
      if (!path.startsWith('http://') && !path.startsWith('https://')) {
        actualPath = `${BASE_URL}${path}`
        headers = {
          'Content-Type': 'application/json',
          ...headers,
          ...config.headers,
          ...this.getAuthHeader(),
        }
        config = {
          ...config,
          credentials: 'include'
        }
      }
      const response = await fetch(actualPath, {
        ...config,
        headers: headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '请求失败')
      }

      return data as T
    } catch (error) {
      const message = error instanceof Error ? error.message : '请求失败'
      //   this.message.error(message)
      throw error
    }
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token')
  }

  private getAuthHeader(): HeadersInit {
    const token = this.getAuthToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  get<T>(path: string, config: Omit<RequestInit, 'method'> = {}) {
    return this.request<T>(path, { ...config, method: 'GET' })
  }

  post<T>(path: string, data?: any, config: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.request<T>(path, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  put<T>(path: string, data?: any, config: Omit<RequestInit, 'method' | 'body'> = {}) {
    return this.request<T>(path, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  delete<T>(path: string, config: Omit<RequestInit, 'method'> = {}) {
    return this.request<T>(path, { ...config, method: 'DELETE' })
  }

  url(path: string) {
    return `${BASE_URL}${path}`
  }
}

export const http = new Http() 