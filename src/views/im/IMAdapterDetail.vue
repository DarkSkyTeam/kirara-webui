<script setup lang="ts">
import { imApi } from '@/api/im'
import type { IMAdapter, IMAdapterInfo, UserProfile } from '@/api/im'
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
    NCard, NSpace, NButton, NForm, NFormItem, NInput, NSpin,
    useMessage, NIcon, NTag, NDivider, NSwitch, NEmpty,
    NPopconfirm, NAlert, NText, NThing, NAvatar, NScrollbar
} from 'naive-ui'
import DynamicConfigForm from '@/components/form/DynamicConfigForm.vue'
import {
    AddOutline,
    ArrowBackOutline,
    SaveOutline,
} from '@vicons/ionicons5'
import type { FormInst } from 'naive-ui'
import MarkdownIt from 'markdown-it';
const route = useRoute()
const router = useRouter()
const message = useMessage()

// 获取路由参数中的适配器类型
const adapterType = computed(() => route.params.adapterType as string)
const loading = ref(false)
const processing = ref(false)
const configSchema = ref<any>(null)
const adapters = ref<IMAdapter[]>([])
const currentAdapter = ref<IMAdapter | null>(null)
const formRef = ref<FormInst | null>(null)
const isEdit = ref<string | null>(null)

const md = new MarkdownIt()
const defaultRender = md.renderer.rules.link_open || function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
};

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    // Add a new `target` attribute, or replace the value of the existing one.
    tokens[idx].attrSet('target', '_blank');

    // Pass the token to the default renderer.
    return defaultRender(tokens, idx, options, env, self);
};

const adapterInfo = ref<IMAdapterInfo | null>(null)

// 获取适配器配置模式
const fetchAdapterConfigSchema = async () => {
    try {
        loading.value = true
        const { configSchema: schema } = await imApi.getAdapterConfigSchema(adapterType.value)
        configSchema.value = schema
    } catch (error) {
        message.error('获取适配器配置模式失败: ' + error)
        console.error('获取适配器配置模式失败:', error)
    } finally {
        loading.value = false
    }
}

// 获取适配器列表
const fetchAdapters = async () => {
    try {
        loading.value = true
        const { adapters: adapterList } = await imApi.getAdapters()
        // 过滤出当前类型的适配器
        // bot_profile 的查询是异步过程，所以这里先备份当前 adapters 的 bot_profile 历史数据，等 adpters 查询完毕后恢复，最后再刷新真实的 bot_profile
        let cachedbot_profileMap = new Map<string, UserProfile | null>()
        if (adapters.value.length > 0) {
            adapters.value.forEach(a => {
                cachedbot_profileMap.set(a.name, a.bot_profile)
            })
        }
        adapters.value = adapterList.filter(a => a.adapter === adapterType.value)
        // 恢复 bot_profile
        if (adapters.value.length > 0) {
            adapters.value.forEach(a => {
                a.bot_profile = cachedbot_profileMap.get(a.name) || null
            })
        }
        // 刷新真实 bot_profile
        adapters.value.forEach(async (adapter) => {
            const { adapter: adapterDetail } = await imApi.getAdapterDetail(adapter.name)
            adapter.bot_profile = adapterDetail.bot_profile
        })
    } catch (error) {
        message.error('获取适配器列表失败: ' + error)
        console.error('获取适配器列表失败:', error)
    } finally {
        loading.value = false
    }
}

// 添加适配器
const addAdapter = async () => {
    isEdit.value = null
    await fetchAdapterConfigSchema()
    currentAdapter.value = {
        name: '',
        adapter: adapterType.value,
        config: {},
        is_running: false,
        enable: true,
        bot_profile: null
    }
}

// 编辑适配器
const editAdapter = (adapter: IMAdapter) => {
    isEdit.value = adapter.name
    currentAdapter.value = { ...adapter }
}

