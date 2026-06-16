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
        v-model="AttributesData"
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
        @start="handleSortGroupStart"
        @end="handleSortGroup"
      >
        <ModelAttributeGroupCard
          v-for="group in filterData"
          :key="group.group_id"
          :group="group"
          :drag-mode="isDragMode"
          :disabled="!!searchInput || !isDragMode"
          :fields="group.attributes || []"
          :expanded="group.expanded"
          :field-count="group.attributes?.length || 0"
          @toggle="toggleGroup"
          @add-field="handleAddAttr"
          @command="handleGroupCommand"
          @update-attributes="updateGroupAttributes"
          @sort-attribute="handleSortAttribute"
          @edit-field="handleUpdateAttr"
          @delete-field="handleDelete"
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
      @confirm="handlerAddAttributeGroup"
      @cancel="dialogAttrGroupVisible = false"
    >
      <el-form ref="attrGroupRef" :model="AttrGroup" :rules="attrGroupRules" label-width="80px" class="dialog-form">
        <el-form-item prop="group_name" label-position="top" label="组名称">
          <el-input v-model="AttrGroup.group_name" placeholder="请输入分组名称" class="form-input" />
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
      v-model="sortFieldVisibe"
      :model-uid="modelUid"
      :attributes-data="AttributesData"
      @success="getAttributesData"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue"
