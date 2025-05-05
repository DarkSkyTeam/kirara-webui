import { http } from '@/utils/http'

export interface SimpleRule {
  type: string
  config: Record<string, any> // 规则类型特定的配置
}

export interface RuleGroup {
  operator: 'and' | 'or'
  rules: SimpleRule[]
}

export interface DispatchRule {
  rule_id: string
  name: string
  description: string
  workflow_id: string
  priority: number
  enabled: boolean
  rule_groups: RuleGroup[] // 规则组列表，组之间是 AND 关系
  metadata: Record<string, any> // 其他元数据
}

export interface DispatchRuleConfigSchema {
  configSchema: Record<string, any>
  error?: string
}

export const dispatchApi = {
  // 获取所有可用的规则类型
  getRuleTypes: () => {
    return http.get<{ types: string[] }>('/dispatch/types')
  },

  // 获取所有规则
  getRules: () => {
    return http.get<{ rules: DispatchRule[] }>('/dispatch/rules')
  },

  // 获取规则配置模式
  getRuleConfigSchema: (type: string) => {
    return http.get<DispatchRuleConfigSchema>(`/dispatch/types/${type}/config-schema`)
  },

  // 创建规则
  createRule: (rule: Partial<DispatchRule>) => {
    return http.post<{ rule: DispatchRule }>('/dispatch/rules', rule)
  },

  // 更新规则
  updateRule: (ruleId: string, rule: Partial<DispatchRule>) => {
    return http.put<{ rule: DispatchRule }>(`/dispatch/rules/${ruleId}`, rule)
  },

  // 删除规则
  deleteRule: (ruleId: string) => {
    return http.delete(`/dispatch/rules/${ruleId}`)
  },

  // 启用规则
  enableRule: (ruleId: string) => {
    return http.post(`/dispatch/rules/${ruleId}/enable`)
  },

  // 禁用规则
  disableRule: (ruleId: string) => {
    return http.post(`/dispatch/rules/${ruleId}/disable`)
  }
}

const _ruleTypeLabels = {
  prefix: '以……开头',
  regex: '正则表达式',
  keyword: '包含……词',
  random: '以……概率',
  sender: '发送者为……',
  sender_mismatch: '发送者不为……',
  bot_mention: '被@',
  chat_type: '聊天类型',
  im_instance: 'IM实例',
  fallback: '任意输入'
}
export const getRuleTypeLabel = (type: string) => {
  return _ruleTypeLabels[type as keyof typeof _ruleTypeLabels] || type
}
