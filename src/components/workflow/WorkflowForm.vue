<template>
  <NForm
    ref="formRef"
    :model="form"
    :rules="rules"
    label-placement="left"
    label-width="80"
    require-mark-placement="right-hanging"
  >
    <NFormItem :label="$t('工作流ID')" path="workflowId">
      <NInput v-model:value="form.workflowId" :placeholder="$t('请输入工作流ID，格式为 group:workflow')" />
    </NFormItem>
    <NFormItem :label="$t('名称')" path="name">
      <NInput v-model:value="form.name" :placeholder="$t('请输入工作流名称')" />
    </NFormItem>
    <NFormItem :label="$t('描述')" path="description">
      <NInput v-model:value="form.description" type="textarea" :placeholder="$t('请输入工作流描述')" />
    </NFormItem>
  </NForm>
</template>

<script setup lang="ts">
import { t } from '@/i18n'
import { ref, defineProps, defineExpose } from 'vue'
import { NForm, NFormItem, NInput } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type {
  FormValidate,
  FormValidateCallback,
  ShouldRuleBeApplied
} from 'naive-ui/es/form/src/interface'

interface WorkflowFormData {
  workflowId: string
  name: string
  description: string
}

const props = defineProps<{
  initialData?: Partial<WorkflowFormData>
}>()

const formRef = ref<FormInst | null>(null)
const form = ref<WorkflowFormData>({
  workflowId: props.initialData?.workflowId || '',
  name: props.initialData?.name || '',
  description: props.initialData?.description || ''
})

const rules = {
  workflowId: {
    required: true,
    message: t('请输入工作流ID'),
    trigger: 'blur',
    validator: (rule: any, value: string) => {
      if (!value) return false
      const parts = value.split(':')
      if (parts.length !== 2) {
        throw new Error(t('工作流ID格式必须为 group:workflow'))
      }
      if (!parts[0] || !parts[1]) {
        throw new Error(t('group 和 workflow 都不能为空'))
      }
      return true
    }
  },
  name: {
    required: true,
    message: t('请输入工作流名称'),
    trigger: 'blur'
  }
}

const validate: FormValidate = async (
  callback?: FormValidateCallback,
  shouldRuleBeApplied?: ShouldRuleBeApplied
) => {
  return (await formRef.value?.validate(callback, shouldRuleBeApplied)) ?? { warnings: [] }
}

const getFormData = () => {
  return form.value
}

defineExpose({
  validate,
  getFormData
})
</script>
