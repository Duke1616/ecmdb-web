<template>
  <CustomDrawer
    v-model="showNodeAttribute"
    :title="getNodeTitle()"
    :subtitle="getNodeSubtitle()"
    size="35%"
    @closed="closed"
    @confirm="handleConfirm"
  >
    <template #header-icon>
      <div class="icon-circle">
        <!-- 网关专属 SVG 图标 -->
        <svg
          v-if="isGatewayType(props.nodeData?.type)"
          viewBox="0 0 1126 1024"
          class="header-svg-icon"
        >
          <path
            d="M563.2 0l563.2 512-563.2 512L0 512 563.2 0z"
            fill="currentColor"
          />
        </svg>
        <!-- 业务节点 SVG 图标 -->
        <svg
          v-else-if="currentNodeConfig?.iconSVG"
          viewBox="0 0 1024 1024"
          class="header-svg-icon"
        >
          <path :d="currentNodeConfig.iconSVG" fill="currentColor" />
        </svg>
        <!-- 基础节点回退文字/图标 -->
        <el-icon v-else class="header-fallback-icon"><Operation /></el-icon>
      </div>
    </template>

    <!-- 动态渲染属性组件内容 -->
    <div class="property-content">
      <component
        v-if="currentNodeConfig?.property"
        :is="currentNodeConfig.property"
        ref="propertyComponentRef"
        v-bind="componentProps"
        @closed="closed"
        @change-type="(newType: string) => emits('changeType', newType)"
      />
      <div v-else class="no-property-hint">该节点无需详细配置</div>
    </div>
  </CustomDrawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { Operation } from "@element-plus/icons-vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import { getNodeConfig } from "../RegisterNode/index"
import { isGatewayType } from "../RegisterNode/gateway/constants"
import { getNodeTypeLabel } from "@/pages/ticket/workflow/utils/graph"

interface Props {
  title?: string
  nodeData?: any
  lf?: any
  flowDetail?: Record<string, any>
  id?: number
  engineType?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  nodeData: () => ({}),
  lf: null,
  flowDetail: () => ({}),
  engineType: "flowx"
})

const emits = defineEmits(["closed", "changeType"])

const showNodeAttribute = ref(true)
const propertyComponentRef = ref()

// 当前节点的配置信息
const currentNodeConfig = computed(() => getNodeConfig(props.nodeData?.type || ""))

// 传递给子组件的 Props
const componentProps = computed(() => ({
  nodeData: props.nodeData,
  lf: props.lf,
  flowDetail: props.flowDetail,
  id: props.id,
  engineType: props.engineType,
  onChangeType: (newType: string) => emits("changeType", newType)
}))

// 获取节点抽屉主标题
const getNodeTitle = () => {
  if (isGatewayType(props.nodeData?.type)) {
    return "网关属性"
  }
  const typeLabel = getNodeTypeLabel(props.nodeData?.type || "")
  return `${typeLabel}属性`
}

// 获取节点抽屉副标题
const getNodeSubtitle = () => {
  if (isGatewayType(props.nodeData?.type)) {
    return "配置网关类型与路由规则"
  }
  return currentNodeConfig.value?.description || "配置节点运行参数与流转规则"
}

// 弹窗关闭通知
const closed = () => {
  emits("closed", true)
}

// 处理抽屉确认保存
const handleConfirm = () => {
  if (propertyComponentRef.value?.confirmFunc) {
    propertyComponentRef.value.confirmFunc()
  } else {
    closed()
  }
}
</script>

<style lang="scss" scoped>
.icon-circle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);

  .header-svg-icon {
    width: 20px;
    height: 20px;
  }

  .header-fallback-icon {
    font-size: 20px;
  }
}

.property-content {
  height: 100%;
  overflow-y: auto;
  padding: calc(0.5rem + 0.2vw);
}

.no-property-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #94a3b8;
  font-size: 13px;
}
</style>
