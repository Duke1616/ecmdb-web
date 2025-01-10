<template>
  <div class="term-container">
    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      :title="title"
      width="500"
      draggable
    >
      <div class="connection-options">
        <div
          v-for="option in options"
          :key="option"
          class="connection-option"
          :class="{ selected: selectedOption === option }"
          @click="selectedOption = option"
        >
          {{ option }}
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="connect" :loading="loading" :disabled="!selectedOption"> 连接 </el-button>
        </div>
      </template>
    </el-dialog>

    <finder v-if="isConnected && selectedOption === 'Web Sftp'" :resource_id="resourceId" :prefix="prefix" />
    <xterm v-if="isConnected && selectedOption === 'Web Shell'" :resource_id="resourceId" :prefix="prefix" />
    <guacd v-if="isConnected && selectedOption === 'RDP'" :resource_id="resourceId" :prefix="prefix" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { connectApi } from "@/api/term"
import { useRoute } from "vue-router"
const route = useRoute()
const resourceId = route.query.resource_id as string
const title = route.query.title as string

import { ElMessage } from "element-plus"
const selectedOption = ref("Web Shell")

import guacd from "./guacd.vue"
import xterm from "./xterm.vue"
import finder from "./file-system.vue"
const options = ["Web Shell", "Web Sftp", "RDP", "VNC"]

const dialogVisible = ref<boolean>(true)
const isConnected = ref<boolean>(false)
const loading = ref<boolean>(false)
export interface PrefixConfig {
  wsServer: string
  prefix: string
}

const prefix = ref<PrefixConfig>()
const connect = () => {
  loading.value = true
  connectApi({
    resource_id: Number(resourceId),
    type: selectedOption.value
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

<style scoped>
.term-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.connection-options {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
}

.connection-option {
  padding: 12px 24px;
  border-radius: 20px;
  border: 2px solid #dcdfe6;
  background: #fff;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.connection-option.selected {
  background: linear-gradient(135deg, #67c23a, #95d475);
  color: white;
  border: none;
  font-weight: 600;
  box-shadow: 0 6px 12px rgba(103, 194, 58, 0.5);
  transform: scale(1.1);
}

.connection-option:hover {
  border-color: #67c23a;
  transform: scale(1.05);
}

.dialog-footer {
  text-align: center;
}

.el-button {
  background: linear-gradient(135deg, #5b9efc, #2b80f3);
  border-radius: 20px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(91, 158, 252, 0.6);
}
</style>
