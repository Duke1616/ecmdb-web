import type { RGOptions } from "relation-graph-vue3"

export const graphOptions: RGOptions = {
  debug: false,
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  allowShowDownloadButton: false,
  allowShowMiniToolBar: true,
  allowShowRefreshButton: false,
  allowShowZoomMenu: true,
  hideNodeContentByZoom: false,

  defaultNodeShape: 1,
  defaultNodeWidth: 100,
  defaultNodeHeight: 32,
  defaultNodeBorderWidth: 0,
  defaultNodeBorderColor: "transparent",
  defaultNodeColor: "transparent",
  defaultNodeFontColor: "#1e293b",

  defaultLineColor: "#cbd5e1",
  defaultLineWidth: 1.5,
  defaultLineShape: 1,
  defaultJunctionPoint: "border",

  backgroundColor: "transparent",

  layouts: [
    {
      label: "力导向",
      layoutName: "force",
      layoutClassName: "seeks-layout-force",
      distance_coefficient: 3.5
    },
    {
      label: "中心环形",
      layoutName: "center"
    },
    {
      label: "树状",
      layoutName: "tree"
    }
  ]
}
