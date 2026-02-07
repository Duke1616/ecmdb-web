<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="工作空间"
      subtitle="管理团队工作空间和项目"
      add-button-text="创建工作空间"
      @add="handlerCreateWorkspace"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handlerCreateWorkspace">
          创建工作空间
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 - 左右布局 -->
    <div class="collaboration-container">
      <!-- 左侧：团队列表 -->
      <div class="left-panel">
        <div class="panel-header">
          <h4 class="panel-title">团队列表</h4>
          <span class="team-count">{{ teams.length }} 个团队</span>
        </div>

        <div class="team-list" v-loading="teamsLoading">
          <!-- 我的团队选项 -->
          <div
            class="team-card my-team-card"
            :class="{ active: selectedTeam?.name === '我的团队' }"
            @click="selectMyTeam"
          >
            <div class="team-info">
              <div class="team-avatar my-team-avatar">
                <el-icon><User /></el-icon>
              </div>
              <div class="team-details">
                <div class="team-name">我的团队</div>
                <div class="team-members">个人工作空间</div>
              </div>
            </div>
            <el-icon class="team-arrow"><ArrowRight /></el-icon>
          </div>

          <div
            v-for="team in teams"
            :key="team.id"
            class="team-card"
            :class="{ active: selectedTeam?.id === team.id }"
            @click="selectTeam(team)"
          >
            <div class="team-info">
              <div class="team-avatar" :style="{ background: generateTeamColor(team.name) }">
                {{ team.name.charAt(0) }}
              </div>
              <div class="team-details">
                <div class="team-name">{{ team.name }}</div>
                <div class="team-members">{{ team.members.length }} 人</div>
              </div>
            </div>
            <div class="team-arrow" v-if="selectedTeam?.id === team.id">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>

          <div v-if="teams.length === 0 && !teamsLoading" class="empty-state">
            <el-empty description="暂无团队数据" :image-size="80" />
          </div>
        </div>
      </div>

      <!-- 分隔符 -->
      <div class="divider" />

      <!-- 右侧：协作空间列表 -->
      <div class="right-panel">
        <div class="panel-header">
          <h4 class="panel-title">
            {{ selectedTeam ? `${selectedTeam.name} 的工作空间` : "请选择团队" }}
          </h4>
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
              @click="handleWorkspaceClick(workspace)"
            >
              <div class="space-header">
                <div class="space-icon" :style="{ background: generateWorkspaceColor(workspace.name) }">
                  {{ workspace.name.charAt(0) }}
                </div>
                <div class="space-badge">{{ workspace.is_public ? "公开" : "私有" }}</div>
              </div>

              <div class="space-body">
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

              <div class="space-footer">
                <span class="action-text">进入工作空间</span>
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
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { Plus, RefreshRight, ArrowRight, FolderAdd, User, Document, UserFilled as Team } from "@element-plus/icons-vue"
import { listTeamsApi } from "@/api/alert/team"
import { Team as TeamType } from "@/api/alert/team/types"
import { listWorkspacesByTeamApi, listMyTeamsApi } from "@/api/alert/workspace"
import { Workspace } from "@/api/alert/workspace/types"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import { Drawer } from "@@/components/Dialogs"
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

const spaceFormRef = ref<InstanceType<typeof SpaceForm>>()

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
  console.log("进入工作空间:", workspace)
  // 跳转到工作空间详情页面
  router.push(`/alert/workspace/${workspace.id}`)
}

// 创建工作空间
const handlerCreateWorkspace = () => {
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
.collaboration-container {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 500px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.left-panel {
  width: 240px;
  min-width: 240px;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.divider {
  width: 1px;
  background: #e5e7eb;
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .team-count,
  .space-count {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
}

.team-list,
.spaces-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
}

.team-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #ffffff;

  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  .team-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .team-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #ffffff;
    font-weight: 600;
    font-size: 16px;
  }

  .team-details {
    flex: 1;
    min-width: 0;

    .team-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .team-members {
      font-size: 12px;
      color: #6b7280;
    }
  }

  .team-arrow {
    color: #3b82f6;
    font-size: 16px;
  }
}

.spaces-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.space-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 200px;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  .space-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .space-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    color: #ffffff;
    font-weight: 600;
    font-size: 16px;
  }

  .space-badge {
    background: #dbeafe;
    color: #1d4ed8;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .space-body {
    flex: 1;
    margin-bottom: 12px;

    .space-name {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 8px 0;
      line-height: 1.4;
    }

    .space-description {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .space-stats {
      display: flex;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #6b7280;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 4px;
    }
  }

  .space-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #f1f5f9;

    .action-text {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
    }

    .space-arrow {
      color: #94a3b8;
      font-size: 16px;
    }
  }
}

.my-team-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;

  &:hover {
    background: #f1f5f9;
    border-color: #3b82f6;
  }

  &.active {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .team-name {
    color: #1e293b;
    font-weight: 500;
  }

  .team-members {
    color: #64748b;
  }

  .team-arrow {
    color: #3b82f6;
  }
}

.my-team-avatar {
  background: #3b82f6 !important;
  color: #ffffff !important;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
  text-align: center;

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

/* 自定义滚动条 */
.team-list::-webkit-scrollbar,
.spaces-container::-webkit-scrollbar {
  width: 6px;
}

.team-list::-webkit-scrollbar-track,
.spaces-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.team-list::-webkit-scrollbar-thumb,
.spaces-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;

  &:hover {
    background: #94a3b8;
  }
}
</style>
