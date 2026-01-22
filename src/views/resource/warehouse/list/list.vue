<template>
  <div class="resource-list">
    <ManagerHeader
      title="资源管理"
      subtitle="管理仓库中的资源数据"
      add-button-text="新增资源"
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="false"
      @add="handlerCreate"
      @refresh="listAttributeFields"
      @back="goBack"
    >
      <template #details>
        <div class="model-identity">
          <div class="identity-badge">
            <span class="badge-label">模型标识</span>
            <code class="identity-code">{{ modelUid }}</code>
          </div>
          <div class="model-name-section">
            <h2 class="model-name">{{ modelName }}</h2>
          </div>
        </div>
      </template>

      <!-- 自定义操作按钮 -->
      <template #actions>
        <el-button :icon="Download" :loading="exporting" class="action-btn" @click="handleExportTemplate">
          导出模板
        </el-button>
        <el-button type="success" :icon="Upload" class="action-btn" @click="handleShowImportDialog">
          导入数据
        </el-button>
        <el-button type="warning" :icon="Download" class="action-btn" @click="handleShowExportDialog">
          导出数据
        </el-button>

        <el-divider direction="vertical" />

        <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerCreate">新增资源</el-button>
        <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="listAttributeFields" />
      </template>
    </ManagerHeader>

    <DataTable
      :data="resourcesData"
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
      @selection-change="handleSelectionChange"
    >
      <!-- 动态字段列插槽 -->
      <template v-for="item in displayFileds" :key="item.id" #[`data.${item.field_uid}`]="{ row }">
        <template v-if="item.secure">
          <SecureFieldView
            :content="row.data[item.field_uid]"
            :is-displaying="!!row.data[`${item.field_uid}_secure_display`]"
            :copy-only="true"
            @view-click="handleSecureClick(row, item)"
            @display-change="(isDisplaying) => handleSecureDisplayChange(row, item, isDisplaying)"
            @copy="(content) => handleCopySecureContent(content, row.id)"
          />
        </template>
        <template v-else-if="item.link">
          <el-button type="text" @click="openNewPage(row.data[item.field_uid])">
            {{ row.data[item.field_uid] }}
          </el-button>
        </template>
        <template v-else-if="item.field_type === 'file'">
          <TableFileUpload
            v-model="row.data[item.field_uid]"
            :field-uid="item.field_uid"
            :row="row"
            :limit="5"
            @upload-success="handleUploadSuccess"
            @upload-error="handleUploadError"
            @remove-success="handleRemoveSuccess"
            @remove-error="handleRemoveError"
            @preview="handlePreview"
          />
        </template>
        <template v-else>
          {{ row.data[item.field_uid] }}
        </template>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
    <!-- 新增或编辑资源 -->
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

    <!-- 导入数据抽屉 -->
    <DataImportDrawer
      v-model="importDialogVisible"
      :model-uid="modelUid"
      :model-name="modelName"
      @import-success="handleImportSuccess"
    />

    <!-- 导出数据抽屉 -->
    <DataExportDrawer
      v-model="exportDialogVisible"
      :model-uid="modelUid"
      :model-name="modelName"
      :model-fields="exportFields"
      :selected-ids="selectedResourceIds"
      @export-success="handleExportSuccess"
    />
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch, h, nextTick, computed } from "vue"
import { useRoute } from "vue-router"
import { type Attribute } from "@/api/attribute/types/attribute"
import { getModelAttributesWithGroupsApi } from "@/api/attribute"
import { listResourceApi, deleteResourceApi, findSecureData } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
import { CirclePlus, Edit, Delete, View, Setting, Download, Upload, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { Drawer } from "@@/components/Dialogs"
import { ElMessage, ElMessageBox, type UploadUserFile } from "element-plus"
import router from "@/router"

import Form from "./form.vue"
import TableFileUpload from "./components/TableFileUpload/index.vue"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"
import DataImportDrawer from "./components/DataImportDrawer.vue"
import DataExportDrawer from "./components/DataExportDrawer.vue"
import { useDataIO } from "./composables/useDataIO"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const route = useRoute()
const modelUid = route.query.uid as string
const modelName = route.query.name as string
const attributeFiledsData = ref<Attribute[]>([])
const attributeGroupsData = ref<any[]>([]) // 存储分组数据
const displayFileds = ref<Attribute[]>([])
const drawerVisible = ref<boolean>(false)

const title = ref<string>("")

// 导入导出功能
const { exporting, exportTemplate } = useDataIO()
const importDialogVisible = ref(false)
const exportDialogVisible = ref(false)

// 导出模板
const handleExportTemplate = async () => {
  await exportTemplate(modelUid, modelName)
}

// 显示导入对话框
const handleShowImportDialog = () => {
  importDialogVisible.value = true
}

// 显示导出对话框
const handleShowExportDialog = () => {
  exportDialogVisible.value = true
}

// 导入成功后刷新列表
const handleImportSuccess = (count: number) => {
  ElMessage.success(`成功导入 ${count} 条数据`)
  listResourceByModelUid()
}

// 导出成功
const handleExportSuccess = () => {
  ElMessage.success("数据导出成功")
}

// 导出字段列表 (转换为 DataExportDrawer 需要的格式)
const exportFields = computed(() => {
  return attributeFiledsData.value
    .filter((attr) => attr.field_type !== "file") // 过滤掉 file 类型
    .map((attr) => ({
      id: attr.field_uid,
      name: attr.field_name,
      type: attr.field_type,
      options: attr.option // 传递 options 数据(用于 list 类型)
    }))
})

// 已选数据
const selectedResources = ref<Resource[]>([])
const selectedResourceIds = computed(() => selectedResources.value.map((r) => String(r.id)))

// 处理选择变化
const handleSelectionChange = (selection: Resource[]) => {
  selectedResources.value = selection
}

// 表格列配置
const tableColumns = computed(() => {
  const columns = displayFileds.value.map((item) => ({
    prop: `data.${item.field_uid}`,
    label: item.field_name,
    align: "center" as const,
    slot: `data.${item.field_uid}`
  }))
  return columns
})

// 操作按钮配置
const operateBtnItems = computed(() => {
  const items = [
    { name: "详情", code: "detail", type: "primary", icon: View },
    { name: "修改", code: "edit", type: "warning", icon: Edit },
    { name: "删除", code: "delete", type: "danger", icon: Delete }
  ]

  // 如果是主机模型，添加终端按钮
  if (modelUid === "host") {
    items.unshift({ name: "终端", code: "terminal", type: "info", icon: CirclePlus })
  }

  return items
})

// 文件上传事件处理
const handleUploadSuccess = (file: UploadUserFile, fieldUid: string, row: Resource) => {
  console.log("Upload success:", file, fieldUid, row)
}

const handleUploadError = (error: any, fieldUid: string, row: Resource) => {
  console.error("Upload error:", error, fieldUid, row)
  ElMessage.error("上传失败")
}

const handleRemoveSuccess = (file: UploadUserFile, fieldUid: string, row: Resource) => {
  console.log("Remove success:", file, fieldUid, row)
}

const handleRemoveError = (error: any, fieldUid: string, row: Resource) => {
  console.error("Remove error:", error, fieldUid, row)
  ElMessage.error("删除失败")
}

const handlePreview = (uploadFile: UploadUserFile) => {
  console.log("Preview file:", uploadFile)
}

const handleDetailClick = (resource: Resource) => {
  router.push({
    path: "/cmdb/resource/info",
    query: { model_uid: modelUid, id: resource.id, name: resource.name }
  })
}

// ** 获取资产字段信息 */
const listAttributeFields = () => {
  getModelAttributesWithGroupsApi(modelUid)
    .then(({ data }) => {
      // 保存分组数据
      attributeGroupsData.value = data.attribute_groups

      // 将分组数据转换为平铺的字段列表
      const allFields: Attribute[] = []
      data.attribute_groups.forEach((group) => {
        if (group.attributes) {
          allFields.push(...group.attributes)
        }
      })
      attributeFiledsData.value = allFields
      sortFields()
    })
    .catch(() => {
      attributeFiledsData.value = []
      attributeGroupsData.value = []
    })
    .finally(() => {
      // ...
    })
}

// ** 过滤展示字段，并排序 */
const sortFields = () => {
  displayFileds.value = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })
}

