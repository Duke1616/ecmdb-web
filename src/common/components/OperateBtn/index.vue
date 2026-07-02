<template>
  <div v-if="props.items" class="operate-actions">
    <!-- 当按钮总数超过限制时，进行折叠 -->
    <div v-if="props.items.length > props.maxLength" class="btn-container">
      <el-button
        v-for="(el, i) in showBtn"
        :key="i"
        :type="el.type || 'primary'"
        size="small"
        :icon="el.icon ? el.icon : ''"
        link
        :disabled="isBtnDisabled(el)"
        @click="routeEvent(props.operateItem, el.code)"
      >
        <span>{{ el.name }}</span>
      </el-button>

      <el-dropdown trigger="click" popper-class="operate-actions-dropdown" @command="handleCommand">
        <el-button class="more-button" link size="small" aria-label="更多操作">
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="operate-dropdown-menu">
            <el-dropdown-item
              v-for="(item, index) in dropData"
              :key="index"
              :command="beforeHandleCommand(props.operateItem, item.name, item.code)"
              :disabled="isBtnDisabled(item)"
              :class="['operate-dropdown-item', `is-${item.type || 'default'}`]"
            >
              <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
              <span>{{ item.name }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 未超过限制，直接展示 -->
    <div v-else class="btn-container">
      <div v-for="(item, index) in props.items" :key="index" class="btn-box">
        <el-button
          :type="item.type || 'default'"
          link
          :icon="item.icon ? item.icon : ''"
          size="small"
          :disabled="isBtnDisabled(item)"
          @click="routeEvent(operateItem, item.code)"
        >
          <span>{{ item.name }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { MoreFilled } from "@element-plus/icons-vue"
import { usePermission } from "@/common/composables/usePermission"

interface Item {
  name: string
  code: string
  type?: any
  icon?: any
  disabled?: boolean
  /** 权限能力标识 */
  capability?: string | string[]
}

interface Props {
  items: Array<Item>
  operateItem: any
  maxLength: number
}

const props = defineProps<Props>()
const emit = defineEmits(["routeEvent"])

const { hasPermission } = usePermission()

/**
 * 判定按钮是否被禁用 (逻辑: 业务禁用 OR 权限缺失)
 */
const isBtnDisabled = (item: Item) => {
  if (item.disabled) return true
  if (item.capability) {
    return !hasPermission(item.capability)
  }
  return false
}

// NOTE: 使用 computed 替代 watch + ref 以避免在 DataTable 大量渲染时触发局部刷新导致的死循环
/**
 * 需要在外部展示的按钮
 */
const showBtn = computed(() => {
  if (props.items.length > props.maxLength) {
    return props.items.slice(0, props.maxLength)
  }
  return []
})

/**
 * 需要收纳进下拉列表的按钮
 */
const dropData = computed(() => {
  if (props.items.length > props.maxLength) {
    return props.items.slice(props.maxLength)
  }
  return []
})

// 正常按钮点击事件
const routeEvent = (data: any, code: string) => {
  emit("routeEvent", data, code)
}

const beforeHandleCommand = (data: any, name: string, code: string) => {
  return {
    data: data,
    name: name,
    code: code
  }
}

// 下拉菜单点击事件
const handleCommand = (command: any) => {
  routeEvent(command.data, command.code)
}
</script>

<style lang="scss" scoped>
.btn-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.btn-box {
  display: flex;
  align-items: center;
  justify-content: center;

  .el-button {
    min-width: 0;
    height: 24px;
    margin: 0;
    padding: 0 3px;
    font-size: 12px;
    font-weight: 600;

    :deep(.el-icon) {
      margin-right: 3px;
      font-size: 14px;
    }
  }
}

.more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: #64748b;
  border-radius: 5px;

  :deep(.el-icon) {
    font-size: 14px;
  }

  &:hover {
    color: #2563eb;
    background: #eff6ff;
  }
}

:global(.operate-actions-dropdown) {
  .el-popper__arrow::before {
    border-color: #e2e8f0 !important;
  }
}

:global(.operate-dropdown-menu) {
  min-width: 88px;
  padding: 4px;
}

:global(.operate-dropdown-item) {
  display: flex !important;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px !important;
  border-radius: 5px;
  color: #334155;
  font-size: 12px;
  font-weight: 600;

  .el-icon {
    margin-right: 0;
    font-size: 14px;
  }

  &.is-primary {
    color: #2563eb;
  }

  &.is-success {
    color: #16a34a;
  }

  &.is-warning {
    color: #d97706;
  }

  &.is-danger {
    color: #dc2626;
  }

  &.is-info,
  &.is-default {
    color: #64748b;
  }
}
</style>
