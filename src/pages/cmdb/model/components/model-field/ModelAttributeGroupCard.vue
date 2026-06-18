<template>
  <div class="group-card">
    <div class="group-header" @click="emit('toggle', group)">
      <div class="group-info">
        <el-icon class="toggle-icon" :class="{ expanded: group.expanded }">
          <ArrowRight />
        </el-icon>
        <h3 class="group-title">{{ group.group_name }}</h3>
        <el-tag size="small" type="info">{{ group.attributes?.length || 0 }}</el-tag>
      </div>

      <div v-if="!dragMode" class="group-actions">
        <el-tooltip content="重命名分组" placement="top" :show-after="500">
          <AuthButton
            link
            class="action-icon-btn rename-btn"
            :disabled="!hasPermission(CMDB_CAPABILITIES.Attribute.GroupRename)"
            @click.stop="emit('command', 'rename', group)"
          >
            <el-icon><Edit /></el-icon>
          </AuthButton>
        </el-tooltip>

        <el-tooltip content="删除属性分组" placement="top" :show-after="500">
          <AuthButton
            link
            class="action-icon-btn delete-btn"
            :disabled="!hasPermission(CMDB_CAPABILITIES.Attribute.GroupDelete)"
            @click.stop="emit('command', 'delete', group)"
          >
            <el-icon><Delete /></el-icon>
          </AuthButton>
        </el-tooltip>
      </div>

      <div v-else class="drag-handle-icon group-drag-handle">
        <el-icon><Rank /></el-icon>
      </div>
    </div>

    <div v-if="group.expanded" class="fields-container">
      <div v-if="(group.attributes?.length || 0) === 0 && !dragMode" class="empty-placeholder-wrapper">
        <AuthButton
          class="empty-placeholder-card"
          :capability="CMDB_CAPABILITIES.Attribute.Add"
          disable-mode
          @click.stop="emit('add-field', group.group_id)"
        >
          <el-icon class="add-icon"><Plus /></el-icon>
          <span class="add-text">该分组下暂无属性，点击添加</span>
        </AuthButton>
      </div>

      <VueDraggable
        v-else
        :model-value="group.attributes || []"
        class="fields-grid"
        :class="{ 'is-empty': !(group.attributes || []).length }"
        :group="{ name: 'attributes', pull: true, put: true }"
        ghost-class="ghost"
        fallback-class="sortable-drag"
        :animation="150"
        :disabled="disabled"
        filter=".undraggable"
        :data-group-id="group.group_id"
        :force-fallback="true"
        :fallback-on-body="true"
        :scroll="true"
        :force-autoscroll="true"
        :scroll-sensitivity="100"
        :scroll-speed="10"
        :bubble-scroll="true"
        @update:model-value="emit('update-attributes', group.group_id, $event)"
        @end="emit('sort-attribute', $event)"
      >
        <ModelFieldCard
          v-for="item in group.attributes || []"
          :key="item.id"
          :field="item"
          @edit="emit('edit-field', group.group_id, item)"
          @delete="emit('delete-field', $event)"
        />

        <!-- 追加在末尾的虚拟卡片，与普通属性卡片同等大小，且不可拖拽 -->
        <AuthButton
          v-if="!dragMode"
          class="add-placeholder-card undraggable"
          :capability="CMDB_CAPABILITIES.Attribute.Add"
          disable-mode
          @click.stop="emit('add-field', group.group_id)"
        >
          <el-icon><Plus /></el-icon>
          <span>添加属性</span>
        </AuthButton>
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Delete, Edit, Plus, Rank } from "@element-plus/icons-vue"
import { VueDraggable } from "vue-draggable-plus"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import type { AttributeGroupView } from "@/common/utils/attribute"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { usePermission } from "@/common/composables/usePermission"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import ModelFieldCard from "./ModelFieldCard.vue"

defineProps<{
  group: AttributeGroupView
  dragMode: boolean
  disabled: boolean
}>()

const { hasPermission } = usePermission()

const emit = defineEmits<{
  toggle: [group: AttributeGroupView]
  "add-field": [groupId: number]
  command: [command: string, group: AttributeGroupView]
  "update-attributes": [groupId: number, attributes: Attribute[]]
  "sort-attribute": [event: any]
  "edit-field": [groupId: number, field: Attribute]
  "delete-field": [field: Attribute]
}>()
</script>

<style lang="scss" scoped>
.group-card {
  margin-bottom: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  cursor: pointer;
  background: #f8fafc;
  border-bottom: 1px solid #d1d5db;
  transition: background-color 0.2s;

  &:hover {
    background: #f1f5f9;
  }
}

.group-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.toggle-icon {
  color: #6b7280;
  transition: transform 0.2s ease;

  &.expanded {
    transform: rotate(90deg);
  }
}

.group-title {
  margin: 0;
  overflow: hidden;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 24px !important;
  min-width: 24px !important;
  height: 24px !important;
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
    width: 14px !important;
    height: 14px !important;
    transition: color 0.2s ease;

    svg {
      width: 14px !important;
      height: 14px !important;
    }
  }

  &.rename-btn {
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
    background-color: #f1f5f9 !important;
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;

    :deep(.el-icon) {
      color: #94a3b8 !important; // 禁用置灰
    }
  }
}

.drag-handle-icon {
  margin-left: auto;
  color: #9ca3af;
  font-size: 18px;
  cursor: move;
}

.fields-container {
  padding: 20px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  user-select: none;
}

.empty-placeholder-wrapper {
  width: 100%;
}

.empty-placeholder-card,
.add-placeholder-card {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.25s ease;

  .add-icon,
  :deep(.el-icon) {
    font-size: 16px;
    font-weight: bold;
  }

  .add-text,
  span {
    font-size: 14px;
    font-weight: 500;
  }

  &:hover:not(:disabled) {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  }

  &:disabled,
  &.is-disabled {
    background: #f1f5f9;
    border-color: #e2e8f0;
    color: #cbd5e1;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    pointer-events: none;
  }
}

.add-placeholder-card {
  height: 85px; // 微调非空网格中占位卡片的高度为 85px，与普通 ModelFieldCard 对齐
  flex-direction: column; // 垂直居中排列，显得更加精致
  background: #ffffff; // 背景色为白，与有卡片网格的背景色呼应
}
</style>
