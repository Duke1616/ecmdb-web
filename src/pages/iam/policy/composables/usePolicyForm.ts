import { ref, reactive } from "vue"
import { ElMessage } from "element-plus"
import type { FormInstance } from "element-plus"
import { getPermissionManifestApi } from "@/api/iam/permission"
import { createPolicyApi, updatePolicyApi } from "@/api/iam/policy"
import type { Policy, Statement } from "@/api/iam/policy/type"

export function usePolicyForm(props: { isEdit: boolean }, emit: any) {
  const formRef = ref<FormInstance>()
  const permissionTree = ref<any[]>([])

  const formData = reactive({
    name: "",
    code: "",
    desc: "",
    type: 2,
    statement: [newStatement()] as Statement[]
  })

  const formRules = {
    name: [{ required: true, message: "请输入策略名称", trigger: "blur" }],
    code: [{ required: true, message: "请输入标识码", trigger: "blur" }],
    desc: [{ required: true, message: "请输入描述", trigger: "blur" }]
  }

  function newStatement(): Statement {
    return {
      effect: "Allow",
      action: [],
      resource: ["*"]
    }
  }

  const loadPermissionTree = async () => {
    try {
      const { data } = await getPermissionManifestApi()
      const actionMap = new Map(data.actions.map((act) => [act.code, act]))

      // 将 Manifest 转换为 UI 渲染所需的带元数据的树结构
      permissionTree.value = data.services.map((svc) => ({
        name: svc.name,
        code: svc.code,
        entries: svc.entries.map((entry) => ({
          name: entry.name,
          actions: entry.actions.map((actionCode) => {
            const detail = actionMap.get(actionCode)
            return {
              name: detail?.name || actionCode,
              code: actionCode
            }
          })
        }))
      }))
    } catch (e) {
      console.error("加载权限清单失败:", e)
    }
  }

  const addStatement = () => formData.statement.push(newStatement())

  const removeStatement = (index: number) => {
    if (formData.statement.length <= 1) return ElMessage.warning("至少保留一条策略语句")
    formData.statement.splice(index, 1)
  }

  const duplicateStatement = (index: number) => {
    const s = JSON.parse(JSON.stringify(formData.statement[index]))
    formData.statement.splice(index + 1, 0, s)
  }

  const setForm = (data: Policy) => {
    formData.name = data.name
    formData.code = data.code
    formData.desc = data.desc
    formData.type = data.type
    formData.statement = JSON.parse(JSON.stringify(data.statement))
  }

  const submit = async () => {
    await formRef.value?.validate()
    if (formData.statement.some((s) => !s.action.length)) {
      return ElMessage.error("每个语句必须至少选择一个操作权限")
    }
    try {
      const payload = { ...formData }
      props.isEdit ? await updatePolicyApi(payload) : await createPolicyApi(payload)
      ElMessage.success(props.isEdit ? "策略修改成功" : "策略创建成功")
      emit("success")
    } catch (e) {
      console.error("提交策略失败:", e)
    }
  }

  return {
    formRef,
    formData,
    formRules,
    permissionTree,
    loadPermissionTree,
    addStatement,
    removeStatement,
    duplicateStatement,
    setForm,
    submit
  }
}
