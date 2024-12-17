<template>
  <div class="app-container">
    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      title="连接服务器"
      width="500"
      draggable
    >
      <span>It's a draggable Dialog</span>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="connect"> 连接 </el-button>
        </div>
      </template>
    </el-dialog>

    <xterm v-if="isConnected" :resource_id="resourceId" />
    <!-- <guacd v-if="isConnected" /> -->
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()
const resourceId = route.query.resource_id as string

// import guacd from "./guacd.vue"

import xterm from "./xterm.vue"
const dialogVisible = ref<boolean>(true)

const isConnected = ref<boolean>(false)
const connect = () => {
  isConnected.value = true
  dialogVisible.value = false
}
</script>

<style scoped></style>
