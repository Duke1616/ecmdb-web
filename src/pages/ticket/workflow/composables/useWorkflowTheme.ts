import type LogicFlow from "@logicflow/core"

/**
 * 统一定义并应用 LogicFlow 流程图主题风格
 * 包含节点描边、文字背景、锚点状态与高亮选框
 * @param lf LogicFlow 实例
 */
export const applyWorkflowTheme = (lf: any) => {
  lf.setTheme({
    circle: {
      stroke: "#667eea",
      strokeWidth: 2,
      outlineColor: "#667eea",
      outlineWidth: 1,
      fill: "#ffffff"
    },
    rect: {
      outlineColor: "#667eea",
      outlineWidth: 1,
      stroke: "#667eea",
      strokeWidth: 2,
      fill: "#ffffff",
      radius: 8
    },
    polygon: {
      strokeWidth: 2,
      stroke: "#667eea",
      fill: "#ffffff",
      outlineColor: "#667eea"
    },
    polyline: {
      stroke: "#94a3b8",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    nodeText: {
      color: "#1e293b",
      fontSize: 14,
      fontWeight: 500,
      background: {
        fill: "rgba(255, 255, 255, 0.92)",
        stroke: "#e2e8f0",
        strokeWidth: 1,
        radius: 4
      }
    },
    edgeText: {
      color: "#334155",
      fontSize: 12,
      fontWeight: 500,
      textWidth: 120,
      background: {
        fill: "rgba(255, 255, 255, 0.96)",
        stroke: "#cbd5e1",
        strokeWidth: 1,
        radius: 6
      }
    },
    anchor: {
      stroke: "#667eea",
      fill: "#ffffff",
      strokeWidth: 2,
      r: 4
    },
    anchorHover: {
      stroke: "#667eea",
      fill: "#667eea",
      strokeWidth: 2,
      r: 6
    },
    anchorActive: {
      stroke: "#667eea",
      fill: "#667eea",
      strokeWidth: 2,
      r: 6
    },
    outline: {
      stroke: "#667eea",
      strokeWidth: 2,
      strokeDasharray: "5,5"
    }
  } as any)
}
