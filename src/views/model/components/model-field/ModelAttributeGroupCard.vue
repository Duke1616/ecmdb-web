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
        <el-tooltip content="添加字段" placement="top" :show-after="500">
          <AuthButton
            type="primary"
            link
            :icon="CirclePlus"
            class="action-icon-btn"
            :capability="CMDB_CAPABILITIES.Model.Create"
            disable-mode
            @click.stop="emit('add-field', group.group_id)"
          />
        </el-tooltip>

        <el-dropdown trigger="click" @command="(command) => emit('command', command as string, group)">
          <el-button link class="action-icon-btn more-btn" @click.stop>
            <el-icon><MoreFilled /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="group-action-dropdown">
              <el-dropdown-item
                command="rename"
                :icon="Edit"
                :disabled="!hasPermission(CMDB_CAPABILITIES.Model.Create)"
              >
                重命名
              </el-dropdown-item>
              <el-dropdown-item
                command="delete"
                :icon="Delete"
                class="delete-item"
                :disabled="!hasPermission(CMDB_CAPABILITIES.Model.Delete)"
              >
                删除分组
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div v-else class="drag-handle-icon group-drag-handle">
        <el-icon><Rank /></el-icon>
      </div>
    </div>

    <div v-if="group.expanded" class="fields-container">
      <VueDraggable
        :model-value="group.attributes || []"
        class="fields-grid"
        :class="{ 'is-empty': !group.attributes?.length }"
        :group="{ name: 'attributes', pull: true, put: true }"
        ghost-class="ghost"
        fallback-class="sortable-drag"
        :animation="150"
        :disabled="disabled"
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
          v-for="item in group.attributes"
          :key="item.id"
          :field="item"
          @detail="emit('field-detail', $event)"
          @edit="emit('edit-field', group.group_id, item)"
          @delete="emit('delete-field', $event)"
        />
      </VueDraggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, CirclePlus, Delete, Edit, MoreFilled, Rank } from "@element-plus/icons-vue"
import { VueDraggable } from "vue-draggable-plus"
import type { Attribute, AttributeGroup } from "@/api/attribute/types/attribute"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { usePermission } from "@/common/composables/usePermission"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import ModelFieldCard from "./ModelFieldCard.vue"

defineProps<{
  group: AttributeGroup
  dragMode: boolean
  disabled: boolean
}>()

const { hasPermission } = usePermission()

const emit = defineEmits<{
  toggle: [group: AttributeGroup]
  "add-field": [groupId: number]
  command: [command: string, group: AttributeGroup]
  "update-attributes": [groupId: number, attributes: Attribute[]]
  "sort-attribute": [event: any]
  "field-detail": [field: Attribute]
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
  gap: 4px;
}

.action-icon-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  color: #6b7280;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #1f2937;
    background-color: #e5e7eb;
  }

  &.more-btn {
    transform: rotate(90deg);
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
</style>
