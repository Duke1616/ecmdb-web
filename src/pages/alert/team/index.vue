<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="团队管理"
      subtitle="管理系统团队和成员分配"
      add-button-text="新增团队"
      @add="handlerCreateTeam"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerCreateTeam">
          新增团队
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="teamsData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 管理人员插槽 -->
      <template #owner="{ row }">
        <el-tag type="primary" effect="plain" class="owner-tag">
          {{ row.owner }}
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { UserFilled, Edit, Delete, RefreshRight, CirclePlus } from "@element-plus/icons-vue"
import { listTeamsApi, deleteTeamApi } from "@/api/alert/team"
import { Team } from "@/api/alert/team/types"
// @ts-ignore
import TeamForm from "./form.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import DataTable from "@@/components/DataTable/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
import { formatTimestamp } from "@/common/utils/day"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const isEditMode = ref<boolean>(false)

const teamFormRef = ref<InstanceType<typeof TeamForm>>()

// 表格列配置
const tableColumns = [
  {
    prop: "name",
    label: "团队名称",
    slot: "teamName",
    align: "center" as const
  },
  {
    prop: "owner",
    label: "管理人员",
    slot: "owner",
    align: "center" as const
  },
  {
    prop: "members",
    label: "成员数量",
    slot: "memberCount",
    align: "center" as const
  },
  {
    prop: "ctime",
    label: "创建时间",
    slot: "ctime",
    align: "center" as const
  }
]

// 表格操作配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit },
  { name: "删除", code: "delete", type: "danger", icon: Delete }
]

const handleRefresh = () => {
  listTeamsData()
}

// 表格操作处理
const handleOperateEvent = (operateItem: Team, actionName: string) => {
  switch (actionName) {
    case "edit":
      handleUpdate(operateItem)
      break
    case "delete":
      handleDelete(operateItem)
      break
  }
}

// 选择变化处理
const handleSelectionChange = (selection: Team[]) => {
  console.log("选中的团队:", selection)
}

/** 查询团队列表 */
const teamsData = ref<Team[]>([])

const listTeamsData = () => {
  listTeamsApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      teamsData.value = data.teams
    })
    .catch(() => {
      teamsData.value = []
    })
    .finally(() => {})
}

const handlerCreateTeam = () => {
  isEditMode.value = false
  dialogVisible.value = true
}

const handleUpdate = (row: Team) => {
  isEditMode.value = true
  dialogVisible.value = true
  teamFormRef.value?.setForm(row)
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
      ElMessage.error("团队删除失败")
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
  dialogVisible.value = false
  isEditMode.value = false
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTeamsData, { immediate: true })
</script>

<style lang="scss" scoped>
/* 团队名称样式 */
.team-name {
  display: flex;
  align-items: center;
  gap: 8px;

  .team-icon {
    color: #3b82f6;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .team-manager {
    padding: 16px;
  }

  .manager-header {
    padding: 16px 20px;
    margin-bottom: 16px;

    .header-left {
      .manager-title {
        font-size: 16px;
      }

      .manager-subtitle {
        font-size: 12px;
      }
    }

    .header-right {
      gap: 8px;

      .action-btn {
        height: 32px;
        font-size: 12px;
        padding: 0 12px;
      }

      .refresh-btn {
        width: 32px;
        height: 32px;
      }
    }
  }
}
</style>
