<script setup lang="ts">
import { ref, onMounted, h, computed } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage,
  NModal,
  NDivider,
  NScrollbar,
  type FormInst,
  NIcon,
  NTooltip
} from 'naive-ui'
import {
  dispatchApi,
  getRuleTypeLabel,
  type DispatchRule,
  type RuleGroup,
  type SimpleRule
} from '@/api/dispatch'
import { listWorkflows, type WorkflowInfo } from '@/api/workflow'
import DynamicConfigForm from '@/components/form/DynamicConfigForm.vue'
import { Add, Remove, PencilOutline, HelpCircleOutline } from '@vicons/ionicons5'
import { v4 as uuidv4 } from 'uuid'

const message = useMessage()
const rules = ref<DispatchRule[]>([])
const ruleTypes = ref<string[]>([])
const showEditModal = ref(false)
const currentRule = ref<DispatchRule>({
  rule_id: '',
  name: '',
  description: '',
  workflow_id: '',
  priority: 5,
  enabled: true,
  rule_groups: [
    {
      operator: 'or',
      rules: []
    }
  ],
  metadata: {}
})
const configSchema = ref<any>(null)
const isCreate = ref(false)
const workflows = ref<WorkflowInfo[]>([])
const selectedRuleType = ref<string>('')
const selectedRuleGroupIndex = ref<number>(-1)
const selectedRuleIndex = ref<number>(-1)
const showRuleConfigModal = ref(false)

// 表格列定义
const columns = [
  { title: '名称', key: 'name' },
  { title: '描述', key: 'description' },
  {
    title: '工作流',
    key: 'workflow_id',
    render: (row: DispatchRule) => {
      const workflow = workflows.value.find(
        (workflow) => `${workflow.group_id}:${workflow.workflow_id}` === row.workflow_id
      )
      return workflow ? `${workflow.name} (${row.workflow_id})  ` : '未指定'
    }
  },
  {
    title: () =>
      h(
        NTooltip,
        {
          trigger: 'hover',
          placement: 'top'
        },
        {
          trigger: () =>
            h(
              'div',
              { style: { display: 'flex', alignItems: 'center' } },
              {
                default: () => [
                  '优先级',
                  h(
                    NIcon,
                    {},
                    {
                      default: () => h(HelpCircleOutline)
                    }
                  )
                ]
              }
            ),
          default: () =>
            '优先级定义了规则判定的顺序，数值越大优先级越高，会优先被判断。建议根据业务需求合理设置优先级。'
        }
      ),
    key: 'priority'
  },
  {
    title: '状态',
    key: 'enabled',
    render: (row: DispatchRule) => {
      return h(NSwitch, {
        value: row.enabled,
        onUpdateValue: async (value) => {
          try {
            if (value) {
              await dispatchApi.enableRule(row.rule_id)
            } else {
              await dispatchApi.disableRule(row.rule_id)
            }
            await loadRules()
            message.success('操作成功')
          } catch (error) {
            message.error('操作失败')
          }
        }
      })
    }
  },
  {
    title: '操作',
    key: 'actions',
    render: (row: DispatchRule) => {
      return h(NSpace, null, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => editRule(row)
            },
            { default: () => '编辑' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => deleteRule(row.rule_id)
            },
            { default: () => '删除' }
          )
        ]
      })
    }
  }
]

const formRef = ref<FormInst | null>(null)
const validationRules = ref<any>({
  name: [
    { required: true, message: '请输入规则名称' },
    { min: 1, max: 100, message: '规则名称长度应在1-100个字符之间' }
  ],
  workflow_id: [{ required: true, message: '请选择工作流' }],
  priority: [
    { required: true, message: '请输入优先级' },
    { type: 'number', min: 0, max: 100, message: '优先级应在0-100之间' }
  ],
  enabled: [{ required: true, message: '请选择启用状态' }]
})

// 加载规则列表
const loadRules = async () => {
  try {
    const { rules: ruleList } = await dispatchApi.getRules()
    rules.value = ruleList
  } catch (error) {
    message.error('加载规则列表失败')
  }
}

const loadWorkflows = async () => {
  try {
    const { workflows: workflowList } = await listWorkflows()
    workflows.value = workflowList
  } catch (error) {
    message.error('加载工作流列表失败')
  }
}

// 加载规则类型
const loadRuleTypes = async () => {
  try {
    const { types } = await dispatchApi.getRuleTypes()
    ruleTypes.value = types
  } catch (error) {
    message.error('加载规则类型失败')
  }
}

// 加载规则配置模式
const loadConfigSchema = async (type: string) => {
  try {
    const { configSchema: schema } = await dispatchApi.getRuleConfigSchema(type)
    configSchema.value = schema
  } catch (error) {
    message.error('加载配置模式失败')
  }
}

// 创建规则
const createRule = () => {
  isCreate.value = true
  currentRule.value = {
    rule_id: uuidv4(),
    priority: 5,
    enabled: true,
    name: '',
    description: '',
    workflow_id: '',
    rule_groups: [
      {
        operator: 'or',
        rules: []
      }
    ],
    metadata: {}
  }
  showEditModal.value = true
}

