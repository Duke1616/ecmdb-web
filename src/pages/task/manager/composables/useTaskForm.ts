import { ref, computed, nextTick, watch, type Ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { createTaskApi, updateTaskApi, getTaskDetailApi } from "@/api/task/manager"
import { TaskType, TaskProtocol, type UpdateTaskReq } from "@/api/task/manager/type"
import type { HandlerDetail } from "@/api/task/executor/type"
import { useTaskResources } from "./useTaskResources"
import { type TaskFormState, createDefaultFormState, mapToFormState, mapToApiPayload } from "./useTaskData"

/**
 * 任务表单核心交互联动与业务提交流程 Hook
 * @param options 表单初始化配置，包括任务ID、组件双向绑定可见状态、事件发射器
 */
export function useTaskForm(options: {
  taskId?: () => number | undefined
  visible: Ref<boolean>
  emit: (e: "success") => void
}) {
  const { taskId, visible, emit } = options

  const currentTaskId = computed(() => taskId?.())

  const formRef = ref<FormInstance>()
  const saving = ref(false)
  const httpConfigTab = ref("headers")
  const form = ref<TaskFormState>(createDefaultFormState())

  // --- 外部注册中心资源 ---
  const {
    loading: resourceLoading,
    executorList,
    fetchResources,
    queryServiceSuggestions,
    queryHandlerSuggestions
  } = useTaskResources()

  // --- 计算属性与联动查询 ---
  const currentHandler = computed(() => {
    const serviceName = form.value.grpc_service
    if (!serviceName) return null

    const executor = executorList.value.find((e) => e.name === serviceName)
    if (!executor) return null

    return executor.handlers.find((h) => h.name === form.value.grpc_handler) ?? null
  })

  // --- 校验规则自适应计算 ---
  const rules = computed<FormRules<TaskFormState>>(() => {
    const r: FormRules<TaskFormState> = {
      name: [{ required: true, message: "请输入任务标识", trigger: "blur" }]
    }

    if (form.value.type === TaskType.RECURRING) {
      r.cron_expr = [{ required: true, message: "请输入有效的 Cron 表达式", trigger: ["blur", "change"] }]
    }

    if (form.value.protocol === TaskProtocol.GRPC) {
      r.grpc_service = [{ required: true, message: "请选择执行器服务", trigger: "change" }]
      r.grpc_handler = [{ required: true, message: "请选择处理方法", trigger: "change" }]
    } else {
      r.http_endpoint = [{ required: true, message: "请输入接口地址", trigger: "blur" }]
    }

    return r
  })

  // --- 表单联动与 UI 事件处理 ---
  const handleServiceSelect = () => {
    // 切换服务时清空先前绑定的接口
    form.value.grpc_handler = ""
  }

  const handleHandlerSelect = (item: Record<string, any>) => {
    const handler = item as HandlerDetail
    const params = form.value.grpc_params

    // 基于元数据自适应初始化参数的默认值
    for (const meta of handler.metadata ?? []) {
      params[meta.key] = params[meta.key] || meta.default || ""
    }
  }

  const queryHandlers = (qs: string, cb: (res: (HandlerDetail & { value: string })[]) => void) => {
    const serviceName = form.value.grpc_service
    queryHandlerSuggestions(serviceName, qs, cb)
  }

  const handleCronSelect = (val: string) => {
    form.value.cron_expr = val
    formRef.value?.validateField("cron_expr").catch(() => {})
  }

  const handleProtocolChange = (protocol: TaskProtocol) => {
    form.value.protocol = protocol
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  // --- 数据详情拉取与重置 ---
  const loadDetail = async () => {
    const id = currentTaskId.value
    if (!id) return

    try {
      const { data } = await getTaskDetailApi(id)
      form.value = mapToFormState(data)
    } catch (error) {
      console.error("加载任务详情失败:", error)
      ElMessage.error("加载任务详情失败")
    }
  }

  // 当抽屉开启状态变化时，决定是拉取详情还是重置状态
  watch(visible, async (val) => {
    if (val) {
      // 仅在打开抽屉时按需拉取执行器资源，避免在列表页挂载时 premature 触发 API 请求
      fetchResources()

      if (currentTaskId.value) {
        await loadDetail()
      } else {
        form.value = createDefaultFormState()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  })

  // --- 提交流程 ---
  const submit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()

    saving.value = true
    try {
      const payload = mapToApiPayload(form.value)
      const id = currentTaskId.value

      if (id) {
        await updateTaskApi({ ...payload, id } as UpdateTaskReq)
        ElMessage.success("更新任务成功")
      } else {
        await createTaskApi(payload)
        ElMessage.success("创建任务成功")
      }

      visible.value = false
      emit("success")
    } finally {
      saving.value = false
    }
  }

  return {
    formRef,
    form,
    saving,
    httpConfigTab,
    resourceLoading,
    currentHandler,
    rules,
    handleServiceSelect,
    handleHandlerSelect,
    queryHandlers,
    handleCronSelect,
    handleProtocolChange,
    submit,
    queryServiceSuggestions
  }
}
