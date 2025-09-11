<template>
  <el-drawer
    v-model="visible"
    :title="title"
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
          <div class="header-icon" v-if="headerIcon">
            <el-icon><component :is="headerIcon" /></el-icon>
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
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
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
}

const props = withDefaults(defineProps<Props>(), {
  size: "60%",
  direction: "rtl",
  showClose: true,
  closeOnClickModal: true,
  showFooter: false,
  class: ""
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
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fafafa;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: -32px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
    }

    .header-right {
      display: flex;
      align-items: center;
    }

    .header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #409eff;
      border-radius: 8px;
      color: white;

      .el-icon {
        font-size: 22px;
      }
    }

    .header-text {
      flex: 1;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        line-height: 1.3;
      }

      p {
        margin: 2px 0 0 0;
        font-size: 13px;
        color: #909399;
        line-height: 1.3;
      }
    }

    .close-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: #303133;
      transition: all 0.2s ease;

      &:hover {
        color: #f56c6c;
        background: rgba(245, 108, 108, 0.1);
      }

      .el-icon {
        font-size: 26px;
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
    padding: 16px 24px;
    background: white;
    border-top: 1px solid #e4e7ed;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin: 0 20px 12px 20px;
    border-radius: 0 0 6px 6px;
  }
}

// 标签页样式已移动到 detail.vue 中

// 响应式设计
@media (max-width: 768px) {
  .custom-drawer {
    .drawer-header {
      padding: 12px 16px;
      gap: 8px;

      .header-icon {
        width: 28px;
        height: 28px;

        .el-icon {
          font-size: 12px;
        }
      }

      .header-text h3 {
        font-size: 15px;
      }

      .header-text p {
        font-size: 12px;
      }
    }

    .drawer-content {
      margin: 0 16px 8px 16px;
    }

    .drawer-footer {
      padding: 12px 16px;
      margin: 0 16px 8px 16px;
    }
  }
}
</style>
