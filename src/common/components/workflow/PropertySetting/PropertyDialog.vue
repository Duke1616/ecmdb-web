<template>
  <CustomDrawer
    v-model="showNodeAttribute"
    :title="getNodeTitle()"
    :subtitle="getNodeSubtitle()"
    :before-close="handleBeforeClose"
    size="35%"
    @closed="closed"
    @confirm="handleDrawerConfirm"
  >
    <template #header-icon>
      <div class="icon-circle">
        <img :src="getIconPath()" :alt="props.nodeData?.type" class="icon-image" />
      </div>
    </template>

    <!-- 直接渲染属性组件内容 -->
    <div class="property-content">
      <startProperty
        v-if="props.nodeData?.type === 'start'"
        ref="propertyComponentRef"
        :nodeData="nodeData"
        :lf="lf"
        :flowDetail="flowDetail"
        @closed="closed"
      />
      <userProperty
        v-if="props.nodeData?.type === 'user'"
        ref="propertyComponentRef"
        :nodeData="nodeData"
        :id="props.id"
        :lf="lf"
        :flowDetail="flowDetail"
        @closed="closed"
      />
      <conditionProperty
        v-if="props.nodeData?.type === 'condition'"
        ref="propertyComponentRef"
        :nodeData="nodeData"
        :lf="lf"
        :flowDetail="flowDetail"
        @closed="closed"
      />
      <automationProperty
        v-if="props.nodeData?.type === 'automation'"
        ref="propertyComponentRef"
        :nodeData="nodeData"
        :id="props.id"
        :lf="lf"
        :flowDetail="flowDetail"
        @closed="closed"
      />
      <!-- 连线 -->
      <edge
        v-if="nodeData?.type === 'polyline'"
        ref="propertyComponentRef"
        :nodeData="nodeData"
        :lf="lf"
        :id="props.id"
        :flowDetail="flowDetail"
        @closed="closed"
      />
    </div>
  </CustomDrawer>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import startProperty from "../RegisterNode/start/startProperty.vue"
import userProperty from "../RegisterNode/user/userProperty.vue"
import conditionProperty from "../RegisterNode/condition/conditionProperty.vue"
import automationProperty from "../RegisterNode/automation/automationProperty.vue"
import edge from "../RegisterEdge/edge.vue"

const props = defineProps({
  //标题
  title: {
    type: String,
    default: ""
  },
  nodeData: Object,
  lf: Object,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  },
  id: Number
})

const emits = defineEmits(["closed"])

const showNodeAttribute = ref(true)
const propertyComponentRef = ref()

// 获取图标路径
const getIconPath = () => {
  const iconName = props.nodeData?.type || "start"
  return new URL(`../background/${iconName}.png`, import.meta.url).href
}

// 获取节点标题
const getNodeTitle = () => {
  const nodeTypeMap: Record<string, string> = {
    start: "开始节点",
    user: "用户节点",
    condition: "条件节点",
    automation: "自动化节点",
    polyline: "连线属性"
  }
  return nodeTypeMap[props.nodeData?.type] || "节点属性"
}

// 获取节点副标题
const getNodeSubtitle = () => {
  const nodeTypeMap: Record<string, string> = {
    start: "配置工作流的起始节点属性",
    user: "配置审批流程的用户节点属性",
    condition: "配置工作流分支条件节点的属性",
    automation: "配置自动化任务的执行参数和通知设置",
    polyline: "配置工作流节点间的连接关系和条件"
  }
  return nodeTypeMap[props.nodeData?.type] || "配置节点属性"
}

// 关闭前处理
const handleBeforeClose = (done: () => void) => {
  // 可以在这里添加确认逻辑
  done()
}

//弹窗关闭
const closed = () => {
  emits("closed", true)
}

// 处理确认
const handleConfirm = () => {
  if (propertyComponentRef.value) {
    propertyComponentRef.value.confirmFunc()
  }
}

// 处理 Drawer 的确认事件
const handleDrawerConfirm = () => {
  handleConfirm()
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.property-content {
  height: 100%;
  overflow-y: auto;
  padding: calc(0.5rem + 0.2vw);
}

.icon-circle {
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

  .icon-image {
    width: 24px;
    height: 24px;
    object-fit: contain;
    filter: brightness(0) invert(1); // 将图标变为白色
  }
}
</style>
