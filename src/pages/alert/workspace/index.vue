<template>
  <ProGovernanceLayout
    title="工作空间"
    subtitle="管理团队工作空间和项目"
    :primary-action="{ capability: ALERT_CAPABILITIES.Workspace.Add, label: '创建工作空间', icon: FolderAdd }"
    @primary-action="handlerCreateWorkspace"
    @refresh="handleRefresh"
  >
    <!-- 主内容区域 - 左右布局 -->
    <div class="collaboration-container">
      <!-- 左侧：团队列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <h2 class="panel-title">团队列表</h2>
          <span class="total-count">{{ teams.length }} 个团队</span>
        </div>

        <div class="team-list-container" v-loading="teamsLoading">
          <div class="team-list">
            <!-- 我的团队选项 -->
            <div
              class="team-card my-team-card"
              :class="{ active: selectedTeam?.name === '我的团队' }"
              @click="selectMyTeam"
            >
              <div class="team-icon my-team-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="team-info">
                <span class="team-name">我的团队</span>
              </div>
            </div>

            <div
              v-for="team in teams"
              :key="team.id"
              class="team-card"
              :class="{ active: selectedTeam?.id === team.id }"
              @click="selectTeam(team)"
            >
              <div class="team-icon" :style="{ color: generateTeamColor(team.name) }">
                {{ team.name.charAt(0) }}
              </div>
              <div class="team-info">
                <span class="team-name">{{ team.name }}</span>
              </div>
              <button
                v-if="canViewTeamDetail"
                type="button"
                class="team-detail-action"
                @click.stop="handleViewTeamDetail(team)"
              >
                详情
              </button>
            </div>

            <div v-if="teams.length === 0 && !teamsLoading" class="empty-state">
              <el-empty description="暂无团队数据" :image-size="80" />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：协作空间列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">
              {{ selectedTeam ? `${selectedTeam.name} 的工作空间` : "请选择团队" }}
            </h3>
            <p class="panel-subtitle">选择工作空间进入告警协作与配置</p>
          </div>
          <span class="space-count">{{ workspaces.length }} 个工作空间</span>
        </div>

        <div class="spaces-container" v-loading="workspacesLoading">
          <div v-if="!selectedTeam" class="empty-state">
            <el-icon class="empty-icon"><Team /></el-icon>
            <p class="empty-text">请先选择一个团队</p>
            <p class="empty-hint">选择左侧团队查看其工作空间</p>
          </div>

          <div v-else-if="workspaces.length === 0" class="empty-state">
            <el-icon class="empty-icon"><FolderAdd /></el-icon>
            <p class="empty-text">该团队暂无工作空间</p>
            <p class="empty-hint">点击上方按钮创建新的工作空间</p>
          </div>

          <div v-else class="spaces-grid">
            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              class="space-card"
              :class="{ disabled: !canViewWorkspaceDetail }"
              @click="handleWorkspaceClick(workspace)"
            >
              <div class="space-card-header">
                <div class="space-icon-wrapper">
                  <span class="space-icon" :style="{ color: generateWorkspaceColor(workspace.name) }">
                    {{ workspace.name.charAt(0) }}
                  </span>
                </div>
                <div class="space-badge" :class="workspace.is_public ? 'is-public' : 'is-private'">
                  {{ workspace.is_public ? "公开" : "私有" }}
                </div>
              </div>

              <div class="space-card-body">
                <h4 class="space-name">{{ workspace.name }}</h4>
                <p class="space-description">{{ workspace.enabled ? "已启用" : "已禁用" }}</p>
                <div class="space-stats">
                  <span class="stat-item">
                    <el-icon><User /></el-icon>
                    {{ workspace.allow_invite ? "允许邀请" : "仅管理员" }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Document /></el-icon>
                    工作空间
                  </span>
                </div>
              </div>

              <div class="space-card-footer">
                <span class="action-text">{{ canViewWorkspaceDetail ? "进入工作空间" : "暂无详情权限" }}</span>
                <div class="space-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建工作空间抽屉 -->
    <Drawer
      v-model="dialogVisible"
      title="创建工作空间"
      subtitle="为团队创建新的工作空间"
      :header-icon="FolderAdd"
      size="700px"
      direction="rtl"
      class="workspace-create-drawer"
      :before-close="handleDrawerClose"
      @closed="onClosedCreateWorkspace"
      @confirm="handlerSubmitWorkspace"
    >
      <SpaceForm
        ref="spaceFormRef"
        :selected-team-id="selectedTeam?.name === '我的团队' ? undefined : selectedTeam?.id"
        @closed="onClosedCreateWorkspace"
        @callback="loadWorkspacesData"
      />
    </Drawer>

    <!-- 团队详情弹窗 -->
    <FormDialog
      v-model="teamDetailVisible"
      :title="currentDetailTeam?.name || '团队详情'"
      subtitle="查看团队基础信息"
      width="760px"
      :header-icon="Team"
      :show-footer="false"
      @closed="currentDetailTeam = null"
    >
      <div v-if="currentDetailTeam" class="team-detail">
        <aside class="team-detail-aside">
          <div class="team-detail-summary">
            <div class="team-detail-icon" :style="{ color: generateTeamColor(currentDetailTeam.name) }">
              {{ currentDetailTeam.name.charAt(0) }}
            </div>
            <div class="team-detail-title">
              <h3>{{ currentDetailTeam.name }}</h3>
              <div class="team-owner">
                <el-icon><User /></el-icon>
                <span>负责人</span>
                <strong>{{ getUserDisplayName(ownerUser, currentDetailTeam.owner) }}</strong>
                <small v-if="getUserUsername(ownerUser, currentDetailTeam.owner)">
                  @{{ getUserUsername(ownerUser, currentDetailTeam.owner) }}
                </small>
              </div>
            </div>
          </div>

          <div class="team-detail-stats">
            <div class="team-stat">
              <strong>{{ currentDetailTeam.members.length }}</strong>
              <span>团队成员</span>
            </div>
            <div class="team-stat">
              <strong>{{ currentDetailTeam.chat_groups?.length || 0 }}</strong>
              <span>通知群组</span>
            </div>
          </div>
        </aside>

        <section class="team-member-section">
          <div class="team-member-header">
            <span>成员列表</span>
            <small>{{ currentDetailTeam.members.length }} 人</small>
          </div>
          <div v-if="currentDetailTeam.members.length" v-loading="teamDetailLoading" class="team-member-list">
            <div v-for="member in detailMemberUsers" :key="member.username" class="team-member-card">
              <div class="member-avatar">{{ getUserInitial(member) }}</div>
              <div class="member-info">
                <strong>{{ getUserDisplayName(member, member.username) }}</strong>
                <span>@{{ getUserUsername(member, member.username) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无成员" :image-size="80" />
        </section>
      </div>
    </FormDialog>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import { useRouter } from "vue-router"
import { ArrowRight, FolderAdd, User, Document, UserFilled as Team } from "@element-plus/icons-vue"
import { listTeamsApi } from "@/api/alert/team"
import { Team as TeamType } from "@/api/alert/team/types"
import { listWorkspacesByTeamApi, listMyTeamsApi } from "@/api/alert/workspace"
import { Workspace } from "@/api/alert/workspace/types"
import { Drawer, FormDialog } from "@@/components/Dialogs"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { usePermission } from "@/common/composables/usePermission"
import { useUsers } from "@/common/composables/useUsers"
import type { IMemberUser } from "@/common/composables/useUsers"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
// @ts-ignore
import SpaceForm from "./form.vue"

// 路由
const router = useRouter()

// 响应式数据
const teams = ref<TeamType[]>([])
const workspaces = ref<Workspace[]>([])
const selectedTeam = ref<TeamType | null>(null)
const teamsLoading = ref(false)
const workspacesLoading = ref(false)
const dialogVisible = ref(false)
const teamDetailVisible = ref(false)
const currentDetailTeam = ref<TeamType | null>(null)
const teamDetailLoading = ref(false)

const spaceFormRef = ref<InstanceType<typeof SpaceForm>>()
const { hasPermission } = usePermission()
const { selectedUsers: detailUsers, loadSelectedUsers: loadTeamDetailUsers } = useUsers()
const canViewWorkspaceDetail = computed(() => hasPermission(ALERT_CAPABILITIES.Workspace.Detail))
const canViewTeamDetail = computed(() => hasPermission(ALERT_CAPABILITIES.Team.Detail))

type ResolvedTeamUser = Pick<IMemberUser, "username" | "nickname" | "avatar" | "email" | "job_title">

const detailUserMap = computed(() => new Map(detailUsers.value.map((user) => [user.username, user])))
const ownerUser = computed(() => {
  const owner = currentDetailTeam.value?.owner
  return owner ? detailUserMap.value.get(owner) : undefined
})
const detailMemberUsers = computed<ResolvedTeamUser[]>(() => {
  return (currentDetailTeam.value?.members || []).map((username) => {
    return (
      detailUserMap.value.get(username) || {
        username,
        nickname: username,
        avatar: "",
        email: "",
        job_title: ""
      }
    )
  })
})

// 生成团队头像颜色
const generateTeamColor = (name: string) => {
  const colors = [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#f5576c",
    "#4facfe",
    "#00f2fe",
    "#43e97b",
    "#38f9d7",
    "#fa709a",
    "#fee140",
    "#a8edea",
    "#fed6e3"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 生成工作空间头像颜色
const generateWorkspaceColor = (name: string) => {
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#6366f1",
    "#ec4899",
    "#14b8a6",
    "#84cc16",
    "#f97316",
    "#ef4444"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 选择我的团队
const selectMyTeam = () => {
  selectedTeam.value = { id: "my-team", name: "我的团队" } as any
  loadWorkspacesData()
}

// 选择团队
const selectTeam = (team: TeamType) => {
  selectedTeam.value = team
  loadWorkspacesData()
}

// 查看团队详情
const handleViewTeamDetail = async (team: TeamType) => {
  if (!canViewTeamDetail.value) {
    ElMessage.warning("暂无团队详情权限")
    return
  }

  currentDetailTeam.value = team
  teamDetailVisible.value = true

  const usernames = Array.from(new Set([team.owner, ...team.members].filter(Boolean)))
  teamDetailLoading.value = true
  try {
    await loadTeamDetailUsers(usernames)
  } finally {
    teamDetailLoading.value = false
  }
}

const getUserDisplayName = (user?: ResolvedTeamUser, fallback = "") => {
  return user?.nickname || user?.username || fallback || "未设置"
}

const getUserUsername = (user?: ResolvedTeamUser, fallback = "") => {
  return user?.username || fallback || ""
}

const getUserInitial = (user: ResolvedTeamUser) => {
  return getUserDisplayName(user, user.username).charAt(0).toUpperCase()
}

// 加载团队数据
const loadTeamsData = async () => {
  teamsLoading.value = true
  try {
    const { data } = await listTeamsApi({
      offset: 0,
      limit: 100
    })
    teams.value = data.teams || []
  } catch (error) {
    console.error("加载团队数据失败:", error)
    teams.value = []
  } finally {
    teamsLoading.value = false
  }
}

// 加载工作空间数据
const loadWorkspacesData = async () => {
  if (!selectedTeam.value) {
    workspaces.value = []
    return
  }

  workspacesLoading.value = true
  try {
    let response
    if (selectedTeam.value.name === "我的团队") {
      // 如果是"我的团队"，调用我的团队接口
      response = await listMyTeamsApi()
    } else {
      // 如果是具体团队,调用根据团队ID获取的接口
      response = await listWorkspacesByTeamApi(selectedTeam.value.id)
    }
    workspaces.value = response.data.workspaces || []
  } catch (error) {
    console.error("加载工作空间数据失败:", error)
    workspaces.value = []
  } finally {
    workspacesLoading.value = false
  }
}

// 处理工作空间点击
const handleWorkspaceClick = (workspace: Workspace) => {
  if (!canViewWorkspaceDetail.value) {
    ElMessage.warning("暂无工作空间详情权限")
    return
  }

  console.log("进入工作空间:", workspace)
  router.push({
    name: "AlertWorkspaceDetail",
    params: { id: workspace.id },
    query: { id: String(workspace.id) }
  })
}

// 创建工作空间
const handlerCreateWorkspace = () => {
  if (!hasPermission(ALERT_CAPABILITIES.Workspace.Add)) {
    ElMessage.warning("暂无创建工作空间权限")
    return
  }

  if (!selectedTeam.value) {
    ElMessage.warning("请先选择一个团队")
    return
  }
  dialogVisible.value = true
}

// 刷新数据
const handleRefresh = () => {
  loadTeamsData()
  if (selectedTeam.value) {
    loadWorkspacesData()
  }
}

// 提交工作空间表单
const handlerSubmitWorkspace = () => {
  spaceFormRef.value?.submitForm()
}

// 关闭抽屉
const handleDrawerClose = (done: () => void) => {
  onClosedCreateWorkspace()
  done()
}

const onClosedCreateWorkspace = () => {
  spaceFormRef.value?.resetForm()
  dialogVisible.value = false
}

// 组件挂载时加载数据
onMounted(() => {
  loadTeamsData()
  // 默认选中"我的团队"
  selectMyTeam()
})
</script>

<style lang="scss" scoped>
:deep(.pro-gov-content) {
  display: flex;
  flex: 1;
  min-height: 0;
}

:deep(.manager-header) {
  align-items: center;
  gap: clamp(16px, 1.4vw, 24px);
  padding: clamp(16px, 1.4vw, 22px) clamp(18px, 1.6vw, 24px);
}

:deep(.header-left) {
  flex: 0 0 auto;
  min-width: clamp(260px, 22vw, 330px);
}

:deep(.header-right) {
  flex: 1;
  min-width: 0;
}

:deep(.eiam-governance-bar) {
  width: 100%;
  justify-content: flex-end;
  gap: clamp(12px, 1.2vw, 20px);
}

:deep(.workspace-create-drawer .drawer-header .header-left) {
  flex: 1 1 auto;
  min-width: 0;
}

:deep(.workspace-create-drawer .drawer-header .header-right) {
  flex: 0 0 auto;
  min-width: auto;
  margin-left: auto;
  justify-content: flex-end;
}

:deep(.action-group) {
  flex-shrink: 0;
  gap: 10px;
}

.collaboration-container {
  display: flex;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 clamp(232px, 14vw, 268px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 0 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    color: #1e293b;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }

  .space-count {
    font-size: 12px;
    color: #64748b;
    font-weight: 700;
  }
}

.panel-subtitle {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.3;
}

.team-list-container,
.spaces-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.team-list-container {
  padding: 10px;
}

.team-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spaces-container {
  padding: 16px 24px 24px;
}

.team-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }

  &.active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.12);

    .team-name {
      color: #0f172a;
      font-weight: 700;
    }

    .team-icon {
      background: #dbeafe;
      color: #1d4ed8 !important;
    }
  }
}

.team-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #f1f5f9;
  border-radius: 8px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.my-team-icon {
  background: #ecfdf5 !important;
  color: #059669 !important;
}

.team-info {
  display: flex;
  flex: 1;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.team-name {
  overflow: hidden;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-detail-action {
  flex-shrink: 0;
  height: 22px;
  padding: 0 8px;
  color: #64748b;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  transition: all 0.2s ease;

  &:hover {
    color: #2563eb;
    background: #eff6ff;
    border-color: #bfdbfe;
  }
}

.total-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 10px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.space-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 166px;
  min-width: 0;

  &:hover {
    transform: translateY(-1px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);

    .space-icon {
      transform: scale(1.05);
      color: #3b82f6 !important;
    }

    .space-arrow {
      transform: translateX(calc(0.2rem + 0.1vw));
    }

    .action-text {
      color: #3b82f6;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.72;

    &:hover {
      border-color: #e2e8f0;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transform: none;
    }

    .space-icon,
    .space-arrow,
    .action-text {
      color: #94a3b8 !important;
      transform: none;
    }
  }
}

.space-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin-bottom: 18px;
}

.space-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.space-icon {
  font-size: 17px;
  font-weight: 800;
  transition: all 0.2s ease;
}

.space-badge {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;

  &.is-public {
    color: #2563eb;
    background: #eff6ff;
  }

  &.is-private {
    color: #4f46e5;
    background: #eef2ff;
  }
}

.space-card-body {
  flex: 1;
  min-width: 0;
  margin-bottom: 18px;
}

.space-name {
  margin: 0 0 8px;
  overflow: hidden;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.space-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 4px 8px;
  overflow: hidden;
  color: #64748b;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.action-text {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.space-arrow {
  flex-shrink: 0;
  color: #94a3b8;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 14px;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
  text-align: center;
  min-height: 280px;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 16px;
    font-weight: 500;
    margin: 0 0 8px 0;
  }

  .empty-hint {
    font-size: 14px;
    margin: 0;
    opacity: 0.7;
  }
}

.team-detail {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 18px;
  padding: 18px 2px 2px;
}

.team-detail-aside {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.team-detail-summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 180px;
  padding: 18px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.team-detail-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 20px;
  font-weight: 800;
}

.team-detail-title {
  min-width: 0;

  h3 {
    margin: 0 0 8px;
    overflow: hidden;
    color: #1e293b;
    font-size: 17px;
    font-weight: 800;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.team-owner {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;

  strong {
    color: #334155;
    font-size: 13px;
  }

  small {
    color: #94a3b8;
    font-size: 12px;
  }
}

.team-detail-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.team-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  strong {
    order: 2;
    color: #1e293b;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
  }

  span {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }
}

.team-member-section {
  min-width: 0;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.team-member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 12px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  font-weight: 800;

  small {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
  }
}

.team-member-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  max-height: 340px;
  padding-right: 2px;
  overflow-y: auto;
}

.team-member-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }
}

.member-avatar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
}

