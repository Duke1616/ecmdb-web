<template>
  <div class="add-relation-drawer">
    <div class="layout-container">
      <!-- 左侧筛选表单 -->
      <div class="left-panel">
        <!-- 关联类型选择 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><Connection /></el-icon>
            <span>关联模型</span>
          </div>
          <div class="form-row">
            <el-form-item label="关联模型" class="form-item" label-position="top">
              <el-select v-model="filterForm.relationName" placeholder="请选择关联类型" @change="handleRelationChange">
                <el-option
                  v-for="item in modelRelationData"
                  :key="item.id"
                  :label="displayMap.get(item.relation_name)"
                  :value="item.relation_name"
                />
              </el-select>
            </el-form-item>
          </div>
        </div>

        <!-- 筛选条件 -->
        <div class="form-section" v-if="filterForm.relationName">
          <div class="section-title">
            <el-icon class="section-icon"><Filter /></el-icon>
            <span>筛选条件</span>
          </div>

          <div class="form-row">
            <el-form-item label="字段名称" class="form-item" label-position="top">
              <el-select v-model="filterForm.fieldName" placeholder="请选择字段" @change="handleFieldName">
                <el-option
                  v-for="item in attributeFieldsData"
                  :key="item.id"
                  :label="item.field_name"
                  :value="item.field_uid"
                />
              </el-select>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="筛选条件" class="form-item" label-position="top">
              <div class="condition-buttons">
                <el-button
                  v-for="option in options"
                  :key="option.value"
                  :type="filterForm.condition === option.value ? 'primary' : 'default'"
                  size="default"
                  @click="handleConditionClick(option.value)"
                >
                  {{ option.label }}
                </el-button>
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="搜索内容" class="form-item" label-position="top">
              <el-input v-model="filterForm.inputSearch" placeholder="请输入搜索内容" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <div class="form-actions">
              <el-button
                type="primary"
                @click="handleSearch"
                :disabled="!filterForm.fieldName || !filterForm.condition"
              >
                <el-icon><Search /></el-icon>
                搜索资源
              </el-button>
              <el-button
                @click="handleClearFilter"
                :disabled="!filterForm.fieldName && !filterForm.condition && !filterForm.inputSearch && !isFiltering"
              >
                <el-icon><Refresh /></el-icon>
                清除筛选
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表格数据 -->
      <div class="right-panel">
        <!-- 资源表格 -->
        <div class="table-section" v-if="filterForm.relationName">
          <div class="result-header">
            <div>
              <div class="result-title">可关联资源</div>
              <div class="result-subtitle">选择资源建立当前关联关系</div>
            </div>
            <span class="result-count">共 {{ paginationData.total }} 条</span>
          </div>
          <DataTable
            :data="resourcesData"
            :columns="getTableColumns()"
            :table-props="{ border: false, stripe: false, rowClassName: getRowClassName }"
            :show-pagination="true"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            :page-sizes="paginationData.pageSizes"
            :pagination-layout="paginationData.layout"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          >
            <!-- 字段值插槽 -->
            <template v-for="field in visibleColumns" :key="`field-${field.id}`" #[field.field_uid]="{ row }">
              <span class="resource-cell-text">{{ formatFieldValue(row.data[field.field_uid]) }}</span>
            </template>

            <!-- 操作列插槽 -->
            <template #actions="{ row }">
              <div class="relation-action-cell">
                <el-button
                  :type="localRelatedResourceIds.has(row.id) ? 'danger' : 'primary'"
                  size="small"
                  class="relation-action-button"
                  :class="{ 'is-related': localRelatedResourceIds.has(row.id) }"
                  :loading="relationPendingIds.has(row.id)"
                  :disabled="relationPendingIds.has(row.id)"
                  @click="handleTableAction('toggle-relation', row)"
                >
                  {{ localRelatedResourceIds.has(row.id) ? "取消关联" : "关联" }}
                </el-button>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <el-empty description="请先选择关联类型" :image-size="80">
            <template #image>
              <el-icon size="60" color="#c0c4cc">
                <Link />
              </el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue"
