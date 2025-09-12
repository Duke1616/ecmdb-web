<template>
  <div class="add-relation-drawer">
    <!-- 筛选表单 -->
    <div class="filter-section">
      <el-form :model="filterForm" label-width="80px">
        <el-form-item label="关联类型">
          <el-select
            v-model="relationName"
            placeholder="请选择关联类型"
            style="width: 100%"
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

        <el-form-item label="条件筛选" v-if="relationName">
          <div class="filter-row">
            <el-select v-model="fieldName" placeholder="字段名称" style="width: 25%" @change="handleFieldName">
              <el-option
                v-for="item in attributeFieldsData"
                :key="item.id"
                :label="item.field_name"
                :value="item.field_uid"
              />
            </el-select>
            <el-select v-model="condition" placeholder="条件" style="width: 20%" @change="handleCondition">
              <el-option v-for="item in options" :key="item.label" :label="item.label" :value="item.value" />
            </el-select>
            <el-input v-model="inputSearch" placeholder="请输入搜索内容" style="width: 35%" clearable />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button v-if="isFiltering" @click="handleClearFilter">清除筛选</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <!-- 资源表格 -->
    <div class="table-section" v-if="relationName">
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
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { Link } from "@element-plus/icons-vue"
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
  if (relationName.value) {
    loadResources(relationName.value, isFiltering.value)
  }
}

const handleSizeChange = (size: number) => {
  originalHandleSizeChange(size)
  if (relationName.value) {
    loadResources(relationName.value, isFiltering.value)
  }
}

// 表单数据
const relationName = ref("")
const fieldName = ref("")
const condition = ref("")
const inputSearch = ref("")

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
  relationName.value = ""
  fieldName.value = ""
  condition.value = ""
  inputSearch.value = ""
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
    if (useFilter && fieldName.value && condition.value && inputSearch.value) {
      params.filter_name = fieldName.value
      params.filter_condition = condition.value
      params.filter_input = inputSearch.value
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

// 处理条件变化
const handleCondition = () => {
  // 可以在这里添加条件变化逻辑
}

// 处理搜索
const handleSearch = async () => {
  if (!relationName.value) {
    ElMessage.warning("请先选择关联类型")
    return
  }

  // 设置筛选状态
  isFiltering.value = !!(fieldName.value && condition.value && inputSearch.value)

  // 重置到第一页
  paginationData.currentPage = 1
  await loadResources(relationName.value, isFiltering.value)
}

// 处理清除筛选
const handleClearFilter = async () => {
  fieldName.value = ""
  condition.value = ""
  inputSearch.value = ""
  isFiltering.value = false

  // 重置到第一页并重新加载数据
  paginationData.currentPage = 1
  if (relationName.value) {
    await loadResources(relationName.value, false)
  }
}

// 处理创建关联
const handleCreateRelation = async (row: Resource) => {
  try {
    // 根据关联类型确定源和目标资源ID
    const src = relationName.value.split("_")[0]
    let src_resource_id = parseInt(props.resourceId)
    let dst_resource_id = row.id

    if (src !== props.modelUid) {
      // 反向关联，需要交换源和目标
      src_resource_id = row.id
      dst_resource_id = parseInt(props.resourceId)
    }

    await CreateResourceRelationApi({
      source_resource_id: src_resource_id,
      relation_name: relationName.value,
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
      relation_name: relationName.value,
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
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;

  .filter-section {
    background: white;
    padding: 20px;
    border-bottom: 1px solid #e4e7ed;
    flex-shrink: 0;

    .filter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      .el-button {
        flex-shrink: 0;
        margin-left: 8px;
      }
    }

    .el-form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .table-section {
    flex: 1;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    display: flex;
    flex-direction: column;

    :deep(.data-table-container) {
      flex: 1;
      display: flex;
      flex-direction: column;

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
    margin: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .add-relation-drawer {
    .filter-section {
      padding: 16px;

      .filter-row {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;

        .el-select,
        .el-input {
          width: 100% !important;
        }

        .el-button {
          margin-left: 0;
          width: 100%;
        }
      }
    }

    .table-section {
      margin: 0 16px 16px 16px;
      padding: 16px;
    }

    .empty-state {
      margin: 16px;
    }
  }
}
</style>