// 保存适配器
const saveAdapter = async () => {
    if (!currentAdapter.value) return

    try {
        processing.value = true
        try {
            const errors = await formRef.value?.validate()
            if (errors?.warnings?.length) return
        } catch (error) {
            message.error('保存适配器失败: 请检查输入内容')
            return
        }

        if (isEdit.value) {
            await imApi.updateAdapter(isEdit.value, currentAdapter.value)
            isEdit.value = currentAdapter.value.name
        } else {
            await imApi.createAdapter(currentAdapter.value)
            isEdit.value = currentAdapter.value.name
        }
        message.success('保存适配器成功')
    } catch (error) {
        message.error('保存适配器失败: ' + error)
        console.error('保存适配器失败:', error)
    } finally {
        processing.value = false
        await fetchAdapters()
    }
}

// 删除适配器
const deleteAdapter = async (adapterName: string) => {
    try {
        processing.value = true
        await imApi.deleteAdapter(adapterName)
        if (currentAdapter.value?.name === adapterName || isEdit.value === adapterName) {
            currentAdapter.value = null
            isEdit.value = null
        }
        message.success('删除适配器成功')
    } catch (error) {
        message.error('删除适配器失败: ' + error)
        console.error('删除适配器失败:', error)
    } finally {
        processing.value = false
        await fetchAdapters()
    }
}

// 返回列表页
const goBack = () => {
    router.push('/im')
}

// 表单规则
const formRules = {
    name: [
        { required: true, message: '请输入适配器名称', trigger: 'blur' },
        {
            validator: (rule: any, value: string) => {
                if (!currentAdapter.value) return true

                const exists = adapters.value.some(
                    a => a.name === value && a.name !== isEdit.value
                )

                if (exists) {
                    return new Error('适配器名称已存在')
                }
                return true
            },
            trigger: 'blur'
        }
    ]
}

// 获取适配器信息
const fetchAdapterInfo = async () => {
    const { adapters } = await imApi.getAdapterTypes()
    if (adapters) {
        adapterInfo.value = adapters[adapterType.value] || null
    } else {
        adapterInfo.value = null
    }
}

onMounted(async () => {
    await fetchAdapterInfo()
    await fetchAdapterConfigSchema()
    await fetchAdapters()
})

defineExpose({
    fetchAdapters,
    currentAdapter,
    processing,
    formRef
})
</script>

