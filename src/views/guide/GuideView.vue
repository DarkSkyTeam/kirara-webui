<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
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
  NIcon,
  NProgress,
  NTooltip,
  NRow,
  NCol,
  NDivider
} from 'naive-ui'
import { useAppStore } from '@/stores/app'
import { 
  ArrowForwardOutline, 
  CloseCircleOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  ServerOutline,
  ExtensionPuzzleOutline,
  ChatbubblesOutline,
  AppsOutline,
  TimeOutline,
  HardwareChipOutline
} from '@vicons/ionicons5'
import LLMStatistics from '@/components/LLMStatistics.vue'

const router = useRouter()
const appStore = useAppStore()
const message = useMessage()

// 控制引导卡片的显示
const showGuide = ref(localStorage.getItem('hideGuide') !== 'true')

// 关闭引导卡片
const hideGuide = () => {
  showGuide.value = false
  localStorage.setItem('hideGuide', 'true')
}

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

// 计算完成进度
const completionProgress = computed(() => {
  const total = stepsStatus.value.length
  const completed = stepsStatus.value.filter(step => step.completed).length
  return Math.round((completed / total) * 100)
})

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'normal':
      return CheckmarkCircleOutline
    case 'warning':
      return AlertCircleOutline
    default:
      return CloseCircleOutline
  }
}

// 添加缺失的工具函数
const getCPUColor = (usage: number) => {
  if (usage >= 90) return 'var(--error-color)'
  if (usage >= 70) return 'var(--warning-color)'
  return 'var(--success-color)'
}

const getMemoryColor = (usage: number) => {
  if (usage >= 90) return 'var(--error-color)'
  if (usage >= 70) return 'var(--warning-color)'
  return 'var(--success-color)'
}

const getRailColor = () => {
  return 'rgba(0, 0, 0, 0.04)'
}

// 计算是否所有步骤都已完成
const isAllCompleted = computed(() => {
  return stepsStatus.value.every(step => step.completed)
})

