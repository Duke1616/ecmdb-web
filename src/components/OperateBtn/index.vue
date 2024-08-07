<template>
  <div v-if="props.items">
    <div v-if="props.items.length > props.maxLength" class="btn-box">
      <el-tooltip effect="dark" :content="el.name" v-for="(el, i) in showBtn" :key="i">
        <el-button
          :type="el.type || 'primary'"
          size="small"
          :icon="el.icon ? el.icon : ''"
          link
          :disabled="el.disabled"
          @click="routeEvent(props.operateItem, el.name)"
        >
          <span> {{ el.name }}</span>
        </el-button>
      </el-tooltip>

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
    <div v-else style="display: flex">
      <div v-for="(item, index) in props.items" :key="index" class="btn-box">
        <el-tooltip effect="dark" placement="right" :content="item.name">
          <el-button
            :type="item.type || 'default'"
            link
            :icon="item.icon ? item.icon : ''"
            size="small"
            :disabled="item.disabled"
            @click="routeEvent(operateItem, item.name)"
          >
            <span> {{ item.name }}</span>
          </el-button>
        </el-tooltip>
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
  icon?: string
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

.btn-box {
  .el-button {
    min-width: 0px;
    margin-right: 12px;
  }
}

.el-dropdown-link {
  vertical-align: text-top;
}

.el-dropdown {
  vertical-align: middle;
}
</style>
