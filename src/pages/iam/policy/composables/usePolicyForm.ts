import { ref, reactive, computed, onMounted, watch, toRef } from "vue"
import { ElMessage, type FormInstance } from "element-plus"
import { getPermissionManifestApi, listMenusByURNsApi } from "@/api/iam/permission"
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
export function usePolicyForm(props: { code?: string }, emit: (e: "success") => void) {
  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const permissionManifest = ref<ManifestService[]>([])
  const menuDetailsMap = ref<Record<string, any>>({})
  const isEdit = computed(() => !!props.code)

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
      isEdit.value ? "请至少保留一条权限语句" : "请至少添加一条权限语句"
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
      if (isEdit.value) {
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
        props.code ? getPolicyDetailApi(props.code) : null
      ])

      permissionManifest.value = enrichManifest(manifestRes.data)

      // NOTE: 扁平提取 URN 列表并批量查询菜单详情。使用 flatMap 与 Set 简化层级嵌套，提升可读性。
      const rawActions = manifestRes.data?.actions || []
      const urnList = [
        ...new Set(
          rawActions
            .filter((act) => act.has_menu && Array.isArray(act.menu_urns))
            .flatMap((act) => act.menu_urns || [])
            .filter(Boolean)
        )
      ] as string[]

      if (urnList.length > 0) {
        try {
          const menuRes = await listMenusByURNsApi({ urns: urnList })
          const details: Record<string, any> = {}
          if (Array.isArray(menuRes.data)) {
            menuRes.data.forEach((m) => {
              const urn = `eiam:menu:${m.name}`
              details[urn] = m
            })
          }
          menuDetailsMap.value = details
        } catch (menuErr) {
          console.error("[GetMenuDetailsError]", menuErr)
        }
      }

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
    menuDetailsMap,
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
 * NOTE: 此 Composable 将模式切换及底层双重同步封装为黑盒，确保双向绑定状态的一致性，防止视图和代码脱节。
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

  // NOTE: 侦听 editorMode。当用户切换到 json 编辑模式时，自动由可视化数据生成最新 JSON；
  // 当切换回 visual 模式时，对当前编辑的 JSON 运行反序列化，若解析失败则强制拦截并停留于 json 模式。
  watch(editorMode, (newMode, oldMode) => {
    if (newMode === "json") {
      syncFromVisual()
    } else if (newMode === "visual" && oldMode === "json") {
      if (!trySyncFromJson()) {
        editorMode.value = "json"
      }
    }
  })

  // NOTE: 实时侦听可视化状态的变化。只有在处于可视化模式（visual）下，才执行 JSON 状态的静默同步，
  // 避免在脚本模式下键入不完整 JSON 时触发错误的解析警报。
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
