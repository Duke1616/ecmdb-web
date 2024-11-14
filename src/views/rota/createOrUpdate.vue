<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="name" label="值班名称">
        <el-input v-model="formData.name" placeholder="请输入值班名称" />
      </el-form-item>
      <el-form-item prop="owner" label="管理人员">
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
          <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.id" />
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
      <el-form-item prop="desc" label="值班描述">
        <el-input v-model="formData.desc" placeholder="请输入值班描述" />
      </el-form-item>
      <el-form-item prop="status" label="是否启用">
        <el-switch v-model="formData.enabled" size="default" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createOrUpdateRotaReq, rota } from "@/api/rota/types/rota"
import { createRotaApi, updateRotaApi } from "@/api/rota"
import { findByUserIdApi, listUsersByUsernameRegexApi } from "@/api/user"
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

// 接收父组建传递
const emits = defineEmits(["closed", "callback"])

const onClosed = () => {
  emits("closed")
}
const DEFAULT_FORM_DATA: createOrUpdateRotaReq = {
  name: "",
  owner: 0,
  desc: "",
  enabled: true
}

const formData = ref<createOrUpdateRotaReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createRotaApi : updateRotaApi
    api(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
        emits("callback")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const loading = ref<boolean>(false)
const keyword = ref<string>("")
const remoteMethod = (query: string) => {
  if (query) {
    keyword.value = query

    nextTick(() => {
      setTimeout(() => {
        listUsersData()
      }, 500)
    })
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

const setOwnerForm = () => {
  findByUserIdApi(formData.value.owner)
    .then(({ data }) => {
      usersData.value = [data]
      // 给定默认负责人
      if (formData.value.owner === 0) {
        formData.value.owner = data.id
      }
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const setFrom = (row: rota) => {
  formData.value = cloneDeep(row)
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  submitForm,
  setFrom,
  resetForm,
  setOwnerForm
})
</script>
