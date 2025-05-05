<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { NSpace, NIcon, NText, NMarquee, NCard } from 'naive-ui'

const props = defineProps<{
  adapterTypes: string[]
}>()

const emit = defineEmits<{
  (e: 'create', adapter: string): void
}>()

const getAdapterIcon = (adapter: string) => {
  return `/assets/icons/llm/${adapter.toLowerCase()}.webp`
}

const handleCreateAdapter = (adapter: string) => {
  emit('create', adapter)
}
</script>

<template>
  <div class="empty-state bg">
    <n-space vertical align="center" style="width: 100%">
      <div class="empty-icon">
        <n-icon size="64" color="var(--primary-color)">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M21 10.975V8a2 2 0 0 0-2-2h-6V4.688c.305-.274.5-.668.5-1.11a1.5 1.5 0 0 0-3 0c0 .442.195.836.5 1.11V6H5a2 2 0 0 0-2 2v2.975A3.5 3.5 0 0 0 2 14.5a3.5 3.5 0 0 0 1.974 3.15c.284.876 1.092 1.5 2.053 1.5h12c.961 0 1.769-.624 2.053-1.5A3.5 3.5 0 0 0 22 14.5a3.5 3.5 0 0 0-1-2.525M8 9h8a1 1 0 0 1 1 1v1H7v-1a1 1 0 0 1 1-1m2 9.5a2.5 2.5 0 0 1-2.5-2.5a2.5 2.5 0 0 1 2.5-2.5a2.5 2.5 0 0 1 2.5 2.5a2.5 2.5 0 0 1-2.5 2.5m8.5-2.5a2.5 2.5 0 0 1-2.5 2.5a2.5 2.5 0 0 1-2.5-2.5a2.5 2.5 0 0 1 2.5-2.5a2.5 2.5 0 0 1 2.5 2.5z"
            />
          </svg>
        </n-icon>
      </div>
      <n-text strong style="font-size: 24px" class="empty-title">海量模型，一网打尽</n-text>
      <n-text style="font-size: 16px" class="empty-description"
        >选择一个模型供应商，然后添加模型，即可开始使用，<a
          href="https://kirara-docs.app.lss233.com/guide/configuration/llm.html"
          target="_blank"
          >查看文档</a
        >。</n-text
      >
      <div class="adapter-marquee-container">
        <n-marquee auto-fill :speed="40">
          <n-space class="adapter-list-marquee">
            <n-card
              v-for="adapter in adapterTypes"
              :key="adapter"
              hoverable
              @click="handleCreateAdapter(adapter)"
              style="width: 120px; height: 120px; position: relative; overflow: hidden"
            >
              <img
                :src="getAdapterIcon(adapter)"
                style="width: 100%; height: 100%; object-fit: contain"
              />
            </n-card>
          </n-space>
        </n-marquee>
      </div>
    </n-space>
  </div>
</template>

<style scoped>
.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  animation: fade-in 0.5s ease;
  padding: 0;
}

.empty-icon {
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.empty-title {
  margin-bottom: 16px;
  background: linear-gradient(to right, var(--primary-color), var(--primary-color-hover));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slide-in-left 0.5s ease forwards;
}

.empty-description {
  margin-bottom: 32px;
  color: var(--text-color-secondary);
  max-width: 500px;
  text-align: center;
  animation: fade-in 0.5s ease forwards 0.2s;
  opacity: 0;
}

.adapter-marquee-container {
  width: 100%;
  height: 140px;
  margin-top: 20px;
  animation: slide-up 0.5s ease forwards 0.3s;
  opacity: 0;
}

.adapter-list-marquee {
  padding: 0 6px;
}

/* 动画关键帧 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
