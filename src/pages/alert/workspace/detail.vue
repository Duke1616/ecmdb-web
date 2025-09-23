<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="workspace?.name || '工作空间'"
      :subtitle="
        workspace
          ? `${teamName} · ${workspace.enabled ? '已启用' : '已禁用'} · ${workspace.is_public ? '公开' : '私有'}`
          : '加载中...'
      "
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="true"
      @back="goBack"
      @refresh="handleRefresh"
    >
      <template #actions>
        <!-- 工作空间状态信息 -->
        <div class="workspace-status">
          <div class="status-item">
            <el-icon class="status-icon" :class="{ active: workspace?.enabled }">
              <CircleCheckFilled v-if="workspace?.enabled" />
              <CircleCloseFilled v-else />
            </el-icon>
            <span class="status-text">{{ workspace?.enabled ? "运行中" : "已停用" }}</span>
          </div>

          <div class="status-item">
            <el-icon class="status-icon" :class="{ public: workspace?.is_public }">
              <Unlock v-if="workspace?.is_public" />
              <Lock v-else />
            </el-icon>
            <span class="status-text">{{ workspace?.is_public ? "公开空间" : "私有空间" }}</span>
          </div>

          <div class="status-item">
            <el-icon class="status-icon">
              <User />
            </el-icon>
            <span class="status-text">{{ teamName || "未知团队" }}</span>
          </div>

          <div class="status-item">
            <el-icon class="status-icon">
              <Clock />
            </el-icon>
            <span class="status-text">{{ formatLastUpdate() }}</span>
          </div>
        </div>

        <!-- 快速操作按钮 -->
        <div class="quick-actions">
          <el-tooltip content="告警管理" placement="bottom">
            <el-button :icon="Warning" circle @click="handleAlerts" />
          </el-tooltip>
          <el-tooltip content="告警规则" placement="bottom">
            <el-button :icon="Setting" circle @click="handleRules" />
          </el-tooltip>
          <el-tooltip content="降噪配置" placement="bottom">
            <el-button :icon="Filter" circle @click="handleNoise" />
          </el-tooltip>
          <el-tooltip content="团队成员" placement="bottom">
            <el-button :icon="User" circle @click="handleMembers" />
          </el-tooltip>
          <el-tooltip content="新建告警" placement="bottom">
            <el-button type="primary" :icon="Plus" circle @click="handleCreateAlert" />
          </el-tooltip>
        </div>
      </template>
    </ManagerHeader>

    <!-- 主要内容区域 -->
    <div class="workspace-content">
      <!-- 侧边栏 -->
      <div class="workspace-sidebar">
        <el-menu :default-active="activeMenu" class="workspace-menu" @select="handleMenuSelect">
          <el-menu-item index="overview">
            <el-icon><DataBoard /></el-icon>
            <span>工作台</span>
          </el-menu-item>
          <el-menu-item index="alerts">
            <el-icon><Warning /></el-icon>
            <span>告警管理</span>
          </el-menu-item>
          <el-menu-item index="rules">
            <el-icon><Setting /></el-icon>
            <span>告警规则</span>
          </el-menu-item>
          <el-menu-item index="noise">
            <el-icon><Filter /></el-icon>
            <span>降噪配置</span>
          </el-menu-item>
          <el-menu-item index="members">
            <el-icon><User /></el-icon>
            <span>团队成员</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon>
            <span>空间设置</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- 主内容区 -->
      <div class="workspace-main">
        <!-- 概览页面 -->
        <div v-if="activeMenu === 'overview'" class="overview-page">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon alerts">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ alertStats.total }}</div>
                <div class="stat-label">总告警数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon critical">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ alertStats.critical }}</div>
                <div class="stat-label">严重告警</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon rules">
                <el-icon><Setting /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ alertStats.rules }}</div>
                <div class="stat-label">告警规则</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon noise-rules">
                <el-icon><Filter /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ alertStats.noiseRules }}</div>
                <div class="stat-label">降噪规则</div>
              </div>
            </div>
          </div>

          <div class="recent-activity">
            <h3>最近活动</h3>
            <div class="activity-list">
              <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                <div class="activity-icon" :class="activity.type">
                  <el-icon><component :is="activity.icon" /></el-icon>
                </div>
                <div class="activity-content">
                  <div class="activity-text">{{ activity.text }}</div>
                  <div class="activity-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 告警管理页面 -->
        <div v-else-if="activeMenu === 'alerts'" class="alerts-page">
          <AlertManager :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 告警规则页面 -->
        <div v-else-if="activeMenu === 'rules'" class="rules-page">
          <AlertRules :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 降噪配置页面 -->
        <div v-else-if="activeMenu === 'noise'" class="noise-page-container">
          <NoiseConfig :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 项目页面 -->
        <div v-else-if="activeMenu === 'projects'" class="projects-page">
          <div class="projects-header">
            <h3>项目列表</h3>
            <el-button type="primary" :icon="Plus" @click="handleCreateProject"> 新建项目 </el-button>
          </div>
          <div class="projects-grid">
            <div v-for="project in projects" :key="project.id" class="project-card">
              <div class="project-header">
                <div class="project-icon" :style="{ background: generateProjectColor(project.name) }">
                  {{ project.name.charAt(0) }}
                </div>
                <div class="project-actions">
                  <el-dropdown>
                    <el-button type="text" :icon="MoreFilled" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="handleEditProject(project)">编辑</el-dropdown-item>
                        <el-dropdown-item @click="handleDeleteProject(project)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
              <div class="project-body">
                <h4 class="project-name">{{ project.name }}</h4>
                <p class="project-description">{{ project.description }}</p>
                <div class="project-meta">
                  <span class="project-status" :class="project.status">
                    {{ project.statusText }}
                  </span>
                  <span class="project-members">{{ project.memberCount }} 人</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 成员页面 -->
        <div v-else-if="activeMenu === 'members'" class="members-page">
          <div class="members-header">
            <h3>成员管理</h3>
            <el-button type="primary" :icon="Plus" @click="handleInviteMember"> 邀请成员 </el-button>
          </div>
          <div class="members-list">
            <div v-for="member in members" :key="member.id" class="member-card">
              <div class="member-avatar">
                <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                <div v-else class="member-avatar-placeholder">
                  {{ member.name.charAt(0) }}
                </div>
              </div>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-role">{{ member.role }}</div>
                <div class="member-email">{{ member.email }}</div>
              </div>
              <div class="member-actions">
                <el-button type="text" @click="handleEditMember(member)">编辑</el-button>
                <el-button type="text" @click="handleRemoveMember(member)">移除</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 设置页面 -->
        <div v-else-if="activeMenu === 'settings'" class="settings-page">
          <WorkspaceSettings :workspace-id="workspace?.id || 0" @refresh="handleSettingsRefresh" />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import {
  Setting,
  User,
  Plus,
  DataBoard,
  MoreFilled,
  Warning,
  WarningFilled,
  Filter,
  CircleCheckFilled,
  CircleCloseFilled,
  Unlock,
  Lock,
  Clock
} from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { Workspace } from "@/api/workspace/types"
import { getWorkspaceDetailApi } from "@/api/workspace"
import NoiseConfig from "./components/NoiseConfig/index.vue"
import AlertRules from "./components/AlertRules/index.vue"
import AlertManager from "./components/AlertManager/index.vue"
import WorkspaceSettings from "./components/WorkspaceSettings/index.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const workspace = ref<Workspace | null>(null)
const activeMenu = ref("overview")
const teamName = ref("")

