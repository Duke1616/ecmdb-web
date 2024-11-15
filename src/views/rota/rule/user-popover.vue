<template>
  <el-popover ref="popoverRef" placement="bottom" :width="200" trigger="click">
    <template #reference>
      <el-button>添加成员</el-button>
    </template>

    <div class="search-wrapper">
      <el-input
        v-model="keyword"
        @input="debouncedSearch"
        placeholder="输入内容检索"
        clearable
        class="search-input"
        prefix-icon="Search"
      />
    </div>

    <!-- 用户数据列表 -->
    <div
      v-for="user in usersData"
      :key="user.id"
      class="user-item"
      @click="handleUserClick(user)"
      @mouseenter="hoverUser(user.id, true)"
      @mouseleave="hoverUser(user.id, false)"
      :style="{ boxShadow: hoverState.get(user.id) ? '0 4px 8px rgba(0, 0, 0, 0.2)' : '' }"
    >
      <span>{{ user.display_name + " [" + user.username + "] " }}</span>
    </div>

    <!-- 分页控件 -->
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :current-page="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { listUsersApi, listUsersByKeywordApi } from "@/api/user"
import { user as userInfo } from "@/api/user/types/user"
import { usePagination } from "@/hooks/usePagination"
import { ElPopover } from "element-plus"
import { debounce } from "lodash-es"
import { ref, watch } from "vue"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "total, prev, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)
// 引用popover实例
const popoverRef = ref<InstanceType<typeof ElPopover>>()
interface Props {
  addRotaGroup: (user: userInfo) => void
}
const props = defineProps<Props>()

// 搜索框的输入值
const keyword = ref<string>("")
const usersData = ref<userInfo[]>([])
// 存储每个用户的 hover 状态
const hoverState = ref<Map<number, boolean>>(new Map())

const listUsersData = () => {
  listUsersApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users.map((user) => ({ ...user, isHovered: false }))
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const listUsersRegexData = () => {
  listUsersByKeywordApi({
    keyword: keyword.value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users.map((user) => ({ ...user, isHovered: false }))
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const debouncedSearch = debounce(() => {
  paginationData.currentPage = 1
  listUsers()
}, 388)

const listUsers = () => {
  if (keyword.value) {
    listUsersRegexData()
  } else {
    listUsersData()
  }
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsers, { immediate: false })

// 处理用户点击事件
const handleUserClick = (user: userInfo) => {
  props.addRotaGroup(user)

  // 关闭popover
  popoverRef.value?.hide()
}

// 鼠标悬停时更新 hover 状态
const hoverUser = (userId: number, isHovered: boolean) => {
  hoverState.value.set(userId, isHovered)
}
</script>

<style scoped>
/* 让popover的内边距为0，确保内容紧贴边缘 */
.popover-custom .el-popover__content {
  padding: 0;
}

/* 搜索框容器 */
.search-wrapper {
  margin-bottom: 10px;
}

/* 搜索框样式 */
.search-input {
  width: 100%;
}

/* 用户项样式 */
.user-item {
  margin-bottom: 8px;
  padding: 8px;
  cursor: pointer;
  transition:
    box-shadow 0.3s ease,
    background-color 0.3s ease;
  border-radius: 4px; /* 圆角效果 */
  background-color: rgba(0, 0, 0, 0.05); /* 背景颜色 */
}

/* 鼠标悬停时阴影效果 */
.user-item.hover-shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background-color: rgba(0, 0, 0, 0.1); /* 更深的背景色 */
}

/* 分页控件的布局 */
.pager-wrapper .el-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
</style>
