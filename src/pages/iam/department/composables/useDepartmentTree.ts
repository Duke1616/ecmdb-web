import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import { listDepartmentTreeApi, updateDepartmentApi } from "@/api/iam/department"
import type { IDepartmentNode } from "@/api/iam/department/type"

/**
 * 部门树状态与数据逻辑组合式函数
 */
export function useDepartmentTree() {
  const treeData = ref<IDepartmentNode[]>([])
  const loading = ref(false)
  const currentNodeKey = ref<number | null>(null)

  // 部门数量计算
  const departmentCount = computed(() => treeData.value?.length || 0)

  /**
   * 递归查找部门节点
   */
  const findDepartmentById = (departments: IDepartmentNode[], id: number): IDepartmentNode | null => {
    for (const department of departments) {
      if (department.id === id) return department
      if (department.children && department.children.length > 0) {
        const found = findDepartmentById(department.children, id)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 加载/刷新部门树数据
   */
  const refreshTreeData = async () => {
    loading.value = true
    try {
      const { data } = await listDepartmentTreeApi()
      treeData.value = Array.isArray(data) ? data : []

      // 如果之前选中的节点现在不存在了，重置选中状态
      if (currentNodeKey.value) {
        const node = findDepartmentById(treeData.value, currentNodeKey.value)
        if (!node) {
          currentNodeKey.value = null
        }
      }
    } catch (error) {
      console.error("加载部门树数据失败:", error)
      treeData.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新指定父节点下所有子部门的排序与层级关系并保存
   */
  const saveTreeLayout = async (parentId: number) => {
    // 1. 查找拖拽放置后的新父节点下的所有直接子部门列表
    const siblings = parentId === 0 ? treeData.value : findDepartmentById(treeData.value, parentId)?.children || []

    // 2. 使用函数式链映射出真正发生实质变化的节点的更新请求
    const updateRequests = siblings
      .map((node, index) => ({ node, sort: (index + 1) * 10 }))
      .filter(({ node, sort }) => node.parent_id !== parentId || node.sort !== sort)
      .map(({ node, sort }) => {
        // 同步修改内存以防止页面闪烁或渲染延迟
        node.parent_id = parentId
        node.sort = sort

        return updateDepartmentApi({
          id: node.id,
          parent_id: parentId,
          name: node.name,
          sort,
          leaders: node.leaders || [],
          main_leader: node.main_leader || ""
        })
      })

    if (updateRequests.length === 0) return

    loading.value = true
    try {
      await Promise.all(updateRequests)
      ElMessage.success("部门排序与层级更新成功")
    } catch (error) {
      console.error("更新部门排序或层级失败:", error)
      ElMessage.error("更新位置失败，请刷新页面重试")
    } finally {
      loading.value = false
      await refreshTreeData()
    }
  }

  return {
    treeData,
    loading,
    currentNodeKey,
    departmentCount,
    refreshTreeData,
    findDepartmentById,
    saveTreeLayout
  }
}