// 编辑规则
const editRule = (rule: DispatchRule) => {
  isCreate.value = false
  currentRule.value = { ...rule }
  showEditModal.value = true
}

// 删除规则
const deleteRule = async (ruleId: string) => {
  try {
    await dispatchApi.deleteRule(ruleId)
    await loadRules()
    message.success('删除成功')
  } catch (error) {
    message.error('删除失败')
  }
}

// 保存规则
const saveRule = async (isCreate: boolean) => {
  try {
    const errors = await formRef.value?.validate()
    if (errors?.warnings?.length) {
      message.error('请检查输入内容')
      return
    }
    if (isCreate) {
      await dispatchApi.createRule(currentRule.value)
    } else {
      await dispatchApi.updateRule(currentRule.value.rule_id!, currentRule.value)
    }
    await loadRules()
    showEditModal.value = false
    message.success('保存成功')
  } catch (error) {
    message.error('保存失败:' + (error as Error).message)
  }
}

// 添加规则组
const addRuleGroup = () => {
  if (!currentRule.value.rule_groups) {
    currentRule.value.rule_groups = []
  }
  currentRule.value.rule_groups.push({
    operator: 'or',
    rules: []
  })
}

// 删除规则组
const removeRuleGroup = (index: number) => {
  currentRule.value.rule_groups?.splice(index, 1)
}

// 添加规则
const addRule = (groupIndex: number) => {
  selectedRuleGroupIndex.value = groupIndex
  selectedRuleIndex.value = currentRule.value.rule_groups[groupIndex].rules.length

  // 创建新规则，但不设置类型
  const newRule: SimpleRule = {
    type: '',
    config: {}
  }
  currentRule.value.rule_groups[groupIndex].rules.push(newRule)
}

// 删除规则
const removeRule = (groupIndex: number, ruleIndex: number) => {
  currentRule.value.rule_groups[groupIndex].rules.splice(ruleIndex, 1)
}

// 规则类型选项
const ruleTypeOptions = computed(() =>
  ruleTypes.value.map((type) => ({
    label: getRuleTypeLabel(type),
    value: type
  }))
)

// 规则类型变化时更新配置表单
const handleRuleTypeChange = async (type: string, groupIndex: number, ruleIndex: number) => {
  if (!type) return // 如果用户清空了选择，直接返回

  selectedRuleType.value = type
  selectedRuleGroupIndex.value = groupIndex
  selectedRuleIndex.value = ruleIndex

  // 更新规则类型
  currentRule.value.rule_groups[groupIndex].rules[ruleIndex].type = type
  currentRule.value.rule_groups[groupIndex].rules[ruleIndex].config = {}

  // 加载配置模式并打开配置对话框
  await loadConfigSchema(type)
  showRuleConfigModal.value = true
}

// 确认规则配置
const confirmRuleConfig = (config: any) => {
  if (selectedRuleGroupIndex.value === -1 || !currentRule.value.rule_groups) return

  // 更新规则配置
  currentRule.value.rule_groups[selectedRuleGroupIndex.value].rules[
    selectedRuleIndex.value
  ].config = config
}

// 关闭规则配置对话框
const closeRuleConfigModal = () => {
  showRuleConfigModal.value = false
}

onMounted(async () => {
  await Promise.all([loadRules(), loadRuleTypes(), loadWorkflows()])
})
</script>