<template>
    <div class="adapter-detail">
        <n-spin :show="loading || processing">
            <n-card class="adapter-card" style="min-height: var(--n-window-height);">
                <template #header>
                    <div class="adapter-header">
                        <div class="adapter-title">
                            <n-button quaternary circle @click="goBack" class="back-button">
                                <template #icon>
                                    <n-icon>
                                        <ArrowBackOutline />
                                    </n-icon>
                                </template>
                            </n-button>
                            <span class="title-text">{{ adapterInfo?.localized_name || adapterType }}</span>
                        </div>
                    </div>
                </template>

                <n-alert type="info" class="adapter-info" v-if="adapterInfo?.detail_info_markdown" :show-icon="false">
                    <div v-html="md.render(adapterInfo?.detail_info_markdown)" class="markdown-content" />
                </n-alert>

                <div class="adapter-content">
                    <!-- 左侧配置列表 -->
                    <div class="instances-panel">
                        <div class="panel-header">
                            <n-space justify="space-between" align="center">
                                <h3 class="panel-title">实例列表</h3>
                                <n-button type="primary" @click="addAdapter" size="small" v-if="adapters.length > 0"
                                    class="add-button">
                                    <template #icon>
                                        <n-icon>
                                            <AddOutline />
                                        </n-icon>
                                    </template>
                                    添加配置
                                </n-button>
                            </n-space>
                        </div>

                        <div class="instances-list">
                            <n-scrollbar style="max-height: 600px;">
                                <n-empty v-if="adapters.length === 0" description="暂无配置" class="empty-state" />
                                <n-card v-for="adapter in adapters" :key="adapter.name" hoverable
                                    @click="editAdapter(adapter)" class="instance-card"
                                    :class="{ 'active': currentAdapter?.name === adapter.name }">
                                    <n-thing :title="adapter.name" :description="adapter.bot_profile
                                        ? adapter.bot_profile.display_name
                                        : ''" class="instance-thing">
                                        <template #avatar>
                                            <n-avatar v-if="adapter.bot_profile && adapter.bot_profile?.avatar_url" round
                                                :src="adapter.bot_profile?.avatar_url" class="avatar">
                                            </n-avatar>
                                            <n-avatar v-else round class="avatar default-avatar">
                                                {{ (adapter.bot_profile
                                                    ? adapter.bot_profile?.username
                                                    : adapter.name).slice(0, 1).toUpperCase() }}
                                            </n-avatar>
                                        </template>
                                        <template #header-extra>
                                            <n-tag v-if="!adapter.enable" type="default" class="status-tag disabled">
                                                未启用
                                            </n-tag>
                                            <n-tag v-else-if="adapter.is_running" type="success" class="status-tag running">
                                                运行中
                                            </n-tag>
                                            <n-tag v-else type="warning" class="status-tag stopped">
                                                已停止
                                            </n-tag>
                                        </template>
                                        <template #action>
                                            <n-space class="action-buttons">
                                                <n-button @click.stop="editAdapter(adapter)" size="small" class="edit-button">
                                                    编辑
                                                </n-button>

                                                <n-popconfirm @positive-click="deleteAdapter(adapter.name)"
                                                    positive-text="确定" negative-text="取消" class="delete-confirm">
                                                    <template #trigger>
                                                        <n-button size="small" class="delete-button">
                                                            删除
                                                        </n-button>
                                                    </template>
                                                    确定要删除配置吗？
                                                </n-popconfirm>
                                            </n-space>
                                        </template>
                                    </n-thing>
                                </n-card>
                            </n-scrollbar>
                        </div>
                    </div>

                    <!-- 右侧配置表单 -->
                    <div class="config-panel">
                        <div class="panel-header">
                            <n-space justify="space-between" align="center">
                                <h3 class="panel-title">
                                    配置详情
                                </h3>
                                <n-button type="primary" size="small" @click="saveAdapter" :loading="processing"
                                    v-if="currentAdapter" class="save-button">
                                    <template #icon>
                                        <n-icon>
                                            <SaveOutline />
                                        </n-icon>
                                    </template>
                                    保存配置
                                </n-button>
                            </n-space>
                        </div>

                        <div v-if="currentAdapter" class="config-form">
                            <n-form ref="formRef" :model="currentAdapter" label-placement="left" label-width="150"
                                :rules="formRules" class="form">
                                <n-form-item label="名称" path="name" class="form-item">
                                    <n-input v-if="currentAdapter" v-model:value="currentAdapter!!.name"
                                        placeholder="配置名称" class="input" />
                                    <template #feedback>
                                        <n-text depth="3" class="form-hint">用于区分不同的配置，必须唯一</n-text>
                                    </template>
                                </n-form-item>

                                <n-form-item label="开启" class="form-item">
                                    <n-switch v-if="currentAdapter" v-model:value="currentAdapter!!.enable" class="switch" />
                                </n-form-item>

                                <n-divider class="divider" />

                                <div v-if="configSchema && currentAdapter" class="dynamic-config">
                                    <dynamic-config-form :schema="configSchema" v-model="currentAdapter!!.config" />
                                </div>
                            </n-form>
                        </div>

                        <div v-else class="empty-config">
                            <n-empty description="请选择或添加一个配置" class="empty-state">
                                <template #extra v-if="adapters.length == 0">
                                    <n-button type="primary" @click="addAdapter" class="add-button-large">
                                        <template #icon>
                                            <n-icon>
                                                <AddOutline />
                                            </n-icon>
                                        </template>
                                        添加配置
                                    </n-button>
                                </template>
                            </n-empty>
                        </div>
                    </div>
                </div>
            </n-card>
        </n-spin>
    </div>
</template>

<style scoped>
.adapter-detail {
    padding: var(--n-padding-md);
    transition: all var(--transition-duration) var(--transition-timing-function);
    animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.adapter-card {
    border-radius: var(--border-radius);
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    box-shadow: var(--box-shadow);
    overflow: hidden;
}

.adapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
}

