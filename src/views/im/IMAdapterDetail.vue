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
const isEdit = ref(false)

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
    isEdit.value = false
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
    isEdit.value = true
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
            await imApi.updateAdapter(currentAdapter.value.name, currentAdapter.value)
        } else {
            await imApi.createAdapter(currentAdapter.value)
            isEdit.value = true
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
        currentAdapter.value = null
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
                    a => a.name === value && a.name !== currentAdapter.value?.name
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
            <n-card style="min-height: var(--n-window-height);">
                <template #header>
                    <div class="adapter-header">
                        <div class="adapter-title">
                            <n-button quaternary circle @click="goBack">
                                <template #icon>
                                    <n-icon>
                                        <ArrowBackOutline />
                                    </n-icon>
                                </template>
                            </n-button>
                            <span>{{ adapterInfo?.localized_name || adapterType }}</span>
                        </div>
                    </div>
                </template>

                <n-alert type="info" style="margin-bottom: 16px;" v-if="adapterInfo?.detail_info_markdown"
                    :show-icon="false">
                    <div v-html="md.render(adapterInfo?.detail_info_markdown)" />
                </n-alert>

                <div class="adapter-content">
                    <!-- 左侧配置列表 -->
                    <div class="instances-panel">
                        <div class="panel-header">
                            <n-space justify="space-between">
                                <h3>实例列表</h3>
                                <n-button type="primary" @click="addAdapter" size="small" v-if="adapters.length > 0">
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
                            <n-empty v-if="adapters.length === 0" description="暂无配置" />
                            <n-card v-for="adapter in adapters" :key="adapter.name" hoverable
                                @click="editAdapter(adapter)">
                                <n-thing :title="adapter.name" :description="adapter.bot_profile
                                    ? adapter.bot_profile.display_name
                                    : ''">
                                    <template #avatar>
                                        <n-avatar v-if="adapter.bot_profile && adapter.bot_profile?.avatar_url" round
                                            :src="adapter.bot_profile?.avatar_url">
                                        </n-avatar>
                                        <n-avatar v-else round>
                                            {{ (adapter.bot_profile
                                                ? adapter.bot_profile?.username
                                                : adapter.name).slice(0, 1).toUpperCase() }}
                                        </n-avatar>
                                    </template>
                                    <template #header-extra>
                                        <n-tag v-if="!adapter.enable" type="default">
                                            未启用
                                        </n-tag>
                                        <n-tag v-else-if="adapter.is_running" type="success">
                                            运行中
                                        </n-tag>
                                        <n-tag v-else type="warning">
                                            已停止
                                        </n-tag>
                                    </template>
                                    <template #action>
                                        <n-space>
                                            <n-button @click="editAdapter(adapter)" size="small">
                                                编辑
                                            </n-button>

                                            <n-popconfirm @positive-click="deleteAdapter(adapter.name)"
                                                positive-text="确定" negative-text="取消">
                                                <template #trigger>
                                                    <n-button size="small">
                                                        删除
                                                    </n-button>
                                                </template>
                                                确定要删除配置吗？
                                            </n-popconfirm>

                                        </n-space>
                                    </template>
                                </n-thing>
                            </n-card>
                        </div>
                    </div>

                    <!-- 右侧配置表单 -->
                    <div class="config-panel">
                        <div class="panel-header">
                            <n-space justify="space-between">
                                <h3>
                                    配置详情
                                </h3>
                                <n-button type="primary" size="small" @click="saveAdapter" :loading="processing"
                                    v-if="currentAdapter">
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
                                :rules="formRules">
                                <n-form-item label="名称" path="name">
                                    <n-input v-if="currentAdapter" v-model:value="currentAdapter!!.name"
                                        placeholder="配置名称" />
                                    <template #feedback>
                                        <n-text depth="3">用于区分不同的配置，必须唯一</n-text>
                                    </template>
                                </n-form-item>

                                <n-form-item label="开启">
                                    <n-switch v-if="currentAdapter" v-model:value="currentAdapter!!.enable" />
                                </n-form-item>

                                <n-divider />

                                <div v-if="configSchema && currentAdapter">
                                    <dynamic-config-form :schema="configSchema" v-model="currentAdapter!!.config" />
                                </div>
                            </n-form>
                        </div>

                        <div v-else class="empty-config">
                            <n-empty description="请选择或添加一个配置">
                                <template #extra v-if="adapters.length == 0">
                                    <n-button type="primary" @click="addAdapter">
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
    transition: all 0.2s ease;
    animation: fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.adapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.adapter-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

.adapter-content {
    display: flex;
    gap: 16px;
    margin-top: 16px;
    height: 100%;
}

.instances-panel {
    flex: 0 0 400px;
    border-right: 1px solid var(--n-border-color);
    padding-right: 16px;
}

.config-panel {
    flex: 1;
    padding-left: 16px;
}

.panel-header {
    margin-bottom: 16px;
}

.panel-header h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}

.instances-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 600px;
    overflow-y: auto;
}

.instance-card {
    position: relative;
    cursor: pointer;
}

.instance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.instance-name {
    font-weight: bold;
}

.instance-content {
    font-size: 0.9em;
}

.instance-content p {
    margin: 4px 0;
}

.instance-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    opacity: 0;
    transition: opacity 0.2s;
}

.instance-card:hover .instance-actions {
    opacity: 1;
}

.config-description {
    font-size: 14px;
}

.config-item {
    margin-bottom: 16px;
}

.config-item h5 {
    margin: 0 0 4px 0;
}

.config-item p {
    margin: 0 0 4px 0;
    color: var(--n-text-color-3);
}

.config-form {
    padding: 16px;
    background-color: var(--n-card-color);
    border-radius: 3px;
    transition: all 0.2s ease;

}

.empty-config {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}
</style>