import { ElMessage } from "element-plus"
import { Link, Search, Refresh, Connection, Filter } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { canBeRelatedFilterResourceApi } from "@/api/resource"
import { canBeRelationFilterReq, type Resource } from "@/api/resource/types/resource"
import { ListAttributeFieldApi } from "@/api/attribute"
import { CreateResourceRelationApi, deleteResourceRelationApi } from "@/api/relation"
import {
  type ModelRelation,
  type ListRelationTypeData,
  type relatedAssetsData as RelatedAssetsData
} from "@/api/relation/types/relation"
import DataTable from "@/common/components/DataTable/index.vue"

interface Props {
  modelRelationData: ModelRelation[]
  relationTypeData: ListRelationTypeData[]
  displayMap: Map<string, string>
  resourceId: string
  modelUid: string
  defaultRelationName?: string
  relatedResourceIds?: number[] // 已关联的资源ID列表
  relatedAssetsData?: RelatedAssetsData[]
}

interface Emits {
  (e: "relation-created"): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  paginationData,
  handleCurrentChange: originalHandleCurrentChange,
  handleSizeChange: originalHandleSizeChange
} = usePagination()

// 当前筛选状态
const isFiltering = ref(false)

// 重写分页处理函数，在分页变化时重新加载数据
const handleCurrentChange = (page: number) => {
  originalHandleCurrentChange(page)
  if (filterForm.value.relationName) {
    loadResources(filterForm.value.relationName, isFiltering.value)
  }
}

const handleSizeChange = (size: number) => {
  originalHandleSizeChange(size)
  if (filterForm.value.relationName) {
    loadResources(filterForm.value.relationName, isFiltering.value)
  }
}

// 筛选表单
const filterForm = ref({
  relationName: "",
  fieldName: "",
  condition: "",
  inputSearch: ""
})

// 表格数据
const resourcesData = ref<Resource[]>([])
const attributeFieldsData = ref<any[]>([])

// 已关联的资源ID集合
const localRelatedResourceIds = ref<Set<number>>(new Set())
const relationPendingIds = ref<Set<number>>(new Set())

// 筛选条件选项
const options = [
  { label: "等于", value: "equal" },
  { label: "不等于", value: "not_equal" },
  { label: "包含", value: "contains" }
]

// 计算可见列
const visibleColumns = computed(() => {
  return attributeFieldsData.value.filter((item) => item.visible !== false)
})

import type { Column } from "@@/components/DataTable/types"

const formatFieldValue = (value: any) => {
  if (value === undefined || value === null || value === "") return "暂无数据"
  if (Array.isArray(value)) return value.length ? `${value.length} 个附件` : "暂无数据"
  if (typeof value === "object") {
    if (value.name) return value.name
    if (value.filename) return value.filename
    return "对象数据"
  }
  return String(value)
}

const getRowClassName = ({ row }: { row: Resource }) => {
  return localRelatedResourceIds.value.has(row.id) ? "is-related-row" : ""
}

const getModelRelation = (relationName: string) => {
  return props.modelRelationData.find((item) => item.relation_name === relationName)
}

const getRelationSourceModelUid = (relationName: string) => {
  const relation = getModelRelation(relationName)
  if (relation) return relation.source_model_uid
  return relationName.split("_")[0]
}

const getRelatedModelUid = (relationName: string) => {
  const relation = getModelRelation(relationName)
  if (relation) {
    return relation.source_model_uid === props.modelUid ? relation.target_model_uid : relation.source_model_uid
  }

  const parts = relationName.split("_")
  return parts[0] === props.modelUid ? parts[2] : parts[0]
}

const getRelationResourceIds = (relationName: string) => {
  const relationAssets = props.relatedAssetsData?.find((item) => item.relation_name === relationName)
  if (relationAssets) return relationAssets.resource_ids || []
  return props.relatedResourceIds || []
}

// 生成表格列配置
const getTableColumns = (): Column[] => {
  const columns: Column[] = visibleColumns.value.map((field: any) => ({
    prop: `data.${field.field_uid}`,
    label: field.field_name,
    align: "center",
    slot: field.field_uid,
    showOverflowTooltip: true
  }))

  return columns
}

// 处理表格操作
const handleTableAction = (key: string, row: any) => {
  if (key === "toggle-relation") {
    if (relationPendingIds.value.has(row.id)) return

    if (localRelatedResourceIds.value.has(row.id)) {
      handleDeleteRelation(row)
    } else {
      handleCreateRelation(row)
    }
  }
}

