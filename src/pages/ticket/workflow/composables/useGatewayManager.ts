import { ref, type Ref } from "vue"
import type LogicFlow from "@logicflow/core"
import { getNodeConfig } from "@@/components/workflow/RegisterNode/index"
import { isGatewayType } from "@@/components/workflow/RegisterNode/gateway/constants"

/**
 * 网关交互与原地热替换管理 Composable
 * @param lfRef LogicFlow 实例引用
 * @param syncCanvasCallback 画布数据同步回调
 * @param isDebugMode 调试模式状态引用
 */
export const useGatewayManager = (
  lfRef: Ref<LogicFlow | undefined>,
  syncCanvasCallback: () => void,
  isDebugMode: Ref<boolean>
) => {
  const selectedGatewayNode = ref<any>(null)

  /**
   * 选中网关节点处理
   */
  const handleSelectGateway = (nodeData: any) => {
    if (isGatewayType(nodeData?.type)) {
      selectedGatewayNode.value = nodeData
    } else {
      selectedGatewayNode.value = null
    }
  }

  /**
   * 清除网关选中状态
   */
  const clearSelectedGateway = () => {
    selectedGatewayNode.value = null
  }

  /**
   * 原地热替换网关节点类型
   * 保留所有已连接的前后连线与坐标位置
   * @param targetType 目标网关类型（如 condition, parallel, inclusion 等）
   * @param fallbackNode 兜底的目标节点数据
   */
  const changeGatewayType = (targetType: string, fallbackNode?: any) => {
    const lf = lfRef.value
    const currentNode = selectedGatewayNode.value || fallbackNode
    if (!lf || !currentNode || !currentNode.id) return
    if (currentNode.type === targetType) return

    const nodeId = currentNode.id
    const oldConfig = getNodeConfig(currentNode.type)
    const newConfig = getNodeConfig(targetType)

    // 1. 调用 LogicFlow 原生类型切换（保持连线拓扑）
    lf.changeNodeType(nodeId, targetType)

    // 2. 智能更新默认文本与 properties.name
    const currentText = typeof currentNode.text === "object" ? currentNode.text?.value : currentNode.text
    const isDefaultName =
      !currentText ||
      currentText === oldConfig?.text ||
      currentText === `${oldConfig?.text}网关` ||
      currentText === "网关"

    if (isDefaultName && newConfig?.text) {
      lf.updateText(nodeId, newConfig.text)
      lf.setProperties(nodeId, { name: newConfig.text })
    }

    // 3. 刷新响应式数据引用
    const updatedNode = lf.getNodeDataById(nodeId)
    if (updatedNode) {
      selectedGatewayNode.value = updatedNode
    }

    // 4. 保持节点在画布上的选中态
    try {
      lf.selectElementById(nodeId)
    } catch (err) {
      console.warn("Failed to select element after type change", err)
    }

    // 5. 若处于调试模式，保留 isDebug 属性
    if (isDebugMode.value) {
      lf.setProperties(nodeId, { isDebug: true })
    }

    // 6. 触发数据同步
    syncCanvasCallback()

    return updatedNode
  }

  return {
    selectedGatewayNode,
    handleSelectGateway,
    clearSelectedGateway,
    changeGatewayType
  }
}
