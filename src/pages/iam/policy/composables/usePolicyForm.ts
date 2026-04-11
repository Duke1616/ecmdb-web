import { ref, reactive, computed } from "vue"
import { ElMessage } from "element-plus"
import type { FormInstance } from "element-plus"
import { getPermissionManifestApi } from "@/api/iam/permission"
import { createPolicyApi, updatePolicyApi } from "@/api/iam/policy"
import type { Policy, Statement } from "@/api/iam/policy/type"
import type { ServicePermissionEntry, ActionDetail } from "@/api/iam/permission/type"
import type { ManifestService, ManifestAction } from "../types"

export function usePolicyForm(props: { isEdit: boolean }, emit: any) {
  const formRef = ref<FormInstance>()

  // 1. 原始 DTO 数据 (对应后端 JSON 结构，明确指定类型)
  const rawServices = ref<ServicePermissionEntry[]>([])
  const rawActions = ref<ActionDetail[]>([])

  // 2. 核心转换逻辑：将 DTO 组装为带翻译信息的 UI VO 清单
  const permissionManifest = computed<ManifestService[]>(() => {
    const registryMap = new Map(rawActions.value.map((a) => [a.code, a]))

    return rawServices.value.map((svc) => ({
      code: svc.code,
      name: svc.name,
      entries: svc.entries.map((grp) => ({
        name: grp.name,
        actions: grp.actions.map((code) => registryMap.get(code) || ({ code, name: code } as ManifestAction))
      }))
    }))
  })

  // 3. 基础表单状态
  const newStatement = (): Statement => ({
    effect: "Allow",
    action: [],
    resource: ["*"]
  })

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

  // 4. 数据加载
  const loadManifest = async () => {
    try {
      const { data } = await getPermissionManifestApi()
      rawServices.value = data.services
      rawActions.value = data.actions
    } catch (e) {
      ElMessage.error("加载权限清单失败")
    }
  }

  // --- 行为函数 ---
  const addStatement = () => formData.statement.push(newStatement())
  const removeStatement = (idx: number) => {
    if (formData.statement.length <= 1) return ElMessage.warning("至少保留一条语句")
    formData.statement.splice(idx, 1)
  }
  const duplicateStatement = (idx: number) => {
    formData.statement.splice(idx + 1, 0, JSON.parse(JSON.stringify(formData.statement[idx])))
  }

  const setForm = (data: Policy) => {
    Object.assign(formData, { ...data, statement: JSON.parse(JSON.stringify(data.statement)) })
  }

  const submit = async () => {
    await formRef.value?.validate()
    if (formData.statement.some((s) => !s.action.length)) return ElMessage.error("语句缺少权限配置")
    try {
      const payload = { ...formData }
      props.isEdit ? await updatePolicyApi(payload) : await createPolicyApi(payload)
      ElMessage.success("保存成功")
      emit("success")
    } catch (e) {
      console.error(e)
    }
  }

  return {
    formRef,
    formData,
    formRules,
    permissionManifest,
    loadManifest,
    addStatement,
    removeStatement,
    duplicateStatement,
    setForm,
    submit
  }
}
