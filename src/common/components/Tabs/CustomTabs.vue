<template>
  <div class="custom-tabs">
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="tab-item"
        :class="{ active: activeTab === tab.name }"
        @click="handleTabClick(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content" :class="{ 'no-margin': noMargin }">
      <slot :activeTab="activeTab" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"

interface Tab {
  name: string
  label: string
}

interface Props {
  tabs: Tab[]
  defaultActive?: string
  noMargin?: boolean // 是否移除内容区域的 margin
}

const props = withDefaults(defineProps<Props>(), {
  defaultActive: "",
  noMargin: false
})

const emits = defineEmits<{
  "tab-change": [tabName: string]
}>()

const activeTab = ref<string>(props.defaultActive || props.tabs[0]?.name || "")

const handleTabClick = (tabName: string) => {
  activeTab.value = tabName
  emits("tab-change", tabName)
}

// 监听外部传入的 defaultActive 变化
watch(
  () => props.defaultActive,
  (newValue) => {
    if (newValue) {
      activeTab.value = newValue
    }
  }
)

// 暴露方法给父组件
defineExpose({
  activeTab,
  setActiveTab: (tabName: string) => {
    activeTab.value = tabName
  }
})
</script>

<style lang="scss" scoped>
// 简洁现代的标签页设计
.custom-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;

  .tabs-header {
    display: flex;
    background: #f8f9fa;
    border-bottom: 1px solid #e4e7ed;
    padding: 0;
    margin: 0;
  }

  .tab-item {
    flex: 1;
    padding: 12px 16px;
    text-align: center;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    border: none;
    background: transparent;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #409eff;
      background: rgba(64, 158, 255, 0.05);
    }

    &.active {
      color: #409eff;
      background: white;
      font-weight: 600;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 2px;
        background: #409eff;
        border-radius: 1px;
      }
    }
  }

  .tabs-content {
    background: white;
    margin: 12px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;

    &.no-margin {
      margin: 0;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .custom-tabs {
    .tab-item {
      padding: 10px 12px;
      font-size: 13px;
      min-height: 40px;
    }

    .tabs-content {
      padding: 16px;
    }
  }
}

/* 高分辨率屏幕优化 */
@media (min-width: 1440px) {
  .custom-tabs {
    .tab-item {
      padding: 14px 18px;
      font-size: 15px;
      min-height: 48px;
    }

    .tabs-content {
      margin: 14px;
    }
  }
}

/* 超高分辨率屏幕优化 */
@media (min-width: 1920px) {
  .custom-tabs {
    .tab-item {
      padding: 16px 20px;
      font-size: 16px;
      min-height: 52px;
    }

    .tabs-content {
      margin: 16px;
    }
  }
}
</style>
