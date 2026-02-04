<template>
  <div class="field-management">
    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input v-model="searchInput" placeholder="搜索字段..." :suffix-icon="Search" style="width: 300px" clearable />
      <div class="search-actions">
        <el-button type="primary" :icon="CirclePlus" @click="openCreateGroupDialog" size="default">
          新增分组
        </el-button>
        <el-button
          :type="isDragMode ? 'warning' : 'default'"
          :icon="isDragMode ? CircleCheck : Rank"
          plain
          @click="isDragMode = !isDragMode"
        >
          {{ isDragMode ? "完成排序" : "开启排序" }}
        </el-button>
        <el-button :icon="allExpanded ? Expand : ArrowUp" @click="toggleAllGroups" size="default">
          {{ allExpanded ? "全部收起" : "全部展开" }}
        </el-button>
        <el-button :icon="Setting" @click="handleSortDrawer" size="default"> 排序设置 </el-button>
      </div>
    </div>

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
        <div v-for="group in filterData" :key="group.group_id" class="group-card">
          <div class="group-header" @click="toggleGroup(group)">
            <div class="group-info">
              <el-icon class="toggle-icon" :class="{ expanded: group.expanded }">
                <ArrowRight />
              </el-icon>
              <h3 class="group-title">{{ group.group_name }}</h3>
              <el-tag size="small" type="info">{{ group.attributes?.length || 0 }}</el-tag>
            </div>
            <div class="group-actions" v-if="!isDragMode">
              <!-- 悬停/常驻 操作栏 -->
              <el-tooltip content="添加字段" placement="top" :show-after="500">
                <el-button
                  type="primary"
                  link
                  :icon="CirclePlus"
                  class="action-icon-btn"
                  @click.stop="handleAddAttr(group.group_id)"
                />
              </el-tooltip>

              <el-dropdown trigger="click" @command="(command) => handleGroupCommand(command, group)">
                <el-button link class="action-icon-btn more-btn" @click.stop>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="group-action-dropdown">
                    <el-dropdown-item command="rename" :icon="Edit">重命名</el-dropdown-item>
                    <el-dropdown-item command="delete" :icon="Delete" class="delete-item"> 删除分组 </el-dropdown-item>
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
              v-model="group.attributes"
              class="fields-grid"
              :class="{ 'is-empty': !group.attributes?.length }"
              :group="{ name: 'attributes', pull: true, put: true }"
              ghost-class="ghost"
              fallback-class="sortable-drag"
              :animation="150"
              :disabled="!!searchInput || !isDragMode"
              :data-group-id="group.group_id"
              :force-fallback="true"
              :fallback-on-body="true"
              :scroll="true"
              :force-autoscroll="true"
              :scroll-sensitivity="100"
              :scroll-speed="10"
              :bubble-scroll="true"
              @end="handleSortAttribute"
            >
              <div
                v-for="item in group.attributes"
                :key="item.id"
                class="field-item"
                :data-id="item.id"
                @click="detailInfo(item)"
              >
                <div class="field-content">
                  <div class="field-header-info">
                    <h4 class="field-name">{{ item.field_name }}</h4>
                    <!-- 重新设计悬停操作按钮，确保正确显示 -->
                    <div class="field-actions">
                      <el-button
                        type="primary"
                        link
                        :icon="Edit"
                        @click.stop="handleUpdateAttr(group.group_id, item)"
                        size="small"
                        class="action-btn edit-btn"
                        title="编辑"
                      />
                      <el-button
                        type="danger"
                        link
                        :icon="Delete"
                        @click.stop="handleDelete(item)"
                        size="small"
                        class="action-btn delete-btn"
                        :disabled="item.builtin"
                        :title="item.builtin ? '内置字段不可删除' : '删除'"
                      />
                    </div>
                  </div>
                  <div class="field-details">
                    <el-tag size="small" type="primary">{{ item.field_type }}</el-tag>
                    <el-tag v-if="item.builtin" size="small" type="warning" effect="light">内置</el-tag>
                    <code class="field-uid">{{ item.field_uid }}</code>
                  </div>
                </div>
              </div>
            </VueDraggable>
          </div>
        </div>
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

    <Drawer
      v-model="attrFieldVisible"
      title="字段管理"
      subtitle="添加或编辑模型字段"
      size="35%"
      direction="rtl"
      header-icon="Edit"
      :show-footer="true"
      cancel-button-text="取消"
      confirm-button-text="保存字段"
      @cancel="() => onClosed(false)"
      @confirm="handleFieldConfirm"
      @closed="() => onClosed(false)"
    >
      <createOrUpdateField
        ref="apiFieldRef"
        :model-uid="modelUid"
        :group-id="groupId"
        @close="onClosed"
        @getAttributesData="getAttributesData"
      />
    </Drawer>

    <Drawer
      v-model="sortFieldVisibe"
      title="排序设置"
      subtitle="设置字段显示顺序"
      size="35%"
      direction="rtl"
      header-icon="Setting"
      :show-footer="true"
      cancel-button-text="取消"
      confirm-button-text="保存设置"
      @cancel="() => sortClose(false)"
      @confirm="handleSortConfirm"
      @closed="() => sortClose(false)"
    >
      <sortField
        ref="sortFieldRef"
        :model-uid="modelUid"
        :attributes-data="AttributesData"
        @close="sortClose"
        @getAttributesData="getAttributesData"
      />
    </Drawer>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch, computed } from "vue"
