<template>
  <ProGovernanceLayout
    title="团队管理"
    subtitle="管理系统团队和成员分配"
    search-placeholder="搜索团队名称"
    v-model:keyword="keyword"
    :primary-action="{ capability: ALERT_CAPABILITIES.Team.Add, label: '新增团队', icon: CirclePlus }"
    :refresh-action="{ capability: ALERT_CAPABILITIES.Team.View }"
    @primary-action="handlerCreateTeam"
    @refresh="handleRefresh"
    @search="handleSearch"
  >
    <!-- 主内容区域 -->
    <DataTable
      :loading="loading"
      :data="teamsData"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{ stripe: true, height: 'calc(100vh - 12rem)' }"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 团队名称插槽 -->
      <template #teamName="{ row }">
        <div class="team-name">
          <span class="team-title">{{ row.name }}</span>
        </div>
      </template>

      <!-- 管理人员插槽 -->
      <template #owner="{ row }">
        <el-tag type="primary" effect="plain" class="owner-tag">
          {{ userToolsStore.getFullDisplayName(row.owner) }}
        </el-tag>
      </template>

      <!-- 成员数量插槽 -->
      <template #memberCount="{ row }">
        <el-tag type="success" effect="plain" class="member-tag"> {{ row.members.length }} 人 </el-tag>
      </template>

      <!-- 创建时间插槽 -->
      <template #ctime="{ row }">
        <span class="time-text">{{ formatTimestamp(row.ctime) }}</span>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>

    <!-- 新增/编辑团队抽屉 -->
    <Drawer
      v-model="dialogVisible"
      :title="isEditMode ? '编辑团队' : '新增团队'"
      :subtitle="isEditMode ? '修改团队信息' : '创建新的团队'"
      :header-icon="UserFilled"
      size="600px"
      direction="rtl"
      :before-close="handleDrawerClose"
      @closed="onClosedCreateOrUpdate"
      @confirm="handlerSubmitTeam"
    >
      <TeamForm ref="teamFormRef" @closed="onClosedCreateOrUpdate" @callback="listTeamsData" />
    </Drawer>

    <!-- 群聊管理抽屉 -->
    <ChatGroupDrawer v-model="chatDrawerVisible" :team="currentTeam" @refresh="handleChatGroupRefresh" />
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, markRaw } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { UserFilled, Edit, Delete, CirclePlus, ChatDotRound } from "@element-plus/icons-vue"
import { listTeamsApi, deleteTeamApi, getTeamDetailApi } from "@/api/alert/team"
import { Team } from "@/api/alert/team/types"
import TeamForm from "./form.vue"
import ChatGroupDrawer from "./components/ChatGroupDrawer.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { Drawer } from "@@/components/Dialogs"
import { formatTimestamp } from "@/common/utils/day"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { useUserToolsStore } from "@/pinia/stores/user-tools"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const loading = ref<boolean>(false)
const keyword = ref<string>("")
const userToolsStore = useUserToolsStore()

const chatDrawerVisible = ref<boolean>(false)
const currentTeam = ref<Team | null>(null)

const teamFormRef = ref<InstanceType<typeof TeamForm>>()
const pendingEditData = ref<Team | null>(null)

import type { Column } from "@@/components/DataTable/types"

// 表格列配置
const tableColumns: Column[] = [
  {
    prop: "name",
    label: "团队名称",
    slot: "teamName",
    align: "center"
  },
  {
    prop: "owner",
    label: "管理人员",
    slot: "owner",
    align: "center"
  },
  {
    prop: "members",
    label: "成员数量",
    slot: "memberCount",
    align: "center"
  },
  {
    prop: "ctime",
    label: "创建时间",
    slot: "ctime",
    align: "center"
  }
]

