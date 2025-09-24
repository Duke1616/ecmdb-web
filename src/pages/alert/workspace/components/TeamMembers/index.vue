<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="成员管理" subtitle="管理团队成员信息" @refresh="loadMembersData">
      <template #actions>
        <el-button type="primary" :icon="Plus" @click="handleInviteMember"> 邀请成员 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="members"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="tableProps"
      v-loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 成员姓名插槽 -->
      <template #displayName="{ row }">
        <div class="member-name">{{ row.display_name || row.username }}</div>
      </template>

      <!-- 用户名插槽 -->
      <template #username="{ row }">
        <div class="member-username">@{{ row.username }}</div>
      </template>

      <!-- 邮箱插槽 -->
      <template #email="{ row }">
        <div class="member-email">{{ row.email || "未设置邮箱" }}</div>
      </template>

      <!-- 职位插槽 -->
      <template #title="{ row }">
        <div class="member-title">{{ row.title || "未设置职位" }}</div>
      </template>
    </DataTable>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { getTeamDetailApi } from "@/api/alert/team"
import { findByUsernamesApi } from "@/api/user"
import type { Team } from "@/api/alert/team/types"
import type { user } from "@/api/user/types/user"
import { usePagination } from "@/common/composables/usePagination"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"

interface Props {
  teamId: number
}

const props = defineProps<Props>()

// 成员列表
const members = ref<user[]>([])
const loading = ref(false)
const teamInfo = ref<Team | null>(null)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const total = ref(0)

// 表格列配置
const tableColumns = [
  {
    prop: "displayName",
    label: "姓名",
    minWidth: 150,
    slot: "displayName"
  },
  {
    prop: "username",
    label: "用户名",
    minWidth: 120,
    slot: "username"
  },
  {
    prop: "email",
    label: "邮箱",
    minWidth: 200,
    slot: "email"
  },
  {
    prop: "title",
    label: "职位",
    minWidth: 150,
    slot: "title"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)"
}

// 加载团队成员数据
const loadMembersData = async () => {
  if (!props.teamId) return

  try {
    loading.value = true

    // 1. 获取团队详情
    const teamResponse = await getTeamDetailApi(props.teamId)
    console.log("团队详情响应:", teamResponse.data)

    // 后端可能直接返回团队对象，而不是包装在 team 字段中
    teamInfo.value = teamResponse.data.team || teamResponse.data
    console.log("团队信息:", teamInfo.value)

    // 检查团队信息是否存在
    if (!teamInfo.value) {
      throw new Error("团队信息不存在")
    }

    // 2. 根据团队成员用户名获取用户详情
    if (teamInfo.value.members && teamInfo.value.members.length > 0) {
      const usernames = teamInfo.value.members

      // 分页处理
      const startIndex = (paginationData.currentPage - 1) * paginationData.pageSize
      const endIndex = startIndex + paginationData.pageSize
      const paginatedUsernames = usernames.slice(startIndex, endIndex)

      // 3. 批量获取用户详情
      const usersResponse = await findByUsernamesApi(paginatedUsernames)
      members.value = usersResponse.data.users || []

      // 设置总数
      total.value = usernames.length
    } else {
      members.value = []
      total.value = 0
    }
  } catch (error) {
    console.error("加载团队成员失败:", error)
    ElMessage.error("加载团队成员失败")
    members.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 监听团队ID变化
watch(
  () => props.teamId,
  (newTeamId) => {
    if (newTeamId) {
      loadMembersData()
    }
  },
  { immediate: true }
)

// 监听分页变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  loadMembersData()
})

// 邀请成员
const handleInviteMember = () => {
  ElMessage.info("邀请成员功能开发中...")
}

// 刷新数据
const refresh = () => {
  loadMembersData()
}

// 暴露方法给父组件
defineExpose({
  refresh
})
</script>

<style lang="scss" scoped>
// 覆盖 PageContainer 样式
.page-container {
  padding: 0px !important;
  background: transparent !important;
  width: 100%;
  height: 100%;
}
</style>
