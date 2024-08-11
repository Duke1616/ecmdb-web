<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="name" label="角色名称">
        <el-input v-model="formData.name" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item prop="code" label="角色编码">
        <el-input v-model="formData.code" placeholder="请输入角色编码" />
      </el-form-item>
      <el-form-item prop="desc" label="角色描述">
        <el-input v-model="formData.desc" placeholder="请输入角色描述" />
      </el-form-item>
      <el-form-item prop="status" label="角色状态">
        <el-switch v-model="formData.status" size="default" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createOrUpdateRoleReq, role } from "@/api/role/types/role"
import { createRoleApi, updateRoleApi } from "@/api/role"

// 接收父组建传递
const emits = defineEmits(["close", "list-roles"])

const DEFAULT_FORM_DATA: createOrUpdateRoleReq = {
  name: "",
  code: "",
  desc: "",
  status: true
}

const formData = ref<createOrUpdateRoleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "必须输入角色编码", trigger: "blur" }]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createRoleApi : updateRoleApi
    api(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        emits("list-roles")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const setFrom = (row: role) => {
  formData.value = cloneDeep(row)
}
const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}
defineExpose({
  submitForm,
  setFrom,
  resetForm
})
</script>
