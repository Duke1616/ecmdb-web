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
          <el-button :icon="Download" @click="downloadGraph"> 导出图片 </el-button>
          <el-button :icon="FullScreen" @click="toggleFullscreen"> 全屏 </el-button>
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
            :options="graphOptions"
            :on-node-click="onNodeClick"
            @refresh="listModelGraphData"
          >
            <template #node="{ node }">
              <div class="custom-node">
                <div
                  class="node-icon"
                  :style="{
                    'background-image': node.data?.icon ? `url(${node.data.icon})` : 'none',
                    'background-color': node.color || '#6366f1'
                  }"
                />
                <div class="node-label" :style="{ color: node.color || '#1e293b' }">
                  {{ node.text }}
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
  allowShowMiniToolBar: false,
  allowShowRefreshButton: false,
  allowShowZoomMenu: true,
  hideNodeContentByZoom: false,

  // 节点样式
  defaultNodeShape: 0,
  defaultNodeWidth: 60,
  defaultNodeHeight: 60,
  defaultNodeBorderWidth: 2,
  defaultNodeBorderColor: "#ffffff",
  defaultNodeColor: "#6366f1",
  defaultNodeFontColor: "#374151",

  // 连线样式
  defaultLineColor: "#6b7280",
  defaultLineWidth: 2,
  defaultLineShape: 1,
  defaultJunctionPoint: "border",

  // 背景
  backgroundColor: "#ffffff",

  // 布局设置
  layouts: [
    {
      label: "力导向布局",
      layoutName: "force",
      layoutClassName: "seeks-layout-force"
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

// 点击节点触发的函数
const onNodeClick = (nodeObject: RGNode) => {
  // 获取所有连线
  const graphInstance = graphRef.value!.getInstance()
  const allLinks = graphInstance.getLinks()

  allLinks.forEach((link) => {
    // 还原所有样式
    link.relations.forEach((line: any) => {
      line.color = line.data.orignColor || ""
      line.fontColor = line.data.orignFontColor || line.color || ""
      line.lineWidth = line.data.orignLineWidth || 1
    })
  })

  // 高亮与nodeObject相关的所有连线
  allLinks
    .filter((link) => link.fromNode === nodeObject || link.toNode === nodeObject)
    .forEach((link) => {
      link.relations.forEach((line: any) => {
        line.data.orignColor = line.color
        line.data.orignFontColor = line.fontColor || line.color
        line.data.orignLineWidth = line.lineWidth || 1
        line.color = "#ff0000"
        line.fontColor = "#ff0000"
        line.lineWidth = 3
      })
    })

  // 强制更新视图
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
      // 等待 DOM 更新后再设置图表数据
      await nextTick()
      // 确保图表组件已经渲染
      setTimeout(async () => {
        await setGraphData()
      }, 100)
    }
  } catch (err) {
    console.error("获取模型关系图数据失败:", err)
    error.value = true
    ElMessage.error("获取数据失败，请重试")
  } finally {
    loading.value = false
  }
}

const setGraphData = async () => {
  try {
    if (modelGraphData.value !== undefined && graphRef.value) {
      // 创建数据副本，避免修改原始数据
      const __graph_json_data: RGJsonData = JSON.parse(JSON.stringify(modelGraphData.value))

      if (__graph_json_data.nodes && __graph_json_data.nodes.length > 0) {
        const rootId = __graph_json_data.nodes[0].id
        __graph_json_data.rootId = rootId

        // 确保 lines 数组存在
        if (!__graph_json_data.lines) {
          __graph_json_data.lines = []
        }

        // 添加从根节点到其他节点的连线
        __graph_json_data.nodes.forEach((n) => {
          if (n.id !== rootId) {
            __graph_json_data.lines.push({ from: rootId, to: n.id, opacity: 0 })
          }
        })

        // 设置图表数据
        await graphRef.value.setJsonData(__graph_json_data, async (graphInstance) => {
          await graphInstance.moveToCenter()
          await graphInstance.zoomToFit()
        })
      } else {
        console.warn("没有节点数据")
      }
    } else {
      console.warn("数据或图表引用不存在")
    }
  } catch (err) {
    console.error("设置图表数据时发生错误:", err)
    error.value = true
  }
}

// 导出图表
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

// 切换全屏
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

onMounted(() => {
  listModelGraphData()
})
</script>

<style lang="scss" scoped>
.relation-graph-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.graph-wrapper {
  flex: 1;
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
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
  background: #f8fafc;

  .loading-icon {
    font-size: 32px;
    color: #6366f1;
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

// 自定义节点样式 - 简化版
.custom-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.05);
    z-index: 10;
  }

  .node-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #6366f1;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border: 3px solid #ffffff;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: #4f46e5;
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
      transform: translateY(-2px);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .node-label {
    margin-top: 8px;
    font-size: 10px;
    font-weight: 600;
    text-align: center;
    max-width: 120px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #374151;
    background: #ffffff;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    min-height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: #f9fafb;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      white-space: normal;
      max-width: 150px;
    }
  }
}

// 全屏模式
:fullscreen .graph-wrapper {
  margin: 0;
  border-radius: 0;
  height: 100vh;
}
</style>
