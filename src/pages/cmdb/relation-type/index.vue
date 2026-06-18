<template>
  <ProGovernanceLayout
    title="关联类型管理"
    subtitle="管理模型间的关联关系类型"
    :primary-action="{ capability: CMDB_CAPABILITIES.Relation.Add, label: '新增关联类型' }"
    @refresh="listRelationTypesData"
    @primary-action="handlerCreate"
  >
    <!-- 主内容区域 -->
    <DataTable
      :data="relationTypesData"
      :columns="tableColumns"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #uid="{ row }">
        <code class="relation-uid">{{ row.uid }}</code>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 新增/查看对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑关联类型' : '新增关联类型'"
      width="30%"
      :confirm-text="isEdit ? '保存' : '确认'"
      @confirm="handleCreateOrUpdate"
      @cancel="onClosed"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" :disabled="isEdit" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item prop="source_describe" label="源->目标描述">
          <el-input v-model="formData.source_describe" placeholder="请输入源->目标描述" />
        </el-form-item>
        <el-form-item prop="target_describe" label="目标->源描述">
          <el-input v-model="formData.target_describe" placeholder="请输入目标->源描述" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import {
  CreateRelationTypeApi,
  ListRelationTypeApi,
  UpdateRelationTypeApi,
  DeleteRelationTypeApi
} from "@/api/cmdb/relation"
import {
  type CreateRealtionTypeReq,
  type ListRelationTypeData,
  type UpdateRelationTypeReq
} from "@/api/cmdb/relation/types/relation"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { Edit, Delete } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { cloneDeep } from "lodash-es"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import type { Column } from "@@/components/DataTable/types"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 当前编辑的ID
const currentId = ref<number>()

// 表格列配置
const tableColumns: Column[] = [
  { prop: "name", label: "名称", align: "center" },
  { prop: "uid", label: "唯一标识", align: "center", slot: "uid" },
  { prop: "source_describe", label: "源->目标描述", align: "center", minWidth: 160, showOverflowTooltip: true },
  { prop: "target_describe", label: "目标->源描述", align: "center", minWidth: 160, showOverflowTooltip: true }
]

const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit, capability: CMDB_CAPABILITIES.Relation.Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete, capability: CMDB_CAPABILITIES.Relation.Delete }
]

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
  if (action === "edit") {
    handleEdit(row)
  } else if (action === "delete") {
    handleDelete(row)
  }
}

// 新增操作
const handlerCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 修改操作
const handleEdit = (row: ListRelationTypeData) => {
  isEdit.value = true
  currentId.value = row.id // 保存ID
  formData.value = {
    uid: row.uid,
    name: row.name,
    source_describe: row.source_describe,
    target_describe: row.target_describe
  }
  dialogVisible.value = true
}

// 删除操作
const handleDelete = (row: ListRelationTypeData) => {
  ElMessageBox.confirm(`确认删除关联类型 "${row.name}" 吗？`, "提示", {
    type: "warning",
    confirmButtonText: "确定",
    cancelButtonText: "取消"
  })
    .then(() => {
      DeleteRelationTypeApi({ id: row.id }).then(() => {
        ElMessage.success("删除成功")
        listRelationTypesData()
      })
    })
    .catch(() => {})
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
  currentId.value = undefined
}

// 创建或修改
const handleCreateOrUpdate = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)

    if (isEdit.value && currentId.value) {
      // 更新
      const updateData: UpdateRelationTypeReq = {
        id: currentId.value,
        name: formData.value.name,
        source_describe: formData.value.source_describe,
        target_describe: formData.value.target_describe
      }
      UpdateRelationTypeApi(updateData).then(() => {
        ElMessage.success("更新成功")
        onClosed()
        listRelationTypesData()
      })
    } else {
      // 创建
      CreateRelationTypeApi(formData.value).then(() => {
        ElMessage.success("创建成功")
        onClosed()
        listRelationTypesData()
      })
    }
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

<style scoped lang="scss">
.relation-uid {
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
}
</style>
