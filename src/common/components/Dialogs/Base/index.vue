<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :class="dialogClass"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    :top="top"
    @closed="handleClosed"
    @opened="handleOpened"
  >
    <!-- 头部插槽 -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- 内容区域 -->
    <div class="dialog-content">
      <slot />
    </div>

    <!-- 底部插槽 -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Props {
  modelValue: boolean
  title?: string
  width?: string | number
  showClose?: boolean
  closeOnClickModal?: boolean
  type?: "standard" | "form" | "permission" | "custom"
  beforeClose?: (done: () => void) => void
  top?: string
  fullHeight?: boolean
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
  (e: "opened"): void
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "50%",
  showClose: false,
  closeOnClickModal: false,
  type: "standard",
  top: "15vh"
})

const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const dialogClass = computed(() => {
  const baseClass = "base-dialog"
  const typeClass = `base-dialog--${props.type}`
  const heightClass = props.fullHeight ? "is-full-height" : ""
  return [baseClass, typeClass, heightClass]
})

const handleBeforeClose = (done: () => void) => {
  if (props.beforeClose) {
    props.beforeClose(done)
  } else {
    done()
  }
}

const handleClosed = () => {
  emits("closed")
}

const handleOpened = () => {
  emits("opened")
}
</script>
<style lang="scss">
/* --- 链路增强：支持全高弹窗模式 --- */
.base-dialog.is-full-height {
  display: flex !important;
  flex-direction: column !important;
  max-height: 92vh !important;
  margin-bottom: 0 !important;

  .el-dialog__body {
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
    padding: 0 !important;
    min-height: 0 !important;

    .dialog-content {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
      min-height: 0 !important;
      height: 0 !important; // 核心：强制进入 Flex 压缩模式
    }
  }
}
</style>
