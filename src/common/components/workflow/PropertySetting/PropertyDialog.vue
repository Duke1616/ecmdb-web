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
        <svg
          v-if="currentNodeConfig?.iconSVG"
          viewBox="0 0 1024 1024"
          style="width: 28px; height: 28px; color: #409eff"
        >
          <path :d="currentNodeConfig.iconSVG" fill="currentColor" />
        </svg>
        <img v-else :src="getIconPath()" :alt="props.nodeData?.type" class="icon-image" />
      </div>
    </template>

    <!-- 直接渲染属性组件内容 -->
    <div class="property-content">
      <component
        v-if="currentNodeConfig?.property"
        :is="currentNodeConfig.property"
        ref="propertyComponentRef"
        v-bind="componentProps"
        @closed="closed"
      />
      <div v-else class="no-property-hint">该节点无需详细配置</div>
    </div>
  </CustomDrawer>
</template>
<script setup lang="ts">
import { ref, computed } from "vue"
import CustomDrawer from "@/common/components/Dialogs/Drawer/index.vue"
import { getNodeConfig } from "../RegisterNode/index"

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
    default: () => ({})
  },
  id: Number
})

const emits = defineEmits(["closed"])

const showNodeAttribute = ref(true)
const propertyComponentRef = ref()

// 当前节点的配置信息
const currentNodeConfig = computed(() => getNodeConfig(props.nodeData?.type || ""))

// 传递给子组件的 Props
const componentProps = computed(() => ({
  nodeData: props.nodeData,
  lf: props.lf,
  flowDetail: props.flowDetail,
  id: props.id
}))

// 获取图标路径
const getIconPath = () => {
  let iconName = props.nodeData?.type || "start"
  if (iconName === "chat") {
    iconName = "automation" // 暂时使用自动化图标作为回退
  }
  return new URL(`../background/${iconName}.png`, import.meta.url).href
}

// 获取节点标题
const getNodeTitle = () => {
  return currentNodeConfig.value?.text ? `${currentNodeConfig.value.text}属性` : "节点属性"
}

// 获取节点副标题
const getNodeSubtitle = () => {
  return currentNodeConfig.value?.description || "配置节点属性"
}

// 关闭前处理
const handleBeforeClose = (done: () => void) => {
  done()
}

//弹窗关闭
const closed = () => {
  emits("closed", true)
}

// 处理确认
const handleConfirm = () => {
  if (propertyComponentRef.value?.confirmFunc) {
    propertyComponentRef.value.confirmFunc()
  } else {
    // 如果没有 confirmFunc，可能是不需要保存的节点，直接关闭
    closed()
  }
}

// 处理 Drawer 的确认事件
const handleDrawerConfirm = () => {
  handleConfirm()
}
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