import {
  Search,
  CirclePlus,
  Edit,
  Delete,
  Setting,
  ArrowRight,
  Expand,
  ArrowUp,
  MoreFilled,
  Rank,
  CircleCheck
} from "@element-plus/icons-vue"
import {
  getModelAttributesWithGroupsApi,
  DeleteAttributeApi,
  createAttributeGroupApi,
  renameAttributeGroupApi,
  deleteAttributeGroupApi,
  SortAttributeApi,
  SortAttributeGroupApi
} from "@/api/attribute"
import { type AttributeGroup, type Attribute } from "@/api/attribute/types/attribute"
import { usePagination } from "@/common/composables/usePagination"
import { useCrudAttributeGroup } from "./composables/useCrudAttributeGroup"
import { type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { FormDialog, Drawer } from "@@/components/Dialogs"
import createOrUpdateField from "./create-or-update.vue"
import sortField from "./sort.vue"
import { VueDraggable } from "vue-draggable-plus"

defineOptions({ name: "ModelField" })

const { paginationData } = usePagination()
const searchInput = ref("")
const cardDrawer = ref(false)
const loading = ref<boolean>(false)
const isDragMode = ref(false)

// Props Destructuring
const { modelUid } = defineProps<{ modelUid: string }>()

const currentItem = ref<Attribute>()

const detailInfo = (item: Attribute) => {
  currentItem.value = item
  cardDrawer.value = true
}

//** 前端动态表单排序 */
const handleSortDrawer = () => {
  sortFieldVisibe.value = true
  nextTick(() => {
    sortFieldRef.value?.handleSortFilter()
  })
}

//** 获取字段信息 */
const AttributesData = ref<AttributeGroup[]>([])
const getAttributesData = () => {
  loading.value = true
  getModelAttributesWithGroupsApi(modelUid)
    .then(({ data }) => {
      AttributesData.value = (data.attribute_groups || []).map((group) => ({
        ...group,
        attributes: group.attributes || []
      }))
    })
    .catch(() => {
      AttributesData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

//** 添加 OR 修改字段属性 */
const groupId = ref<number>()
const apiFieldRef = ref<InstanceType<typeof createOrUpdateField>>()
const attrFieldVisible = ref<boolean>(false)

const handleAddAttr = (group_id: number) => {
  attrFieldVisible.value = true
  groupId.value = group_id
  nextTick(() => {
    apiFieldRef.value?.resetForm()
  })
}

const handleUpdateAttr = (group_id: number, row: Attribute) => {
  attrFieldVisible.value = true
  row.group_id = group_id
  nextTick(() => {
    apiFieldRef.value?.setFrom(row)
  })
}

const onClosed = (val: boolean) => {
  attrFieldVisible.value = val
  if (!val) {
    nextTick(() => {
      apiFieldRef.value?.resetForm()
    })
  }
}

//** 属性表格展示排序 */
const sortFieldRef = ref<InstanceType<typeof sortField>>()
const sortFieldVisibe = ref<boolean>(false)

const sortClose = (val: boolean) => {
  sortFieldVisibe.value = val
}

const handleSortConfirm = async () => {
  const success = await sortFieldRef.value?.handlerCustomAttributeFieldColumns()
  if (success) {
    sortClose(false)
  }
}

const handleFieldConfirm = async () => {
  const success = await apiFieldRef.value?.handlerCreateOrUpdateAttribute()
  if (success) {
    onClosed(false)
  }
}

//** 组展开 */
const toggleGroup = (group: AttributeGroup) => {
  group.expanded = !group.expanded
}

//** 前端过滤展示 (Computed) */
const filterData = computed(() => {
  if (!searchInput.value.trim()) {
    return AttributesData.value
  }

  const query = searchInput.value.trim().toLowerCase()
  const foundAttrs: AttributeGroup[] = []

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
    ElMessage.warning("内置字段不可删除")
    return
  }
  ElMessageBox.confirm(`正在删除字段: ${row.field_name} 确认删除？`, "删除确认", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    dangerouslyUseHTMLString: true,
    message: `<p>正在删除字段: <span style="color: red">${row.field_name}</span> 确认删除？</p>`
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
      ElMessage.error("排序更新失败")
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
      ElMessage.error("分组排序更新失败")
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
} = useCrudAttributeGroup<AttributeGroup>({
  createApi: (data) => createAttributeGroupApi({ ...data, model_uid: modelUid }),
  updateApi: renameAttributeGroupApi,
  deleteApi: deleteAttributeGroupApi,
  refreshData: getAttributesData,
  checkDeleteable: (item) => (item.attributes && item.attributes.length > 0 ? "分组下存在字段，无法删除" : true),
  confirmDeleteText: (item) => `确认删除分组 "${item.group_name}" 吗？`
})

const attrGroupRules: FormRules = {
  group_name: [{ required: true, message: "必须输入分组名称", trigger: "blur" }]
}

const handleGroupCommand = (command: string, group: AttributeGroup) => {
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

watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  if (modelUid) getAttributesData()
})

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
/* 搜索区域样式 */
.search-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0px 0px 20px 0;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .search-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

/* 字段管理样式 */
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
  .group-card {
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);

    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #d1d5db;
      cursor: pointer;
      transition: background-color 0.2s;

      .group-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 1; /* Always visible */
        transition: opacity 0.2s ease;

        .action-icon-btn {
          width: 28px;
          height: 28px;
          border-radius: 4px; /* Soft square or circle */
          padding: 0;
          font-size: 16px;
          color: #6b7280;
          transition: all 0.2s;

          &:hover {
            background-color: #e5e7eb;
            color: #1f2937;
          }

          &.more-btn {
            transform: rotate(90deg);
          }
        }
      }

      &:hover {
        background: #f1f5f9;

        .group-actions {
          opacity: 1; /* Show on hover */
        }
      }

      .drag-handle-icon {
        color: #9ca3af;
        font-size: 18px;
        margin-left: auto;
        cursor: move;
      }

      .group-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .toggle-icon {
          transition: transform 0.2s ease;
          color: #6b7280;

          &.expanded {
            transform: rotate(90deg);
          }
        }

        .group-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
      }
    }

    .fields-container {
      padding: 20px;

      .fields-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        user-select: none;
      }
    }
  }
}

