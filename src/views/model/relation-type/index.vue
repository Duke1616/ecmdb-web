<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="关联类型管理"
      subtitle="管理模型间的关联关系类型"
      add-button-text="新增关联类型"
      @add="handlerCreate"
      @refresh="listRelationTypesData"
    />

    <!-- 主内容区域 -->
    <DataTable
      :data="relationTypesData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 新增/查看对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '查看关联类型' : '新增关联类型'"
      width="30%"
      :confirm-text="isEdit ? '关闭' : '确认'"
      @confirm="handleCreateOrUpdate"
      @cancel="onClosed"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="isEdit ? {} : formRules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" :disabled="isEdit" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" :disabled="isEdit" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item prop="source_describe" label="源->目标描述">
          <el-input v-model="formData.source_describe" :disabled="isEdit" placeholder="请输入源->目标描述" />
        </el-form-item>
        <el-form-item prop="target_describe" label="目标->源描述">
          <el-input v-model="formData.target_describe" :disabled="isEdit" placeholder="请输入目标->源描述" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CreateRelationTypeApi, ListRelationTypeApi } from "@/api/relation"
import { type CreateRealtionTypeReq, type ListRelationTypeData } from "@/api/relation/types/relation"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { Edit } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { cloneDeep } from "lodash-es"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { FormDialog } from "@@/components/Dialogs"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表格列配置
const tableColumns = [
  { prop: "name", label: "名称", align: "center" as const },
  { prop: "uid", label: "唯一标识", align: "center" as const },
  { prop: "source_describe", label: "源->目标描述", align: "center" as const },
  { prop: "target_describe", label: "目标->源描述", align: "center" as const }
]

// 操作按钮配置（暂时只支持查看，因为后端API不支持更新和删除）
const operateBtnItems = [{ name: "查看", code: "view", type: "primary", icon: Edit }]

// 选中的行
const selectedRows = ref<ListRelationTypeData[]>([])

// 编辑状态
const isEdit = ref<boolean>(false)

// 表单相关
const DEFAULT_FORM_DATA: CreateRealtionTypeReq = {
  uid: "",
  name: "",
  source_describe: "",
  target_describe: ""
}
const dialogVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateRealtionTypeReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRules: FormRules<CreateRealtionTypeReq> = {
  uid: [
    { required: true, trigger: "blur", message: "请输入唯一标识" },
    { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
  ],
  name: [{ required: true, trigger: "blur", message: "请输入名称" }],
  source_describe: [{ required: true, trigger: "blur", message: "请输入源描述" }],
  target_describe: [{ required: true, trigger: "blur", message: "请输入目标描述" }]
}
// 操作按钮事件
const handleOperateEvent = (row: ListRelationTypeData, action: string) => {
  if (action === "view") {
    handleView(row)
  }
}

// 选择变化事件
const handleSelectionChange = (selection: ListRelationTypeData[]) => {
  selectedRows.value = selection
}

// 新增操作
const handlerCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 查看操作
const handleView = (row: ListRelationTypeData) => {
  isEdit.value = true
  formData.value = cloneDeep(row)
  dialogVisible.value = true
}

// 关闭对话框
const onClosed = () => {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  isEdit.value = false
}

// 创建或查看
const handleCreateOrUpdate = () => {
  if (isEdit.value) {
    // 查看模式，直接关闭
    onClosed()
    return
  }

  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)

    CreateRelationTypeApi(formData.value)
      .then(() => {
        ElMessage.success("创建成功")
        onClosed()
        listRelationTypesData()
      })
      .catch(() => {
        ElMessage.error("创建失败")
      })
  })
}

/** 查询关联类型 */
const relationTypesData = ref<ListRelationTypeData[]>([])
const listRelationTypesData = () => {
  ListRelationTypeApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      relationTypesData.value = data.relation_types
    })
    .catch(() => {
      relationTypesData.value = []
    })
    .finally(() => {})
}
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRelationTypesData, { immediate: true })
</script>
