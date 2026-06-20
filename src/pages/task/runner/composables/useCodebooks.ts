import { ref, computed, watch } from "vue"
import type { Ref } from "vue"
import type { codebook, CodebookProject } from "@/api/task/codebook/types/codebook"
import { listProjectApi, treeCodebookApi, detailCodebookApi } from "@/api/task/codebook"
import { buildTree } from "@/pages/task/codebook/composables/useCodebookTree"
import type { registerOrUpdateReq } from "@/api/task/runner/types/runner"

/**
 * 管理脚本项目列表与脚本树选择逻辑的 Composable
 * @param formData 执行器表单数据
 */
export function useCodebooks(formData: Ref<registerOrUpdateReq>) {
  const projects = ref<CodebookProject[]>([])
  const selectedProjectId = ref<number | undefined>(undefined)
  const codebookTree = ref<codebook[]>([])
  const projectsLoading = ref(false)
  const codebookTreeLoading = ref(false)
  const fallbackCodebookName = ref("")

  /** 获取全部项目列表 */
  const fetchProjects = async () => {
    projectsLoading.value = true
    try {
      const { data } = await listProjectApi({ offset: 0, limit: 1000 })
      projects.value = data.projects || []
    } catch (e) {
      projects.value = []
    } finally {
      projectsLoading.value = false
    }
  }

  /** 获取指定项目下的脚本资源树 */
  const fetchCodebookTree = async (projectId: number) => {
    codebookTreeLoading.value = true
    try {
      const { data } = await treeCodebookApi(projectId)
      codebookTree.value = buildTree(data.codebooks || [])
    } catch (e) {
      codebookTree.value = []
    } finally {
      codebookTreeLoading.value = false
    }
  }

  /** 递归从树节点中查找指定 ID 的脚本 */
  const findCodebookInTree = (nodes: codebook[], id: number): codebook | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children && node.children.length > 0) {
        const found = findCodebookInTree(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  /** 根据选中的 codebook_id 自动从树中查找对应的密钥 */
  const computedSecret = computed(() => {
    if (!formData.value.codebook_id) return ""
    const matched = findCodebookInTree(codebookTree.value, formData.value.codebook_id)
    return matched?.secret ?? ""
  })

  // NOTE: 选中模版后自动同步密钥，确保用户操作时能即时回显
  watch(computedSecret, (val) => {
    if (val) {
      formData.value.codebook_secret = val
    } else if (!formData.value.codebook_id) {
      formData.value.codebook_secret = ""
    }
  })

  /** 计算当前选中的脚本名称，用于执行器命名生成 */
  const codebookName = computed(() => {
    if (!formData.value.codebook_id) return ""
    const matched = findCodebookInTree(codebookTree.value, formData.value.codebook_id)
    if (matched) return matched.name
    return fallbackCodebookName.value
  })

  /** 项目切换事件处理器 */
  const onProjectChange = (projectId?: number) => {
    formData.value.codebook_id = undefined
    formData.value.codebook_secret = ""
    codebookTree.value = []
    if (projectId) {
      fetchCodebookTree(projectId)
    }
  }

  return {
    projects,
    selectedProjectId,
    codebookTree,
    projectsLoading,
    codebookTreeLoading,
    fallbackCodebookName,
    codebookName,
    fetchProjects,
    fetchCodebookTree,
    onProjectChange,
    detailCodebookApi
  }
}
