import { ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { FormInstance } from "element-plus"
import { cloneDeep } from "lodash-es"

interface UseCrudAttributeGroupOptions {
  createApi: (data: any) => Promise<any>
  updateApi: (data: any) => Promise<any>
  deleteApi: (id: any) => Promise<any>
  refreshData: () => void
  confirmDeleteText?: (item: any) => string
  checkDeleteable?: (item: any) => boolean | string
}

export function useCrudAttributeGroup<T extends { group_id: number; group_name: string }>(
  options: UseCrudAttributeGroupOptions
) {
  const { createApi, updateApi, deleteApi, refreshData, confirmDeleteText, checkDeleteable } = options

  // Dialog State
  const dialogVisible = ref(false)
  const isEditMode = ref(false)
  const currentEditId = ref<number | undefined>(undefined)
  const loading = ref(false)

  // Form State
  const formRef = ref<FormInstance>()
  const formData = ref<{ group_name: string }>({ group_name: "" })
  const defaultFormData = { group_name: "" }

  // Actions
  const openCreateDialog = () => {
    isEditMode.value = false
    currentEditId.value = undefined
    formData.value = cloneDeep(defaultFormData)
    dialogVisible.value = true
    // Clear validation after dialog opens
    setTimeout(() => formRef.value?.clearValidate(), 0)
  }

  const openEditDialog = (item: T) => {
    isEditMode.value = true
    currentEditId.value = item.group_id
    formData.value = { group_name: item.group_name }
    dialogVisible.value = true
    setTimeout(() => formRef.value?.clearValidate(), 0)
  }

  const handleDelete = (item: T) => {
    // Check if deleteable
    if (checkDeleteable) {
      const checkResult = checkDeleteable(item)
      if (checkResult === false || typeof checkResult === "string") {
        ElMessage.warning(typeof checkResult === "string" ? checkResult : "无法删除该项")
        return
      }
    }

    const text = confirmDeleteText ? confirmDeleteText(item) : `确认删除 "${item.group_name}" 吗？`

    ElMessageBox.confirm(text, "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    })
      .then(() => {
        deleteApi({ id: item.group_id }).then(() => {
          ElMessage.success("删除成功")
          refreshData()
        })
      })
      .catch(() => {})
  }

  const handleSubmit = () => {
    formRef.value?.validate((valid) => {
      if (!valid) return

      loading.value = true
      const apiCall =
        isEditMode.value && currentEditId.value
          ? updateApi({ id: currentEditId.value, name: formData.value.group_name })
          : createApi(formData.value)

      apiCall
        .then(() => {
          ElMessage.success(isEditMode.value ? "更新成功" : "创建成功")
          dialogVisible.value = false
          refreshData()
        })
        .finally(() => {
          loading.value = false
        })
    })
  }

  return {
    dialogVisible,
    isEditMode,
    loading,
    formRef,
    formData,
    openCreateDialog,
    openEditDialog,
    handleDelete,
    handleSubmit
  }
}
