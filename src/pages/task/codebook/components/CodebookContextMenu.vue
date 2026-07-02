<template>
  <div v-if="visible" class="context-menu" :style="{ top: y + 'px', left: x + 'px' }">
    <div v-if="readonly" class="menu-readonly">
      <span class="readonly-dot" />
      <span>系统资源只读</span>
    </div>
    <div v-if="!readonly && target?.kind === 'DIRECTORY'" class="menu-group">
      <div
        class="menu-item"
        :class="{ disabled: !hasPermission(capabilities.Codebook.Add) }"
        @click="hasPermission(capabilities.Codebook.Add) && $emit('action', 'createFile')"
      >
        <el-icon><DocumentAdd /></el-icon>
        <span>新建脚本</span>
      </div>
      <div
        class="menu-item"
        :class="{ disabled: !hasPermission(capabilities.Codebook.Add) }"
        @click="hasPermission(capabilities.Codebook.Add) && $emit('action', 'createDir')"
      >
        <el-icon><FolderAdd /></el-icon>
        <span>新建目录</span>
      </div>
    </div>
    <div v-if="showDivider" class="menu-divider" />
    <div v-if="!readonly && target && target.id !== 0" class="menu-group">
      <div
        class="menu-item"
        :class="{ disabled: !hasPermission(capabilities.Codebook.Edit) }"
        @click="hasPermission(capabilities.Codebook.Edit) && $emit('action', 'edit')"
      >
        <el-icon><Edit /></el-icon>
        <span>信息</span>
      </div>
      <div
        class="menu-item danger"
        :class="{ disabled: !hasPermission(capabilities.Codebook.Delete) }"
        @click="hasPermission(capabilities.Codebook.Delete) && $emit('action', 'delete')"
      >
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Delete, DocumentAdd, Edit, FolderAdd } from "@element-plus/icons-vue"
import type { codebook } from "@/api/task/codebook/types/codebook"
import { usePermission } from "@/common/composables/usePermission"
import { TASK_CAPABILITIES } from "@/common/auth/capability"

const { hasPermission } = usePermission()
const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  target: codebook | null
  readonly?: boolean
}>()

const showDivider = computed(() => {
  return !props.readonly && props.target?.kind === "DIRECTORY" && props.target.id !== 0
})

defineEmits<{
  (e: "action", action: "createFile" | "createDir" | "edit" | "delete"): void
}>()
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 140px;
  padding: 4px;
  user-select: none;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.04);
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.12s ease;

  .el-icon {
    color: #64748b;
    font-size: 14px;
  }

  span {
    color: #334155;
    font-size: 12px;
    font-weight: 500;
  }

  &:hover {
    background-color: #f1f5f9;

    .el-icon {
      color: #2563eb;
    }

    span {
      color: #0f172a;
    }
  }

  &.danger:hover {
    background-color: #fef2f2;

    .el-icon {
      color: #dc2626;
    }

    span {
      color: #b91c1c;
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none;
  }
}

.menu-divider {
  height: 1px;
  margin: 4px 2px;
  background: #e2e8f0;
}

.menu-readonly {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 9px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.readonly-dot {
  width: 7px;
  height: 7px;
  background: #94a3b8;
  border-radius: 50%;
}
</style>
