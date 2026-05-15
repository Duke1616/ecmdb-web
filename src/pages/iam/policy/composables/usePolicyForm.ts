import { ref, reactive, onMounted, watch, toRef } from "vue"
import { ElMessage, type FormInstance } from "element-plus"
import { getPermissionManifestApi } from "@/api/iam/permission"
import { createPolicyApi, getPolicyDetailApi, updatePolicyApi } from "@/api/iam/policy"
import type { UpdatePolicyRequest } from "@/api/iam/policy/type"
import {
  createDefaultStatement,
  enrichManifest,
  getStatementValidationMessage,
  mapVOToRequest,
  mapResponseToVO,
  normalizeStatements,
  parseStatementsJson,
  type PolicyFormVO,
  type ManifestService
} from "./usePolicyData"

/**
 * 策略表单总控 Composable
 * 核心优化：将逻辑拆分为「基础数据」、「编辑器同步」、「业务动作」三个高内聚模块
 */
export function usePolicyForm(props: { isEdit: boolean; code?: string }, emit: (e: "success") => void) {
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const permissionManifest = ref<ManifestService[]>([])

  // --- 1. 核心表单数据状态 ---
  const formData = reactive<PolicyFormVO>({
    name: "",
    code: "",
    desc: "",
    type: 2,
    statement: [createDefaultStatement()]
  })

  // --- 2. 编辑器同步逻辑 (可视化 <-> JSON 脚本) ---
  const { editorMode, jsonCode, syncFromVisual, trySyncFromJson } = useDualModeEditor(toRef(formData, "statement"))

  // --- 3. 校验与提交 ---
  const formRules = {
    name: [{ required: true, message: "请输入策略名称", trigger: "blur" }],
    code: [
      { required: true, message: "请输入策略识别码", trigger: "blur" },
      { pattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/, message: "以字母开头，仅含字母、数字、下划线和连字符", trigger: "blur" }
    ]
  }

  const validateStatements = () => {
    // 提交前尝试从 JSON 同步（如果当前处于 JSON 模式）
    if (editorMode.value === "json" && !trySyncFromJson()) {
      return false
    }

    const message = getStatementValidationMessage(
      formData.statement,
      props.isEdit ? "请至少保留一条权限语句" : "请至少添加一条权限语句"
    )

    if (message) {
      ElMessage.warning(message)
      return false
    }
    return true
  }

  const submitForm = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      loading.value = true

      const payload = mapVOToRequest(formData)
      if (props.isEdit) {
        await updatePolicyApi(payload as unknown as UpdatePolicyRequest)
      } else {
        await createPolicyApi(payload)
      }

      ElMessage.success("策略保存成功")
      emit("success")
    } catch (e) {
      console.error("[SubmitError]", e)
    } finally {
      loading.value = false
    }
  }

  // --- 4. 辅助动作 (语句增删改) ---
  const addStatement = () => formData.statement.push(createDefaultStatement())

  const removeStatement = (index: number) => {
    if (formData.statement.length <= 1) return ElMessage.warning("至少保留一条权限语句")
    formData.statement.splice(index, 1)
  }

  const duplicateStatement = (index: number) => {
    const copy = normalizeStatements([structuredClone(formData.statement[index])])[0]
    formData.statement.splice(index + 1, 0, copy)
  }

  // --- 5. 生命周期加载 ---
  onMounted(async () => {
    loading.value = true
    try {
      const [manifestRes, detailRes] = await Promise.all([
        getPermissionManifestApi(),
        props.isEdit && props.code ? getPolicyDetailApi(props.code) : null
      ])

      permissionManifest.value = enrichManifest(manifestRes.data)
      if (detailRes) {
        Object.assign(formData, mapResponseToVO(detailRes.data.policy ?? detailRes.data))
        // 初始同步一次 JSON
        syncFromVisual()
      }
    } catch (e) {
      console.error("[InitializeDataError]", e)
      ElMessage.error("初始化数据失败")
    } finally {
      loading.value = false
    }
  })

  return {
    formRef,
    formData,
    formRules,
    loading,
    permissionManifest,
    editorMode,
    jsonCode,
    addStatement,
    removeStatement,
    duplicateStatement,
    validateStatements,
    submitForm
  }
}

/**
 * 内部辅助 Composable：管理可视化与 JSON 模式的平滑同步
 */
function useDualModeEditor(statement: import("vue").Ref<any[]>) {
  const editorMode = ref<"visual" | "json">("visual")
  const jsonCode = ref("")

  const syncFromVisual = () => {
    jsonCode.value = JSON.stringify(statement.value, null, 2)
  }

  const trySyncFromJson = () => {
    try {
      statement.value = parseStatementsJson(jsonCode.value)
      return true
    } catch (e: any) {
      ElMessage.error(`脚本解析失败: ${e.message}`)
      return false
    }
  }

  // 模式切换拦截与自动同步
  watch(editorMode, (newMode, oldMode) => {
    if (newMode === "json") {
      syncFromVisual()
    } else if (newMode === "visual" && oldMode === "json") {
      if (!trySyncFromJson()) {
        // 解析失败，强制停留（不使用 setTimeout，通过 nextTick 解决或直接重置）
        editorMode.value = "json"
      }
    }
  })

  // 实时监听可视化变更（保持 JSON 预览同步）
  watch(
    statement,
    () => {
      if (editorMode.value === "visual") syncFromVisual()
    },
    { deep: true }
  )

  return {
    editorMode,
    jsonCode,
    syncFromVisual,
    trySyncFromJson
  }
}
