<template>
  <PageContainer class="resource-list-page">
    <ManagerHeader
      title="资源管理"
      subtitle="管理仓库中的资源数据"
      :show-add-button="false"
      :show-refresh-button="false"
      :show-back-button="true"
      @back="goBack"
    >
      <template #details>
        <div class="resource-detail-context">
          <div class="identity-badge">
            <span class="badge-label">模型标识</span>
            <code class="identity-code">{{ modelUid }}</code>
          </div>
          <strong class="model-display-name">{{ modelName }}</strong>
        </div>
      </template>

      <template #actions>
        <div class="resource-header-actions">
          <AuthButton
            class="resource-action-btn is-outline"
            :loading="exporting"
            :capability="CMDB_CAPABILITIES.DataIO.ExportTemplate"
            disable-mode
            @click="handleExportTemplate"
          >
            <el-icon v-if="!exporting"><Download /></el-icon>
            <span>{{ exporting ? "导出中..." : "导出模板" }}</span>
          </AuthButton>
          <AuthButton
            type="success"
            class="resource-action-btn is-import"
            :capability="CMDB_CAPABILITIES.DataIO.Import"
            disable-mode
            @click="handleShowImportDialog"
          >
            <el-icon><Upload /></el-icon>
            <span>导入数据</span>
          </AuthButton>
          <AuthButton
            type="warning"
            class="resource-action-btn is-export"
            :capability="CMDB_CAPABILITIES.DataIO.Export"
            disable-mode
            @click="handleShowExportDialog"
          >
            <el-icon><Download /></el-icon>
            <span>导出数据</span>
          </AuthButton>

          <el-divider direction="vertical" class="action-divider" />

          <AuthButton
            type="primary"
            class="resource-action-btn is-create"
            :capability="CMDB_CAPABILITIES.Resource.Add"
            disable-mode
            @click="handlerCreate"
          >
            <el-icon><CirclePlus /></el-icon>
            <span>新增资源</span>
          </AuthButton>

          <el-button type="primary" :icon="RefreshRight" circle class="resource-refresh-btn" @click="refreshPage" />
        </div>
      </template>
    </ManagerHeader>

    <div class="resource-page-content">
      <DataTable
        :data="resourcesData"
        :columns="tableColumns"
        :loading="tableLoading"
        :show-selection="canDeleteResource"
        :selectable="() => canDeleteResource"
        :show-pagination="true"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        :page-sizes="paginationData.pageSizes"
        :pagination-layout="paginationData.layout"
        action-column-width="180"
        action-column-fixed="right"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        @selection-change="handleSelectionChange"
      >
        <template #empty>
          <el-empty :image-size="160" description="该模型暂无资源数据">
            <div class="empty-actions">
              <AuthButton
                type="success"
                class="resource-action-btn is-import"
                :capability="CMDB_CAPABILITIES.DataIO.Import"
                disable-mode
                @click="handleShowImportDialog"
              >
                <el-icon><Upload /></el-icon>
                <span>导入数据</span>
              </AuthButton>
              <AuthButton
                type="primary"
                class="resource-action-btn is-create"
                :capability="CMDB_CAPABILITIES.Resource.Add"
                disable-mode
                @click="handlerCreate"
              >
                <el-icon><CirclePlus /></el-icon>
                <span>新增资源</span>
              </AuthButton>
            </div>
          </el-empty>
        </template>

        <template v-for="item in customCellFields" :key="item.id" #[`data.${item.field_uid}`]="{ row }">
          <div class="resource-cell">
            <el-popover
              v-if="item.secure && item.field_type === 'multiline'"
              trigger="click"
              placement="bottom"
              :width="420"
              popper-class="resource-secure-popover"
              :show-arrow="false"
            >
              <template #reference>
                <button type="button" class="secure-preview-button" @click="handleSecureClick(row, item)">
                  <el-icon><View /></el-icon>
                  <span>查看</span>
                </button>
              </template>
              <div class="secure-popover-content">
                <div class="secure-popover-head">
                  <div class="secure-popover-title">
                    <el-icon><View /></el-icon>
                    <span>{{ item.field_name }}</span>
                  </div>
                  <span class="secure-popover-badge">敏感内容</span>
                </div>
                <div class="secure-popover-text">
                  {{ row.data[item.field_uid] || "-" }}
                </div>
                <div class="secure-popover-actions">
                  <span>{{ item.field_uid }}</span>
                  <div class="secure-popover-buttons">
                    <el-button
                      text
                      type="primary"
                      :icon="CopyDocument"
                      @click="copySecureContent(row.data[item.field_uid])"
                    >
                      复制
                    </el-button>
                  </div>
                </div>
              </div>
            </el-popover>
            <SecureFieldView
              v-else-if="item.secure"
              :content="row.data[item.field_uid]"
              :is-displaying="!!row.data[`${item.field_uid}_secure_display`]"
              :copy-only="true"
              @view-click="handleSecureClick(row, item)"
              @display-change="(isDisplaying) => handleSecureDisplayChange(row, item, isDisplaying)"
            />
            <el-button v-else-if="item.link" type="primary" link @click="openNewPage(row.data[item.field_uid])">
              {{ row.data[item.field_uid] || "-" }}
            </el-button>
            <TableFileUpload
              v-else-if="item.field_type === 'file'"
              :model-value="Array.isArray(row.data[item.field_uid]) ? row.data[item.field_uid] : []"
              :field-uid="item.field_uid"
              :row="row"
              :limit="5"
              :disabled="!canEditCustomField"
              @update:model-value="(val) => (row.data[item.field_uid] = val)"
              @upload-success="handleUploadSuccess"
              @upload-error="handleUploadError"
              @remove-success="handleRemoveSuccess"
              @remove-error="handleRemoveError"
              @preview="handlePreview"
            />
          </div>
        </template>

        <template #actions="{ row }">
          <OperateBtn :items="operateBtnItems" :operate-item="row" :max-length="2" @routeEvent="handleOperateEvent" />
        </template>
      </DataTable>

      <Drawer
        v-model="drawerVisible"
        :title="title"
        subtitle="配置资源的基本信息和属性"
        size="40%"
        direction="rtl"
        :header-icon="Setting"
        :show-footer="true"
        cancel-button-text="取消"
        confirm-button-text="保存"
        @cancel="onClosed"
        @confirm="handleCreate"
        @closed="onClosed"
      >
        <Form
          ref="apiRef"
          :attributeFiledsData="attributeFiledsData"
          :attributeGroupsData="attributeGroupsData"
          :modelUid="modelUid"
          @list="listResourceByModelUid"
          @closed="onClosed"
        />
      </Drawer>

      <DataImportDrawer
        v-model="importDialogVisible"
        :model-uid="modelUid"
        :model-name="modelName"
        @import-success="handleImportSuccess"
      />

      <DataExportDrawer
        v-model="exportDialogVisible"
        :model-uid="modelUid"
        :model-name="modelName"
        :model-fields="exportFields"
        :selected-ids="selectedResourceIds"
        :current-ids="currentResourceIds"
      />
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
import { CirclePlus, CopyDocument, Download, RefreshRight, Setting, Upload, View } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { Drawer } from "@@/components/Dialogs"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"
import Form from "./components/ResourceForm.vue"
import DataExportDrawer from "./components/ResourceDataExportDrawer.vue"
import DataImportDrawer from "./components/ResourceDataImportDrawer.vue"
import TableFileUpload from "./components/ResourceTableFileUpload.vue"
import { useResourceList } from "./composables/useResourceList"

