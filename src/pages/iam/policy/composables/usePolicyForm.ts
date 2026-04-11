import { ref, reactive, onMounted } from "vue"
import { ElMessage, type FormInstance } from "element-plus"
import { useRouter } from "vue-router"
import { getPermissionManifestApi } from "@/api/iam/permission"
import { createPolicyApi, updatePolicyApi } from "@/api/iam/policy"
import type { UpdatePolicyRequest } from "@/api/iam/policy/type"
import {
  createDefaultStatement,
  enrichManifest,
  mapVOToRequest,
  mapResponseToVO,
  type PolicyFormVO,
  type ManifestService
} from "./usePolicyData"

/**
 * 策略表单总控 Composable
 */
export function usePolicyForm(props: { isEdit: boolean; id?: string }, emit: (e: "success") => void) {
  const router = useRouter()
  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const formData = reactive<PolicyFormVO>({
    name: "",
    code: "",
    desc: "",
    type: 2,
    statement: [createDefaultStatement()]
  })

  const permissionManifest = ref<ManifestService[]>([])

  const formRules = {
    name: [{ required: true, message: "请输入策略名称", trigger: "blur" }],
    code: [
      { required: true, message: "请输入策略识别码", trigger: "blur" },
      { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: "以字母开头，仅含字母、数字、下划线和连字符", trigger: "blur" }
    ]
  }

  /**
   * 加载权限清单
   * API 返回 { actions: ActionDetail[], services: ServiceEntry[] }
   * 通过 enrichManifest 将 entries[].actions 从 string[] 充实为 {code, name}[]
   */
  const loadManifest = async () => {
    try {
      const { data } = await getPermissionManifestApi()
      permissionManifest.value = enrichManifest(data)
    } catch (e) {
      console.error("[LoadManifest]", e)
    }
  }

  const addStatement = () => {
    formData.statement.push(createDefaultStatement())
  }

  const removeStatement = (index: number) => {
    if (formData.statement.length <= 1) {
      return ElMessage.warning("至少保留一条权限语句")
    }
    formData.statement.splice(index, 1)
  }

  const duplicateStatement = (index: number) => {
    const copy = JSON.parse(JSON.stringify(formData.statement[index]))
    formData.statement.splice(index + 1, 0, copy)
  }

  const submitForm = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()

      const emptyIdx = formData.statement.findIndex((s) => s.action.length === 0)
      if (emptyIdx !== -1) {
        return ElMessage.error(`第 ${emptyIdx + 1} 条语句尚未配置权限操作`)
      }

      loading.value = true
      const payload = mapVOToRequest(formData)

      if (props.isEdit) {
        await updatePolicyApi(payload as unknown as UpdatePolicyRequest)
      } else {
        await createPolicyApi(payload)
      }

      ElMessage.success("策略保存成功")
      emit("success")
      router.push("/iam/policy")
    } catch (e) {
      console.error("[SubmitError]", e)
    } finally {
      loading.value = false
    }
  }

  const setForm = (val: any) => {
    Object.assign(formData, mapResponseToVO(val))
  }

  onMounted(loadManifest)

  return {
    formRef,
    formData,
    formRules,
    loading,
    permissionManifest,
    addStatement,
    removeStatement,
    duplicateStatement,
    submitForm,
    setForm
  }
}
