import { ref, computed, reactive } from "vue"
import type { Statement } from "@/api/iam/policy/type"
import type { ManifestService } from "../../types"

export function useStatementLogic(props: { stmt: Statement; permissionManifest: ManifestService[] }, emit: any) {
  // 1. 交互状态
  const expanded = reactive({
    orchestrator: true,
    resource: false,
    condition: false
  })

  const toggleExpanded = (key: "orchestrator" | "resource" | "condition") => {
    expanded[key] = !expanded[key]
  }

  // 2. 服务与操作逻辑
  const selectedServiceCodes = ref<string[]>([])

  const actionMode = computed(() => {
    return props.stmt.action.some((a) => a.endsWith(":*")) ? "all" : "specific"
  })

  const syncServicesFromData = () => {
    const codesInAction = props.stmt.action.map((a) => a.split(":")[0])
    selectedServiceCodes.value = [...new Set(codesInAction)].filter((c) =>
      props.permissionManifest.some((s) => s.code === c)
    )
  }
  syncServicesFromData()

  // 3. 资源逻辑
  const resourceMode = computed(() => {
    return props.stmt.resource.includes("*") ? "all" : "specific"
  })

  const resourceText = computed(() => {
    return props.stmt.resource.filter((r) => r !== "*").join("\n")
  })

  // 4. 核心 Patch 函数
  const patchStmt = (patch: Partial<Statement>) => {
    emit("update:stmt", { ...props.stmt, ...patch })
  }

  // 5. 事件处理函数 (平铺导出)
  const onEffectChange = (val: any) => patchStmt({ effect: val })

  const onServiceChange = (val: any) => {
    const newCodes = val as string[]
    const oldCodes = selectedServiceCodes.value
    selectedServiceCodes.value = newCodes
    let nextActions = [...props.stmt.action]
    oldCodes
      .filter((c) => !newCodes.includes(c))
      .forEach((code) => {
        nextActions = nextActions.filter((a) => !a.startsWith(`${code}:`))
      })
    if (actionMode.value === "all") {
      nextActions = newCodes.map((c) => `${c}:*`)
    }
    patchStmt({ action: nextActions })
  }

  const onActionModeChange = (val: any) => {
    const mode = val as "all" | "specific"
    if (mode === "all") {
      patchStmt({ action: selectedServiceCodes.value.map((c) => `${c}:*`) })
    } else {
      patchStmt({ action: props.stmt.action.filter((a) => !a.endsWith(":*")) })
    }
  }

  const onResourceModeChange = (val: any) => {
    const mode = val as "all" | "specific"
    if (mode === "all") {
      patchStmt({ resource: ["*"] })
    } else {
      patchStmt({ resource: props.stmt.resource.filter((r) => r !== "*") })
    }
  }

  const onResourceTextUpdate = (text: string) => {
    const list = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s !== "")
    patchStmt({ resource: list })
  }

  const onActionsUpdate = (nextActions: string[]) => {
    patchStmt({ action: nextActions })
  }

  const onActionToggle = (actionCode: string, checked: boolean) => {
    const nextActions = checked
      ? [...new Set([...props.stmt.action, actionCode])]
      : props.stmt.action.filter((a) => a !== actionCode)
    patchStmt({ action: nextActions })
  }

  // 6. 衍生数据 (平铺导出)
  const activeServices = computed(() =>
    props.permissionManifest.filter((s) => selectedServiceCodes.value.includes(s.code))
  )

  const summaryText = computed(() => {
    if (selectedServiceCodes.value.length === 0) return "权限条目配置"
    const firstSvc = props.permissionManifest.find((s) => s.code === selectedServiceCodes.value[0])
    return `${firstSvc?.name || "未知模块"} / ${actionMode.value === "all" ? "全部授权" : props.stmt.action.length + " 个操作"}`
  })

  return {
    expanded,
    toggleExpanded,
    selectedServiceCodes,
    actionMode,
    resourceMode,
    resourceText,
    activeServices,
    summaryText,
    onEffectChange,
    onServiceChange,
    onActionModeChange,
    onResourceModeChange,
    onResourceTextUpdate,
    onActionsUpdate,
    onActionToggle,
    patchStmt
  }
}
