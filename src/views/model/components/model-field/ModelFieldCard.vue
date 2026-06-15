<template>
  <div class="field-item" :data-id="field.id" @click="emit('detail', field)">
    <div class="field-content">
      <div class="field-header-info">
        <h4 class="field-name">{{ field.field_name }}</h4>

        <div class="field-actions">
          <AuthButton
            type="primary"
            link
            :icon="Edit"
            size="small"
            class="action-btn edit-btn"
            title="编辑"
            :capability="CMDB_CAPABILITIES.Model.Create"
            disable-mode
            @click.stop="emit('edit', field)"
          />
          <AuthButton
            type="danger"
            link
            :icon="Delete"
            size="small"
            class="action-btn delete-btn"
            :capability="CMDB_CAPABILITIES.Model.Delete"
            :disabled="field.builtin"
            disable-mode
            :title="field.builtin ? '内置字段不可删除' : '删除'"
            @click.stop="emit('delete', field)"
          />
        </div>
      </div>

      <div class="field-details">
        <el-tag size="small" type="primary">{{ field.field_type }}</el-tag>
        <el-tag v-if="field.builtin" size="small" type="warning" effect="light">内置</el-tag>
        <code class="field-uid">{{ field.field_uid }}</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit } from "@element-plus/icons-vue"
import type { Attribute } from "@/api/attribute/types/attribute"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

defineProps<{
  field: Attribute
}>()

const emit = defineEmits<{
  detail: [field: Attribute]
  edit: [field: Attribute]
  delete: [field: Attribute]
}>()
</script>

<style lang="scss" scoped>
.field-item {
  position: relative;
  min-height: 85px;
  padding: 14px;
  user-select: none;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2);
    transform: translateY(-2px);

    .field-actions {
      opacity: 1;
      visibility: visible;
    }
  }
}

.field-content {
  user-select: none;
}

.field-header-info {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.field-name {
  flex: 1;
  padding-right: 50px;
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  user-select: none;
}

.field-actions {
  position: absolute;
  top: 0;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  min-width: 22px;
  height: 22px;
  padding: 0;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    color: #f87171;
    cursor: not-allowed;
    background: #fde4e4;
    opacity: 0.5;
    transform: none !important;
  }

  :deep(.el-icon) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    margin: 0;
  }

  &.edit-btn {
    color: #1d4ed8;
    background: #dbeafe;

    &:hover {
      color: #ffffff;
      background: #1d4ed8;
      transform: scale(1.1);
    }
  }

  &.delete-btn {
    color: #dc2626;
    background: #fee2e2;

    &:hover {
      color: #ffffff;
      background: #dc2626;
      transform: scale(1.1);
    }
  }
}

.field-details {
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;

  :deep(.el-tag) {
    color: #1e40af;
    font-weight: 500;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }

  :deep(.el-tag.el-tag--warning) {
    color: #a16207;
    background: #fef3c7;
    border-color: #fcd34d;
  }
}

.field-uid {
  padding: 3px 6px;
  color: #4b5563;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  user-select: none;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
</style>
