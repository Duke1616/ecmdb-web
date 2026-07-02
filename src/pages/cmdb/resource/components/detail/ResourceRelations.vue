<template>
  <!-- 头部区域 -->
  <ManagerHeader
    title="关联管理"
    subtitle="管理资源之间的关联关系"
    add-button-text="新增关联"
    @add="openAddDialog"
    @refresh="listRelatedAssetsData"
  >
    <template #actions>
      <el-button v-if="canAddRelation" type="primary" :icon="CirclePlus" class="action-btn" @click="openAddDialog">
        新增关联
      </el-button>
      <el-tooltip content="刷新数据">
        <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="listRelatedAssetsData" />
      </el-tooltip>
    </template>
  </ManagerHeader>
  <!-- 关联列表内容 - 左右布局 -->
  <div class="relation-layout">
    <!-- 左侧关联类型列表 -->
    <div class="relation-sidebar">
      <div class="sidebar-header">
        <h3>关联类型</h3>
      </div>
      <div class="relation-list">
        <div v-if="assetsData && assetsData.length > 0">
          <div
            v-for="(item, index) in assetsData"
            :key="index"
            class="relation-item"
            :class="{ active: activeRelationName === item.relation_name }"
            @click="selectRelation(item.relation_name)"
          >
            <div class="relation-info">
              <span class="relation-name">{{ displayMap.get(item.relation_name) }}</span>
            </div>
            <div class="relation-right">
              <span class="relation-count">{{ item.total }}</span>
              <el-icon class="relation-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </div>
        <div v-else class="empty-relation">
          <el-empty description="暂无关联类型" :image-size="80">
            <template #image>
              <el-icon size="60" color="#c0c4cc">
                <Connection />
              </el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 右侧资源表格 -->
    <div class="relation-main">
      <div v-if="activeRelationName" class="table-container">
        <div class="table-header">
          <h3>{{ displayMap.get(activeRelationName) }}</h3>
          <div class="header-right">
            <span class="resource-count">共 {{ activeRelationData?.total || 0 }} 个资源</span>
          </div>
        </div>
        <DataTable
          :data="activeRelationData?.resources || []"
          :columns="resourceTableColumns"
          :actions="resourceTableActions"
          :table-props="{ border: true }"
          @action="handleResourceTableAction"
        >
          <!-- 安全字段和链接字段插槽 -->
          <template v-for="field in displayFields" :key="`field-${field.id}`" #[field.field_uid]="{ row }">
            <template v-if="field.secure">
              <el-button
                v-if="!secureDisplay.get(row.id)"
                type="primary"
                size="small"
                @click="handleSecureClick(row, field)"
              >
                查看
              </el-button>
              <div v-if="secureDisplay.get(row.id)">
                {{ row.data[field.field_uid] }}
              </div>
            </template>
            <template v-else-if="field.link">
              <el-button type="text" @click="openNewPage(row.data[field.field_uid])">
                {{ row.data[field.field_uid] }}
              </el-button>
            </template>
            <template v-else>
              {{ parseFieldValue(field, row.data[field.field_uid]) }}
            </template>
          </template>
        </DataTable>
      </div>
      <div v-else class="empty-state">
        <el-empty description="请选择关联类型查看资源" :image-size="100">
          <template #image>
            <el-icon size="80" color="#c0c4cc">
              <ArrowRight />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </div>
  </div>

  <!-- 新增关联对话框 -->
  <FormDialog
    v-model="dialogVisible"
    title="新增关联"
    subtitle="选择关联类型并添加资源关联"
    :header-icon="Link"
    width="80%"
    :show-footer="false"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <AddRelationDrawer
      v-if="dialogVisible"
      :model-relation-data="modelRelationData"
      :relation-type-data="relationTypeData"
      :display-map="displayMap"
      :resource-id="resourceId"
      :model-uid="modelUid"
      :default-relation-name="activeRelationName"
      :related-resource-ids="relatedResourceIds"
      :related-assets-data="assetsData"
      @relation-created="handleRelationCreated"
    />
  </FormDialog>
</template>

<script lang="ts" setup>
import { CirclePlus, RefreshRight, ArrowRight, Connection, Link } from "@element-plus/icons-vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import AddRelationDrawer from "./components/AddRelationDrawer.vue"
import { useResourceRelations } from "../../composables/detail/useResourceRelations"

interface Props {
  modelUid: string
  resourceId: string
}
const props = defineProps<Props>()
const {
  activeRelationData,
  activeRelationName,
  assetsData,
  canAddRelation,
  dialogVisible,
  displayFields,
  displayMap,
  modelRelationData,
  relatedResourceIds,
  relationTypeData,
  resourceTableActions,
  resourceTableColumns,
  secureDisplay,
  closeDialog: handleDialogClosed,
  handleRelationCreated,
  handleResourceTableAction,
  handleSecureClick,
  listRelatedAssetsData,
  openAddDialog,
  openNewPage,
  parseFieldValue,
  selectRelation
} = useResourceRelations(props)
</script>

<style scoped>
.relation-layout {
  display: flex;
  gap: 16px;
  height: 100%;
}

.relation-sidebar {
  width: 280px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #f8fafc;

    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .relation-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    .relation-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      position: relative;

      &:hover {
        background: rgba(64, 158, 255, 0.05);
        border-left-color: #409eff;
      }

      &.active {
        background: #e6f7ff;
        border-left-color: #409eff;

        &::after {
          content: "";
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid #409eff;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }

        .relation-name {
          color: #409eff;
          font-weight: 600;
        }

        .relation-arrow {
          color: #409eff;
        }
      }

      .relation-info {
        flex: 1;
        display: flex;
        align-items: center;

        .relation-name {
          font-size: 13px;
          font-weight: 500;
          color: #303133;
          transition: color 0.2s ease;
          line-height: 1.4;
        }
      }

      .relation-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .relation-count {
          font-size: 12px;
          color: #606266;
          background: #e8f4fd;
          padding: 2px 8px;
          border-radius: 12px;
          white-space: nowrap;
          font-weight: 500;
          border: 1px solid #d1e7ff;
        }

        .relation-arrow {
          color: #c0c4cc;
          font-size: 12px;
          transition: color 0.2s ease;
        }
      }

      &:hover .relation-arrow {
        color: #409eff;
      }
    }

    .empty-relation {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      padding: 20px;
    }
  }
}

.relation-main {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #f8fafc;

      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        flex: 1;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .resource-count {
        font-size: 12px;
        color: #606266;
        background: #e8f4fd;
        padding: 3px 8px;
        border-radius: 16px;
        white-space: nowrap;
        font-weight: 500;
        border: 1px solid #d1e7ff;
      }
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafbfc;
    padding: 40px 20px;
  }
}
</style>
