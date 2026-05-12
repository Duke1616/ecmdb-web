import { useUserStore } from "@/pinia/stores/user"
import { storeToRefs } from "pinia"
import { PERMISSION_CONFIG } from "@/common/auth/config"

/**
 * 权限校验模式
 */
export enum PermissionMode {
  /** 满足数组中任意一个权限即可 */
  ANY = "any",
  /** 必须满足数组中所有权限 */
  ALL = "all"
}

/**
 * 权限判定 Composable
 */
export function usePermission() {
  const userStore = useUserStore()
  const { permissions, isAdmin } = storeToRefs(userStore)

  /**
   * 检查是否拥有指定权限 (支持单权限 or 多权限)
   * @param value 权限代码或代码数组
   * @param mode 校验模式: PermissionMode.ANY | PermissionMode.ALL
   */
  const hasPermission = (value: string | string[], mode: PermissionMode = PermissionMode.ANY) => {
    // 1. 全局配置开关 (最高优先级)
    if (!PERMISSION_CONFIG.ENABLE) return true

    // 2. 超级管理员一键绕过所有权限检查 (上帝模式)
    if (PERMISSION_CONFIG.ADMIN_BYPASS && isAdmin.value) return true

    if (!value) return true

    const required = Array.isArray(value) ? value : [value]

    if (mode === PermissionMode.ANY) {
      return permissions.value.some((p) => required.includes(p))
    } else {
      return required.every((p) => permissions.value.includes(p))
    }
  }

  return {
    permissions,
    hasPermission
  }
}
