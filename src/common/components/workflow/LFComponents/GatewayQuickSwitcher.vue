<template>
  <Transition name="fade-slide">
    <div
      v-if="visible && position"
      class="gateway-quick-switcher"
      :class="{ 'is-flipped': flipped }"
      :style="{
        left: `${position.x}px`,
        top: `${position.y}px`
      }"
      @mousedown.stop
    >
      <div class="switcher-header">
        <span class="switcher-title">快速替换</span>
      </div>

      <div class="switcher-divider" />

      <div class="gateway-options">
        <el-tooltip
          v-for="item in displayGatewayTypes"
          :key="item.type"
          :content="getOptionTooltip(item)"
          placement="top"
          :show-after="200"
        >
          <button
            type="button"
            class="gateway-btn"
            :class="[
              `theme-${item.themeColor}`,
              {
                active: currentType === item.type,
                disabled: isOptionDisabled(item.type)
              }
            ]"
            :disabled="isOptionDisabled(item.type)"
            @click.stop="handleSwitch(item.type)"
          >
            <svg :viewBox="item.viewBox" class="gateway-btn-icon">
              <path v-for="(p, pIdx) in item.paths" :key="pIdx" :d="p.d" :transform="p.transform" fill="currentColor" />
            </svg>
            <span class="btn-label">{{ item.name.replace("网关", "") }}</span>
          </button>
        </el-tooltip>
      </div>

      <div class="switcher-divider" />

      <el-tooltip content="打开详细属性抽屉" placement="top" :show-after="200">
        <button type="button" class="action-btn" @click.stop="$emit('openDetail')">
          <el-icon><Setting /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue"
import { Setting } from "@element-plus/icons-vue"
import { GATEWAY_TYPE_LIST, isGatewayType, type GatewayType } from "../RegisterNode/gateway/constants"

interface Props {
  lf: any
  nodeData: any
  disabled?: boolean
  engineType?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  engineType: "flowx"
})

const emits = defineEmits<{
  (e: "changeType", newType: GatewayType): void
  (e: "openDetail"): void
}>()

// 展示全部网关类型，支持存量条件网关平滑识别与切换
const displayGatewayTypes = computed(() => {
  return GATEWAY_TYPE_LIST
})

const isOptionDisabled = (targetType: GatewayType) => {
  if (props.disabled) return true
  // FlowX 引擎下，不支持切回传统条件网关，除非当前节点本身就是条件网关（允许展示自身选中状态）
  if (props.engineType === "flowx" && targetType === "selective" && currentType.value !== "selective") {
    return true
  }
  return false
}

const getOptionTooltip = (item: any) => {
  if (props.engineType === "flowx" && item.type === "selective" && currentType.value !== "selective") {
    return `${item.name} - FlowX 引擎遵循 BPMN 规范，不支持切换为传统条件网关`
  }
  return `${item.name} (${item.badgeText}) - ${item.subTitle}`
}

const position = ref<{ x: number; y: number } | null>(null)
const flipped = ref(false)

const visible = computed(() => {
  return Boolean(props.nodeData && isGatewayType(props.nodeData?.type))
})

const currentType = computed<GatewayType>(() => {
  return (props.nodeData?.type as GatewayType) || "condition"
})

/**
 * 根据 LogicFlow 坐标模型计算 HTML 视图中的绝对像素位置
 */
const updatePosition = () => {
  if (!visible.value || !props.lf || !props.nodeData) {
    position.value = null
    return
  }

  try {
    const { x, y } = props.nodeData
    if (typeof x !== "number" || typeof y !== "number") return

    const transformModel = props.lf.graphModel?.transformModel
    if (!transformModel || typeof transformModel.CanvasPointToHtmlPoint !== "function") return

    const [htmlX, htmlY] = transformModel.CanvasPointToHtmlPoint([x, y])
    const scaleY = typeof transformModel.SCALE_Y === "number" ? transformModel.SCALE_Y : 1

    // 网关高度为 80px，半径为 40px；选中虚线框与顶部锚点向外延伸约 8px
    // 向上预留 14px 呼吸感间隙，确保工具条底部完全避开网关顶部尖角和锚点
    const gatewayHalfHeight = 40 * scaleY
    const safeGap = 16
    const neededTop = htmlY - gatewayHalfHeight - safeGap

    // 若靠近顶部容器边缘，则自适应翻转展示在下方
    const isFlipped = neededTop < 45
    const finalTop = isFlipped ? htmlY + gatewayHalfHeight + safeGap : neededTop

    position.value = {
      x: htmlX,
      y: finalTop
    }
    flipped.value = isFlipped
  } catch (error) {
    console.warn("Failed to compute gateway quick switcher position", error)
  }
}