.member-info {
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
    line-height: 1.35;
  }

  span {
    color: #94a3b8;
    font-size: 12px;
    line-height: 1.35;
  }
}

.team-member-list::-webkit-scrollbar {
  width: 6px;
}

.team-member-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.team-member-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;

  &:hover {
    background: #94a3b8;
  }
}

@media (max-width: 1100px) {
  :deep(.manager-header) {
    align-items: stretch;
    flex-direction: column;
  }

  :deep(.header-left) {
    min-width: 0;
  }

  :deep(.eiam-governance-bar) {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .collaboration-container {
    flex-direction: column;
    overflow-y: auto;
  }

  .left-panel {
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .team-list-container {
    overflow-x: auto;
    padding: 10px;
  }

  .team-list {
    flex-direction: row;
  }

  .team-card {
    min-width: 164px;
  }

  .spaces-container {
    overflow-y: visible;
    padding: 16px;
  }

  .team-detail {
    grid-template-columns: 1fr;
  }

  .team-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .spaces-grid {
    grid-template-columns: 1fr;
  }

  .team-member-list {
    grid-template-columns: 1fr;
  }

  .team-detail-stats {
    grid-template-columns: 1fr;
  }
}

/* 自定义滚动条 */
.team-list-container::-webkit-scrollbar,
.spaces-container::-webkit-scrollbar {
  width: 6px;
}

.team-list-container::-webkit-scrollbar-track,
.spaces-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.team-list-container::-webkit-scrollbar-thumb,
.spaces-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;

  &:hover {
    background: #94a3b8;
  }
}
</style>
