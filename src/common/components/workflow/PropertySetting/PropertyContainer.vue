<template>
  <div class="property-container" :class="dialogClass">
    <!-- 弹窗头部 -->
    <div class="dialog-header" :class="headerClass">
      <div class="header-icon">
        <div class="icon-circle">
          <img :src="getIconPath(iconName)" :alt="iconName" class="icon-image" />
        </div>
      </div>
      <div class="header-content">
        <h3 class="header-title">{{ title }}</h3>
        <p class="header-subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="dialog-content">
      <slot />
    </div>

    <!-- 弹窗底部按钮 -->
    <div class="dialog-footer" v-if="showFooter">
      <slot name="footer">
        <el-button @click="handleCancel" class="footer-btn footer-btn-cancel"> 取消 </el-button>
        <el-button type="primary" @click="handleConfirm" class="footer-btn footer-btn-confirm"> 确定 </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

interface Props {
  // 头部配置
  title: string
  subtitle: string
  iconName: string
  theme?: "green" | "blue" | "orange" | "purple" | "cyan"

  // 显示配置
  showFooter?: boolean

  // 自定义类名
  dialogClass?: string
  headerClass?: string
}

interface Emits {
  (e: "confirm"): void
  (e: "cancel"): void
}

const props = withDefaults(defineProps<Props>(), {
  theme: "green",
  showFooter: true,
  dialogClass: "",
  headerClass: ""
})

const emits = defineEmits<Emits>()

// 获取图标路径
const getIconPath = (iconName: string) => {
  return new URL(`../background/${iconName}.png`, import.meta.url).href
}

// 主题配置
const themeConfig = {
  green: {
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderColor: "#10b981",
    focusColor: "rgba(16, 185, 129, 0.15)"
  },
  blue: {
    gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    borderColor: "#3b82f6",
    focusColor: "rgba(59, 130, 246, 0.15)"
  },
  orange: {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    borderColor: "#f59e0b",
    focusColor: "rgba(245, 158, 11, 0.15)"
  },
  purple: {
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    borderColor: "#8b5cf6",
    focusColor: "rgba(139, 92, 246, 0.15)"
  },
  cyan: {
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    borderColor: "#06b6d4",
    focusColor: "rgba(6, 182, 212, 0.15)"
  }
}

const currentTheme = computed(() => themeConfig[props.theme])

const handleConfirm = () => {
  emits("confirm")
}

const handleCancel = () => {
  emits("cancel")
}
</script>

<style scoped lang="scss">
.property-container {
  background: transparent;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px;
    z-index: -1;
  }
}

.dialog-header {
  padding: 24px 28px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 24px 24px 0 0;
  position: relative;
  z-index: 1;
  background: v-bind("currentTheme.gradient");

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.header-icon {
  .icon-circle {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 12px;
      pointer-events: none;
    }

    .icon-image {
      width: 32px;
      height: 32px;
      object-fit: contain;
      position: relative;
      z-index: 1;
      filter: brightness(0) invert(1); // 将图标变为白色
    }
  }
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  line-height: 1.4;
}

.dialog-content {
  padding: 20px 24px 16px;
  background: #ffffff;
  position: relative;
  z-index: 1;
  border-radius: 0 0 24px 24px;
  padding: 16px 10px 16px !important;
}

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: v-bind("currentTheme.gradient");
  color: white;
  border-color: v-bind("currentTheme.borderColor");

  &:hover {
    box-shadow: 0 4px 12px v-bind("currentTheme.focusColor");
  }
}
</style>