// 格式化最后更新时间
const formatLastUpdate = () => {
  if (!workspace.value?.utime) {
    return "未知时间"
  }
  
  const updateTime = new Date(workspace.value.utime)
  const now = new Date()
  const diff = now.getTime() - updateTime.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return updateTime.toLocaleDateString()
  }
}

// 统计数据
const alertStats = ref({
  total: 156,
  critical: 8,
  rules: 24,
  noiseRules: 12
})

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: "alert",
    icon: "Warning",
    text: "CPU使用率超过80%的告警触发",
    time: "5分钟前"
  },
  {
    id: 2,
    type: "rule",
    icon: "Setting",
    text: "新增了内存使用率告警规则",
    time: "1小时前"
  },
  {
    id: 3,
    type: "noise",
    icon: "Filter",
    text: "配置了新的降噪规则",
    time: "3小时前"
  },
  {
    id: 4,
    type: "member",
    icon: "User",
    text: "李四加入了告警工作空间",
    time: "1天前"
  }
])

// 项目列表
const projects = ref([
  {
    id: 1,
    name: "用户管理系统",
    description: "企业级用户权限管理系统",
    status: "active",
    statusText: "进行中",
    memberCount: 5
  },
  {
    id: 2,
    name: "数据分析平台",
    description: "实时数据分析和可视化平台",
    status: "active",
    statusText: "进行中",
    memberCount: 8
  },
  {
    id: 3,
    name: "移动端应用",
    description: "跨平台移动应用开发",
    status: "completed",
    statusText: "已完成",
    memberCount: 3
  }
])