import {
  getModelAttributesWithGroupsApi,
  DeleteAttributeApi,
  createAttributeGroupApi,
  renameAttributeGroupApi,
  deleteAttributeGroupApi,
  SortAttributeApi,
  SortAttributeGroupApi
} from "@/api/attribute"
import { type Attribute } from "@/api/attribute/types/attribute"
import { useCrudAttributeGroup } from "../../composables/useCrudAttributeGroup"
import { type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import createOrUpdateField from "./create-or-update.vue"
import sortField from "./sort.vue"
import ModelAttributeGroupCard from "./ModelAttributeGroupCard.vue"
import ModelFieldToolbar from "./ModelFieldToolbar.vue"
import { VueDraggable } from "vue-draggable-plus"
import { createAttributeSchema, type AttributeGroupView } from "@/common/utils/attribute"

defineOptions({ name: "ModelField" })

const searchInput = ref("")
const isDragMode = ref(false)

// Props Destructuring
const { modelUid } = defineProps<{ modelUid: string }>()

//** 前端动态表单排序 */
const handleSortDrawer = () => {
  sortFieldVisibe.value = true
}

//** 获取字段信息 */
const AttributesData = ref<AttributeGroupView[]>([])
const getAttributesData = () => {
  getModelAttributesWithGroupsApi(modelUid)
    .then(({ data }) => {
      AttributesData.value = createAttributeSchema(data).groups
    })
    .catch(() => {
      AttributesData.value = []
    })
}

//** 添加 OR 修改字段属性 */
const groupId = ref<number>()
const attrFieldVisible = ref<boolean>(false)
const activeAttribute = ref<Attribute | null>(null)
const isReadonly = ref<boolean>(false)

const handleAddAttr = (group_id: number) => {
  groupId.value = group_id
  activeAttribute.value = null
  isReadonly.value = false
  attrFieldVisible.value = true
}

const handleUpdateAttr = (group_id: number, row: Attribute) => {
  groupId.value = group_id
  activeAttribute.value = row
  isReadonly.value = false
  attrFieldVisible.value = true
}

//** 属性表格展示排序 */
const sortFieldVisibe = ref<boolean>(false)

//** 组展开 */
const toggleGroup = (group: AttributeGroupView) => {
  group.expanded = !group.expanded
}

const updateGroupAttributes = (groupId: number, attributes: Attribute[]) => {
  const group = AttributesData.value.find((item) => item.group_id === groupId)
  if (group) group.attributes = attributes
}

//** 前端过滤展示 (Computed) */
const filterData = computed(() => {
  if (!searchInput.value.trim()) {
    return AttributesData.value
  }

  const query = searchInput.value.trim().toLowerCase()
  const foundAttrs: AttributeGroupView[] = []

  AttributesData.value.forEach((group) => {
    if (Array.isArray(group.attributes)) {
      const matchingAttrs = group.attributes.filter(
        (attr) => attr.field_uid.toLowerCase().includes(query) || attr.field_name.toLowerCase().includes(query)
      )
      if (matchingAttrs.length > 0) {
        foundAttrs.push({
          ...group,
          attributes: matchingAttrs,
          expanded: true
        })
      }
    }
  })

  return foundAttrs
})

const handleDelete = (row: Attribute) => {
  if (row.builtin) {
    ElMessage.warning("内置属性不可删除")
    return
  }
  ElMessageBox.confirm(`正在删除属性: ${row.field_name} 确认删除？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    dangerouslyUseHTMLString: true,
    message: `<p>正在删除属性: <span style="color: red">${row.field_name}</span> 确认删除？</p>`
  }).then(() => {
    DeleteAttributeApi(row.id).then(() => {
      ElMessage.success("删除成功")
      getAttributesData()
    })
  })
}

const handleSortAttribute = (evt: any) => {
  const { newIndex, to, item } = evt
  if (newIndex === undefined || !to || !item) return

  const targetGroupId = Number(to.dataset.groupId)
  const itemId = Number(item.dataset.id)

  if (!targetGroupId || !itemId) return

  SortAttributeApi({
    id: itemId,
    target_group_id: targetGroupId,
    target_position: newIndex
  })
    .then(() => {
      ElMessage.success("排序更新成功")
      // 不需要全量刷新，因为 VueDraggable 更细粒度控制了视图
      // getAttributesData()
    })
    .catch(() => {
      getAttributesData() // 失败时刷新以恢复原状
    })
}

//** 分组拖拽排序 */
// NOTE: 拖拽分组时的标志，用于通过 CSS 控制显示
const isGroupDragging = ref(false)

const handleSortGroupStart = () => {
  isGroupDragging.value = true
}

const handleSortGroup = (evt: any) => {
  isGroupDragging.value = false

  const { newIndex } = evt
  if (newIndex === undefined) return

  const group = AttributesData.value[newIndex]
  if (!group) return

  SortAttributeGroupApi({
    id: group.group_id,
    target_position: newIndex
  })
    .then(() => {
      ElMessage.success("分组排序更新成功")
    })
    .catch(() => {
      getAttributesData()
    })
}

// Attribute Group CRUD
const {
  dialogVisible: dialogAttrGroupVisible,
  isEditMode: isEditGroup,
  formRef: attrGroupRef,
  formData: AttrGroup,
  openCreateDialog: openCreateGroupDialog,
  openEditDialog: handleRenameGroup,
  handleDelete: handleDeleteGroup,
  handleSubmit: handlerAddAttributeGroup
} = useCrudAttributeGroup<AttributeGroupView>({
  createApi: (data) => createAttributeGroupApi({ ...data, model_uid: modelUid }),
  updateApi: renameAttributeGroupApi,
  deleteApi: deleteAttributeGroupApi,
  refreshData: getAttributesData,
  checkDeleteable: (item) => (item.attributes && item.attributes.length > 0 ? "分组下存在属性，无法删除" : true),
  confirmDeleteText: (item) => `确认删除分组 "${item.group_name}" 吗？`
})

const attrGroupRules: FormRules = {
  group_name: [{ required: true, message: "必须输入分组名称", trigger: "blur" }]
}

const handleGroupCommand = (command: string, group: AttributeGroupView) => {
  if (command === "rename") {
    handleRenameGroup(group)
  } else if (command === "delete") {
    handleDeleteGroup(group)
  }
}

// Watchers
watch(
  () => modelUid,
  (newVal) => {
    if (newVal) getAttributesData()
  },
  { immediate: true }
)

//** 全部展开/收起功能 */
const allExpanded = ref(false)
const toggleAllGroups = () => {
  allExpanded.value = !allExpanded.value
  filterData.value.forEach((group) => {
    group.expanded = allExpanded.value
  })
}
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
