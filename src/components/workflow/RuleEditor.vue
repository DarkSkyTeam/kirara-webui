<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  NCard,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NInputNumber,
  NSwitch,
  useMessage,
  NButton
} from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const props = defineProps<{
  groupId: string
  workflowId: string
}>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)

const ruleTypes = [
  { label: '前缀匹配', value: 'prefix' },
  { label: '关键词匹配', value: 'keyword' },
  { label: '正则匹配', value: 'regex' }
]

const formValue = ref({
  rule_id: '',
  name: '',
  description: '',
  type: 'prefix',
  pattern: '',
  keywords: '',
  priority: 5,
  enabled: true
})

const rules: FormRules = {
  rule_id: {
    required: true,
    message: '请输入规则ID',
    trigger: 'blur'
  },
  name: {
    required: true,
    message: '请输入规则名称',
    trigger: 'blur'
  },
  type: {
    required: true,
    message: '请选择规则类型',
    trigger: 'change'
  },
  pattern: {
    required: true,
    message: '请输入匹配模式',
    trigger: 'blur'
  }
}

const handleSubmit = (e: MouseEvent) => {
  e.preventDefault()
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      try {
        // TODO: 保存规则
        message.success('保存成功')
      } catch (error) {
        message.error('保存失败')
      }
    }
  })
}
</script>

<template>
  <NCard title="触发规则" class="h-full">
    <NForm
      ref="formRef"
      :model="formValue"
      :rules="rules"
      label-placement="left"
      label-width="80"
      require-mark-placement="right-hanging"
    >
      <NFormItem label="规则ID" path="rule_id">
        <NInput v-model:value="formValue.rule_id" placeholder="请输入规则ID" />
      </NFormItem>

      <NFormItem label="规则名称" path="name">
        <NInput v-model:value="formValue.name" placeholder="请输入规则名称" />
      </NFormItem>

      <NFormItem label="规则描述" path="description">
        <NInput
          v-model:value="formValue.description"
          type="textarea"
          placeholder="请输入规则描述"
        />
      </NFormItem>

      <NFormItem label="规则类型" path="type">
        <NSelect v-model:value="formValue.type" :options="ruleTypes" placeholder="请选择规则类型" />
      </NFormItem>

      <NFormItem
        v-if="formValue.type === 'prefix' || formValue.type === 'regex'"
        label="匹配模式"
        path="pattern"
      >
        <NInput
          v-model:value="formValue.pattern"
          :placeholder="formValue.type === 'prefix' ? '请输入前缀' : '请输入正则表达式'"
        />
      </NFormItem>

      <NFormItem v-if="formValue.type === 'keyword'" label="关键词" path="keywords">
        <NInput
          v-model:value="formValue.keywords"
          type="textarea"
          placeholder="请输入关键词，多个关键词用逗号分隔"
        />
      </NFormItem>

      <NFormItem label="优先级" path="priority">
        <NInputNumber
          v-model:value="formValue.priority"
          :min="0"
          :max="100"
          placeholder="请输入优先级"
        />
      </NFormItem>

      <NFormItem label="是否启用" path="enabled">
        <NSwitch v-model:value="formValue.enabled" />
      </NFormItem>

      <div class="flex justify-end mt-4">
        <NButton type="primary" @click="handleSubmit">保存规则</NButton>
      </div>
    </NForm>
  </NCard>
</template>
