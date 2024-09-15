<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" style="width: 600px">
      <el-form-item prop="name" label="流程名称">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item prop="owner" label="负责人">
        <el-select
          v-model="formData.owner"
          reserve-keyword
          placeholder="输入关键字选择"
          :remote-method="remoteMethod"
          :loading="loading"
          clearable
          filterable
          remote
        >
          <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.username" />
          <template #footer>
            <el-pagination
              class="justify-center h-10 p-2 bg-white"
              background
              :layout="paginationData.layout"
              :page-sizes="paginationData.pageSizes"
              :total="paginationData.total"
              :page-size="paginationData.pageSize"
              :currentPage="paginationData.currentPage"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </template>
          <template #loading>
            <div v-loading="loading" element-loading-text="加载中" class="h-20" />
          </template>
        </el-select>
      </el-form-item>
      <el-form-item prop="desc" label="流程说明">
        <el-input v-model="formData.desc" type="textarea" d />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleNext">下一步</el-button>
        <el-button @click="handleClose">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { createInfoReq, createOrUpdateWorkflowReq } from "@/api/workflow/types/workflow"
import { FormInstance, FormRules } from "element-plus"
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { listUsersByUsernameRegexApi } from "@/api/user"
import { usePagination } from "@/hooks/usePagination"
import { user } from "@/api/user/types/user"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

interface Props {
  data: createOrUpdateWorkflowReq
}
const props = defineProps<Props>()

const emits = defineEmits(["next", "close"])
const handleClose = () => {
  emits("close")
}

const DEFAULT_FORM_DATA: createInfoReq = {
  name: "",
  desc: "",
  icon: "",
  owner: ""
}

const formData = ref<createInfoReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入负责人", trigger: "blur" }]
}

const handleNext = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) {
      return console.error("表单校验不通过", fields)
    }
    emits("next", "info")
  })
}

const loading = ref<boolean>(false)
const keyword = ref<string>("")
const remoteMethod = (query: string) => {
  if (query) {
    keyword.value = query
    setTimeout(() => {
      listUsersData()
    }, 500)
  } else {
    usersData.value = []
  }
}

const usersData = ref<user[]>([])
const listUsersData = () => {
  listUsersByUsernameRegexApi({
    username: keyword.value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })
const getFormData = () => {
  return formData.value
}

watch(
  () => props.data,
  (val: createInfoReq) => {
    console.log("hello， world")
    formData.value = cloneDeep(val)
  },
  { immediate: true }
)

defineExpose({
  getFormData
})
</script>

<style lang="scss" scoped>
.el-form {
  min-width: 100%; /* 确保表单至少和视窗一样宽 */
}
.flow-info {
  width: 1000px;
}
</style>
