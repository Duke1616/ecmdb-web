<template>
  <ProGovernanceLayout title="模型关系图" subtitle="查看模型之间的关联关系" @refresh="refreshGraph">
    <template #actions-suffix>
      <el-button plain :icon="Download" class="graph-action-btn" @click="downloadGraph">导出图片</el-button>
      <el-button type="primary" :icon="FullScreen" class="graph-action-btn" @click="toggleFullscreen">
        {{ isFullscreen ? "退出全屏" : "全屏显示" }}
      </el-button>
    </template>

    <div class="relation-graph-container">
      <div ref="graphContainer" class="graph-wrapper">
        <div v-if="loading" class="graph-state">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <p>正在加载关系图...</p>
        </div>

        <div v-else-if="error" class="graph-state">
          <el-empty description="加载失败，请重试">
            <el-button type="primary" @click="refreshGraph">重新加载</el-button>
          </el-empty>
        </div>

        <div v-else-if="!modelGraphData?.nodes?.length" class="graph-state">
          <el-empty description="暂无模型数据">
            <el-button type="primary" @click="refreshGraph">刷新数据</el-button>
          </el-empty>
        </div>

        <div v-else class="graph-content">
          <RelationGraph
            ref="graphRef"
            class="relation-graph"
            :options="graphOptions"
            :on-node-click="onNodeClick"
            @refresh="listModelGraphData"
          >
            <template #node="{ node }">
              <ModelGraphNode :node="node" />
            </template>
          </RelationGraph>
        </div>
      </div>
    </div>
  </ProGovernanceLayout>
</template>

<script lang="ts" setup>
import { Download, FullScreen, Loading } from "@element-plus/icons-vue"
import RelationGraph from "relation-graph-vue3"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import ModelGraphNode from "./components/ModelGraphNode.vue"
import { graphOptions } from "./constants/graphOptions"
import { useModelRelationGraph } from "./composables/useModelRelationGraph"

const {
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
} = useModelRelationGraph()
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

.relation-graph-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  width: 100%;
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

.graph-state {
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
.graph-action-btn {
  height: 38px;
  border-radius: 8px;
  font-weight: 600;
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
