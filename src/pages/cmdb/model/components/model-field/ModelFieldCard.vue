<template>
  <div class="field-item" :class="{ 'is-secure': field.secure }" :data-id="field.id">
    <div class="field-content">
      <div class="field-header-info">
        <h4 class="field-name">
          <el-icon v-if="field.secure" class="secure-title-icon"><Lock /></el-icon>
          <el-tooltip v-if="field.required" content="必填属性" placement="top" :show-after="400">
            <span class="required-dot" />
          </el-tooltip>
          <span>{{ field.field_name }}</span>
        </h4>

        <div class="field-actions">
          <AuthButton
            link
            class="action-btn edit-btn"
            title="编辑"
            :capability="CMDB_CAPABILITIES.Attribute.Edit"
            disable-mode
            @click.stop="emit('edit', field)"
          >
            <el-icon><Edit /></el-icon>
          </AuthButton>

          <el-tooltip v-if="field.builtin" content="内置属性由系统维护，不支持删除" placement="top" :show-after="300">
            <span class="builtin-field-lock">
              <el-icon><Lock /></el-icon>
            </span>
          </el-tooltip>

          <template v-else>
            <AuthButton
              link
              class="action-btn delete-btn"
              :capability="CMDB_CAPABILITIES.Attribute.Delete"
              disable-mode
              title="删除"
              @click.stop="emit('delete', field)"
            >
              <el-icon><Delete /></el-icon>
            </AuthButton>
          </template>
        </div>
      </div>

      <div class="field-details">
        <el-tag size="small" type="primary">{{ field.field_type }}</el-tag>
        <el-tag v-if="field.builtin" size="small" type="warning" effect="light">内置</el-tag>
        <el-tooltip :content="field.field_uid" placement="top" :show-after="400">
          <code class="field-uid">{{ field.field_uid }}</code>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Edit, Lock } from "@element-plus/icons-vue"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"

defineProps<{
  field: Attribute
}>()

const emit = defineEmits<{
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
  cursor: default;
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

  &.is-secure {
    background: linear-gradient(90deg, #fff7ed 0, #ffffff 18%);
    border-color: #fed7aa;
    box-shadow: inset 3px 0 0 #f97316;

    &:hover {
      border-color: #f97316;
      box-shadow:
        inset 3px 0 0 #f97316,
        0 6px 16px rgba(249, 115, 22, 0.18);
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
  margin-bottom: 12px;
}

.field-name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding-right: 50px;
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  user-select: none;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.secure-title-icon {
  flex-shrink: 0;
  color: #ea580c;
  font-size: 14px;
}

.required-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 999px;
  box-shadow: 0 0 0 3px #fee2e2;
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

.builtin-field-lock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.action-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 22px !important;
  min-width: 22px !important;
  height: 22px !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 4px;
  transition: all 0.2s ease;
  box-sizing: border-box !important;
  cursor: pointer !important;

  :deep(.el-icon) {
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 12px !important;
    height: 12px !important;
    transition: color 0.2s ease;

    svg {
      width: 12px !important;
      height: 12px !important;
    }
  }

  &.edit-btn {
    background-color: #dbeafe !important; // 默认浅蓝底

    :deep(.el-icon) {
      color: #1d4ed8 !important; // 默认蓝字
    }

    &:hover:not(:disabled),
    &:focus:not(:disabled),
    &:active:not(:disabled) {
      background-color: #1d4ed8 !important; // hover 变深蓝底
      transform: scale(1.1) !important;
      box-shadow: 0 2px 6px rgba(29, 78, 216, 0.3) !important;

      :deep(.el-icon) {
        color: #ffffff !important; // hover 图标变白
      }
    }
  }

  &.delete-btn {
    background-color: #fee2e2 !important; // 默认浅红底

    :deep(.el-icon) {
      color: #dc2626 !important; // 默认红字
    }

    &:hover:not(:disabled),
    &:focus:not(:disabled),
    &:active:not(:disabled) {
      background-color: #dc2626 !important; // hover 变深红底
      transform: scale(1.1) !important;
      box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3) !important;

      :deep(.el-icon) {
        color: #ffffff !important; // hover 图标变白
      }
    }
  }

  &:disabled,
  &.is-disabled {
    background-color: #fde4e4 !important;
    opacity: 0.5 !important;
    cursor: not-allowed !important;
    transform: none !important;
    pointer-events: none !important;

    :deep(.el-icon) {
      color: #f87171 !important;
    }
  }
}

.field-details {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  user-select: none;

  :deep(.el-tag) {
    flex-shrink: 0;
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
  display: inline-block;
  min-width: 0;
  max-width: 150px;
  padding: 3px 6px;
  overflow: hidden;
  color: #4b5563;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
</style>
