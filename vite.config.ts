import { fileURLToPath, URL } from 'node:url'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'

import { defineConfig, normalizePath } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { execSync } from 'child_process'

// 获取 Git 信息
function getGitVersion(): string {
  try {
    let tag = '';
    try {
      tag = execSync('git describe --tags --exact-match').toString().trim();
    } catch (e) {
      // 如果没有找到 tag，则忽略错误
    }

    if (tag) {
      return tag;
    }

    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    return `dev-${commitHash}`;
  } catch (e) {
    return 'unknown';
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Added proxy configuration
  server: { 
    proxy: {
      '/backend-api': 'http://127.0.0.1:8080',
      '/backend-api/api/tracing/ws': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
      },
      '/backend-api/api/system/logs': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
      },
      '/backend-api/api/block/code/lsp': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@comfyorg/litegraph/dist/css/litegraph.css': path.resolve(__dirname, 'node_modules/@comfyorg/litegraph/dist/css/litegraph.css'),
    },
    dedupe: ['vscode']
  },
  build: {
    rollupOptions: {
      output: {
        compact: true,
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
        manualChunks: {
          'cryptojs': ['crypto-js'],
          'naiveui': ['naive-ui'],
          'vsc': [
            '@codingame/monaco-vscode-api', 
            '@codingame/monaco-vscode-extension-api', 
            '@codingame/monaco-vscode-languages-service-override', 
            '@codingame/monaco-vscode-theme-service-override', 
            '@codingame/monaco-vscode-textmate-service-override',
            '@codingame/monaco-vscode-language-pack-zh-hans',
            'monaco-editor',
            'vscode',
            'vscode-languageclient',
            'vscode-ws-jsonrpc',
            'vscode-languageserver-protocol',
            'vscode-jsonrpc'
          ]
        }
      }
      
    }
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(getGitVersion())
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
    include: [
        'vscode/localExtensionHost',
        'vscode-textmate',
        'vscode-oniguruma'
    ]
  },
  worker: {
    format: "es"
  }
})
