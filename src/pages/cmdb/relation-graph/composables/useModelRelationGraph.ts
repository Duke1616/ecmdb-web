import { nextTick, onBeforeUnmount, onMounted, ref } from "vue"
import { ElMessage } from "element-plus"
import { listModelGraphApi } from "@/api/cmdb/model"
import type { RGJsonData, RGNode, RelationGraphComponent } from "relation-graph-vue3"

export const useModelRelationGraph = () => {
  const graphRef = ref<RelationGraphComponent>()
  const graphContainer = ref<HTMLElement>()
  const modelGraphData = ref<RGJsonData>()
  const loading = ref(false)
  const error = ref(false)
  const isFullscreen = ref(false)

  let renderTimer: ReturnType<typeof setTimeout> | undefined
  let centerTimer: ReturnType<typeof setTimeout> | undefined
  let fullscreenTimer: ReturnType<typeof setTimeout> | undefined

  const clearTimer = (timer?: ReturnType<typeof setTimeout>) => {
    if (timer) clearTimeout(timer)
  }

  const centerGraph = async () => {
    const graphInstance = graphRef.value?.getInstance()
    if (graphInstance) {
      await graphInstance.moveToCenter()
      await graphInstance.zoomToFit()
    }
  }

  const scheduleCenterGraph = (delay = 0) => {
    clearTimer(centerTimer)
    centerTimer = setTimeout(() => {
      centerGraph()
    }, delay)
  }

  const onNodeClick = (nodeObject: RGNode) => {
    const graphInstance = graphRef.value?.getInstance()
    if (!graphInstance) return

    const allLinks = graphInstance.getLinks()

    allLinks.forEach((link) => {
      link.relations.forEach((line: any) => {
        if (line.data?.orignColor !== undefined) {
          line.color = line.data.orignColor
          line.fontColor = line.data.orignFontColor
          line.lineWidth = line.data.orignLineWidth
        }
      })
    })

    allLinks
      .filter((link) => link.fromNode === nodeObject || link.toNode === nodeObject)
      .forEach((link) => {
        link.relations.forEach((line: any) => {
          if (!line.data) line.data = {}

          if (line.data.orignColor === undefined) {
            line.data.orignColor = line.color
          }
          if (line.data.orignFontColor === undefined) {
            line.data.orignFontColor = line.fontColor || line.color
          }
          if (line.data.orignLineWidth === undefined) {
            line.data.orignLineWidth = line.lineWidth || 1.5
          }

          if (line.opacity === 0 || line.color === "transparent" || line.color === "rgba(0,0,0,0)") {
            return
          }

          line.color = "#3B82F6"
          line.fontColor = "#3B82F6"
          line.lineWidth = 3
        })
      })

    graphInstance.dataUpdated()
  }

  const setGraphData = async () => {
    try {
      if (modelGraphData.value === undefined || !graphRef.value) return

      const graphJsonData: RGJsonData = JSON.parse(JSON.stringify(modelGraphData.value))

      if (!graphJsonData.nodes?.length) {
        console.warn("没有节点数据")
        return
      }

      const rootId = graphJsonData.nodes[0].id
      graphJsonData.rootId = rootId
      graphJsonData.lines = graphJsonData.lines || []

      graphJsonData.nodes.forEach((node) => {
        if (node.id !== rootId) {
          graphJsonData.lines!.push({ from: rootId, to: node.id, opacity: 0 })
        }
      })

      await graphRef.value.setJsonData(graphJsonData, () => {
        scheduleCenterGraph(1000)
      })
    } catch (err) {
      console.error("设置图表数据时发生错误:", err)
      error.value = true
    }
  }

  const listModelGraphData = async () => {
    try {
      loading.value = true
      error.value = false

      const { data } = await listModelGraphApi()
      modelGraphData.value = data

      if (data?.nodes?.length) {
        await nextTick()
        clearTimer(renderTimer)
        renderTimer = setTimeout(async () => {
          await setGraphData()
        }, 100)
      }
    } catch (err) {
      console.error("获取模型关系图数据失败:", err)
      error.value = true
    } finally {
      loading.value = false
    }
  }

  const refreshGraph = () => {
    listModelGraphData()
  }

  const downloadGraph = () => {
    try {
      const graphInstance = graphRef.value?.getInstance()
      if (graphInstance) {
        graphInstance.downloadAsImage("模型关系图.png")
        ElMessage.success("图片导出成功")
      }
    } catch (err) {
      ElMessage.error("导出失败，请重试")
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await graphContainer.value?.requestFullscreen()
        isFullscreen.value = true
      } else {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    } catch (err) {
      console.error("全屏切换失败:", err)
      ElMessage.warning("浏览器不支持全屏功能")
    }
  }

  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement

    clearTimer(fullscreenTimer)
    fullscreenTimer = setTimeout(async () => {
      window.dispatchEvent(new Event("resize"))
      await centerGraph()
    }, 850)
  }

  onMounted(() => {
    listModelGraphData()
    document.addEventListener("fullscreenchange", handleFullscreenChange)
  })

  onBeforeUnmount(() => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange)
    clearTimer(renderTimer)
    clearTimer(centerTimer)
    clearTimer(fullscreenTimer)
  })

  return {
    graphRef,
    graphContainer,
    modelGraphData,
    loading,
    error,
    isFullscreen,
    listModelGraphData,
    refreshGraph,
    onNodeClick,
    downloadGraph,
    toggleFullscreen
  }
}