// 表格操作配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: markRaw(Edit), capability: ALERT_CAPABILITIES.Team.Edit },
  { name: "群聊", code: "chat", type: "success", icon: markRaw(ChatDotRound), capability: ALERT_CAPABILITIES.Team.ChatView },
  { name: "删除", code: "delete", type: "danger", icon: markRaw(Delete), capability: ALERT_CAPABILITIES.Team.Delete }
]

const handleRefresh = () => {
  listTeamsData()
}

const handleSearch = () => {
  if (paginationData.currentPage !== 1) {
    paginationData.currentPage = 1
    return
  }
  listTeamsData()
}

// 表格操作处理
const handleOperateEvent = (operateItem: Team, actionName: string) => {
  switch (actionName) {
    case "edit":
      handleUpdate(operateItem)
      break
    case "chat":
      handleChatGroup(operateItem)
      break
    case "delete":
      handleDelete(operateItem)
      break
  }
}

/** 查询团队列表 */
const teamsData = ref<Team[]>([])

const listTeamsData = () => {
  loading.value = true
  return listTeamsApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    keyword: keyword.value.trim() || undefined
  })
    .then(({ data }) => {
      paginationData.total = data.total
      teamsData.value = data.teams
      const usernames = teamsData.value.flatMap((team) => [team.owner, ...(team.members || [])]).filter(Boolean)
      if (usernames.length > 0) {
        userToolsStore.batchResolveUsers([...new Set(usernames)])
      }
    })
    .catch(() => {
      teamsData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

const handlerCreateTeam = () => {
  isEditMode.value = false
  dialogVisible.value = true
}

const handleUpdate = (row: Team) => {
  isEditMode.value = true
  pendingEditData.value = row
  dialogVisible.value = true
}

const handleChatGroup = (row: Team) => {
  currentTeam.value = row
  chatDrawerVisible.value = true
}

const handleChatGroupRefresh = async () => {
  // 使用 detail API 获取最新的团队信息
  if (currentTeam.value) {
    try {
      const { data } = await getTeamDetailApi(currentTeam.value.id)
      currentTeam.value = data
    } catch {
      ElMessage.error("刷新团队详情失败")
    }
  }
}

const handleDelete = async (row: Team) => {
  try {
    await ElMessageBox.confirm(`确定要删除团队 "${row.name}" 吗？删除后不可恢复。`, "删除确认", {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger"
    })

    await deleteTeamApi(row.id)
    ElMessage.success("团队删除成功")
    listTeamsData()
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("团队删除失败，请稍后重试")
    }
  }
}

const handlerSubmitTeam = () => {
  teamFormRef.value?.submitForm()
}

const handleDrawerClose = (done: () => void) => {
  onClosedCreateOrUpdate()
  done()
}

const onClosedCreateOrUpdate = () => {
  teamFormRef.value?.resetForm()
  pendingEditData.value = null
  dialogVisible.value = false
  isEditMode.value = false
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTeamsData, { immediate: true })

// 监听 Drawer 打开，在完全打开后设置表单数据
watch(dialogVisible, async (newVal) => {
  if (newVal && isEditMode.value && pendingEditData.value) {
    // 等待 Drawer 和表单组件完全渲染后再设置表单数据
    await nextTick()
    await nextTick()
    // 等待一小段时间让 Drawer 动画完成
    setTimeout(() => {
      if (teamFormRef.value && pendingEditData.value) {
        teamFormRef.value.setForm(pendingEditData.value)
        pendingEditData.value = null
      }
    }, 150)
  }
})
</script>

<style lang="scss" scoped>
/* 团队名称样式 */
.team-name {
  display: flex;
  align-items: center;
  justify-content: center;

  .team-title {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #1e293b;
    font-weight: 600;
  }
}

/* 管理人员标签样式 */
.owner-tag {
  font-size: 12px;
  font-weight: 500;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 成员数量标签样式 */
.member-tag {
  font-size: 12px;
  font-weight: 500;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 时间文本样式 */
.time-text {
  font-size: 12px;
  color: #6b7280;
}

</style>