// 重置表单
const resetForm = () => {
  filterForm.value.relationName = ""
  filterForm.value.fieldName = ""
  filterForm.value.condition = ""
  filterForm.value.inputSearch = ""
  resourcesData.value = []
  attributeFieldsData.value = []
  isFiltering.value = false
}

const applyDefaultRelationName = async () => {
  const relationName = props.defaultRelationName
  if (!relationName || relationName === filterForm.value.relationName) return
  if (!props.modelRelationData.some((item) => item.relation_name === relationName)) return

  resetForm()
  filterForm.value.relationName = relationName
  await handleRelationChange(relationName)
}

// 初始化已关联的资源ID集合
const initRelatedResourceIds = () => {
  localRelatedResourceIds.value = new Set(getRelationResourceIds(filterForm.value.relationName))
}

// 处理关联类型变化
const handleRelationChange = async (relationName: string) => {
  if (!relationName) return

  try {
    // 清空已关联资源ID集合
    localRelatedResourceIds.value.clear()

    // 根据关联类型获取字段，逻辑与父组件保持一致
    const modelUid = getRelatedModelUid(relationName)
    if (!modelUid) return

    await ListAttributeFieldApi(modelUid).then((data) => {
      attributeFieldsData.value = (data.data as any).attribute_fields || []
    })

    // 关联类型变化时自动加载数据
    await loadResources(relationName)

    // 初始化已关联的资源ID
    initRelatedResourceIds()
  } catch (error) {
    console.error("获取属性字段失败:", error)
  }
}