// 成员列表
const members = ref([
  {
    id: 1,
    name: "张三",
    role: "管理员",
    email: "zhangsan@example.com",
    avatar: ""
  },
  {
    id: 2,
    name: "李四",
    role: "开发者",
    email: "lisi@example.com",
    avatar: ""
  },
  {
    id: 3,
    name: "王五",
    role: "设计师",
    email: "wangwu@example.com",
    avatar: ""
  }
])

// 生成项目头像颜色
const generateProjectColor = (name: string) => {
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

// 返回上一页
const goBack = () => {
  router.back()
}

// 刷新数据
const handleRefresh = () => {
  loadWorkspaceData()
  ElMessage.success("数据已刷新")
}

// 处理设置页面刷新
const handleSettingsRefresh = () => {
  loadWorkspaceData()
}

// 菜单选择
const handleMenuSelect = (key: string) => {
  activeMenu.value = key
}

const handleMembers = () => {
  activeMenu.value = "members"
}

const handleAlerts = () => {
  activeMenu.value = "alerts"
}

const handleRules = () => {
  activeMenu.value = "rules"
}

const handleNoise = () => {
  activeMenu.value = "noise"
}

const handleCreateAlert = () => {
  ElMessage.info("创建告警功能待实现")
}

const handleCreateProject = () => {
  ElMessage.info("创建项目功能待实现")
}

const handleEditProject = (project: any) => {
  ElMessage.info(`编辑项目: ${project.name}`)
}

const handleDeleteProject = (project: any) => {
  ElMessage.info(`删除项目: ${project.name}`)
}

const handleInviteMember = () => {
  ElMessage.info("邀请成员功能待实现")
}

const handleEditMember = (member: any) => {
  ElMessage.info(`编辑成员: ${member.name}`)
}

const handleRemoveMember = (member: any) => {
  ElMessage.info(`移除成员: ${member.name}`)
}


// 加载工作空间数据
const loadWorkspaceData = async () => {
  const workspaceId = route.params.id
  if (!workspaceId) {
    ElMessage.error("工作空间ID不存在")
    router.back()
    return
  }

  try {
    // 调用API获取工作空间详情
    const response = await getWorkspaceDetailApi(Number(workspaceId))
    workspace.value = response.data

    // 更新团队名称
    teamName.value = workspace.value?.team?.name || "未知团队"
  } catch (error) {
    console.error("加载工作空间数据失败:", error)
    ElMessage.error("加载工作空间数据失败")
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadWorkspaceData()
})
</script>

<style lang="scss" scoped>
// 工作空间状态样式
.workspace-status {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-right: 16px;

  .status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .status-icon {
      font-size: 14px;
      color: #6b7280;

      &.active {
        color: #10b981;
      }

      &.public {
        color: #3b82f6;
      }
    }

    .status-text {
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }
  }
}

