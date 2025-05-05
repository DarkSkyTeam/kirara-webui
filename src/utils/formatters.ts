/**
 * 格式化大数字为紧凑表示形式 (例如 1.2k, 3.4M).
 * 使用 Intl.NumberFormat 以获得更好的本地化和准确性。
 *
 * @param num 要格式化的数字或可以解析为数字的字符串。
 * @param options Intl.NumberFormat 的选项，允许自定义格式。
 * @returns 格式化后的字符串，如果输入无效则返回 'N/A'。
 */
export const formatLargeNumber = (
  num: number | string | undefined | null,
  options?: Intl.NumberFormatOptions
): string => {
  // 尝试将输入转换为数字
  const numericValue = typeof num === 'string' ? parseFloat(num) : num

  // 检查是否为有效数字
  if (typeof numericValue !== 'number' || isNaN(numericValue)) {
    // 对于无效输入返回 'N/A' 或其他占位符
    return 'N/A'
  }

  // 默认格式化选项：紧凑表示法，最多一位小数
  const defaultOptions: Intl.NumberFormatOptions = {
    notation: 'compact',
    maximumFractionDigits: 1,
    minimumFractionDigits: 0, // 允许整数（例如 1k 而不是 1.0k）
    ...options // 允许调用者覆盖默认选项
  }

  try {
    return new Intl.NumberFormat('en-US', defaultOptions).format(numericValue)
  } catch (error) {
    console.error('格式化数字时出错:', error)
    // 发生错误时回退到简单的字符串转换
    return numericValue.toString()
  }
}
