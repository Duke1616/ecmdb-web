import { changeEndpointsApi } from "./index"
import type { ChangeEndpointsReq, endpoint } from "./types/menu"
import { Action } from "./types/menu"
import { ElMessage } from "element-plus"

/**
 * 变更菜单端点的工具函数
 */
export class MenuEndpointsManager {
  /**
   * 创建端点（第一次创建）
   * @param menuId 菜单ID
   * @param endpoints 端点列表
   */
  static async createEndpoints(menuId: number, endpoints: endpoint[]) {
    return this.changeEndpoints(menuId, Action.CREATE, endpoints)
  }

  /**
   * 新增端点
   * @param menuId 菜单ID
   * @param endpoints 要新增的端点列表
   */
  static async addEndpoints(menuId: number, endpoints: endpoint[]) {
    return this.changeEndpoints(menuId, Action.WRITE, endpoints)
  }

  /**
   * 删除所有端点并重新录入
   * @param menuId 菜单ID
   * @param endpoints 新的端点列表
   */
  static async replaceEndpoints(menuId: number, endpoints: endpoint[]) {
    return this.changeEndpoints(menuId, Action.DELETE, endpoints)
  }

  /**
   * 变更端点的通用方法
   * @param menuId 菜单ID
   * @param action 动作类型
   * @param endpoints 端点列表
   */
  private static async changeEndpoints(menuId: number, action: Action, endpoints: endpoint[]) {
    try {
      const data: ChangeEndpointsReq = {
        id: menuId,
        action,
        endpoints
      }

      const response = await changeEndpointsApi(data)
      
      // 不在这里显示消息，由调用方决定是否显示
      return response.data
    } catch (error: any) {
      console.error("变更端点失败:", error)
      ElMessage.error(error.message || "变更端点失败")
      throw error
    }
  }
}

/**
 * 便捷的端点变更函数
 */
export const changeMenuEndpoints = {
  /**
   * 创建端点
   */
  create: (menuId: number, endpoints: endpoint[]) => 
    MenuEndpointsManager.createEndpoints(menuId, endpoints),

  /**
   * 新增端点
   */
  add: (menuId: number, endpoints: endpoint[]) => 
    MenuEndpointsManager.addEndpoints(menuId, endpoints),

  /**
   * 替换端点
   */
  replace: (menuId: number, endpoints: endpoint[]) => 
    MenuEndpointsManager.replaceEndpoints(menuId, endpoints)
}