.adapter-title {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.title-text {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-color);
}

.back-button {
    transition: transform 0.3s ease;
}

.back-button:hover {
    transform: translateX(-3px);
}

.adapter-info {
    margin-bottom: 1.5rem;
    border-radius: var(--border-radius);
    border: 1px solid rgba(var(--info-color), 0.2);
    background-color: rgba(var(--info-color), 0.05);
}

.markdown-content {
    font-size: 0.95rem;
    line-height: 1.6;
}

.markdown-content a {
    color: var(--primary-color);
    text-decoration: none;
    transition: all 0.3s ease;
    border-bottom: 1px dashed var(--primary-color);
}

.markdown-content a:hover {
    color: var(--primary-color-hover);
    border-bottom: 1px solid var(--primary-color-hover);
}

.adapter-content {
    display: flex;
    gap: 2rem;
    margin-top: 1.5rem;
    height: 100%;
}

.instances-panel {
    flex: 0 0 400px;
    border-right: 1px solid var(--border-color);
    padding-right: 1.5rem;
}

.config-panel {
    flex: 1;
    padding-left: 1rem;
}

.panel-header {
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
}

.panel-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.instances-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.instance-card.active {
    border: 1px solid var(--primary-color);
    background-color: rgba(var(--primary-color), 0.05);
}

.instance-thing {
    padding: 0.5rem 0;
}

.avatar {
    transition: transform 0.3s ease;
}

.default-avatar {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-hover) 100%);
    color: white;
    font-weight: bold;
}

.status-tag {
    border-radius: 12px;
    font-size: 0.8rem;
    padding: 0 0.8rem;
    transition: all 0.3s ease;
}

.status-tag.running {
    background-color: var(--success-color);
    color: white;
}

.status-tag.stopped {
    background-color: var(--warning-color);
    color: white;
}

.status-tag.disabled {
    background-color: var(--text-color-tertiary);
    color: white;
}

.action-buttons {
    opacity: 0.7;
    transition: opacity 0.3s ease;
}

.instance-card:hover .action-buttons {
    opacity: 1;
}

.config-form {
    padding: 1.5rem;
    background-color: var(--card-bg-color);
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
    transition: all 0.3s ease;
    animation: slide-up 0.5s ease forwards;
}

.form-item {
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
}

.form-hint {
    font-size: 0.85rem;
    color: var(--text-color-tertiary);
}

.input {
    transition: all 0.3s ease;
}

.input:hover, .input:focus {
    border-color: var(--primary-color);
}

.switch {
    transition: all 0.3s ease;
}

.divider {
    margin: 1.5rem 0;
    border-color: var(--border-color);
}

.dynamic-config {
    animation: fade-in 0.5s ease forwards;
}

.empty-config {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    border-radius: var(--border-radius);
    border: 1px dashed var(--border-color);
    background-color: rgba(0, 0, 0, 0.02);
}

.empty-state {
    padding: 2rem;
}

.add-button-large {
    padding: 0.5rem 1.5rem;
    font-size: 1rem;
    transition: all 0.3s ease;
}

.add-button-large:hover {
    transform: translateY(-3px);
    box-shadow: var(--box-shadow-hover);
}

/* 响应式布局 */
@media (max-width: 1200px) {
    .adapter-content {
        gap: 1.5rem;
    }

    .instances-panel {
        flex: 0 0 350px;
    }
}

@media (max-width: 992px) {
    .adapter-content {
        flex-direction: column;
    }

    .instances-panel {
        flex: none;
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        padding-right: 0;
        padding-bottom: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .config-panel {
        padding-left: 0;
    }

    .instances-list {
        max-height: 400px;
    }
}

@media (max-width: 768px) {
    .adapter-detail {
        padding: 1rem;
    }

    .title-text {
        font-size: 1.3rem;
    }

    .panel-title {
        font-size: 1.1rem;
    }

    .config-form {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .adapter-detail {
        padding: 0.5rem;
    }

    .instances-list {
        max-height: 300px;
    }

    .action-buttons {
        flex-direction: column;
        gap: 0.5rem;
    }
}
</style>