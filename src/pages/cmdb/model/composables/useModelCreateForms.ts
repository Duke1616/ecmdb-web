import { ref } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { CreateModelApi, CreateModelGroupApi } from "@/api/cmdb/model"
import type { CreateModelGroupReq, CreateModelReq } from "@/api/cmdb/model/types/model"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"

const DEFAULT_FORM_DATA: CreateModelReq = {
  name: "",
  group_id: undefined,
  icon: "",
  uid: ""
}

const DEFAULT_MODEL_GROUP_DATA: CreateModelGroupReq = {
  name: ""
}

const validateForm = (form: FormInstance | null) =>
  new Promise<boolean>((resolve) => {
    if (!form) {
      resolve(false)
      return
    }

    form.validate((valid) => resolve(valid))
  })

export const useModelCreateForms = (refreshCatalog: () => Promise<void> | void) => {
  const { hasPermission } = usePermission()

  const dialogModelVisible = ref(false)
  const dialogModelGroupVisible = ref(false)
  const formData = ref<CreateModelReq>(cloneDeep(DEFAULT_FORM_DATA))
  const formModelGroupData = ref<CreateModelGroupReq>(cloneDeep(DEFAULT_MODEL_GROUP_DATA))
  const formRef = ref<FormInstance | null>(null)
  const formGroupRef = ref<FormInstance | null>(null)

  const formRules: FormRules = {
    group_id: [{ required: true, message: "必须输入所在组", trigger: "blur" }],
    uid: [
      { required: true, message: "必须输入唯一标识", trigger: "blur" },
      { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
    ],
    name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
    icon: [{ required: true, message: "必须选择图标", trigger: "change" }]
  }
  const groupFormRules: FormRules = {
    name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
  }

  const openDialog = (capability: string, visible: typeof dialogModelVisible) => {
    if (hasPermission(capability)) visible.value = true
  }
  const openModelDialog = () => openDialog(CMDB_CAPABILITIES.Model.Create, dialogModelVisible)
  const openGroupDialog = () => openDialog(CMDB_CAPABILITIES.Model.GroupCreate, dialogModelGroupVisible)

  const resetForm = () => {
    formRef.value?.clearValidate()
    formGroupRef.value?.clearValidate()
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
    formModelGroupData.value = cloneDeep(DEFAULT_MODEL_GROUP_DATA)
  }

  const handleCreateModelGroup = async () => {
    if (!hasPermission(CMDB_CAPABILITIES.Model.GroupCreate)) return
    if (!(await validateForm(formGroupRef.value))) return

    try {
      await CreateModelGroupApi(formModelGroupData.value)
      ElMessage.success("操作成功")
      dialogModelGroupVisible.value = false
      await refreshCatalog()
    } catch (error) {
      console.error("创建分组失败:", error)
    }
  }

  const handleCreateModel = async () => {
    if (!hasPermission(CMDB_CAPABILITIES.Model.Create)) return
    if (!(await validateForm(formRef.value))) return

    const { name, icon, group_id, uid } = formData.value
    const apiData: CreateModelReq = { name, icon, group_id, uid }

    try {
      await CreateModelApi(apiData)
      ElMessage.success("操作成功")
      dialogModelVisible.value = false
      await refreshCatalog()
    } catch (error) {
      console.error("创建模型失败:", error)
    }
  }

  return {
    dialogModelVisible,
    dialogModelGroupVisible,
    formData,
    formModelGroupData,
    formRef,
    formGroupRef,
    formRules,
    groupFormRules,
    openModelDialog,
    openGroupDialog,
    resetForm,
    handleCreateModel,
    handleCreateModelGroup
  }
}
