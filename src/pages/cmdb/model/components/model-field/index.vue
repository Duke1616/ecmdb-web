<template>
  <div class="field-management">
    <ModelFieldToolbar
      v-model:keyword="searchInput"
      v-model:drag-mode="isDragMode"
      :expanded="allExpanded"
      @create-group="openCreateGroupDialog"
      @toggle-expand="toggleAllGroups"
      @custom-columns="handleSortDrawer"
    />

    <div class="groups-container" :class="{ 'dragging-groups': isGroupDragging }">
      <VueDraggable
        v-model="attributeGroups"
        :disabled="!!searchInput || !isDragMode"
        :animation="150"
        handle=".group-drag-handle"
        ghost-class="ghost"
        drag-class="group-dragging"
        :scroll="true"
        :force-autoscroll="true"
        :scroll-sensitivity="100"
        :scroll-speed="10"
        :bubble-scroll="true"
        @start="startGroupDrag"
        @end="sortGroup"
      >
        <ModelAttributeGroupCard
          v-for="group in visibleGroups"
          :key="group.group_id"
          :group="group"
          :drag-mode="isDragMode"
          :disabled="!!searchInput || !isDragMode"
          @toggle="toggleGroup"
          @add-field="openCreateField"
          @command="handleGroupCommand"
          @update-attributes="updateGroupAttributes"
          @sort-attribute="sortAttribute"
          @edit-field="openEditField"
          @delete-field="deleteField"
        />
      </VueDraggable>
    </div>

    <FormDialog
      v-model="dialogAttrGroupVisible"
      :title="isEditGroup ? '重命名分组' : '新增分组'"
      subtitle="创建新的属性分组"
      width="500px"
      header-icon="Folder"
      @closed="() => {}"
      @confirm="submitAttributeGroup"
      @cancel="dialogAttrGroupVisible = false"
    >
      <el-form ref="attrGroupRef" :model="attrGroup" :rules="attrGroupRules" label-width="80px" class="dialog-form">
        <el-form-item prop="group_name" label-position="top" label="组名称">
          <el-input v-model="attrGroup.group_name" placeholder="请输入分组名称" class="form-input" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <createOrUpdateField
      v-model="attrFieldVisible"
      :model-uid="modelUid"
      :group-id="groupId"
      :active-attribute="activeAttribute"
      :readonly="isReadonly"
      @success="getAttributesData"
    />

    <sortField
      v-model="sortFieldVisible"
      :model-uid="modelUid"
      :attributes-data="attributeGroups"
      @success="getAttributesData"
    />
  </div>
</template>

<script lang="ts" setup>
import { FormDialog } from "@@/components/Dialogs"
import { VueDraggable } from "vue-draggable-plus"
import { useModelFields } from "../../composables/useModelFields"
import createOrUpdateField from "./create-or-update.vue"
import sortField from "./sort.vue"
import ModelAttributeGroupCard from "./ModelAttributeGroupCard.vue"
import ModelFieldToolbar from "./ModelFieldToolbar.vue"

defineOptions({ name: "ModelField" })

const { modelUid } = defineProps<{ modelUid: string }>()

const {
  searchInput,
  isDragMode,
  attributeGroups,
  visibleGroups,
  allExpanded,
  isGroupDragging,
  groupId,
  attrFieldVisible,
  activeAttribute,
  isReadonly,
  sortFieldVisible,
  dialogAttrGroupVisible,
  isEditGroup,
  attrGroupRef,
  attrGroup,
  attrGroupRules,
  getAttributesData,
  openCreateField,
  openEditField,
  deleteField,
  toggleGroup,
  toggleAllGroups,
  updateGroupAttributes,
  sortAttribute,
  startGroupDrag,
  sortGroup,
  openCreateGroupDialog,
  submitAttributeGroup,
  handleGroupCommand,
  openSortDrawer: handleSortDrawer
} = useModelFields(() => modelUid)
</script>

<style lang="scss" scoped>
/* 属性管理样式 */
.field-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
</style>

<style>
/* 拖拽 ghost 占位符：完全隐藏以避免“复制”效果 */
.ghost {
  opacity: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* 拖拽时的克隆元素样式 */
.sortable-drag {
  opacity: 1 !important;
  background: #ffffff !important;
  border: 1px solid #2563eb !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  cursor: grabbing !important;
  transition: none !important; /* Fix drag lag */

  /* 关键：因为脱离了 grid 布局，需要指定宽度 */
  width: 240px !important;
  height: auto !important;
  z-index: 10000 !important;
  transform: scale(1.02);
}

/* 隐藏拖拽元素中的操作按钮 */
.sortable-drag .field-actions {
  display: none !important;
}

/* 修复 Tag 样式在 body 中可能失效的问题（如果 scoped 属性没生效） */
.sortable-drag .el-tag {
  background-color: #eff6ff !important;
  border-color: #bfdbfe !important;
  color: #1e40af !important;
}

.sortable-drag .el-tag--warning {
  background-color: #fef3c7 !important;
  border-color: #fcd34d !important;
  color: #a16207 !important;
}

/* 分组拖拽时的样式 - 只显示标题条 */
.group-dragging {
  opacity: 0.8 !important;
  background: #eef2ff !important;
  border: 2px dashed #2563eb !important;

  /* 强制限制高度，只保留标题栏 */
  max-height: 60px !important;
  overflow: hidden !important;

  /* 强制隐藏分组详情内容 */
  .fields-container {
    display: none !important;
  }

  /* 箭头保持收起状态 */
  .toggle-icon {
    transform: rotate(0deg) !important;
  }
}

/* 拖拽分组时，隐藏所有分组的内容 */
.groups-container.dragging-groups {
  .group-card:not(.group-dragging) {
    .fields-container {
      display: none !important;
    }

    .toggle-icon {
      transform: rotate(0deg) !important;
    }
  }
}
</style>