.field-item {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 85px;
  user-select: none;

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.2);
    transform: translateY(-2px);

    .field-actions {
      opacity: 1 !important;
      visibility: visible !important;
    }
  }

  .field-content {
    user-select: none;

    .field-header-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
      position: relative;

      .field-name {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
        flex: 1;
        line-height: 1.3;
        padding-right: 50px;
        user-select: none;
      }

      .field-actions {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 6px;
        opacity: 0;
        visibility: hidden;
        transition: all 0.2s ease;
        position: absolute;
        right: 8px;
        top: 0;

        .action-btn {
          width: 22px;
          height: 22px;
          padding: 0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          font-size: 12px;
          transition: all 0.2s ease;
          min-width: 22px;
          cursor: pointer;

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
            background: #fde4e4;
            color: #f87171;
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
            background: #dbeafe;
            color: #1d4ed8;

            &:hover {
              background: #1d4ed8;
              color: white;
              transform: scale(1.1);
            }
          }

          &.delete-btn {
            background: #fee2e2;
            color: #dc2626;

            &:hover {
              background: #dc2626;
              color: white;
              transform: scale(1.1);
            }
          }
        }
      }
    }

    .field-details {
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;

      :deep(.el-tag) {
        background: #eff6ff;
        color: #1e40af;
        border: 1px solid #bfdbfe;
        font-weight: 500;
      }

      :deep(.el-tag.el-tag--warning) {
        background: #fef3c7;
        color: #a16207;
        border-color: #fcd34d;
      }

      .field-uid {
        font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
        font-size: 11px;
        color: #4b5563;
        background: #f9fafb;
        padding: 3px 6px;
        border-radius: 4px;
        border: 1px solid #d1d5db;
        font-weight: 500;
        user-select: none;
      }
    }
  }
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