const {
  CMDB_CAPABILITIES,
  modelUid,
  modelName,
  attributeFiledsData,
  attributeGroupsData,
  resourcesData,
  drawerVisible,
  importDialogVisible,
  exportDialogVisible,
  title,
  apiRef,
  tableLoading,
  exporting,
  exportFields,
  customCellFields,
  selectedResourceIds,
  currentResourceIds,
  paginationData,
  tableColumns,
  operateBtnItems,
  canDeleteResource,
  canEditCustomField,
  handleCurrentChange,
  handleSizeChange,
  refreshPage,
  listResourceByModelUid,
  handleSelectionChange,
  handleExportTemplate,
  handleShowImportDialog,
  handleShowExportDialog,
  handleImportSuccess,
  openNewPage,
  handleSecureClick,
  handleSecureDisplayChange,
  copySecureContent,
  handleUploadSuccess,
  handleUploadError,
  handleRemoveSuccess,
  handleRemoveError,
  handlePreview,
  handlerCreate,
  handleOperateEvent,
  onClosed,
  handleCreate,
  goBack
} = useResourceList()
</script>

<style lang="scss" scoped>
.resource-list-page {
  :deep(.manager-header) {
    align-items: center;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.details-section) {
    min-width: 0;
  }

  :deep(.header-right) {
    flex-shrink: 0;
  }
}

