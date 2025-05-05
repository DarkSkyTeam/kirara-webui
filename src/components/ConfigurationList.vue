<template>
  <div class="topbar">
    <p>{{ props.title.toLocaleUpperCase() }}</p>
    <n-space>
      <slot name="tools"></slot>
      <n-button quaternary @click="resetForm">
        <template #icon>
          <n-icon>
            <reload-icon />
          </n-icon>
        </template>
      </n-button>
      <n-button quaternary @click="saveToServer">
        <template #icon>
          <n-icon>
            <save-icon />
          </n-icon>
        </template>
      </n-button>
    </n-space>
  </div>
  <n-scrollbar style="max-height: 90vh">
    <div style="max-width: 66%; margin: 0 auto; padding-top: 16px" class="configuration-container">
      <n-form ref="formRef" label-placement="left" v-model:value="props.configurationValue">
        <div v-for="(group, i) in configurationGroups" :key="i">
          <h2 style="text-align: left; padding: 16px 0">{{ group.title }}</h2>
          <Markdown :source="group.description" v-if="group.description"></Markdown>
          <n-divider></n-divider>

          <div style="margin-bottom: 20px" v-for="(config, j) in group.properties" :key="j">
            <n-form-item :label="config.title" v-if="config.type == 'boolean'">
              <n-switch v-model:value="props.configurationValue[j]">
                <template #checked-icon> 😁 </template>
                <template #unchecked-icon> 🤔 </template>
              </n-switch>
            </n-form-item>

            <template v-else-if="config.type == 'object'">
              <p style="padding: 10px 0">{{ config.title }}</p>

              <template v-for="(_, keyName) in props.configurationValue[j]" :key="keyName">
                <p style="padding: 10px 0">
                  <span
                    contenteditable="true"
                    @input="changeObjectKey(j, keyName, $event.target.innerText)"
                    >{{ keyName }}</span
                  >
                  <n-button style="margin-left: 12px" @click="removeObjectKey(j, keyName)">
                    删除
                  </n-button>
                  <n-button attr-type="button" @click="addObjectArrayItem(j, keyName)">
                    增加
                  </n-button>
                </p>

                <n-form-item
                  v-for="(__, childIndex) in props.configurationValue[j][keyName]"
                  :key="childIndex"
                  :label="`${childIndex}`"
                >
                  <n-input
                    v-model:value="props.configurationValue[j][keyName][childIndex]"
                    clearable
                    style="min-width: 25%"
                  />
                  <n-button
                    style="margin-left: 12px"
                    @click="removeObjectArrayItem(j, keyName, childIndex)"
                  >
                    删除
                  </n-button>
                </n-form-item>
              </template>

              <n-form-item>
                <n-space>
                  <n-button attr-type="button" @click="addObjectKey(j, '请输入 AI 名')">
                    增加
                  </n-button>
                </n-space>
              </n-form-item>
            </template>

            <template v-else-if="config.type == 'array'">
              <p style="padding: 10px 0">{{ config.title }}</p>
              <n-form-item
                v-for="(item, index) in props.configurationValue[j]"
                :key="index"
                :label="`第${index + 1}项`"
              >
                <n-input
                  v-model:value="props.configurationValue[j][index]"
                  clearable
                  style="min-width: 25%"
                />
                <n-button style="margin-left: 12px" @click="removeArrayItem(j, index)">
                  删除
                </n-button>
              </n-form-item>

              <n-form-item>
                <n-space>
                  <n-button attr-type="button" @click="addArrayItem(j)"> 增加 </n-button>
                </n-space>
              </n-form-item>
            </template>

            <n-form-item
              :label="config.title"
              path="inputValue"
              v-else-if="config.type == 'integer'"
            >
              <n-input-number
                v-model:value="props.configurationValue[j]"
                :placeholder="'' + (config.default || '请输入……')"
                style="min-width: 25%"
              />
            </n-form-item>
            <n-form-item
              :label="config.title"
              path="inputValue"
              v-else-if="config.form_type == 'password'"
            >
              <n-input
                v-model:value="props.configurationValue[j]"
                type="password"
                :placeholder="'' + (config.default || '请输入……')"
                style="min-width: 25%"
              />
            </n-form-item>
            <n-form-item :label="config.title" path="inputValue" v-else>
              <n-input
                v-model:value="props.configurationValue[j]"
                type="text"
                :placeholder="'' + (config.default || '请输入……')"
                style="min-width: 25%"
              />
            </n-form-item>
            <Markdown :source="config.description" v-if="config.description"></Markdown>

            <n-divider></n-divider>
          </div>
        </div>
      </n-form>
    </div>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { SaveOutline as SaveIcon, ReloadOutline as ReloadIcon } from '@vicons/ionicons5'
