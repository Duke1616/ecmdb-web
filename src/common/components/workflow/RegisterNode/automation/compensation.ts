export interface AutomationGraphNode {
  id?: string
  type?: string
  text?: string | { value?: string }
  properties?: Record<string, unknown>
}

export interface CompensationNodeOption {
  id: string
  name: string
}

const getAutomationNodeName = (node: AutomationGraphNode) =>
  String(node.properties?.name || "").trim() ||
  (typeof node.text === "string" ? node.text : node.text?.value) ||
  "自动化节点"

export const getCompensationNodeOptions = (
  nodes: AutomationGraphNode[],
  currentNodeID?: string
): CompensationNodeOption[] =>
  nodes
    .filter((node) => node.type === "automation" && !!node.id && node.id !== currentNodeID)
    .map((node) => ({
      id: node.id as string,
      name: getAutomationNodeName(node)
    }))

export const findCompensationNodeReferences = (
  nodes: AutomationGraphNode[],
  targetNodeID: string
): CompensationNodeOption[] =>
  nodes
    .filter(
      (node) =>
        node.type === "automation" && !!node.id && String(node.properties?.compensation_node_id || "") === targetNodeID
    )
    .map((node) => ({ id: node.id as string, name: getAutomationNodeName(node) }))
