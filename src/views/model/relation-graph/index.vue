<template>
  <PageContainer>
    <div class="relation-graph-container">
      <!-- 使用 ManagerHeader 组件 -->
      <ManagerHeader
        title="模型关系图"
        subtitle="查看模型之间的关联关系"
        :show-add-button="false"
        :show-refresh-button="true"
        @refresh="refreshGraph"
      >
        <template #actions>
          <el-button plain :icon="Download" class="action-btn" @click="downloadGraph"> 导出图片 </el-button>
          <el-button type="primary" :icon="FullScreen" class="action-btn" @click="toggleFullscreen">
            {{ isFullscreen ? "退出全屏" : "全屏显示" }}
          </el-button>
        </template>
      </ManagerHeader>

      <!-- 关系图容器 -->
      <div class="graph-wrapper" ref="graphContainer">
        <div v-if="loading" class="loading-container">
          <el-icon class="loading-icon">
            <Loading />
          </el-icon>
          <p>正在加载关系图...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <el-empty description="加载失败，请重试">
            <el-button type="primary" @click="refreshGraph">重新加载</el-button>
          </el-empty>
        </div>

        <div v-else-if="!modelGraphData?.nodes?.length" class="empty-container">
          <el-empty description="暂无模型数据">
            <el-button type="primary" @click="refreshGraph">刷新数据</el-button>
          </el-empty>
        </div>

        <div v-else ref="graphPage" class="graph-content">
          <RelationGraph
            ref="graphRef"
            class="relation-graph"
            :options="graphOptions"
            :on-node-click="onNodeClick"
            @refresh="listModelGraphData"
          >
            <template #node="{ node }">
              <div class="custom-node" :style="{ '--theme-color': node.color || '#3B82F6' }">
                <div class="node-indicator" />
                <div class="node-main">
                  <div
                    class="node-icon"
                    :style="{ 'background-image': node.data?.icon ? `url(${node.data.icon})` : 'none' }"
                  >
                    <span v-if="!node.data?.icon" class="node-icon-fallback">{{
                      node.text.charAt(0).toUpperCase()
                    }}</span>
                  </div>
                  <div class="node-info">
                    <span class="node-label" :title="node.text">{{ node.text }}</span>
                  </div>
                </div>
              </div>
            </template>
          </RelationGraph>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from "vue"
import { ElMessage } from "element-plus"
import { Download, FullScreen, Loading } from "@element-plus/icons-vue"
import RelationGraph, { RGJsonData, RGNode, RGOptions, RelationGraphComponent } from "relation-graph-vue3"
import { listModelGraphApi } from "@/api/model"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"

