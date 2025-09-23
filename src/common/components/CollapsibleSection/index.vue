<template>
  <div class="collapsible-section">
    <div class="section-header" @click="toggleCollapse">
      <div class="header-info">
        <h4>{{ title }}</h4>
        <span class="header-tip">{{ tip }}</span>
      </div>
      <div class="header-actions">
        <slot name="actions" />
        <el-icon class="collapse-icon">
          <ArrowDown v-if="!isCollapsed" />
          <ArrowUp v-else />
        </el-icon>
      </div>
    </div>
    <div v-show="!isCollapsed" class="section-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ArrowDown, ArrowUp } from "@element-plus/icons-vue"

interface Props {
  title: string
  tip?: string
  defaultCollapsed?: boolean
  collapsed?: boolean // 外部控制状态
}

const props = withDefaults(defineProps<Props>(), {
  tip: "",
  defaultCollapsed: false,
  collapsed: undefined
})

const emit = defineEmits<{
  (e: "update:collapsed", value: boolean): void
}>()

// 内部状态
const isCollapsed = ref(props.collapsed !== undefined ? props.collapsed : props.defaultCollapsed)

// 监听外部 collapsed 属性变化
watch(
  () => props.collapsed,
  (newValue) => {
    if (newValue !== undefined) {
      isCollapsed.value = newValue
    }
  },
  { immediate: true }
)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  // 如果外部传入了 collapsed 属性，则发出事件通知父组件
  if (props.collapsed !== undefined) {
    emit("update:collapsed", isCollapsed.value)
  }
}
</script>

<style lang="scss" scoped>
.collapsible-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    }

    .header-info {
      h4 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }

      .header-tip {
        font-size: 12px;
        color: #6b7280;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .collapse-icon {
        font-size: 16px;
        color: #6b7280;
        transition: transform 0.2s ease;
      }
    }
  }

  .section-content {
    padding: 20px;
  }
}
</style>
