<template>
  <div class="login-view">
    <!-- 背景图层 -->
    <div class="login-bg-layer"></div>
    
    <div class="login-container">
      <!-- 左侧图片区域 -->
      <div class="login-image-section">
        <div class="login-image-content">
          <h1 class="brand-title">Kirara AI</h1>
          <p class="brand-slogan">探索人工智能的无限可能</p>
        </div>
      </div>
      
      <!-- 右侧登录表单区域 -->
      <div class="login-form-section">
        <div class="login-form-wrapper">
          <div class="login-header">
            <div class="login-logo">
              <div class="i-carbon-bot text-36px animate-float" />
            </div>
            <h2 class="login-title">欢迎使用 Kirara AI</h2>
            <p class="login-subtitle">{{ isFirstTime ? '首次使用，请设置管理员密码' : '请输入管理员密码继续' }}</p>
          </div>
          
          <n-form
            ref="formRef"
            :model="formModel"
            :rules="rules"
            label-placement="left"
            label-width="0"
            require-mark-placement="right-hanging"
            size="large"
            class="login-form"
          >
            <n-form-item path="password" class="form-item">
              <n-input
                v-model:value="formModel.password"
                type="password"
                placeholder="请输入密码"
                show-password-on="click"
                :status="passwordFeedback"
                class="password-input"
              >
                <template #prefix>
                  <div class="i-carbon-password" />
                </template>
              </n-input>
            </n-form-item>
            
            <n-form-item v-if="isFirstTime" path="confirmPassword" class="form-item">
              <n-input
                v-model:value="formModel.confirmPassword"
                type="password"
                placeholder="请确认密码"
                :maxlength="32"
                show-password-on="click"
                class="password-input"
              >
                <template #prefix>
                  <div class="i-carbon-password-confirmation" />
                </template>
              </n-input>
            </n-form-item>
            
            <div class="form-actions">
              <n-button
                type="primary"
                size="large"
                block
                :loading="loading"
                @click="handleLogin"
                class="login-button"
              >
                {{ isFirstTime ? '设置密码' : '登录' }}
                <div class="button-effect"></div>
              </n-button>
              
              <div class="forgot-password" v-if="!isFirstTime">
                <n-tooltip trigger="hover" placement="bottom">
                  <template #trigger>
                    <span class="forgot-password-text">
                      忘记密码？
                    </span>
                  </template>
                  <span>删除项目下的 data\web\password.hash 文件即可重置密码</span>
                </n-tooltip>
              </div>
            </div>
          </n-form>
        </div>
      </div>
    </div>
    
    <div class="login-footer">
      <a href="https://github.com/lss233/kirara-ai" target="_blank" class="footer-link">
        <span>Powered by Kirara AI</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NButton,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { useLoginViewModel } from './login.vm'

const {
  isFirstTime,
  loading,
  formModel,
  rules,
  handleSubmit,
  checkFirstTime
} = useLoginViewModel()

const message = useMessage()
const passwordFeedback = ref<string | undefined>(undefined)

const handleLogin = async () => {
  try {
    passwordFeedback.value = undefined
    await handleSubmit();
  } catch (error: any) {
    passwordFeedback.value = 'error'
    message.error('登录失败，请重试');
  }
};

onMounted(() => {
  checkFirstTime()
})
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 背景图层 */
.login-bg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: brightness(0.7);
  z-index: -2;
}

.login-bg-layer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(64, 128, 255, 0.3) 0%, rgba(102, 153, 255, 0.3) 100%);
  z-index: -1;
}

.login-container {
  display: flex;
  width: 90%;
  max-width: 1200px;
  min-height: 600px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: container-appear 0.8s ease forwards;
}

/* 左侧图片区域 */
.login-image-section {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: linear-gradient(135deg, rgba(64, 128, 255, 0.7) 0%, rgba(102, 153, 255, 0.7) 100%);
  color: white;
  overflow: hidden;
}

.login-image-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: contain;
  background-position: bottom right;
  background-repeat: no-repeat;
  opacity: 0.2;
  z-index: 0;
  animation: image-float 6s ease-in-out infinite;
}

.login-image-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

.brand-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #ffffff, #e0e0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slide-in-left 0.8s ease forwards;
}

.brand-slogan {
  font-size: 1.5rem;
  margin-bottom: 3rem;
  opacity: 0;
  animation: fade-in 0.8s ease forwards 0.3s;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
  opacity: 0;
  transform: translateX(-20px);
}

.feature-item:nth-child(1) {
  animation: slide-in-left 0.6s ease forwards 0.5s;
}

.feature-item:nth-child(2) {
  animation: slide-in-left 0.6s ease forwards 0.7s;
}

.feature-item:nth-child(3) {
  animation: slide-in-left 0.6s ease forwards 0.9s;
}

.feature-item div {
  font-size: 1.8rem;
}

/* 右侧表单区域 */
.login-form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: rgba(255, 255, 255, 0.9);
  position: relative;
  overflow: hidden;
}

.login-form-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  animation: rotate 20s linear infinite;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.login-logo div {
  font-size: 3rem;
  color: var(--primary-color);
}

.login-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  animation: fade-in 0.8s ease forwards;
}

.login-subtitle {
  color: #666;
  font-size: 1rem;
  animation: fade-in 0.8s ease forwards 0.2s;
  opacity: 0;
}

.login-form {
  animation: slide-up 0.8s ease forwards 0.3s;
  opacity: 0;
}

.form-item {
  margin-bottom: 1.5rem;
}

.form-actions {
  margin-top: 2rem;
}

.login-button {
  height: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
  border: none;
  position: relative;
  overflow: hidden;
}

.button-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s ease;
}

.login-button:hover .button-effect {
  left: 100%;
}

.forgot-password {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.9rem;
}

.forgot-password-text {
  color: var(--primary-color);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.forgot-password-text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background-color: var(--primary-color);
  transition: width 0.3s ease;
}

.forgot-password-text:hover {
  color: var(--primary-color-hover);
}

.forgot-password-text:hover::after {
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  position: absolute;
  bottom: 1rem;
  width: 100%;
  animation: fade-in 0.8s ease forwards 1s;
  opacity: 0;
}

.footer-link {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: rgba(var(--n-text-color-rgb), 0.4);
  text-decoration: none;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: rgba(var(--n-text-color-rgb), 1.0);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.footer-icon {
  font-size: 1.2rem;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes image-float {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
}

/* 响应式布局 */
@media (max-width: 992px) {
  .login-container {
    flex-direction: column;
    width: 95%;
    max-width: 500px;
  }
  
  .login-image-section {
    padding: 2rem;
    min-height: 250px;
  }
  
  .brand-title {
    font-size: 2.5rem;
  }
  
  .brand-slogan {
    font-size: 1.2rem;
    margin-bottom: 1.5rem;
  }
  
  .brand-features {
    flex-direction: row;
    justify-content: space-around;
    gap: 1rem;
  }
  
  .feature-item {
    flex-direction: column;
    text-align: center;
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .login-container {
    width: 100%;
    height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  
  .login-image-section {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(135deg, rgba(64, 128, 255, 0.5) 0%, rgba(102, 153, 255, 0.5) 100%);
  }
  
  .login-form-section {
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(15px);
    min-height: 100vh;
    padding: 2rem 1.5rem;
  }
  
  .brand-features {
    display: none;
  }
  
  .login-form-wrapper {
    padding: 2rem;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 480px) {
  .login-form-wrapper {
    padding: 1.5rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  
  .login-subtitle {
    font-size: 0.9rem;
  }
  
  .login-logo div {
    font-size: 2.5rem;
  }
}
</style> 