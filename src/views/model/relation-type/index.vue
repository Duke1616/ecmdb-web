<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="getTableData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="tableData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="uid" label="唯一标识" align="center" />
          <el-table-column prop="source_describe" label="源->目标描述" align="center" />
          <el-table-column prop="target_describe" label="目标->源描述" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <!-- 新增 -->
    <el-dialog v-model="dialogVisible" title="新增关联类型" @closed="resetForm" width="30%">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="source_describe" label="源->目标描述">
          <el-input v-model="formData.source_describe" placeholder="请输入" />
        </el-form-item>
        <el-form-item prop="target_describe" label="目标->源描述">
          <el-input v-model="formData.target_describe" placeholder="请输入" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateOrUpdate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CreateRelationTypeApi, ListRelationTypeApi } from "@/api/relation"
import { type CreateRealtionTypeReq, type ListRelationTypeData } from "@/api/relation/types/relation"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { cloneDeep } from "lodash-es"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

//#region 增
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
/** 新增关联类型 */
const handleCreateOrUpdate = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateRelationTypeApi(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogVisible.value = false
        getTableData()
      })
      .finally(() => {})
  })
}
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

/** 查询关联类型 */
const tableData = ref<ListRelationTypeData[]>([])
const getTableData = () => {
  ListRelationTypeApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      tableData.value = data.relation_types
    })
    .catch(() => {
      tableData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: ListRelationTypeData) => {
  dialogVisible.value = false
  formData.value = cloneDeep(row)
}

const handleDelete = (row: ListRelationTypeData) => {
  dialogVisible.value = false
  formData.value = cloneDeep(row)
}
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], getTableData, { immediate: true })
</script>

<style lang="scss" scoped>
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
