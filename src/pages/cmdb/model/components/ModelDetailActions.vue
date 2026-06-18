<template>
  <div class="model-detail-actions">
    <AuthButton
      class="u-gov-btn is-primary"
      :loading="exporting"
      :disabled="!modelUid"
      :capability="CMDB_CAPABILITIES.DataIO.ExportTemplate"
      disable-mode
      @click="emit('export')"
    >
      <el-icon v-if="!exporting"><Download /></el-icon>
      <span>{{ exporting ? "导出中..." : "导出模板" }}</span>
    </AuthButton>

    <AuthButton
      class="u-gov-btn is-danger"
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
import { Delete, Download } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

defineProps<{
  modelUid: string
  builtin: boolean
  exporting: boolean
}>()

const emit = defineEmits<{
  export: []
  delete: []
}>()
</script>

<style lang="scss" scoped>
.model-detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .model-detail-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
