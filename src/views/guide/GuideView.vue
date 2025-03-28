<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NSpace,
  NSteps,
  NStep,
  NGrid,
  NGi,
  NStatistic,
  NButton,
  useMessage,
  NIcon
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { ArrowForwardOutline } from '@vicons/ionicons5'
import LLMStatistics from '@/components/LLMStatistics.vue'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

// 计算每个步骤的完成状态
const stepsStatus = computed(() => {
  // 从 localStorage 获取已完成的步骤
  const completedSteps = JSON.parse(localStorage.getItem('completedSteps') || '{}')
  
  const steps = [
    {
      key: 'plugins',
      completed: completedSteps.plugins,
      title: '浏览插件市场',
      description: '发现并安装适合您需求的插件',
      path: '/plugins/market'
    },
    {
      key: 'im',
      completed: completedSteps.im,
      title: '添加 IM',
      description: '连接您常用的聊天平台',
      path: '/im'
    },
    {
      key: 'llm',
      completed: completedSteps.llm,
      title: '添加 LLM',
      description: '连接 AI 模型服务',
      path: '/llm'
    },
    {
      key: 'dispatch',
      completed: completedSteps.dispatch,
      title: '了解调度规则',
      description: '学习如何召唤和使用 Bot',
      path: '/workflow/dispatch-rules'
    },
    {
      key: 'workflow',
      completed: completedSteps.workflow,
      title: '自定义工作流',
      description: '打造专属于您的 AI 助手',
      path: '/workflow'
    }
  ]
  
  return steps
})

// 计算当前应该进行的步骤
const currentStep = computed(() => {
  return stepsStatus.value.findIndex(step => !step.completed)
})

const handleStepClick = (step: number, path: string) => {
  // 标记当前步骤为已完成
  const completedSteps = JSON.parse(localStorage.getItem('completedSteps') || '{}')
  completedSteps[stepsStatus.value[step].key] = true
  localStorage.setItem('completedSteps', JSON.stringify(completedSteps))
  
  // 跳转到目标页面
  router.push(path)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal':
      return 'var(--success-color)'
    case 'warning':
      return 'var(--warning-color)'
    case 'error':
      return 'var(--error-color)'
    default:
      return 'var(--error-color)'
  }
}
</script>

<template>
  <div class="guide-container">
    <n-space vertical size="large">
      <!-- 引导步骤 -->
      <n-card title="快速开始" :bordered="false" class="steps-card" v-if="appStore.systemStatus.status === 'normal'">
        <n-steps :current="currentStep" class="guide-steps">
          <n-step v-for="(step, index) in stepsStatus" :key="index" :title="step.title" :description="step.description"
            :status="step.completed ? 'finish' : index === currentStep ? 'process' : 'wait'">
            <template #default>
              <div class="step-content">
                <div class="step-description">{{ step.description }}</div>
                <n-button text type="primary" @click="handleStepClick(index, step.path)"
                  :disabled="index !== currentStep && !step.completed" v-if="index === currentStep" class="step-button">
                  立刻前往
                  <template #icon>
                    <n-icon>
                      <ArrowForwardOutline />
                    </n-icon>
                  </template>
                </n-button>
              </div>
            </template>
          </n-step>
        </n-steps>
      </n-card>
      
      <!-- 系统状态卡片 -->
      <n-card title="系统概览" :bordered="false" class="status-card">
        <n-grid :cols="5" :x-gap="12" responsive="screen">
          <n-gi>
            <n-statistic label="已接入 IM" :value="appStore.systemStatus.activeAdapters" class="statistic-item" />
          </n-gi>
          <n-gi>
            <n-statistic label="已接入 LLM" :value="appStore.systemStatus.activeBackends" class="statistic-item" />
          </n-gi>
          <n-gi>
            <n-statistic label="已安装插件" :value="appStore.systemStatus.loadedPlugins" class="statistic-item" />
          </n-gi>
          <n-gi>
            <n-statistic label="工作流数量" :value="appStore.systemStatus.workflowCount" class="statistic-item" />
          </n-gi>
          <n-gi>
            <n-statistic label="系统状态" :value="appStore.systemStatus.status === 'normal' ? '正常' : '异常'"
              :value-style="{ color: getStatusColor(appStore.systemStatus.status) }" class="statistic-item" />
          </n-gi>
        </n-grid>
      </n-card>
      
      <!-- LLM 统计信息卡片 -->
      <LLMStatistics />
    </n-space>
  </div>
</template>

<style scoped>
.guide-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.status-card {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.steps-card {
  background: var(--card-bg-color);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 24px;
}

.guide-steps {
  margin: 20px 0;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-description {
  color: var(--text-color-secondary);
}

.step-button {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 4px;
}

.statistic-item {
  padding: 16px;
  border-radius: var(--border-radius-small);
  transition: background-color 0.3s;
}

.statistic-item:hover {
  background-color: rgba(64, 128, 255, 0.05);
}

:deep(.n-step) {
  padding: 20px 0;
}

:deep(.n-step.n-step--finish) {
  .n-step-indicator {
    background-color: var(--success-color);
    border-color: var(--success-color);
  }
}

:deep(.n-step.n-step--process) {
  .n-step-indicator {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
  }
}

:deep(.n-step.n-step--wait) {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .guide-container {
    padding: 16px;
  }
  
  :deep(.n-grid) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.status-card :deep(.n-statistic) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: var(--border-radius-small);
  transition: all 0.3s ease;
}

.status-card :deep(.n-statistic:hover) {
  background-color: rgba(99, 102, 241, 0.05);
  transform: translateY(-2px);
}

.status-card :deep(.n-progress-circle) {
  width: 80px !important;
  height: 80px !important;
}
</style>