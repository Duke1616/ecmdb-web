<template>
  <el-drawer
    v-model="visible"
    :size="size"
    :direction="direction"
    :show-close="false"
    :close-on-click-modal="closeOnClickModal"
    :before-close="handleBeforeClose"
    :class="drawerClass"
    :style="drawerStyle"
    @closed="handleClosed"
  >
    <!-- 头部插槽 -->
    <template #header>
      <div class="drawer-header">
        <div class="header-left">
          <div class="header-icon" v-if="headerIcon || $slots['header-icon']">
            <slot name="header-icon">
              <el-icon><component :is="headerIcon" /></el-icon>
            </slot>
          </div>
          <div class="header-text">
            <h3>{{ title }}</h3>
            <p v-if="subtitle">{{ subtitle }}</p>
          </div>
        </div>
        <div class="header-right" v-if="showClose">
          <el-button type="text" :icon="Close" class="close-btn" @click="handleCancel" />
        </div>
      </div>
    </template>

    <!-- 抽屉内容 -->
    <div class="drawer-content">
      <slot />
    </div>

    <!-- 底部插槽 -->
    <template #footer v-if="showFooter">
      <div class="drawer-footer">
        <slot name="footer">
          <el-button @click="handleCancel">{{ cancelButtonText }}</el-button>
          <el-button type="primary" @click="handleConfirm">{{ confirmButtonText }}</el-button>
        </slot>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Close } from "@element-plus/icons-vue"

interface Props {
  modelValue: boolean
  title: string
  subtitle?: string
  size?: string | number
  direction?: "rtl" | "ltr" | "ttb" | "btt"
  showClose?: boolean
  closeOnClickModal?: boolean
  showFooter?: boolean
  headerIcon?: any
  beforeClose?: (done: () => void) => void
  class?: string
  cancelButtonText?: string
  confirmButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: "60%",
  direction: "rtl",
  showClose: true,
  closeOnClickModal: true,
  showFooter: true,
  class: "",
  cancelButtonText: "取消",
  confirmButtonText: "确定"
})

const emits = defineEmits<{
  "update:modelValue": [value: boolean]
  closed: []
  cancel: []
  confirm: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emits("update:modelValue", val)
})

const drawerClass = computed(() => {
  const baseClass = "custom-drawer"
  return props.class ? `${baseClass} ${props.class}` : baseClass
})

const drawerStyle = computed(() => ({
  "--el-drawer-padding-primary": "0px",
  "--el-drawer-bg-color": "#f5f7fa",
  "--el-drawer-content-bg-color": "#f5f7fa",
  "--el-drawer-header-padding": "0px",
  "--el-drawer-header-margin": "0px"
}))

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

const handleCancel = () => {
  emits("cancel")
  visible.value = false
}

const handleConfirm = () => {
  emits("confirm")
}
</script>

<style lang="scss" scoped>
.custom-drawer {
  // 使用 CSS 变量设置 el-drawer 样式，无需深度选择器
  height: 100%;
  display: flex;
  flex-direction: column;

  .drawer-header {
    padding: calc(0.8rem + 0.3vw) calc(1rem + 0.4vw);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    background: #fafafa;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: calc(-2.2rem + 0.2vw);
    text-align: left;


    .header-left {
      display: flex;
      align-items: center;
      gap: calc(0.5rem + 0.2vw);
      flex: 1;
    }

    .header-right {
      display: flex;
      align-items: center;
      margin-left: auto;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(2rem + 0.5vw);
      height: calc(2rem + 0.5vw);
      background: #409eff;
      border-radius: calc(0.4rem + 0.1vw);
      color: white;

      .el-icon {
        font-size: calc(1.1rem + 0.25vw);
      }
    }

    .header-text {
      flex: 1;
      text-align: left;

      h3 {
        margin: 0;
        font-size: calc(0.8rem + 0.2vw);
        font-weight: 600;
        color: #303133;
        line-height: 1.3;
        text-align: left;
      }

      p {
        margin: calc(0.1rem + 0.05vw) 0 0 0;
        font-size: calc(0.65rem + 0.15vw);
        color: #909399;
        line-height: 1.3;
        text-align: left;
      }
    }

    .close-btn {
      width: calc(2rem + 0.5vw);
      height: calc(2rem + 0.5vw);
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: calc(0.4rem + 0.1vw);
      color: #303133;
      transition: all 0.2s ease;

      &:hover {
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.1);
      }

      .el-icon {
        font-size: calc(1.3rem + 0.3vw);
      }
    }
  }

  .drawer-content {
    flex: 1;
    padding: 0;
    overflow-y: auto;
    background: white;
    height: 100%;
    // margin: 0 20px 12px 20px;
    border-radius: 6px;
    box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }

  .drawer-footer {
    padding: calc(1rem + 0.4vw) calc(1.2rem + 0.5vw);
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: calc(0.6rem + 0.2vw);
    margin: 0 calc(1rem + 0.4vw) calc(0.6rem + 0.2vw) calc(1rem + 0.4vw);
    border-radius: 0 0 calc(0.3rem + 0.1vw) calc(0.3rem + 0.1vw);

    .el-button {
      min-width: calc(5rem + 1vw);
      height: calc(2.2rem + 0.5vw);
      border-radius: calc(0.4rem + 0.1vw);
      font-weight: 500;
      font-size: calc(0.7rem + 0.15vw);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: calc(0.3rem + 0.1vw);

      &:not(.el-button--primary) {
        border: 1px solid #d1d5db;
        background: #ffffff;
        color: #6b7280;

        &:hover {
          border-color: #9ca3af;
          color: #374151;
          background: #f9fafb;
        }

        .el-icon {
          margin-right: 6px;
          font-size: 16px;
        }
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: none;
        color: white;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

        &:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }

        .el-icon {
          margin-right: 6px;
          font-size: 16px;
        }
      }
    }
  }
}

// 标签页样式已移动到 detail.vue 中
</style>
