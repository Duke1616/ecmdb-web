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

    <el-tooltip v-if="builtin" content="内置模型由系统维护，不支持删除" placement="top">
      <span class="builtin-model-lock">
        <el-button class="u-gov-btn is-locked" disabled>
          <el-icon><Lock /></el-icon>
          <span>内置模型</span>
        </el-button>
      </span>
    </el-tooltip>

    <AuthButton
      v-else
      class="u-gov-btn is-danger"
      :capability="CMDB_CAPABILITIES.Model.Delete"
      disable-mode
      @click="emit('delete')"
    >
      <el-icon><Delete /></el-icon>
      <span>删除模型</span>
    </AuthButton>
  </div>
</template>

<script setup lang="ts">
import { Delete, Download, Lock } from "@element-plus/icons-vue"
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

.builtin-model-lock {
  display: inline-flex;
}

.is-locked {
  color: #64748b;
  background: #f8fafc;
  border-color: #dbe4ee;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .model-detail-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
