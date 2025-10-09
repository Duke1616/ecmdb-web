<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="模板集合" subtitle="管理告警通知模板集合" @refresh="loadTemplateSets">
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建集合 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="templateSets"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="tableProps"
      v-loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 集合名称插槽 -->
      <template #name="{ row }">
        <div class="template-set-name-cell">
          <h4 class="name-text">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 条目数量插槽 -->
      <template #itemCount="{ row }">
        <div class="item-count-cell">
          <el-tag type="info" size="small"> {{ row.items?.length || 0 }} 个条目 </el-tag>
        </div>
      </template>

      <!-- 描述信息插槽 -->
      <template #description="{ row }">
        <div class="description-cell">
          <div class="description-text">{{ row.description || "暂无描述" }}</div>
        </div>
      </template>

      <!-- 创建时间插槽 -->
      <template #ctime="{ row }">
        <div class="time-cell">{{ formatTimestamp(row.ctime) }}</div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>

    <!-- 创建/编辑对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      subtitle="请填写模板集合的基本信息"
      width="500px"
      :confirm-loading="submitLoading"
      confirm-text="确定"
      header-icon="Collection"
      @confirm="handleSubmit"
      @cancel="handleDialogClose"
      @closed="handleDialogClose"
    >
      <TemplateSetForm ref="formRef" v-model="formData" />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import type { CreateTemplateSetReq, TemplateSet } from "@/api/alert/template_set/types"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import { useTemplateSet } from "./composables/useTemplateSet"
import { formatTimestamp } from "./utils"
import { TABLE_COLUMNS, TABLE_PROPS, OPERATE_ITEMS } from "./config/constants"
import TemplateSetForm from "./components/TemplateSetForm.vue"

// 使用组合式函数
const {
  templateSets,
  loading,
  paginationData,
  loadTemplateSets,
  createTemplateSet,
  updateTemplateSet,
  deleteTemplateSet,
  navigateToItems,
  handleCurrentChange,
  handleSizeChange
} = useTemplateSet()

// 对话框相关
const dialogVisible = ref(false)
const submitLoading = ref(false)
const dialogTitle = ref("")
const isEdit = ref(false)
const currentEditId = ref<number | null>(null)

// 表单相关
const formRef = ref()
const formData = ref<CreateTemplateSetReq>({
  name: "",
  description: "",
  owner_id: 1 // TODO: 从用户信息获取
})

// 表格配置
const tableColumns = TABLE_COLUMNS
const tableProps = TABLE_PROPS

// 使用工具函数

// 获取操作按钮配置
const getOperateItems = (_templateSet: TemplateSet) => OPERATE_ITEMS.templateSet

// 操作事件处理
const operateEvent = (templateSet: TemplateSet, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(templateSet)
      break
    case "manage":
      handleManageItems(templateSet)
      break
    case "delete":
      handleDelete(templateSet)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 创建集合
const handleCreate = () => {
  dialogTitle.value = "创建模板集合"
  isEdit.value = false
  currentEditId.value = null
  formData.value = {
    name: "",
    description: "",
    owner_id: 1
  }
  dialogVisible.value = true
}

// 编辑集合
const handleEdit = (templateSet: TemplateSet) => {
  dialogTitle.value = "编辑模板集合"
  isEdit.value = true
  currentEditId.value = templateSet.id
  formData.value = {
    name: templateSet.name,
    description: templateSet.description,
    owner_id: templateSet.owner_id
  }
  dialogVisible.value = true
}

// 管理条目
const handleManageItems = (templateSet: TemplateSet) => {
  navigateToItems(templateSet)
}

// 删除集合
const handleDelete = async (templateSet: TemplateSet) => {
  await deleteTemplateSet(templateSet)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  const isValid = await formRef.value.validate()
  if (!isValid) return

  submitLoading.value = true

  if (isEdit.value && currentEditId.value) {
    // 更新
    await updateTemplateSet(currentEditId.value, formData.value)
  } else {
    // 创建
    await createTemplateSet(formData.value)
  }

  dialogVisible.value = false
  submitLoading.value = false
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

// 监听分页变化
watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => {
    loadTemplateSets()
  }
)

// 初始化加载数据
loadTemplateSets()
</script>

<style lang="scss" scoped>
// 集合名称样式
.template-set-name-cell {
  .name-text {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }

  .description-text {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
  }
}

// 条目数量样式
.item-count-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 描述信息样式
.description-cell {
  .description-text {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.4;
    word-break: break-word;
  }
}

// 时间样式
.time-cell {
  font-size: 14px;
  color: #1f2937;
}
</style>