// 加载资源数据
const loadResources = async (relationName: string, useFilter = false) => {
  try {
    const params: canBeRelationFilterReq = {
      model_uid: props.modelUid,
      resource_id: parseInt(props.resourceId),
      relation_name: relationName,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    // 如果使用筛选条件，添加筛选参数
    if (useFilter && filterForm.value.fieldName && filterForm.value.condition && filterForm.value.inputSearch) {
      params.filter_name = filterForm.value.fieldName
      params.filter_condition = filterForm.value.condition
      params.filter_input = filterForm.value.inputSearch
    }

    const response = await canBeRelatedFilterResourceApi(params)
    resourcesData.value = response.data?.resources || []
    paginationData.total = response.data?.total || 0
  } catch (error) {
    console.error("加载资源失败:", error)
  }
}

// 处理字段名称变化
const handleFieldName = () => {
  // 可以在这里添加字段变化逻辑
}

// 处理条件按钮点击
const handleConditionClick = (value: string) => {
  filterForm.value.condition = value
}

// 处理搜索
const handleSearch = async () => {
  if (!filterForm.value.relationName) {
    ElMessage.warning("请先选择关联类型")
    return
  }

  // 设置筛选状态
  isFiltering.value = !!(filterForm.value.fieldName && filterForm.value.condition && filterForm.value.inputSearch)

  // 重置到第一页
  paginationData.currentPage = 1
  await loadResources(filterForm.value.relationName, isFiltering.value)
}

// 处理清除筛选
const handleClearFilter = async () => {
  filterForm.value.fieldName = ""
  filterForm.value.condition = ""
  filterForm.value.inputSearch = ""
  isFiltering.value = false

  // 重置到第一页并重新加载数据
  paginationData.currentPage = 1
  if (filterForm.value.relationName) {
    await loadResources(filterForm.value.relationName, false)
  }
}

// 处理创建关联
const handleCreateRelation = async (row: Resource) => {
  if (relationPendingIds.value.has(row.id)) return
  relationPendingIds.value.add(row.id)

  try {
    // 根据关联类型确定源和目标资源ID
    const src = getRelationSourceModelUid(filterForm.value.relationName)
    let src_resource_id = parseInt(props.resourceId)
    let dst_resource_id = row.id

    if (src !== props.modelUid) {
      // 反向关联，需要交换源和目标
      src_resource_id = row.id
      dst_resource_id = parseInt(props.resourceId)
    }

    await CreateResourceRelationApi({
      source_resource_id: src_resource_id,
      relation_name: filterForm.value.relationName,
      target_resource_id: dst_resource_id
    })

    // 将资源ID添加到已关联集合中
    localRelatedResourceIds.value.add(row.id)

    ElMessage.success("关联创建成功")
    emit("relation-created")
  } catch (error) {
    console.error("创建关联失败:", error)
  } finally {
    relationPendingIds.value.delete(row.id)
  }
}

// 处理删除关联
const handleDeleteRelation = async (row: Resource) => {
  if (relationPendingIds.value.has(row.id)) return
  relationPendingIds.value.add(row.id)

  try {
    const modelUid = row.model_uid || getRelatedModelUid(filterForm.value.relationName)
    if (!modelUid) {
      ElMessage.error("无法确定关联模型，取消关联失败")
      return
    }

    await deleteResourceRelationApi({
      resource_id: row.id,
      relation_name: filterForm.value.relationName,
      model_uid: modelUid
    })

    // 从已关联集合中移除资源ID
    localRelatedResourceIds.value.delete(row.id)

    ElMessage.success("取消关联成功")
    emit("relation-created")
  } catch (error) {
    console.error("取消关联失败:", error)
  } finally {
    relationPendingIds.value.delete(row.id)
  }
}

// 组件挂载时使用页面左侧当前选中的关联类型
onMounted(() => {
  applyDefaultRelationName()
})

watch(
  () => [filterForm.value.relationName, props.relatedAssetsData, props.relatedResourceIds] as const,
  () => {
    if (!filterForm.value.relationName || relationPendingIds.value.size > 0) return
    initRelatedResourceIds()
  }
)

watch(
  () => props.defaultRelationName,
  () => {
    applyDefaultRelationName()
  }
)
</script>

<style lang="scss" scoped>
.add-relation-drawer {
  height: 65vh;
  background: #f8fafc;
  overflow: hidden;
  font-size: 13px;
  --filter-panel-width: clamp(320px, 24vw, 460px);
  --filter-panel-padding: clamp(12px, 1.7vh, 24px);
  --filter-section-gap: clamp(14px, 2.2vh, 30px);
  --filter-title-y: clamp(8px, 1.2vh, 16px);
  --filter-title-x: clamp(10px, 1.2vw, 18px);
  --filter-title-gap: clamp(7px, 0.7vw, 12px);
  --filter-row-gap: clamp(10px, 1.45vh, 20px);
  --filter-label-gap: clamp(5px, 0.7vh, 9px);
  --filter-control-height: clamp(36px, 4.7vh, 54px);
  --filter-choice-height: clamp(34px, 4.4vh, 50px);
  --filter-action-height: clamp(36px, 4.7vh, 54px);
  --filter-title-font: clamp(13px, 1.25vh, 17px);
  --filter-label-font: clamp(12px, 1.05vh, 15px);
  --filter-control-font: clamp(13px, 1.2vh, 16px);
}

.layout-container {
  height: 100%;
  display: flex;
  gap: 14px;
  padding: 12px;
}

.left-panel {
  width: var(--filter-panel-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  padding: var(--filter-panel-padding);
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.form-section {
  margin-bottom: var(--filter-section-gap);

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--filter-title-gap);
  margin-bottom: var(--filter-row-gap);
  padding: var(--filter-title-y) var(--filter-title-x);
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  box-shadow: inset 3px 0 0 #3b82f6;

  .section-icon {
    font-size: var(--filter-title-font);
    color: #3b82f6;
  }

  span {
    font-size: var(--filter-title-font);
    font-weight: 600;
    color: #374151;
  }
}

.form-row {
  margin-bottom: var(--filter-row-gap);

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  margin-bottom: 0;

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #475569;
    margin-bottom: var(--filter-label-gap);
    font-size: var(--filter-label-font);
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 100%;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: var(--filter-control-height);
  }

  :deep(.el-input__inner),
  :deep(.el-select__placeholder),
  :deep(.el-select__selected-item) {
    font-size: var(--filter-control-font);
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #9ca3af;
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }

  :deep(.el-select__wrapper) {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: none;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      border-color: #9ca3af;
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
}

.condition-buttons {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(8px, 0.9vw, 14px);
  width: 100%;

  .el-button {
    height: var(--filter-choice-height);
    width: 100%;
    margin: 0;
    border-radius: 6px;
    font-weight: 600;
    font-size: var(--filter-label-font);
    padding: 6px 12px;

    & + .el-button {
      margin-left: 0;
    }
  }
}

.form-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(8px, 0.9vw, 14px);
  align-items: center;

  .el-button {
    height: var(--filter-action-height);
    width: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: var(--filter-control-font);
    padding: 8px 14px;

    & + .el-button {
      margin-left: 0;
    }
  }
}

.table-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .result-title {
    color: #1f2937;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
  }

  .result-subtitle {
    margin-top: 2px;
    color: #64748b;
    font-size: 12px;
  }

  .result-count {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 9px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(.data-table-container) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .el-table {
      flex: 1;
      --el-table-border-color: #edf2f7;
      --el-table-header-bg-color: #f8fafc;
      --el-table-row-hover-bg-color: #f8fbff;
      font-size: 13px;
    }
  }

  :deep(.manager-content),
  :deep(.content-card) {
    min-height: 0;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  :deep(.table-wrapper) {
    min-height: 0;
  }

  :deep(.el-table__inner-wrapper::before),
  :deep(.el-table__border-left-patch) {
    display: none;
  }

  :deep(.el-table th.el-table__cell) {
    height: 44px;
    background: #f8fafc;
    border-bottom: 1px solid #e5e7eb;
    color: #475569;
    font-weight: 600;
  }

  :deep(.el-table td.el-table__cell) {
    height: 48px;
    border-bottom: 1px solid #edf2f7;
    color: #334155;
  }

  :deep(.el-table .cell) {
    padding: 0 16px;
  }

  :deep(.data-table-cell-content) {
    justify-content: center;
    text-align: center;
  }

  :deep(.el-table__row.is-related-row) {
    background: #f8fbff;
  }

  :deep(.el-table__row.is-related-row td.el-table__cell:first-child) {
    box-shadow: inset 3px 0 0 #60a5fa;
  }

  :deep(.pagination-container) {
    padding: 12px 16px;
    border-top: 1px solid #e5e7eb;
    background: #fbfdff;
  }

  .resource-cell-text {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    color: #334155;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .relation-action-cell {
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .relation-action-button {
    min-width: 52px;
    height: 28px;
    border-radius: 6px;
    font-weight: 600;
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;

    &:hover {
      background: #dbeafe;
      border-color: #93c5fd;
      color: #1d4ed8;
    }

    &.is-related {
      background: #fff7ed;
      border-color: #fed7aa;
      color: #c2410c;

      &:hover {
        background: #ffedd5;
        border-color: #fdba74;
        color: #9a3412;
      }
    }
  }
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;

  :deep(.el-empty__description) {
    color: #6b7280;
    font-size: 13px;
  }
}

@media (max-width: 1024px) {
  .add-relation-drawer {
    --filter-panel-width: 100%;
    --filter-panel-padding: clamp(12px, 1.7vh, 18px);
    --filter-section-gap: clamp(14px, 2vh, 22px);
    --filter-row-gap: clamp(10px, 1.4vh, 16px);
  }

  .layout-container {
    flex-direction: column;
    gap: 12px;
  }

  .left-panel {
    width: 100%;
    max-height: none;
  }

  .right-panel {
    flex: 1;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .add-relation-drawer {
    height: 70vh;
  }

  .left-panel {
    max-height: none;
  }

  .form-section {
    margin-bottom: var(--filter-section-gap);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin-bottom: var(--filter-row-gap);
    padding: var(--filter-title-y) var(--filter-title-x);

    .section-icon {
      font-size: var(--filter-title-font);
    }

    span {
      font-size: var(--filter-title-font);
    }
  }

  .form-row {
    margin-bottom: var(--filter-row-gap);

    &:last-child {
      margin-bottom: 0;
    }
  }

  .condition-buttons {
    gap: 6px;

    .el-button {
      width: 100%;
      font-size: var(--filter-label-font);
      padding: 6px 12px;
    }
  }

  .form-actions {
    gap: 8px;

    .el-button {
      width: 100%;
      font-size: var(--filter-control-font);
      padding: 8px 16px;
    }
  }
}
</style>
