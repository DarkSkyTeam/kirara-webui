<template>
  <div class="sidebar-title" v-if="props.title">
    <p>{{ props.title }}</p>
  </div>

  <div class="sidebar">
    <ul class="sidebar-nav">
      <li v-for="(nav, index) in navList" :key="index" @click="toggleIndex(nav.key)">
        <router-link :to="nav.path" v-if="nav.path">
          <div
            :class="{
              'sidebar-nav-item': true,
              'sidebar-nav-sub-item': true,
              'sidebar-nav-icon': props.iconOnly
            }"
          >
            <component :is="nav.icon" v-if="nav.icon"></component>
            <div class="sidebar-nav-text" v-if="nav.text && !props.iconOnly">{{ nav.text }}</div>
          </div>
        </router-link>

        <!-- nested sidebar -->
        <ul class="sidebar-nav-child" v-if="nav.children">
          <!-- <li :class="{'sidebar-nav-sub-item': true, 'sidebar-nav-sub-item-active': selectAccountIndex == childIndex && selectAccountModelName == type}" v-for="(account, childIndex) in accountList[type]"
                                @click="onAccountSelect(type, childIndex)" :key="childIndex">
                                <div>
                                    <p class="account-remark">账号 {{ childIndex + 1 }}</p>
                                    <p class="account-status" style="color: mediumseagreen" v-if="account.ok">可用</p>
                                    <p class="account-status" style="color:brown" v-else>不可用</p>
                                </div>
                            </li> -->
        </ul>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import { reactive, toRefs, computed, onMounted, type Component } from 'vue'
export interface Nav {
  key?: string
  text: string
  icon?: Component
  path: string
  children?: Nav[]
}
const state = reactive({
  currentPath: '/',
  collapse: false,
  height: 0
})
const props = defineProps<{
  navList: Nav[]
  iconOnly: Boolean
  title?: string
}>()

const emit = defineEmits<{
  (e: 'onSelect', name?: string): void
}>()

const toggleIndex = (key?: string) => {
  emit('onSelect', key)
}
const onSelect = (path: string) => {
  state.currentPath = path
}
const setHeight = () => {
  state.height = document.getElementsByClassName('sidebar-nav-child')[0].clientHeight
}
onMounted(() => {
  // setHeight();
  // window.addEventListener('resize', setHeight);
})
</script>

<style scoped>
.sidebar-nav {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
}

.sidebar-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  /* padding: 0 20px; */
}

.sidebar-nav-icon {
  font-size: 20px;
  min-height: 50px;
}
</style>