watch(
  () => [props.nodeData?.id, props.nodeData?.type, props.nodeData?.x, props.nodeData?.y],
  () => {
    updatePosition()
  },
  { immediate: true, deep: true }
)

const handleSwitch = (targetType: GatewayType) => {
  if (isOptionDisabled(targetType)) return
  if (targetType === currentType.value) return
  emits("changeType", targetType)
}

// 监听画布拖拽、缩放事件动态更新位置
onMounted(() => {
  if (!props.lf) return
  props.lf.on("graph:transform", updatePosition)
  props.lf.on("node:drag", updatePosition)
})

onUnmounted(() => {
  if (!props.lf) return
  props.lf.off("graph:transform", updatePosition)
  props.lf.off("node:drag", updatePosition)
})
</script>

<style scoped lang="scss">
.gateway-quick-switcher {
  position: absolute;
  z-index: 1000;
  transform: translate(-50%, -100%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(10px);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow:
    0 10px 25px -5px rgba(15, 23, 42, 0.12),
    0 8px 10px -6px rgba(15, 23, 42, 0.08);
  pointer-events: auto;
  user-select: none;
  white-space: nowrap;

  &.is-flipped {
    transform: translate(-50%, 0);
  }

  .switcher-header {
    display: flex;
    align-items: center;
    padding: 0 4px;

    .switcher-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      letter-spacing: -0.2px;
    }
  }

  .switcher-divider {
    width: 1px;
    height: 18px;
    background: #e2e8f0;
    margin: 0 2px;
  }

  .gateway-options {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .gateway-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: #475569;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);

    .gateway-btn-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }

    .btn-label {
      line-height: 1;
    }

    &:hover:not(.disabled) {
      background: #f1f5f9;
      color: #1e293b;
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    &.active {
      font-weight: 600;

      &.theme-orange {
        background: #fff7ed;
        border-color: #fdba74;
        color: #c2410c;
      }

      &.theme-blue {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #1d4ed8;
      }

      &.theme-green {
        background: #f0fdf4;
        border-color: #bbf7d0;
        color: #15803d;
      }

      &.theme-purple {
        background: #faf5ff;
        border-color: #e9d5ff;
        color: #7e22ce;
      }
    }
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: #f1f5f9;
      color: #2563eb;
    }
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -90%) scale(0.96);

  &.is-flipped {
    transform: translate(-50%, -10%) scale(0.96);
  }
}

html.dark {
  .gateway-quick-switcher {
    background: rgba(30, 41, 59, 0.95);
    border-color: #475569;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);

    .switcher-header .switcher-title {
      color: #94a3b8;
    }

    .switcher-divider {
      background: #475569;
    }

    .gateway-btn {
      color: #cbd5e1;

      &:hover:not(.disabled) {
        background: #334155;
        color: #f8fafc;
      }

      &.active {
        &.theme-orange {
          background: #431407;
          border-color: #ea580c;
          color: #fed7aa;
        }

        &.theme-blue {
          background: #172554;
          border-color: #2563eb;
          color: #bfdbfe;
        }

        &.theme-green {
          background: #052e16;
          border-color: #16a34a;
          color: #bbf7d0;
        }

        &.theme-purple {
          background: #3b0764;
          border-color: #9333ea;
          color: #e9d5ff;
        }
      }
    }

    .action-btn {
      color: #94a3b8;

      &:hover {
        background: #334155;
        color: #60a5fa;
      }
    }
  }
}
</style>
