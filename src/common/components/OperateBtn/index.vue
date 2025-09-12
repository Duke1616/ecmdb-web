<template>
  <div v-if="props.items">
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
          <el-icon style="color: #409eff"><More /></el-icon>
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
import { ref, onMounted } from "vue"

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
const dropData = ref<any>([])
const showBtn = ref<any>([])

onMounted(() => {
  if (props.items.length > props.maxLength) {
    showBtn.value = props.items.slice(0, props.maxLength)
    dropData.value = props.items.slice(props.maxLength)
  }
})
const emit = defineEmits(["routeEvent"])
// 正常按钮点击事件
const routeEvent = (data: any, name: string) => {
  emit("routeEvent", data, name)
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
}

.btn-box {
  display: flex;
  justify-content: center;
  align-items: center;

  .el-button {
    min-width: 0px;
    margin-right: 6px;
    font-size: 9px;
    padding: 2px 6px;
    min-height: 18px;
  }
}

.el-dropdown-link {
  vertical-align: text-top;
}

.el-dropdown {
  vertical-align: middle;
}

/* 高分辨率屏幕优化 */
@media (min-width: 1440px) {
  .btn-box {
    .el-button {
      font-size: 11px;
      padding: 6px 10px;
      min-height: 26px;
      margin-right: 10px;
    }
  }

  .link-text .el-button {
    font-size: 11px;
    padding: 6px 10px;
    min-height: 26px;
  }
}

/* 中等屏幕优化 */
@media (max-width: 1023px) and (min-width: 769px) {
  .btn-box {
    .el-button {
      font-size: 10px;
      padding: 3px 8px;
      min-height: 24px;
      margin-right: 8px;
    }
  }

  .link-text .el-button {
    font-size: 10px;
    padding: 3px 8px;
    min-height: 24px;
  }
}

/* 高分辨率屏幕优化 */
@media (min-width: 1440px) {
  .btn-box {
    .el-button {
      font-size: 11px;
      padding: 6px 10px;
      min-height: 26px;
      margin-right: 10px;
    }
  }

  .link-text .el-button {
    font-size: 11px;
    padding: 6px 10px;
    min-height: 26px;
  }
}

/* 超高分辨率屏幕优化 */
@media (min-width: 1920px) {
  .btn-box {
    .el-button {
      font-size: 14px;
      padding: 10px 16px;
      min-height: 36px;
      margin-right: 16px;
    }
  }

  .link-text .el-button {
    font-size: 14px;
    padding: 10px 16px;
    min-height: 36px;
  }
}
</style>