<template>
  <div class="dispatch-rules">
    <n-space vertical>
      <n-card title="规则列表" class="dispatch-rules-card">
        <template #header-extra>
          <n-button type="primary" @click="createRule"> 创建规则 </n-button>
        </template>
        <div class="dispatch-rules-description">
          触发规则决定了 Kirara AI 何时会执行工作流，更多介绍请阅读<a
            href="https://kirara-docs.app.lss233.com/guide/configuration/dispatch.html"
            target="_blank"
            >官方文档</a
          >。
        </div>
        <n-data-table :columns="columns" :data="rules" :bordered="false" :single-line="false" />
      </n-card>
      <!-- 编辑规则对话框 -->
      <n-modal
        v-model:show="showEditModal"
        preset="dialog"
        :title="isCreate ? '创建规则' : '编辑规则'"
        style="width: 1200px"
      >
        <div class="rule-edit-container">
          <!-- 基本信息 -->
          <div class="rule-basic-form">
            <n-form label-placement="left" label-width="80" :rules="validationRules" ref="formRef">
              <n-form-item label="名称" required feedback="用于区分不同的规则，必须保持唯一">
                <n-input v-model:value="currentRule.name" placeholder="请输入名称" />
              </n-form-item>
              <n-form-item label="描述" feedback="用于描述规则的用途，方便你理解">
                <n-input
                  v-model:value="currentRule.description"
                  type="textarea"
                  placeholder="请输入描述"
                />
              </n-form-item>
              <n-form-item label="工作流" required feedback="指定触发规则的工作流">
                <n-select
                  v-model:value="currentRule.workflow_id"
                  :options="
                    workflows.map((workflow) => ({
                      label:
                        workflow.name + ' (' + workflow.group_id + ':' + workflow.workflow_id + ')',
                      value: `${workflow.group_id}:${workflow.workflow_id}`
                    }))
                  "
                  placeholder="请选择工作流"
                />
              </n-form-item>
              <n-form-item label="优先级" required feedback="数值越大优先级越高，会优先被判断">
                <n-input-number v-model:value="currentRule.priority" :min="0" :max="100" />
              </n-form-item>
              <n-form-item label="启用状态">
                <n-switch v-model:value="currentRule.enabled" />
              </n-form-item>
            </n-form>
          </div>

          <!-- 触发条件 -->
          <div class="rule-config-form">
            <n-divider vertical />
            <div class="config-form-container">
              <h3 class="config-title">触发条件</h3>
              <n-scrollbar style="max-height: 400px">
                <div class="rule-groups">
                  <div class="rule-group-header">
                    <span class="rule-group-label">当</span>
                  </div>

                  <div
                    v-for="(group, groupIndex) in currentRule.rule_groups"
                    :key="groupIndex"
                    class="rule-group"
                  >
                    <div class="rule-list">
                      <template v-for="(rule, ruleIndex) in group.rules" :key="ruleIndex">
                        <div class="rule-item">
                          <n-select
                            v-model:value="rule.type"
                            :options="ruleTypeOptions"
                            @update:value="
                              (type) => handleRuleTypeChange(type, groupIndex, ruleIndex)
                            "
                            class="rule-type-select"
                            placeholder="请选择规则类型"
                          />
                          <n-button
                            circle
                            tertiary
                            type="info"
                            @click="
                              () => {
                                selectedRuleGroupIndex = groupIndex
                                selectedRuleIndex = ruleIndex
                                selectedRuleType = rule.type
                                loadConfigSchema(rule.type)
                                showRuleConfigModal = true
                              }
                            "
                            :disabled="!rule.type"
                          >
                            <template #icon>
                              <n-icon>
                                <PencilOutline />
                              </n-icon>
                            </template>
                          </n-button>
                          <n-button
                            circle
                            tertiary
                            type="error"
                            @click="removeRule(groupIndex, ruleIndex)"
                          >
                            <template #icon>
                              <n-icon>
                                <Remove />
                              </n-icon>
                            </template>
                          </n-button>
                        </div>
                        <span class="operator">或</span>
                      </template>
                      <n-button dashed class="add-rule-btn" @click="addRule(groupIndex)">
                        <template #icon>
                          <n-icon>
                            <Add />
                          </n-icon>
                        </template>
                        添加条件
                      </n-button>
                    </div>

                    <div class="group-operator">且</div>
                  </div>

                  <n-button
                    dashed
                    block
                    class="add-group-btn"
                    @click="addRuleGroup"
                    :disabled="
                      currentRule.rule_groups[currentRule.rule_groups.length - 1].rules.length === 0
                    "
                  >
                    <template #icon>
                      <n-icon>
                        <Add />
                      </n-icon>
                    </template>
                    添加条件组
                  </n-button>
                </div>
              </n-scrollbar>
            </div>
          </div>
        </div>

        <!-- 规则配置对话框 -->
        <n-modal
          v-model:show="showRuleConfigModal"
          preset="dialog"
          :title="'配置' + getRuleTypeLabel(selectedRuleType) + '规则'"
          style="width: 600px"
        >
          <dynamic-config-form
            v-if="configSchema && selectedRuleGroupIndex >= 0"
            :model-value="
              currentRule.rule_groups[selectedRuleGroupIndex].rules[selectedRuleIndex]?.config || {}
            "
            :schema="configSchema"
            @update:model-value="confirmRuleConfig"
          />
          <template #action>
            <n-button type="primary" @click="closeRuleConfigModal"> 确定 </n-button>
          </template>
        </n-modal>

        <template #action>
          <n-button type="primary" @click="saveRule(isCreate)"> 确定 </n-button>
        </template>
      </n-modal>
    </n-space>
  </div>
</template>

<style scoped>
.dispatch-rules {
  padding: 16px;
}

.dispatch-rules-card {
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dispatch-rules-description {
  margin-bottom: 16px;
}

.rule-edit-container {
  display: flex;
  min-height: 400px;
}

.rule-basic-form {
  flex: 0 0 360px;
  padding-right: 16px;
}

.rule-config-form {
  flex: 1;
  display: flex;
  min-width: 0;
}

.config-form-container {
  flex: 1;
  padding-left: 16px;
}

.config-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--n-text-color);
}

.rule-groups {
  margin-bottom: 16px;
}

.rule-group-header {
  margin-bottom: 16px;
}

.rule-group-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--n-text-color);
}

.rule-group {
  background: var(--n-card-color);
  border-radius: 8px;
}

.rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--n-color-modal);
  padding: 4px;
  border-radius: 4px;
}

.rule-type-select {
  width: 200px;
}

.operator {
  color: var(--n-text-color-3);
  font-weight: 500;
  padding: 0 8px;
}

.group-operator {
  margin-top: 16px;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.add-group-btn {
  margin-top: 16px;
}

:deep(.n-form-item .n-form-item-label) {
  font-weight: 500;
}

:deep(.n-input-number) {
  width: 100%;
}
</style>
