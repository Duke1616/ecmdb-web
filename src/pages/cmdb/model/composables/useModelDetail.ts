import type ModelDeleteDialog from "../components/ModelDeleteDialog.vue"
import { computed, h, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { deleteModelApi, getModelDetailApi } from "@/api/cmdb/model"
import type { Model } from "@/api/cmdb/model/types/model"
import { useDataIO } from "@/common/composables/useDataIO"

export const useModelDetail = () => {
  const route = useRoute()
  const router = useRouter()
  const { exporting, exportTemplate } = useDataIO()

  const activeTab = ref("model-field")
  const modelInfo = ref<Model | null>(null)
  const modelId = computed(() => Number(route.query.id) || undefined)
  const modelUid = computed(() => modelInfo.value?.uid ?? "")
  const modelName = computed(() => modelInfo.value?.name ?? "")
  const isBuiltin = computed(() => Boolean(modelInfo.value?.builtin))

  const fetchModelInfo = async () => {
    if (!modelId.value) return

    try {
      const { data } = await getModelDetailApi(modelId.value)
      const rawData = data as any
      modelInfo.value = rawData?.model ?? rawData ?? null
    } catch (error) {
      console.error("获取模型详情失败:", error)
      modelInfo.value = null
    }
  }

  const goBack = () => {
    router.go(-1)
  }

  const handleExportTemplate = async () => {
    if (!modelUid.value) return
    await exportTemplate(modelUid.value, modelName.value)
  }

  const handleDisableModel = async () => {
    if (!modelUid.value) return

    await ElMessageBox({
      title: "禁用确认",
      message: h("p", null, [
        h("span", null, "确认要禁用模型: "),
        h("strong", { style: "color: warning" }, `${modelName.value}`),
        h("span", null, " 吗？")
      ]),
      confirmButtonText: "确认禁用",
      cancelButtonText: "取消",
      type: "warning"
    })

    ElMessage.success("模型已禁用")
  }

  const deleteDialogRef = ref<InstanceType<typeof ModelDeleteDialog>>()

  const handleDeleteModel = () => {
    if (!modelInfo.value) {
      ElMessage.warning("数据加载中，请稍后再试")
      return
    }
    if (isBuiltin.value) {
      ElMessage.warning("内置模型不可删除")
      return
    }

    deleteDialogRef.value?.open(modelInfo.value)
  }

  onMounted(fetchModelInfo)

  return {
    activeTab,
    modelInfo,
    modelUid,
    modelName,
    isBuiltin,
    exporting,
    goBack,
    fetchModelInfo,
    handleExportTemplate,
    handleDisableModel,
    handleDeleteModel,
    deleteDialogRef
  }
}
