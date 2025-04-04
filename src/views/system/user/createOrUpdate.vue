<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="username" label="用户名称">
        <el-input v-model="formData.username" :disabled="formData.id !== undefined" placeholder="请输入用户名称" />
      </el-form-item>
      <el-form-item prop="display_name" label="展示名称">
        <el-input v-model="formData.display_name" placeholder="请输入用户展示名称" />
      </el-form-item>
      <el-form-item prop="email" label="电子邮箱">
        <el-input v-model="formData.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item prop="department" label="所属部门">
        <el-tree-select
          v-model="formData.department_id"
          :data="treeData"
          node-key="id"
          :render-after-expand="false"
          :expand-on-click-node="false"
          show-checkbox
          check-strictly
          check-on-click-node
          :props="defaultProps"
        />
      </el-form-item>
      <el-form-item prop="feishu_info.user_id" label="飞书用户">
        <el-input v-model="formData.feishu_info.user_id" placeholder="请输入飞书用户ID" />
      </el-form-item>
      <el-form-item prop="wechat_info.user_id" label="企微用户">
        <el-input v-model="formData.wechat_info.user_id" placeholder="请输入企业微信用户ID" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createOrUpdateUserReq, feishuInfo, user, wechatInfo } from "@/api/user/types/user"
import { updateUserApi, syncLdapUserApi } from "@/api/user"
import { listDepartmentTreeApi } from "@/api/department"
import { department } from "@/api/department/types/department"
import { user as syncUser } from "@/api/user/types/ldap"

// 接收父组建传递
const emits = defineEmits(["closed", "callback"])
const onClosed = () => {
  emits("closed")
}

const FeishuInfo: feishuInfo = {}
const WechatInfo: wechatInfo = {}
const DEFAULT_FORM_DATA: createOrUpdateUserReq = {
  username: "",
  display_name: "",
  feishu_info: FeishuInfo,
  wechat_info: WechatInfo
}

const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

const formData = ref<createOrUpdateUserReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  display_name: [{ required: true, message: "必须输入用户展示名称", trigger: "blur" }],
  username: [{ required: true, message: "必须输入用户名称（唯一值）", trigger: "blur" }]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? syncLdapUserApi : updateUserApi
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

const treeData = ref<department[]>([])
const listDepartmentTreeData = async () => {
  listDepartmentTreeApi()
    .then(async ({ data }) => {
      treeData.value = data
    })
    .catch(() => {
      treeData.value = []
    })
    .finally(() => {})
}

const setFrom = (row: user) => {
  formData.value = cloneDeep(row)

  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

const setSyncForm = (row: syncUser) => {
  formData.value = {
    ...cloneDeep(row),
    feishu_info: {},
    wechat_info: {}
  }
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

onMounted(() => {
  listDepartmentTreeData()
})

defineExpose({
  submitForm,
  setFrom,
  setSyncForm,
  resetForm
})
</script>

<style lang="scss"></style>
