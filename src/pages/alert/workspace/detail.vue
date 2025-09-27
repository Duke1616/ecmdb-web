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
          <el-sub-menu index="noise">
            <template #title>
              <el-icon><Filter /></el-icon>
              <span>降噪配置</span>
            </template>
            <el-menu-item index="noise-aggregate">
              <el-icon><DataAnalysis /></el-icon>
              <span>聚合规则</span>
            </el-menu-item>
            <el-menu-item index="noise-inhibit">
              <el-icon><CircleClose /></el-icon>
              <span>抑制规则</span>
            </el-menu-item>
            <el-menu-item index="noise-silence">
              <el-icon><Mute /></el-icon>
              <span>静默规则</span>
            </el-menu-item>
          </el-sub-menu>
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
          <Overview :workspace-id="workspace?.id || 0" ref="workspaceOverviewRef" />
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
        <div v-else-if="activeMenu === 'noise'" class="noise-page">
          <NoiseConfig :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 聚合规则页面 -->
        <div v-else-if="activeMenu === 'noise-aggregate'" class="rules-page">
          <AggregateRules :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 抑制规则页面 -->
        <div v-else-if="activeMenu === 'noise-inhibit'" class="rules-page">
          <InhibitRules />
        </div>

        <!-- 静默规则页面 -->
        <div v-else-if="activeMenu === 'noise-silence'" class="rules-page">
          <SilenceRules :silence-rules="silenceRules" @refresh="loadSilenceRules" />
        </div>

        <!-- 成员页面 -->
        <div v-else-if="activeMenu === 'members'" class="members-page">
          <TeamMembers :team-id="workspace?.team?.id || 0" ref="teamMembersRef" />
        </div>

        <!-- 设置页面 -->
        <div v-else-if="activeMenu === 'settings'" class="settings-page">
          <Settings :workspace-id="workspace?.id || 0" @refresh="handleSettingsRefresh" />
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
  Warning,
  Filter,
  CircleCheckFilled,
  CircleCloseFilled,
  Unlock,
  Lock,
  Clock,
  DataAnalysis,
  CircleClose,
  Mute
} from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { Workspace } from "@/api/alert/workspace/types"
import { getWorkspaceDetailApi } from "@/api/alert/workspace"
import NoiseConfig from "./components/NoiseConfig/index.vue"
import AlertRules from "./components/AlertRules/index.vue"
import AlertManager from "./components/AlertManager/index.vue"
import Settings from "./components/Settings/index.vue"
import TeamMembers from "./components/TeamMembers/index.vue"
import Overview from "./components/Overview/index.vue"
import AggregateRules from "./components/NoiseConfig/aggregate/rules.vue"
import InhibitRules from "./components/NoiseConfig/inhibit/rules.vue"
import SilenceRules from "./components/NoiseConfig/silence_rules.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 响应式数据
const workspace = ref<Workspace | null>(null)
const activeMenu = ref("overview")
const teamName = ref("")
const silenceRules = ref<any[]>([])

// 组件引用
const teamMembersRef = ref()
const workspaceOverviewRef = ref()

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
  activeMenu.value = "noise-aggregate"
}

const handleCreateAlert = () => {
  ElMessage.info("创建告警功能待实现")
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
  }
}

// 加载静默规则数据
const loadSilenceRules = async () => {
  // 这里应该调用静默规则的API
  // 暂时使用模拟数据
  silenceRules.value = [
    {
      id: 1,
      name: "维护窗口静默",
      matchers: [
        { Type: 1, Name: "severity", Value: "critical" },
        { Type: 1, Name: "service", Value: "database" }
      ],
      start_time: Date.now(),
      end_time: Date.now() + 2 * 60 * 60 * 1000,
      enabled: true,
      is_active: true,
      created_by: "admin",
      created_at: Date.now() - 30 * 60 * 1000,
      comment: "数据库维护期间静默关键告警"
    }
  ]
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadWorkspaceData()
  await loadSilenceRules()
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
}

// 通用页面样式
.overview-page,
.rules-page,
.alerts-page,
.noise-page,
.members-page,
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