const graphOptions: RGOptions = {
  debug: false,
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  allowShowDownloadButton: false,
  allowShowMiniToolBar: true, // 开启右下角工具栏，方便布局切换与缩放
  allowShowRefreshButton: false,
  allowShowZoomMenu: true,
  hideNodeContentByZoom: false,

  // 节点样式 - 设置为极简卡片形式，最大程度降低组件间距占用
  defaultNodeShape: 1, // 0 circle, 1 rectangle
  defaultNodeWidth: 100,
  defaultNodeHeight: 32,
  defaultNodeBorderWidth: 0,
  defaultNodeBorderColor: "transparent",
  defaultNodeColor: "transparent",
  defaultNodeFontColor: "#1e293b",

  // 连线样式
  defaultLineColor: "#cbd5e1", // 使用 slate-300 淡色连线，突出节点
  defaultLineWidth: 1.5,
  defaultLineShape: 1, // 恢复为直线(1)，或者贝塞尔曲线。不要使用折线(4)，因为复杂拓扑下折线会形成蜘蛛网般的严重交叉
  defaultJunctionPoint: "border",

  // 背景
  backgroundColor: "transparent",

  // 自动布局设置
  layouts: [
    {
      label: "力导向",
      layoutName: "force",
      layoutClassName: "seeks-layout-force",
      distance_coefficient: 3.5 // 我们的卡片宽度达到160px，必须大幅增加排斥系数防止重叠
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

// 响应式状态
const graphRef = ref<RelationGraphComponent>()
const graphContainer = ref<HTMLElement>()
const graphPage = ref<HTMLElement>()
const loading = ref(false)
const error = ref(false)
const isFullscreen = ref(false)

// 点击节点触发的高亮交互
const onNodeClick = (nodeObject: RGNode) => {
  const graphInstance = graphRef.value!.getInstance()
  const allLinks = graphInstance.getLinks()

  // 首先还原所有连线的样式
  allLinks.forEach((link) => {
    link.relations.forEach((line: any) => {
      // 从 line.data 中恢复原始设置，如果有的话
      if (line.data?.orignColor !== undefined) {
        line.color = line.data.orignColor
        line.fontColor = line.data.orignFontColor
        line.lineWidth = line.data.orignLineWidth
      }
    })
  })

  // 高亮与选中节点相关的连线
  allLinks
    .filter((link) => link.fromNode === nodeObject || link.toNode === nodeObject)
    .forEach((link) => {
      link.relations.forEach((line: any) => {
        if (!line.data) line.data = {}
        // 记录原始值
        if (line.data.orignColor === undefined) {
          line.data.orignColor = line.color
        }
        if (line.data.orignFontColor === undefined) {
          line.data.orignFontColor = line.fontColor || line.color
        }
        if (line.data.orignLineWidth === undefined) {
          line.data.orignLineWidth = line.lineWidth || 1.5
        }

        // 不高亮透明的对齐辅助线
        if (line.opacity === 0 || line.color === "transparent" || line.color === "rgba(0,0,0,0)") {
          return
        }

        // 应用高亮样式
        line.color = "#3B82F6" // Blue-500
        line.fontColor = "#3B82F6"
        line.lineWidth = 3
      })
    })

  // 强制更新视图应用样式
  graphInstance.dataUpdated()
}

const modelGraphData = ref<RGJsonData>()

// 刷新图表
const refreshGraph = () => {
  listModelGraphData()
}

// 获取模型关系图数据
const listModelGraphData = async () => {
  try {
    loading.value = true
    error.value = false

    const { data } = await listModelGraphApi()
    modelGraphData.value = data

    if (data?.nodes?.length) {
      await nextTick()
      // 确保图表组件已经渲染后设置数据
      setTimeout(async () => {
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

const setGraphData = async () => {
  try {
    if (modelGraphData.value !== undefined && graphRef.value) {
      // 创建数据副本，避免污染原数据
      const __graph_json_data: RGJsonData = JSON.parse(JSON.stringify(modelGraphData.value))

      if (__graph_json_data.nodes && __graph_json_data.nodes.length > 0) {
        const rootId = __graph_json_data.nodes[0].id
        __graph_json_data.rootId = rootId

        if (!__graph_json_data.lines) {
          __graph_json_data.lines = []
        }

        // 添加从根节点到其他节点的不可见连线以产生中心聚合效果
        __graph_json_data.nodes.forEach((n) => {
          if (n.id !== rootId) {
            __graph_json_data.lines.push({ from: rootId, to: n.id, opacity: 0 })
          }
        })

        // 设置数据并在力导向布局稳定后居中缩放
        await graphRef.value.setJsonData(__graph_json_data, () => {
          setTimeout(async () => {
            const graphInstance = graphRef.value?.getInstance()
            if (graphInstance) {
              await graphInstance.moveToCenter()
              await graphInstance.zoomToFit()
            }
          }, 1000) // 给力导向算法更长时间充分推开节点后，再执行居中和视野自适应缩放
        })
      } else {
        console.warn("没有节点数据")
      }
    }
  } catch (err) {
    console.error("设置图表数据时发生错误:", err)
    error.value = true
  }
}

// 导出图表为图片
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

// 切换全屏模式
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

// 监听全屏事件同步状态 (如用户按 Esc 退出)
onMounted(() => {
  listModelGraphData()

  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement

    // 全屏或退出全屏时，Mac 和其他系统有较长的视窗形变动画过渡，必须等动画落位之后计算居中坐标才准确！
    setTimeout(async () => {
      // 触发一次 window resize 作为引擎重绘钩子兜底
      window.dispatchEvent(new Event("resize"))

      const graphInstance = graphRef.value?.getInstance()
      if (graphInstance) {
        // 重排图表在中心点并自适应新的画幅
        await graphInstance.moveToCenter()
        await graphInstance.zoomToFit()
      }
    }, 850) // 延时到 850 毫秒，足以绕过最慢的全屏渐变过场动画
  })
})
</script>

<style lang="scss" scoped>
.relation-graph-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-wrapper {
  flex: 1;
  position: relative;
  background-color: #f8fafc; /* Slate-50 */
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 24px 24px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;

  .loading-icon {
    font-size: 32px;
    color: #3b82f6; /* Blue-500 */
    animation: spin 1s linear infinite;
  }

  p {
    margin-top: 16px;
    color: #64748b;
    font-size: 14px;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.graph-content {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

// 自定义节点级联打磨：卡片样式
.custom-node {
  display: flex;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 6px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;
  cursor: pointer;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
    border-color: var(--theme-color);
  }

  // 节点左侧颜色标识条
  .node-indicator {
    width: 6px;
    height: 100%;
    background: var(--theme-color);
    flex-shrink: 0;
  }

  .node-main {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 0 6px; /* 极简内边距 */
    gap: 4px; /* 极简图文间距 */
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .node-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: #f1f5f9;
    color: var(--theme-color);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 11px;
    flex-shrink: 0;
  }

  .node-icon-fallback {
    pointer-events: none;
    user-select: none;
  }

  .node-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;

    .node-label {
      color: #1e293b;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }
  }
}

// 头部按钮样式
.action-btn {
  margin-left: 8px;
}

// 全屏模式微调
:fullscreen .graph-wrapper,
:-webkit-full-screen .graph-wrapper {
  margin: 0;
  border-radius: 0;
  border: none;
  height: 100vh;
  width: 100vw;
}
</style>
