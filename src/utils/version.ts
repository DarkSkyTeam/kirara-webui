import { compare as semverCompare } from 'semver'

export const version = {
  /**
   * 获取当前前端版本
   */
  getCurrentVersion(): string {
    return import.meta.env.VITE_APP_VERSION.replace(/^v/, '') || '0.0.0'
  },

  /**
   * 比较两个版本号
   * @param version1 版本号1
   * @param version2 版本号2
   * @returns 如果 version1 > version2 返回 1，如果 version1 < version2 返回 -1，如果相等返回 0
   */
  compare(version1: string, version2: string): number {
    try {
      const result = semverCompare(version1, version2)
      return result === null ? 0 : result
    } catch (error) {
      console.error('版本号格式错误', error)
      return 0
    }
  }
}
