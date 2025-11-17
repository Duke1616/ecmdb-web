<template>
  <div class="relation-management">
    <ManagerHeader
      title="模型关联管理"
      subtitle="管理模型之间的关联关系和约束"
      add-button-text="新建关联"
      @add="handleCreateNew"
      @refresh="listModelRelationData"
    />

    <DataTable
      :data="modelRelationData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 唯一标识列插槽 -->
      <template #relation_name="{ row }">
        <code class="relation-id">{{ row.relation_name }}</code>
      </template>

      <!-- 源模型列插槽 -->
      <template #source_model_uid="{ row }">
        <div class="model-tag source-model">
          {{ modelMap.get(row.source_model_uid) }}
        </div>
      </template>

      <!-- 目标模型列插槽 -->
      <template #target_model_uid="{ row }">
        <div class="model-tag target-model">
          {{ modelMap.get(row.target_model_uid) }}
        </div>
      </template>

      <!-- 关联类型列插槽 -->
      <template #relation_type_uid="{ row }">
        <el-tag type="info" size="small" class="type-tag">{{ row.relation_type_uid }}</el-tag>
      </template>

      <!-- 约束列插槽 -->
      <template #mapping="{ row }">
        <div class="mapping-badge">{{ row.mapping }}</div>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <Drawer
      v-model="drawerVisible"
      :title="editingRow ? '编辑关联' : '新建关联'"
      subtitle="配置模型之间的关联关系"
      size="35%"
      direction="rtl"
      header-icon="Link"
      :show-footer="true"
      cancel-button-text="取消"
      confirm-button-text="保存关联"
      @cancel="() => (drawerVisible = false)"
      @confirm="handleRelationConfirm"
      @closed="() => (drawerVisible = false)"
    >
      <CreateRelation
        ref="createRelationRef"
        :model-uid="props.modelUid"
        :relation-type-data="relationTypeData"
        :edit-data="editingRow || undefined"
        @success="listModelRelationData"
      />
    </Drawer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, nextTick } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import { ListRelationTypeApi, ListModelRelationApi, DeleteModelRelationApi } from "@/api/relation"
import { type ListRelationTypeData, type ModelRelation } from "@/api/relation/types/relation"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@/common/composables/usePagination"
import { Edit, Delete } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import CreateRelation from "./create.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const modelData = useModelStore().modelsData

// 表格列配置
const tableColumns = [
  { prop: "relation_name", label: "唯一标识", align: "center" as const, slot: "relation_name" },
  { prop: "source_model_uid", label: "源模型", align: "center" as const, slot: "source_model_uid" },
  { prop: "target_model_uid", label: "目标模型", align: "center" as const, slot: "target_model_uid" },
  { prop: "relation_type_uid", label: "关联类型", align: "center" as const, slot: "relation_type_uid" },
  { prop: "mapping", label: "源→目标约束", align: "center" as const, slot: "mapping" }
]

// 操作按钮配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete }
]

const modelMap: Map<string, string> = new Map<string, string>()
const reverseMap = () => {
  modelData.forEach((mg) => {
    if (Array.isArray(mg.models)) {
      mg.models.forEach((m) => {
        modelMap.set(m.uid, m.name)
      })
    }
  })
}

// 操作按钮事件
const handleOperateEvent = (row: ModelRelation, action: string) => {
  if (action === "edit") {
    handleUpdate(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

interface Props {
  modelUid: string
}
const props = defineProps<Props>()

// 控制抽屉打开和传输数据
const drawerVisible = ref<boolean>(false)
const editingRow = ref<ModelRelation | null>(null)
const createRelationRef = ref<InstanceType<typeof CreateRelation>>()
const handleUpdate = (row: ModelRelation) => {
  editingRow.value = row
  drawerVisible.value = true
  // 等待下一个 tick 确保组件已渲染
  nextTick(() => {
    createRelationRef.value?.setEditData(row)
  })
}

const handleCreateNew = () => {
  editingRow.value = null
  drawerVisible.value = true
}

const handleRelationConfirm = async () => {
  const success = await createRelationRef.value?.handleCreate()
  if (success) {
    drawerVisible.value = false
  }
}

const relationTypeData = ref<ListRelationTypeData[]>([])
const getRealtionTypeData = () => {
  ListRelationTypeApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      relationTypeData.value = data.relation_types
    })
    .catch(() => {
      relationTypeData.value = []
    })
    .finally(() => {})
}

const modelRelationData = ref<ModelRelation[]>([])
const listModelRelationData = () => {
  ListModelRelationApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    model_uid: props.modelUid
  })
    .then(({ data }) => {
      reverseMap()
      paginationData.total = data.total
      // 后端可能返回 null / undefined，需要兜底为数组，避免 DataTable 内部对 data 进行遍历时报错
      modelRelationData.value = Array.isArray(data.model_relations) ? data.model_relations : []

      console.log("relation", modelRelationData.value)
    })
    .catch((error) => {
      modelRelationData.value = []
      console.log("cache", error)
    })
    .finally(() => {})
}

const handleDelete = (row: ModelRelation) => {
  ElMessageBox.confirm(`正在删除字段：${row.relation_name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    DeleteModelRelationApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listModelRelationData()
    })
  })
}

watch([() => paginationData.currentPage, () => paginationData.pageSize], listModelRelationData, { immediate: true })

onMounted(() => {
  getRealtionTypeData()
})
</script>

<style lang="scss" scoped>
.relation-management {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  :deep(.el-table) {
    .relation-id {
      font-family: "Monaco", "Menlo", monospace;
      background: #e0f2fe;
      padding: 3px 8px;
      border-radius: 4px;
      color: #0369a1;
      font-size: 12px;
      font-weight: 500;
    }

    .model-tag {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;

      &.source-model {
        background: #dbeafe;
        color: #1e40af;
      }

      &.target-model {
        background: #dcfce7;
        color: #166534;
      }
    }

    .type-tag {
      font-size: 11px;
      font-weight: 500;
    }

    .mapping-badge {
      display: inline-block;
      padding: 3px 6px;
      background: #f3f4f6;
      color: #374151;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 500;
      font-family: "Monaco", "Menlo", monospace;
    }
  }
}

.search-wrapper {
  margin-bottom: 20px;
  :deep(.el-card__body) {
    padding-bottom: 2px;
  }
}

.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