// 快速操作按钮样式
.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  .el-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #d1d5db;
    background: #ffffff;
    transition: all 0.2s ease;

    &:hover {
      border-color: #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
    }

    &.el-button--primary {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #ffffff;

      &:hover {
        background: #1d4ed8;
        border-color: #1d4ed8;
      }
    }
  }
}

.workspace-content {
  display: flex;

  .back-btn {
    color: #6b7280;
    font-size: 14px;
  }

  .workspace-info {
    display: flex;
    align-items: center;
    gap: 16px;

    .workspace-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      color: #ffffff;
      font-weight: 600;
      font-size: 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .workspace-details {
      .workspace-name {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
      }

      .workspace-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: #6b7280;

        .workspace-status {
          &.active {
            color: #10b981;
          }
          &.inactive {
            color: #ef4444;
          }
        }

        .workspace-visibility {
          &.public {
            color: #3b82f6;
          }
          &.private {
            color: #f59e0b;
          }
        }
      }
    }
  }
}

.header-right {
  .el-button-group {
    .el-button {
      border-radius: 6px;
    }
  }
}

.workspace-content {
  display: flex;
  gap: 20px;
  min-height: calc(100vh - 200px);

  .workspace-sidebar {
    width: 200px;
    flex-shrink: 0;
    height: 100%;

    .workspace-menu {
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #ffffff;
      height: 100%;

      .el-menu-item {
        height: 48px;
        line-height: 48px;
        margin: 4px 8px;
        border-radius: 6px;

        &.is-active {
          background: #eff6ff;
          color: #3b82f6;
        }

        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }

  .workspace-main {
    flex: 1;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    padding: 24px;
    min-width: 0; // 确保 flex 子元素可以收缩
    overflow: hidden; // 防止内容溢出
  }

  // 告警规则页面特殊处理
  .rules-page {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  // 告警管理页面特殊处理
  .alerts-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;

    // 覆盖 PageContainer 背景色
    :deep(.page-container) {
      background: transparent !important;
      width: 100%;
    }
  }
}

// 概览页面样式
.overview-page {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e5e7eb;

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 8px;
        font-size: 20px;
        color: #ffffff;

        &.alerts {
          background: #ef4444;
        }
        &.critical {
          background: #dc2626;
        }
        &.rules {
          background: #3b82f6;
        }
        &.noise-rules {
          background: #8b5cf6;
        }
      }

      .stat-content {
        .stat-number {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }
      }
    }
  }

  .recent-activity {
    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .activity-list {
      .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }

        .activity-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 14px;
          color: #ffffff;

          &.project {
            background: #3b82f6;
          }
          &.member {
            background: #10b981;
          }
          &.update {
            background: #f59e0b;
          }
        }

        .activity-content {
          flex: 1;

          .activity-text {
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 2px;
          }

          .activity-time {
            font-size: 12px;
            color: #6b7280;
          }
        }
      }
    }
  }
}

// 降噪配置页面容器样式
.noise-page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

// 项目页面样式
.projects-page {
  .projects-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;

    .project-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      }

      .project-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .project-icon {
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
      }

      .project-body {
        .project-name {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .project-description {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }

        .project-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .project-status {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;

            &.active {
              background: #dbeafe;
              color: #1e40af;
            }

            &.completed {
              background: #d1fae5;
              color: #065f46;
            }
          }

          .project-members {
            font-size: 12px;
            color: #6b7280;
          }
        }
      }
    }
  }
}

// 成员页面样式
.members-page {
  .members-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .members-list {
    .member-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 12px;

      .member-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .member-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background: #3b82f6;
          color: #ffffff;
          font-weight: 600;
          font-size: 18px;
        }
      }

      .member-info {
        flex: 1;

        .member-name {
          font-size: 16px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .member-role {
          font-size: 14px;
          color: #3b82f6;
          margin-bottom: 2px;
        }

        .member-email {
          font-size: 12px;
          color: #6b7280;
        }
      }

      .member-actions {
        display: flex;
        gap: 8px;
      }
    }
  }
}

// 设置页面样式
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;

  // 覆盖 PageContainer 背景色
  :deep(.page-container) {
    background: transparent !important;
    width: 100%;
  }
}
</style>