.resource-page-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.resource-detail-context {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.identity-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  .badge-label {
    flex-shrink: 0;
    color: #64748b;
    font-size: 11px;
    font-weight: 700;
  }

  .identity-code {
    min-width: 0;
    max-width: 220px;
    overflow: hidden;
    color: #0369a1;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.model-display-name {
  min-width: 0;
  max-width: 220px;
  margin: 0;
  overflow: hidden;
  color: #0f172a;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

:deep(.resource-action-btn) {
  height: 34px;
  min-width: auto;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &.is-outline {
    color: #475569;
    background: #ffffff;
    border-color: #d8e0ea;
    box-shadow: none;

    &:hover {
      color: #2563eb;
      border-color: #93c5fd;
      background: #eff6ff;
    }
  }

  &.is-import {
    background: #55bd3a;
    border-color: #55bd3a;
  }

  &.is-export {
    background: #ec9a2e;
    border-color: #ec9a2e;
  }

  &.is-create {
    background: #409eff;
    border-color: #409eff;
  }
}

.action-divider {
  height: 24px;
  margin: 0 4px;
  border-left-color: #dbe4f0;
}

.resource-refresh-btn {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  background: #409eff;
  border-color: #409eff;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.resource-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.secure-preview-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  color: #475569;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 6px;
  transition:
    color 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;

  .el-icon {
    color: #64748b;
    font-size: 14px;
  }

  &:hover,
  &:focus {
    color: #2563eb;
    background: #f8fbff;
    border-color: #9bbcf8;

    .el-icon {
      color: #2563eb;
    }
  }
}

:global(.resource-secure-popover) {
  padding: 10px !important;
  overflow: hidden;
  border-radius: 8px;
}

:global(.resource-secure-popover .secure-popover-content) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 360px;
  background: #ffffff;
}

:global(.resource-secure-popover .secure-popover-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 24px;
}

:global(.resource-secure-popover .secure-popover-title) {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
}

:global(.resource-secure-popover .secure-popover-title .el-icon) {
  flex-shrink: 0;
  margin-right: 6px;
  color: #2563eb;
  font-size: 15px;
}

:global(.resource-secure-popover .secure-popover-title span) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.resource-secure-popover .secure-popover-badge) {
  flex-shrink: 0;
  padding: 2px 7px;
  color: #c2410c;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  background: #ffedd5;
  border: 1px solid #fdba74;
  border-radius: 999px;
}

:global(.resource-secure-popover .secure-popover-text) {
  max-height: 240px;
  padding: 12px;
  overflow: auto;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

:global(.resource-secure-popover .secure-popover-actions) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  color: #64748b;
  font-size: 12px;
}

:global(.resource-secure-popover .secure-popover-buttons) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .resource-list-page {
    :deep(.manager-header) {
      align-items: flex-start;
      flex-direction: column;
      gap: 14px;
    }
  }
}
</style>
