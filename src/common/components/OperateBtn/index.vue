<template>
  <div v-if="props.items">
    <!-- 当按钮总数超过限制时，进行折叠 -->
    <div v-if="props.items.length > props.maxLength" class="btn-box">
      <el-button
        v-for="(el, i) in showBtn"
        :key="i"
        :type="el.type || 'primary'"
        size="small"
        :icon="el.icon ? el.icon : ''"
        link
        :disabled="el.disabled"
        @click="routeEvent(props.operateItem, el.code)"
      >
        <span> {{ el.name }}</span>
      </el-button>

      <el-dropdown trigger="hover" @command="handleCommand">
        <span class="el-dropdown-link">
          <el-icon style="color: #409eff; margin-left: 4px; cursor: pointer"><More /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="table-opetation-more-dropdown">
            <el-dropdown-item
              v-for="(item, index) in dropData"
              :key="index"
              :command="beforeHandleCommand(props.operateItem, item.name, item.code)"
              class="link-text"
            >
              <el-button :type="item.type || 'primary'" link :icon="item.icon ? item.icon : ''" size="small">
                {{ item.name }}
              </el-button>
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
          :disabled="item.disabled"
          @click="routeEvent(operateItem, item.code)"
        >
          <span> {{ item.name }}</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { More } from "@element-plus/icons-vue"

interface Item {
  name: string
  code: string
  type?: any
  icon?: any
  disabled?: boolean
}

interface Props {
  items: Array<Item>
  operateItem: any
  maxLength: number
}

const props = defineProps<Props>()
const emit = defineEmits(["routeEvent"])

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
.link-text .el-button {
  width: 100%;
  text-align: left;
}

.btn-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.btn-box {
  display: flex;
  justify-content: center;
  align-items: center;

  .el-button {
    min-width: 0px;
    margin-right: 4px;
    font-size: 13px;
    padding: 4px 8px;
    height: 32px;
  }
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  height: 32px;
}
</style>