// 解析运行时间
const startTime = ref(Date.now() - appStore.systemStatus.uptime * 1000)
const currentTime = ref(Date.now())
const parseUptime = computed(() => {
  // 计算当前的运行时间（秒）
  const uptimeSeconds = Math.floor((currentTime.value - startTime.value) / 1000)
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const seconds = uptimeSeconds % 60
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟${seconds}秒`
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟${seconds}秒`
  } else if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`
  }
  return `${seconds}秒`
})

const timer = ref(0)
// 每秒更新当前时间
onMounted(() => {
  timer.value = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer.value)
})

// 当系统状态更新时，重新计算启动时间
watch(() => appStore.systemStatus.uptime, (newUptime) => {
  startTime.value = Date.now() - newUptime * 1000
})
</script>

<template>
  <div class="guide-container">
    <n-space vertical :size="16">
      <!-- 快速开始引导 -->
      <n-card v-if="showGuide && !isAllCompleted" title="快速开始" :bordered="false" class="guide-card">
        <template #header-extra>
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-button circle tertiary type="error" size="small" @click="hideGuide">
                <template #icon>
                  <n-icon><CloseCircleOutline /></n-icon>
                </template>
              </n-button>
            </template>
            隐藏引导
          </n-tooltip>
        </template>
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

      <!-- 系统状态概览卡片 -->
      <n-card :bordered="false" class="status-overview-card">
        <n-grid cols="1 s:2 m:4" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
          <!-- 运行时长 -->
          <n-gi>
            <div class="status-item">
              <div class="status-icon uptime">
                <n-icon size="24">
                  <TimeOutline />
                </n-icon>
              </div>
              <div class="status-info">
                <div class="status-label">运行时长</div>
                <div class="status-value">{{ parseUptime }}</div>
              </div>
            </div>
          </n-gi>
          
          <!-- 已接入 IM -->
          <n-gi>
            <div class="status-item">
              <div class="status-icon chat">
                <n-icon size="24">
                  <ChatbubblesOutline />
                </n-icon>
              </div>
              <div class="status-info">
                <div class="status-label">已接入 IM</div>
                <div class="status-value">{{ appStore.systemStatus.activeAdapters }}</div>
              </div>
            </div>
          </n-gi>
          
          <!-- 已接入 LLM -->
          <n-gi>
            <div class="status-item">
              <div class="status-icon brain">
                <n-icon size="24">
                  <AppsOutline />
                </n-icon>
              </div>
              <div class="status-info">
                <div class="status-label">已接入 LLM</div>
                <div class="status-value">{{ appStore.systemStatus.activeBackends }}</div>
              </div>
            </div>
          </n-gi>
          
          <!-- 已安装插件 -->
          <n-gi>
            <div class="status-item">
              <div class="status-icon plugin">
                <n-icon size="24">
                  <ExtensionPuzzleOutline />
                </n-icon>
              </div>
              <div class="status-info">
                <div class="status-label">已安装插件</div>
                <div class="status-value">{{ appStore.systemStatus.loadedPlugins }}</div>
              </div>
            </div>
          </n-gi>
        </n-grid>
      </n-card>

      <!-- 系统负载和系统信息 -->
      <n-grid cols="1 s:1 m:2 l:2" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
        <!-- 系统负载卡片 -->
        <n-gi>
          <n-card :bordered="false" class="system-load-card" title="系统负载">
            <div class="load-container">
              <!-- CPU 使用率 -->
              <div class="load-item">
                <div class="load-info">
                  <div class="load-title">
                    <n-icon size="18"><HardwareChipOutline /></n-icon>
                    <span>CPU 使用率</span>
                  </div>
                  <div class="load-value">{{ Math.round(appStore.systemStatus.cpuUsage) }}%</div>
                  <div class="load-progress">
                    <n-progress type="line" 
                      :percentage="Math.round(appStore.systemStatus.cpuUsage)" 
                      :color="getCPUColor(appStore.systemStatus.cpuUsage)"
                      :rail-color="getRailColor()"
                      :height="8"
                      :border-radius="4"
                      class="resource-progress" />
                  </div>
                </div>
              </div>
              
              <n-divider vertical />
              
              <!-- 内存使用率 -->
              <div class="load-item">
                <div class="load-info">
                  <div class="load-title">
                    <n-icon size="18"><ServerOutline /></n-icon>
                    <span>内存使用率</span>
                  </div>
                  <div class="load-value">{{ Math.round(appStore.systemStatus.memoryUsage.percent * 100) }}%</div>
                  <div class="load-progress">
                    <n-progress type="line" 
                      :percentage="Math.round(appStore.systemStatus.memoryUsage.percent * 100)" 
                      :color="getMemoryColor(appStore.systemStatus.memoryUsage.percent * 100)"
                      :rail-color="getRailColor()"
                      :height="8"
                      :border-radius="4"
                      class="resource-progress" />
                  </div>
                  <div class="load-detail">可用: {{ appStore.systemStatus.memoryUsage.free.toFixed(2) }}MB</div>

                </div>
              </div>
            </div>
          </n-card>
        </n-gi>
        
        <!-- 系统信息卡片 -->
        <n-gi>
          <n-card :bordered="false" class="system-info-card" title="系统信息">
            <n-grid cols="1 s:2 m:2 l:2" :x-gap="16" :y-gap="16" responsive="screen" :item-responsive="true">
              <n-gi>
                <div class="info-item">
                  <div class="info-label">Kirara AI</div>
                  <div class="info-value">{{ appStore.systemStatus.version }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div class="info-item">
                  <div class="info-label">操作系统</div>
                  <div class="info-value">{{ appStore.systemStatus.platform || '-' }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div class="info-item">
                  <div class="info-label">CPU 型号</div>
                  <div class="info-value">{{ appStore.systemStatus.cpuInfo || '-' }}</div>
                </div>
              </n-gi>
              <n-gi>
                <div class="info-item">
                  <div class="info-label">Python</div>
                  <div class="info-value">{{ appStore.systemStatus.pythonVersion || '-' }}</div>
                </div>
              </n-gi>
            </n-grid>
          </n-card>
        </n-gi>
      </n-grid>

                  <!-- LLM 统计 -->
                  <div class="llm-stats-container">
              <div class="llm-stats-title">LLM 统计</div>
              <LLMStatistics />
            </div>
    </n-space>
  </div>
</template>

<style scoped>
.guide-container {
  padding: 24px;
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--body-bg-color) 0%, rgba(var(--primary-color-rgb), 0.05) 100%);
}

.guide-card,
.status-overview-card,
.system-load-card,
.system-info-card {
  background: rgba(var(--card-bg-color-rgb), 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  border: 1px solid rgba(var(--primary-color-rgb), 0.1);
  transition: all 0.3s ease;
}

.guide-card:hover,
.status-overview-card:hover,
.system-load-card:hover,
.system-info-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.guide-steps {
  margin: 16px 0;
  padding: 0 12px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.step-description {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.step-button {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 8px;
  background: rgba(var(--primary-color-rgb), 0.1);
  color: var(--primary-color);
  transition: all 0.3s ease;
}

.step-button:hover {
  background: rgba(var(--primary-color-rgb), 0.15);
}

:deep(.n-step.n-step--finish) {
  .n-step-indicator {
    background: linear-gradient(135deg, var(--success-color) 0%, rgba(var(--success-color-rgb), 0.8) 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(var(--success-color-rgb), 0.2);
  }
}

:deep(.n-step.n-step--process) {
  .n-step-indicator {
    background: linear-gradient(135deg, var(--primary-color) 0%, rgba(var(--primary-color-rgb), 0.8) 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.2);
  }
}

:deep(.n-step.n-step--wait) {
  opacity: 0.5;
}

/* 状态概览卡片样式 */
.status-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--primary-color-rgb), 0.03);
  transition: all 0.3s ease;
}

.status-item:hover {
  background: rgba(var(--primary-color-rgb), 0.06);
  transform: translateY(-2px);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--primary-color-rgb), 0.2) 100%);
  color: var(--primary-color);
}

.status-icon.uptime {
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1) 0%, rgba(var(--primary-color-rgb), 0.2) 100%);
  color: var(--primary-color);
}

.status-icon.chat {
  background: linear-gradient(135deg, rgba(var(--info-color-rgb), 0.1) 0%, rgba(var(--info-color-rgb), 0.2) 100%);
  color: var(--info-color);
}

.status-icon.brain {
  background: linear-gradient(135deg, rgba(var(--success-color-rgb), 0.1) 0%, rgba(var(--success-color-rgb), 0.2) 100%);
  color: var(--success-color);
}

.status-icon.plugin {
  background: linear-gradient(135deg, rgba(var(--warning-color-rgb), 0.1) 0%, rgba(var(--warning-color-rgb), 0.2) 100%);
  color: var(--warning-color);
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.status-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

/* 系统负载卡片样式 */
.load-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 0;
}

.load-item {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0 16px;
}

.load-progress {
  margin-top: 12px;
  width: 100%;
}

.load-info {
  width: 100%;
}

.load-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.load-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.load-detail {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
}

/* 系统信息卡片样式 */
.info-item {
  padding: 16px;
  border-radius: 12px;
  background: rgba(var(--primary-color-rgb), 0.03);
  transition: all 0.3s ease;
}

.info-item:hover {
  background: rgba(var(--primary-color-rgb), 0.06);
}

.info-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
}

.info-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  word-break: break-word;
}

/* LLM 统计样式 */
.llm-stats-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
}
</style>