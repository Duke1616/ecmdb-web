<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :class="dialogClass"
    :show-close="showClose"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    @closed="handleClosed"
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
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "closed"): void
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "50%",
  showClose: false,
  closeOnClickModal: false,
  type: "standard"
})

const emits = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const dialogClass = computed(() => {
  const baseClass = "base-dialog"
  const typeClass = `base-dialog--${props.type}`
  return [baseClass, typeClass]
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
</script>
