<template>
  <WorkspaceSectionPage
    title="团队成员"
    subtitle="管理团队成员信息"
    :primary-action="{
      label: '邀请成员',
      icon: Plus,
      capability: ALERT_CAPABILITIES.Team.Edit
    }"
    @primary-action="handleInviteMember"
  >
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
        <div class="member-name">{{ row.nickname || row.username }}</div>
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
        <div class="member-title">{{ row.job_title || "未设置职位" }}</div>
      </template>
    </DataTable>
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { getTeamDetailApi } from "@/api/alert/team"
import type { Team } from "@/api/alert/team/types"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { usePagination } from "@/common/composables/usePagination"
import DataTable from "@/common/components/DataTable/index.vue"
import { useUsers } from "@/common/composables/useUsers"
import type { IMemberUser } from "@/common/composables/useUsers"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"

interface Props {
  teamId: number
}

const props = defineProps<Props>()

// 成员列表
const members = ref<IMemberUser[]>([])
const { selectedUsers, loadSelectedUsers } = useUsers()
const loading = ref(false)
const teamInfo = ref<Team | null>(null)

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const total = ref(0)

import type { Column } from "@@/components/DataTable/types"

// 表格列配置
const tableColumns: Column[] = [
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
    prop: "job_title",
    label: "职位",
    minWidth: 150,
    slot: "title"
  }
]

// 表格属性
const tableProps = {
  height: "100%"
}

// 加载团队成员数据
const loadMembersData = async () => {
  if (!props.teamId) return

  try {
    loading.value = true

    // 1. 获取团队详情
    const teamResponse = await getTeamDetailApi(props.teamId)

    // 后端可能直接返回团队对象，而不是包装在 team 字段中
    teamInfo.value = teamResponse.data

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

      // 3. 批量获取用户详情 (由 useUsers Hook 并发接管)
      await loadSelectedUsers(paginatedUsernames)
      members.value = selectedUsers.value

      // 设置总数
      total.value = usernames.length
    } else {
      members.value = []
      total.value = 0
    }
  } catch (error) {
    console.error("加载团队成员失败:", error)
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
  refresh,
  loadData: loadMembersData,
  loadMembersData
})
</script>