import {
  NDivider,
  NInput,
  NFormItem,
  NForm,
  NSpace,
  NButton,
  NIcon,
  NScrollbar,
  NSwitch,
  NInputNumber
} from 'naive-ui'
import Markdown from 'vue3-markdown-it'

import CryptoJS from 'crypto-js'

export type Configuration = {
  title: string
  isRequired: boolean
  value: any
  description: string
  default?: any
  type: string
  form_type?: string
}
export type ConfigurationGroup = {
  title: string
  description?: string
  properties: Array<Configuration>
}

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  configurationGroups: {
    type: Array as () => Array<ConfigurationGroup>,
    required: true
  },
  configurationValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'reset'): void
  (e: 'save', configurationValue: any): void
}>()

function generateSalt() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let salt = ''
  for (let i = 0; i < 10; i++) {
    salt += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return salt
}

function createHash(originalStr: string, method: string) {
  const hashFunc = method
  let hash
  if (hashFunc.startsWith('Hmac')) {
    const key = generateSalt()
    const saltedData = `${originalStr}`
    hash = CryptoJS[hashFunc](saltedData, key)
    return `${hashFunc.replace('Hmac', '').toLocaleLowerCase()}$${key}$${hash.toString(
      CryptoJS.enc.Hex
    )}`
  } else {
    hash = CryptoJS[hashFunc](originalStr)
    return `${hashFunc}$${hash.toString(CryptoJS.enc.Hex)}`
  }
}

const resetForm = () => {
  // Reset form fields to their original values
  emit('reset')
}

const saveToServer = () => {
  try {
    for (let property: string in props.configurationValue) {
      if (props.configurationGroups[0].properties[property].form_type == 'password') {
        console.log(props.configurationGroups[0].properties[property].password)
        props.configurationValue[property] = createHash(
          props.configurationValue[property],
          props.configurationGroups[0].properties[property].password
        )
      }
    }
  } catch (e) {
    console.error(e)
  }

  emit('save', props.configurationValue)
}

const removeArrayItem = (arr: number, index: number) => {
  props.configurationValue[arr].splice(index, 1)
}
const addArrayItem = (arr: number) => {
  props.configurationValue[arr].push('')
}

const addObjectArrayItem = (arr: number, keyName: string) => {
  props.configurationValue[arr][keyName].push('')
}
const removeObjectArrayItem = (arr: number, keyName: string, index: number) => {
  props.configurationValue[arr][keyName].splice(index, 1)
}
const removeObjectKey = (arr: number, keyName: string) => {
  delete props.configurationValue[arr][keyName]
}

const addObjectKey = (arr: number, keyName: string) => {
  props.configurationValue[arr][keyName] = []
}

const changeObjectKey = (arr: number, keyName: string, newKeyName: string) => {
  props.configurationValue[arr][newKeyName] = props.configurationValue[arr][keyName]
  delete props.configurationValue[arr][keyName]
}
</script>

<style scoped>
.topbar {
  background-color: var(--vt-c-white-mute);
  color: #111;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

ul {
  list-style: none;
  display: flex;
}

li {
  margin-right: 20px;
}

a {
  color: #111;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
