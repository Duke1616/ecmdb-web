<template>
  <div class="model-detail-actions">
    <el-button type="primary" class="u-gov-btn" :loading="exporting" :disabled="!modelUid" @click="emit('export')">
      <el-icon v-if="!exporting"><Download /></el-icon>
      <span>{{ exporting ? "导出中..." : "导出模板" }}</span>
    </el-button>

    <el-button class="u-gov-btn" :disabled="!modelUid" @click="emit('disable')">
      <el-icon><CircleClose /></el-icon>
      <span>禁用模型</span>
    </el-button>

    <AuthButton
      type="danger"
      class="u-gov-btn is-danger-btn"
      :capability="CMDB_CAPABILITIES.Model.Delete"
      :disabled="builtin"
      disable-mode
      @click="emit('delete')"
    >
      <el-icon><Delete /></el-icon>
      <span>删除模型</span>
    </AuthButton>
  </div>
</template>

<script setup lang="ts">
import { CircleClose, Delete, Download } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

defineProps<{
  modelUid: string
  builtin: boolean
  exporting: boolean
}>()

const emit = defineEmits<{
  export: []
  disable: []
  delete: []
}>()
</script>

<style lang="scss" scoped>
.model-detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.u-gov-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 600;

  &.is-danger-btn {
    color: #ffffff;
    background-color: #ef4444;
    border-color: #ef4444;

    &:hover {
      background-color: #dc2626;
      border-color: #dc2626;
    }
  }
}

@media (max-width: 768px) {
  .model-detail-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
