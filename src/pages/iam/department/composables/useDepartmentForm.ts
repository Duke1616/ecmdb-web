import { ref, reactive } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { createDepartmentApi, updateDepartmentApi } from "@/api/iam/department"
import type { IDepartmentNode } from "@/api/iam/department/type"

interface IDepartmentFormState {
  id: number
  parent_id?: number
  name: string
  sort: number
  leaders: string[]
  main_leader: string
}

/**
 * 部门属性表单状态与提交逻辑组合式函数
 */
export function useDepartmentForm(onSuccess?: (id?: number) => void) {
  const formRef = ref<FormInstance | null>(null)
  const saving = ref(false)
  const selectedLeaders = ref<string[]>([])
  const selectedMainLeaderUsername = ref("")

  const getInitialData = (): IDepartmentFormState => ({
    id: 0,
    parent_id: undefined,
    name: "",
    sort: 0,
    leaders: [],
    main_leader: ""
  })

  const formData = reactive<IDepartmentFormState>(getInitialData())

  const formRules: FormRules = {
    name: [{ required: true, message: "部门名称不能为空", trigger: "blur" }]
  }

  /**
   * 重置表单状态
   */
  const resetForm = () => {
    formRef.value?.clearValidate()
    Object.assign(formData, getInitialData())
    selectedLeaders.value = []
    selectedMainLeaderUsername.value = ""
  }

  /**
   * 预设表单数据（加载详情）
   */
  const setDepartmentData = (node: IDepartmentNode) => {
    formRef.value?.clearValidate()
    formData.id = node.id
    formData.parent_id = node.parent_id === 0 ? undefined : node.parent_id
    formData.name = node.name
    formData.sort = node.sort
    formData.leaders = node.leaders || []
    formData.main_leader = node.main_leader || ""

    selectedLeaders.value = formData.leaders
    selectedMainLeaderUsername.value = formData.main_leader
  }

  /**
   * 预置上级部门 ID
   */
  const setFormForPid = (pid: number) => {
    formData.parent_id = pid
  }

  /**
   * 提交创建部门表单
   */
  const submitCreateForm = async (elForm?: FormInstance) => {
    const activeForm = elForm || formRef.value
    if (!activeForm) return
    await activeForm.validate()

    saving.value = true
    try {
      const payload = {
        parent_id: formData.parent_id || 0,
        name: formData.name,
        sort: formData.sort || 0,
        leaders: selectedLeaders.value,
        main_leader: selectedMainLeaderUsername.value
      }
      const { data } = await createDepartmentApi(payload)
      resetForm()
      if (onSuccess) {
        onSuccess(data)
      }
    } catch (error) {
      console.error("创建部门失败:", error)
    } finally {
      saving.value = false
    }
  }

  /**
   * 提交修改部门表单
   */
  const submitUpdateForm = async (elForm?: FormInstance) => {
    const activeForm = elForm || formRef.value
    if (!activeForm) return
    await activeForm.validate()

    saving.value = true
    try {
      const payload = {
        id: formData.id,
        parent_id: formData.parent_id || 0,
        name: formData.name,
        sort: formData.sort || 0,
        leaders: selectedLeaders.value,
        main_leader: selectedMainLeaderUsername.value
      }
      await updateDepartmentApi(payload)
      resetForm()
      if (onSuccess) {
        onSuccess(formData.id)
      }
    } catch (error) {
      console.error("修改部门失败:", error)
    } finally {
      saving.value = false
    }
  }

  return {
    formRef,
    formData,
    formRules,
    saving,
    selectedLeaders,
    selectedMainLeaderUsername,
    resetForm,
    setDepartmentData,
    setFormForPid,
    submitCreateForm,
    submitUpdateForm
  }
}
