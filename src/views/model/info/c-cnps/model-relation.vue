<template>
  <div class="relation-management">
    <div class="management-header">
      <div class="header-content">
        <h3>模型关联管理</h3>
        <p>管理模型之间的关联关系和约束</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="CirclePlus" @click="handleCreateNew" size="small" class="primary-btn">
          新建关联
        </el-button>
        <el-tooltip content="刷新当前页">
          <el-button
            type="default"
            :icon="RefreshRight"
            circle
            size="small"
            @click="listModelRelationData"
            class="refresh-btn"
          />
        </el-tooltip>
      </div>
    </div>

    <div class="table-container">
      <el-table
        :data="modelRelationData"
        v-loading="loading"
        class="modern-table"
        stripe
        size="small"
        header-row-class-name="table-header"
      >
        <el-table-column type="selection" width="40" align="center" />
        <el-table-column prop="relation_name" label="唯一标识" align="center">
          <template #default="scope">
            <code class="relation-id">{{ scope.row.relation_name }}</code>
          </template>
        </el-table-column>
        <el-table-column prop="source_model_uid" label="源模型" align="center">
          <template #default="scope">
            <div class="model-tag source-model">
              {{ modelMap.get(scope.row.source_model_uid) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="target_model_uid" label="目标模型" align="center">
          <template #default="scope">
            <div class="model-tag target-model">
              {{ modelMap.get(scope.row.target_model_uid) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="relation_type_uid" label="关联类型" align="center">
          <template #default="scope">
            <el-tag type="info" size="small" class="type-tag">{{ scope.row.relation_type_uid }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mapping" label="源→目标约束" align="center">
          <template #default="scope">
            <div class="mapping-badge">{{ scope.row.mapping }}</div>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="140" align="center">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" text size="small" @click="handleUpdate(scope.row)" class="edit-btn">
                修改
              </el-button>
              <el-button type="danger" text size="small" @click="handleDelete(scope.row)" class="delete-btn">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        background
        small
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :currentPage="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="modern-pagination"
      />
    </div>

    <CreateRelation
      v-model:visible="drawerVisible"
      :model-uid="props.modelUid"
      :relation-type-data="relationTypeData"
      :edit-data="editingRow"
      @success="listModelRelationData"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import { ListRelationTypeApi, ListModelRelationApi, DeleteModelRelationApi } from "@/api/relation"
import { type ListRelationTypeData, type ModelRelation } from "@/api/relation/types/relation"
import { ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@/common/composables/usePagination"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import CreateRelation from "./create-relation.vue"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [5, 10, 20],
  pageSize: 5
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)
const modelData = useModelStore().modelsData

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

interface Props {
  modelUid: string
}
const props = defineProps<Props>()
const loading = ref<boolean>(false)

// 控制抽屉打开和传输数据
const drawerVisible = ref<boolean>(false)
const editingRow = ref<ModelRelation | null>(null)
const handleUpdate = (row: ModelRelation) => {
  editingRow.value = row
  drawerVisible.value = true
}

const handleCreateNew = () => {
  console.log("123")
  editingRow.value = null
  drawerVisible.value = true
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
      modelRelationData.value = data.model_relations

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
  padding-bottom: 24px;

  .management-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    margin-bottom: 16px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    .header-content {
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px 0;
      }

      p {
        color: #6b7280;
        margin: 0;
        font-size: 13px;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;

      .primary-btn {
        background: #0f766e;
        border-color: #0f766e;
        color: white;
        border-radius: 6px;
        font-weight: 500;

        &:hover {
          background: #0d5b56;
          border-color: #0d5b56;
        }
      }

      .refresh-btn {
        background: #f9fafb;
        border-color: #e5e7eb;
        color: #6b7280;

        &:hover {
          background: #f3f4f6;
          color: #374151;
          border-color: #d1d5db;
        }
      }
    }
  }

  .table-container {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;

    :deep(.modern-table) {
      .table-header {
        background: #f8fafc;

        .el-table__cell {
          background: #f8fafc;
          color: #1e293b;
          font-weight: 600;
          border-bottom: 1px solid #e2e8f0;
          padding: 12px 8px;
        }
      }

      .el-table__row {
        &:hover {
          background: #f8fafc;
        }

        .el-table__cell {
          border-bottom: 1px solid #f1f5f9;
          padding: 12px 8px;
          color: #334155;
        }
      }

      .relation-id {
        font-family: "Monaco", "Menlo", monospace;
        background: #e0f2fe;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        color: #0f766e;
        font-weight: 500;
      }

      .model-tag {
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;

        &.source-model {
          background: #0f766e;
          color: white;
        }

        &.target-model {
          background: #ea580c;
          color: white;
        }
      }

      .type-tag {
        border-radius: 4px;
        font-weight: 500;
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }

      .mapping-badge {
        background: #fef3c7;
        color: #92400e;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
        font-family: "Monaco", "Menlo", monospace;
        font-size: 12px;
        border: 1px solid #fde68a;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        justify-content: center;
        align-items: center;
        flex-wrap: nowrap;
        width: 100%;
        padding: 0 4px;

        .edit-btn,
        .delete-btn {
          padding: 4px 12px;
          font-size: 12px;
          border-radius: 4px;
          min-width: 50px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .edit-btn {
          color: #0f766e;
          background: #f0fdfa;
          border: 1px solid #5eead4;

          &:hover {
            background: #0f766e;
            color: white;
            border-color: #0f766e;
          }
        }

        .delete-btn {
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;

          &:hover {
            background: #dc2626;
            color: white;
            border-color: #dc2626;
          }
        }
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    padding: 0 16px 0 0;
    margin-top: 20px;

    :deep(.modern-pagination) {
      .el-pagination__total,
      .el-pagination__jump {
        color: #6b7280;
      }

      .el-pager li {
        background: #ffffff;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        margin: 0 1px;

        &:hover {
          background: #0f766e;
          color: white;
          border-color: #0f766e;
        }

        &.is-active {
          background: #0f766e;
          color: white;
          border-color: #0f766e;
        }
      }

      .btn-prev,
      .btn-next {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        color: #1f2937;

        &:hover {
          background: #0f766e;
          color: white;
          border-color: #0f766e;
        }
      }
    }
  }
}

:deep(.modern-drawer) {
  .el-drawer__body {
    padding: 0;
  }

  .drawer-content {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 16px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }

      .close-btn {
        color: #6b7280;

        &:hover {
          color: #374151;
        }
      }
    }

    .relation-form {
      flex: 1;

      .el-form-item {
        margin-bottom: 16px;

        .el-form-item__label {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 6px;
          font-size: 13px;
        }

        .form-select,
        .form-textarea {
          :deep(.el-input__wrapper),
          :deep(.el-textarea__inner) {
            border-radius: 6px;
            border: 1px solid #e5e7eb;

            &:hover {
              border-color: #0f766e;
            }

            &.is-focus {
              border-color: #0f766e;
              box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.1);
            }
          }
        }
      }
    }

    .form-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      margin-top: auto;

      .cancel-btn {
        background: #f9fafb;
        color: #6b7280;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
      }

      .save-btn {
        background: #0f766e;
        border-color: #0f766e;
        border-radius: 6px;
        font-weight: 500;
      }
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