// 跳转外部
const openNewPage = (url: string) => {
  window.open(url, "_blank")
}

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const listResourceByModelUid = () => {
  listResourceApi({
    model_uid: modelUid,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      resourcesData.value = data.resources
      paginationData.total = data.total
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: Resource) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteResourceApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listResourceByModelUid()
    })
  })
}

const handleSecureClick = (row: Resource, item: Attribute) => {
  findSecureData({
    id: row.id,
    field_uid: item.field_uid
  }).then((data) => {
    // 存储安全数据到 row 中，这样切换页面后数据不会丢失
    row.data[item.field_uid] = data.data
    // row.data[`${item.field_uid}_secure_display`] = true
  })
}

const handleSecureDisplayChange = (row: Resource, item: Attribute, isDisplaying: boolean) => {
  row.data[`${item.field_uid}_secure_display`] = isDisplaying
}

const handleCopySecureContent = (content: string, rowId: number) => {
  // 复制逻辑已移到 SecureFieldView 组件内部
  console.log("Content copied:", content, "for row:", rowId)
}

const apiRef = ref<InstanceType<typeof Form>>()
const handlerCreate = () => {
  ElMessage.info("准备新增资产，请填写相关信息")
  title.value = "新增资产"
  drawerVisible.value = true
}

const handleUpdate = (row: Resource) => {
  ElMessage.info(`准备修改资产：${row.name}`)
  title.value = "修改资产"

  drawerVisible.value = true
  nextTick(() => {
    apiRef.value?.setForm(row)
  })
}

// 操作按钮事件
const handleOperateEvent = (row: Resource, action: string) => {
  if (action === "terminal") {
    // 跳转到终端页面
    window.open(`/terminal?resource_id=${row.id}&title=${row.name}`, "_blank")
  } else if (action === "detail") {
    handleDetailClick(row)
  } else if (action === "edit") {
    handleUpdate(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

const onClosed = () => {
  apiRef.value?.resetForm()
  drawerVisible.value = false
}

const handleCreate = () => {
  apiRef.value?.handleSubmit()
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  listAttributeFields()
})

onUnmounted(() => {
  // 组件销毁时的清理工作
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listResourceByModelUid, { immediate: true })
</script>

<style lang="scss" scoped>
.resource-list {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .model-identity {
    display: flex;
    align-items: center;
    gap: 16px;

    .identity-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--muted, #f9fafb);
      padding: 4px 8px;
      border-radius: 6px;

      .badge-label {
        font-size: 11px;
        font-weight: 500;
        color: var(--muted-foreground, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .identity-code {
        font-family: var(--font-mono, "Monaco", "Menlo", "Ubuntu Mono", monospace);
        font-size: 12px;
        font-weight: 600;
        color: var(--primary, #3b82f6);
        background: var(--background, #ffffff);
        padding: 2px 6px;
        border-radius: 3px;
      }
    }

    .model-name-section {
      .model-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--foreground, #111827);
        margin: 0;
        line-height: 1.3;
      }
    }
  }
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.file-name {
  max-width: 230px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
