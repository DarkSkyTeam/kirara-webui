<template>
  <div id="monaco-editor-container" ref="editorContainer" class="editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, watch } from 'vue';
import '@codingame/monaco-vscode-language-pack-zh-hans'
import 'vscode/localExtensionHost';
import '@codingame/monaco-vscode-python-default-extension';
import "@codingame/monaco-vscode-theme-defaults-default-extension";
import * as monaco from 'monaco-editor';
import { initWebSocketAndStartClient } from './lsp-client';
import { initialize } from '@codingame/monaco-vscode-api'

import { http } from '@/utils/http';

import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getThemeServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextMateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getConfigurationServiceOverride from "@codingame/monaco-vscode-configuration-service-override";
import type { MonacoLanguageClient } from 'monaco-languageclient';

// 定义组件属性
const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  language: {
    type: String,
    default: 'python'
  },
  theme: {
    type: String,
    default: 'vs-light'
  },
  options: {
    type: Object,
    default: () => ({})
  },
  lspEndpoint: {
    type: String,
    default: '/block/code/lsp'
  }
});

// 定义事件
const emit = defineEmits(['update:modelValue', 'editorDidMount', 'change']);
let ws: WebSocket | null = null;
let editor: monaco.editor.IStandaloneCodeEditor | null = null;
let lspClient: MonacoLanguageClient | null = null;

export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
  TextEditorWorker: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
  TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' })
}

// 设置 Monaco 环境
window.MonacoEnvironment = {
  getWorker: function (_moduleId, label) {
    const workerFactory = workerLoaders[label]
    if (workerFactory != null) {
      return workerFactory()
    }
    throw new Error(`Worker ${label} not found`)
  }
}

const editorContainer = ref<HTMLElement | null>(null);

// 获取编辑器实例的方法
const getEditor = () => editor;
onMounted(async () => {
  // 确保只初始化一次
  try {
    await initialize({
      container: editorContainer.value,
      ...getTextMateServiceOverride(),
      ...getThemeServiceOverride(),
      ...getLanguagesServiceOverride(),
      ...getConfigurationServiceOverride()
      });
      console.log('initialized')
  } catch (error) {
    console.error(error)
  }

  // 创建编辑器实例
  if (editorContainer.value) {
    // 合并默认选项和用户提供的选项
    const editorOptions = {
      value: props.modelValue,
      language: props.language,
      theme: props.theme,
      automaticLayout: true,
      ...props.options
    };
    console.log(editorOptions)
    editor = monaco.editor.create(editorContainer.value, editorOptions);
    
    // 监听内容变化事件
    editor.onDidChangeModelContent(() => {
      const newValue = editor?.getValue() || '';
      emit('update:modelValue', newValue);
      emit('change', newValue);
    });
    
    // 启动 WebSocket LSP 客户端
    ws = http.ws(props.lspEndpoint);
    lspClient = await initWebSocketAndStartClient(ws);
    monaco.editor.setTheme(props.theme);
    // 通知编辑器已挂载
    emit('editorDidMount', { editor, monaco, lspClient });
  }
});

// 监听属性变化
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
}, { deep: true });

watch(() => props.language, (newValue) => {
  if (editor) {
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, newValue);
    }
  }
});

watch(() => props.theme, (newValue) => {
  if (editor) {
    monaco.editor.setTheme(newValue);
  }
});

onBeforeUnmount(() => {
  // 清理编辑器实例
  if (editor) {
    editor.dispose();
    editor = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
});

// 暴露方法给父组件
defineExpose({
  getEditor
});
</script>

<style scoped>
.editor-container {
  width: 100%;
  height: 100%;
  min-height: 500px;
}
</style>