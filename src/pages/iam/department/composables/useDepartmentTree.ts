import { ref, computed } from "vue"
import { listDepartmentTreeApi } from "@/api/iam/department"
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

  return {
    treeData,
    loading,
    currentNodeKey,
    departmentCount,
    refreshTreeData,
    findDepartmentById
  }
}
