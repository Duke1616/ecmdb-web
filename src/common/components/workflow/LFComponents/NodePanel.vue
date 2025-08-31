<template>
  <div class="node-panel">
    <!-- Updated header with modern typography and styling -->
    <div class="panel-header">
      <h3 class="panel-title font-heading">节点库</h3>
      <p class="panel-subtitle font-body">拖拽添加节点</p>
    </div>

    <!-- Redesigned categories with modern card layout -->
    <div class="node-categories">
      <div class="category-section">
        <h4 class="category-title font-heading">
          <div class="category-icon">🚦</div>
          网关节点
        </h4>
        <div class="node-grid">
          <div v-for="item in gatewayNodes" :key="item.text" class="node-card" @mousedown="$_dragNode(item)">
            <div class="node-icon" :class="item.class">
              <div v-if="item.type === 'user' || item.type === 'time'" class="shape" />
            </div>
            <span class="node-label font-body">{{ item.text }}</span>
            <div class="node-description font-body">{{ item.description }}</div>
          </div>
        </div>
      </div>

      <div class="category-section">
        <h4 class="category-title font-heading">
          <div class="category-icon">🏢</div>
          业务节点
        </h4>
        <div class="node-grid">
          <div v-for="item in businessNodes" :key="item.text" class="node-card" @mousedown="$_dragNode(item)">
            <div class="node-icon" :class="item.class">
              <div v-if="item.type === 'user' || item.type === 'time'" class="shape" />
            </div>
            <span class="node-label font-body">{{ item.text }}</span>
            <div class="node-description font-body">{{ item.description }}</div>
          </div>
        </div>
      </div>

      <div class="category-section">
        <h4 class="category-title font-heading">
          <div class="category-icon">⚙️</div>
          流程控制
        </h4>
        <div class="node-grid">
          <div v-for="item in controlNodes" :key="item.text" class="node-card" @mousedown="$_dragNode(item)">
            <div class="node-icon" :class="item.class">
              <div v-if="item.type === 'user' || item.type === 'time'" class="shape" />
            </div>
            <span class="node-label font-body">{{ item.text }}</span>
            <div class="node-description font-body">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from "vue"

interface Props {
  lf: any
  nodeList: any[]
}

const props = defineProps<Props>()

const gatewayNodes = computed(() =>
  props.nodeList
    .filter((item) => ["condition", "parallel", "inclusion"].includes(item.type))
    .map((item) => ({
      ...item,
      description: getNodeDescription(item.type)
    }))
)

const businessNodes = computed(() =>
  props.nodeList
    .filter((item) => ["user", "automation", "time", "push", "download", "click"].includes(item.type))
    .map((item) => ({
      ...item,
      description: getNodeDescription(item.type)
    }))
)

const controlNodes = computed(() =>
  props.nodeList
    .filter((item) => ["start", "end"].includes(item.type))
    .map((item) => ({
      ...item,
      description: getNodeDescription(item.type)
    }))
)

const getNodeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    start: "流程开始",
    end: "流程结束",
    user: "用户任务",
    condition: "条件判断",
    automation: "自动化任务",
    parallel: "并行网关",
    inclusion: "包含网关",
    time: "定时任务",
    push: "推送消息",
    download: "下载文件",
    click: "点击事件"
  }
  return descriptions[type] || "节点"
}

const $_dragNode = (item: any) => {
  console.log("[v0] Starting drag for node:", item.type)
  if (props.lf && props.lf.dnd) {
    props.lf.dnd.startDrag({
      type: item.type
    })
  } else {
    console.error("[v0] LogicFlow instance or dnd not available")
  }
}
</script>

<style lang="scss" scoped>
/* Fixed positioning and layout to work within sidebar container */
.node-panel {
  width: 100%;
  height: 100%;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.panel-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: center;
  background: #f8fafc;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 900;
  color: #0891b2;
  margin: 0 0 4px 0;
}

.panel-subtitle {
  font-size: 12px;
  color: #64748b;
  margin: 0;
  opacity: 0.7;
}

.node-categories {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.category-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.category-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 12px 0;
  padding: 6px 10px;
  background: rgba(8, 145, 178, 0.1);
  border-radius: 6px;
  border-left: 3px solid #0891b2;
}

.category-icon {
  font-size: 14px;
}

.node-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.node-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
  cursor: grab;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #0891b2, #ea580c);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(8, 145, 178, 0.15);
    border-color: #0891b2;

    &::before {
      transform: scaleX(1);
    }
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
}

.node-icon {
  width: 32px;
  height: 32px;
  margin: 0 auto 8px;
  background-size: cover;
  border-radius: 6px;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(8, 145, 178, 0.1), rgba(234, 88, 12, 0.1));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .node-card:hover &::after {
    opacity: 1;
  }
}

.node-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  user-select: none;
}

.node-description {
  font-size: 10px;
  color: #64748b;
  user-select: none;
  line-height: 1.2;
}

/* Updated node type styles with modern colors */
.node-start {
  background: url("../background/start.png") no-repeat center;
  background-size: cover;
  background-color: rgba(34, 197, 94, 0.1);
}

.node-end {
  background: url("../background/end.png") no-repeat center;
  background-size: cover;
  background-color: rgba(239, 68, 68, 0.1);
}

.node-user {
  background: url("../background/user.png") no-repeat center;
  background-size: cover;
  background-color: rgba(8, 145, 178, 0.1);
}

.node-condition {
  background: url("../background/condition.png") no-repeat center;
  background-size: cover;
  background-color: rgba(234, 88, 12, 0.1);
}

.node-automation {
  background: url("../background/automation.png") no-repeat center;
  background-size: cover;
  background-color: rgba(168, 85, 247, 0.1);
}

.node-parallel {
  background: url("../background/parallel.png") no-repeat center;
  background-size: cover;
  background-color: rgba(59, 130, 246, 0.1);
}

.node-inclusion {
  background: url("../background/inclusion.png") no-repeat center;
  background-size: cover;
  background-color: rgba(16, 185, 129, 0.1);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .node-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    padding: 16px;
  }

  .node-categories {
    padding: 16px;
  }
}
</style>
