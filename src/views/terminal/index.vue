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
          <el-button type="primary" @click="connect" :loading="loading"> 连接 </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- <xterm v-if="isConnected" :resource_id="resourceId" :prefix="prefix" /> -->
    <!-- <guacd v-if="isConnected" /> -->
    <finder v-if="isConnected" :resource_id="resourceId" :prefix="prefix" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { connectApi } from "@/api/term"
import { useRoute } from "vue-router"
const route = useRoute()
const resourceId = route.query.resource_id as string

// import xterm from "./xterm.vue"
import { ElMessage } from "element-plus"

// import guacd from "./guacd.vue"

import finder from "./file-system.vue"

const dialogVisible = ref<boolean>(true)
const isConnected = ref<boolean>(false)
const loading = ref<boolean>(false)
export interface PrefixConfig {
  wsServer: string // WebSocket 服务器地址
  prefix: string // 前缀地址
}

const prefix = ref<PrefixConfig>()
const connect = () => {
  loading.value = true
  connectApi({
    resource_id: Number(resourceId),
    type: "ssh"
  })
    .then(() => {
      prefix.value = getPrefixConfig()
      isConnected.value = true
      dialogVisible.value = false
    })
    .catch((err) => {
      if (err.msg === undefined) {
        ElMessage.error("连接超时")
      }
    })
    .finally(() => {
      loading.value = false
    })
}

function getPrefixConfig() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  const host = window.location.host

  return {
    wsServer: `${protocol}//${host}`,
    prefix: `${window.location.protocol}//${window.location.host}`
  }
}
</script>

<style scoped></style>
