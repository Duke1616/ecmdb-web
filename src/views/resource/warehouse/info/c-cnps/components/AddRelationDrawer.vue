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
              <el-select
                v-model="filterForm.relationName"
                placeholder="请选择关联类型"
                size="large"
                @change="handleRelationChange"
              >
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
              <el-select v-model="filterForm.fieldName" placeholder="请选择字段" size="large" @change="handleFieldName">
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
              <el-input v-model="filterForm.inputSearch" placeholder="请输入搜索内容" size="large" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <div class="form-actions">
              <el-button
                type="primary"
                size="large"
                @click="handleSearch"
                :disabled="!filterForm.fieldName || !filterForm.condition"
              >
                <el-icon><Search /></el-icon>
                搜索资源
              </el-button>
              <el-button v-if="isFiltering" size="large" @click="handleClearFilter">
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
          <DataTable
            :data="resourcesData"
            :columns="getTableColumns()"
            :table-props="{ border: true, stripe: true }"
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
              <span>{{ row.data[field.field_uid] || "暂无数据" }}</span>
            </template>

            <!-- 操作列插槽 -->
            <template #actions="{ row }">
              <el-button
                :type="localRelatedResourceIds.has(row.id) ? 'danger' : 'primary'"
                text
                bg
                size="small"
                @click="handleTableAction('toggle-relation', row)"
              >
                {{ localRelatedResourceIds.has(row.id) ? "取消关联" : "关联" }}
              </el-button>
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
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { Link, Search, Refresh, Connection, Filter } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { canBeRelatedFilterResourceApi } from "@/api/resource"
import { canBeRelationFilterReq, type Resource } from "@/api/resource/types/resource"
import { ListAttributeFieldApi } from "@/api/attribute"
import { CreateResourceRelationApi, deleteResourceRelationApi } from "@/api/relation"
import { type ModelRelation, type ListRelationTypeData } from "@/api/relation/types/relation"
import DataTable from "@/common/components/DataTable/index.vue"

interface Props {
  modelRelationData: ModelRelation[]
  relationTypeData: ListRelationTypeData[]
  displayMap: Map<string, string>
  resourceId: string
  modelUid: string
  relatedResourceIds?: number[] // 已关联的资源ID列表
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

// 生成表格列配置
const getTableColumns = () => {
  const columns: any[] = visibleColumns.value.map((field: any) => ({
    prop: `data.${field.field_uid}`,
    label: field.field_name,
    align: "center" as const,
    slot: field.field_uid,
    showOverflowTooltip: true
  }))

  return columns
}

// 处理表格操作
const handleTableAction = (key: string, row: any) => {
  if (key === "toggle-relation") {
    if (localRelatedResourceIds.value.has(row.id)) {
      handleDeleteRelation(row)
    } else {
      handleCreateRelation(row)
    }
  }
}

// 组件挂载时重置表单
onMounted(() => {
  resetForm()
})

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

// 初始化已关联的资源ID集合
const initRelatedResourceIds = () => {
  if (props.relatedResourceIds) {
    localRelatedResourceIds.value = new Set(props.relatedResourceIds)
  }
}

// 处理关联类型变化
const handleRelationChange = async (relationName: string) => {
  if (!relationName) return

  try {
    // 清空已关联资源ID集合
    localRelatedResourceIds.value.clear()

    // 根据关联类型获取字段，逻辑与父组件保持一致
    const src = relationName.split("_")[0]
    let modelUid = ""

    if (src === props.modelUid) {
      // 正向关联，使用目标模型
      modelUid = relationName.split("_")[2]
    } else {
      // 反向关联，使用源模型
      modelUid = src
    }

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

    console.log("加载资源参数:", params)
    const response = await canBeRelatedFilterResourceApi(params)
    console.log("加载资源响应:", response)
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
  try {
    // 根据关联类型确定源和目标资源ID
    const src = filterForm.value.relationName.split("_")[0]
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
    ElMessage.error("创建关联失败")
  }
}

// 处理删除关联
const handleDeleteRelation = async (row: Resource) => {
  try {
    await deleteResourceRelationApi({
      resource_id: row.id,
      relation_name: filterForm.value.relationName,
      model_uid: row.model_uid
    })

    // 从已关联集合中移除资源ID
    localRelatedResourceIds.value.delete(row.id)

    ElMessage.success("取消关联成功")
    emit("relation-created")
  } catch (error) {
    console.error("取消关联失败:", error)
    ElMessage.error("取消关联失败")
  }
}
</script>

<style lang="scss" scoped>
.add-relation-drawer {
  height: 65vh;
  overflow-y: auto;
}

.layout-container {
  height: 100%;
  display: flex;
  gap: 20px;
}

.left-panel {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow-y: auto;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.form-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;

  .section-icon {
    margin-right: 6px;
    font-size: 16px;
    color: #3b82f6;
  }

  span {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
}

.form-row {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  margin-bottom: 0;

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
    font-size: 13px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }

  :deep(.el-select__wrapper) {
    border-radius: 6px;
    border: 1px solid #d1d5db;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }
  }
}

.condition-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .el-button {
    margin: 0;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;

  .el-button {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.table-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.data-table-container) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .el-table {
      flex: 1;
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  :deep(.el-empty__description) {
    color: #6b7280;
    font-size: 16px;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .layout-container {
    flex-direction: column;
    gap: 12px;
  }

  .left-panel {
    width: 100%;
    max-height: 300px;
    padding: 16px;
  }

  .right-panel {
    flex: 1;
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .add-relation-drawer {
    padding: 12px;
  }

  .left-panel {
    padding: 12px;
    max-height: 250px;
  }

  .form-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin-bottom: 12px;
    padding: 8px 12px;

    .section-icon {
      font-size: 14px;
    }

    span {
      font-size: 13px;
    }
  }

  .form-row {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .condition-buttons {
    flex-direction: column;
    gap: 6px;

    .el-button {
      width: 100%;
      font-size: 12px;
      padding: 6px 12px;
    }
  }

  .form-actions {
    flex-direction: column;
    gap: 8px;

    .el-button {
      width: 100%;
      font-size: 12px;
      padding: 8px 16px;
    }
  }
}
</style>
