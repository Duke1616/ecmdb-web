<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="workspace?.name || '工作空间'"
      :subtitle="teamName"
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
          <el-menu-item index="noise-aggregate">
            <el-icon><DataAnalysis /></el-icon>
            <span>聚合规则</span>
          </el-menu-item>
          <el-menu-item index="noise-silence">
            <el-icon><Mute /></el-icon>
            <span>静默规则</span>
          </el-menu-item>
          <el-menu-item index="noise-inhibit">
            <el-icon><CircleClose /></el-icon>
            <span>抑制规则</span>
          </el-menu-item>
          <el-menu-item index="members">
            <el-icon><User /></el-icon>
            <span>团队成员</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon>
            <span>空间配置</span>
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
          <AlertManager :workspace-id="workspace?.id || 0" ref="alertManagerRef" />
        </div>

        <!-- 告警规则页面 -->
        <div v-else-if="activeMenu === 'rules'" class="workspace-section-pane">
          <AlertRules :workspace-id="workspace?.id || 0" ref="alertRulesRef" />
        </div>

        <!-- 聚合规则页面 -->
        <div v-else-if="activeMenu === 'noise-aggregate'" class="workspace-section-pane">
          <AggregateRules :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 抑制规则页面 -->
        <div v-else-if="activeMenu === 'noise-inhibit'" class="workspace-section-pane">
          <InhibitRules :workspace-id="workspace?.id || 0" />
        </div>

        <!-- 静默规则页面 -->
        <div v-else-if="activeMenu === 'noise-silence'" class="workspace-section-pane">
          <SilenceRules :silence-rules="silenceRules" @refresh="loadSilenceRules" />
        </div>

        <!-- 成员页面 -->
        <div v-else-if="activeMenu === 'members'" class="workspace-section-pane">
          <TeamMembers :team-id="workspace?.team_id || 0" ref="teamMembersRef" />
        </div>

        <!-- 设置页面 -->
        <div v-else-if="activeMenu === 'settings'" class="workspace-section-pane">
          <Settings :workspace-id="workspace?.id || 0" ref="settingsRef" @refresh="handleSettingsRefresh" />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, nextTick } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { useWorkspaceMenuStore } from "@/pinia/stores/useWorkspaceMenu"
import {
  Setting,
  User,
  DataBoard,
  Warning,
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
import AlertRules from "./components/AlertRules/index.vue"
import AlertManager from "./components/AlertManager/index.vue"
import Settings from "./components/Settings/index.vue"
import TeamMembers from "./components/TeamMembers/index.vue"
import Overview from "./components/Overview/index.vue"
import AggregateRules from "./components/Aggregate/index.vue"
import InhibitRules from "./components/Inhibit/index.vue"
import SilenceRules from "./components/Silence/index.vue"

// 路由
const route = useRoute()
const router = useRouter()

// 菜单状态管理
const menuStore = useWorkspaceMenuStore()

// 响应式数据
const workspace = ref<Workspace | null>(null)
const teamName = ref("")
const silenceRules = ref<any[]>([])

// 使用 store 中的菜单状态
const activeMenu = computed(() => menuStore.activeMenu)

// 组件引用
const teamMembersRef = ref()
const workspaceOverviewRef = ref()
const alertManagerRef = ref()
const alertRulesRef = ref()
const settingsRef = ref()

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
  menuStore.setActiveMenu(key)
  // 延迟执行数据加载，确保组件已经渲染
  nextTick(() => {
    loadCurrentMenuData()
  })
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

// 根据当前菜单状态加载数据
const loadCurrentMenuData = () => {
  const currentMenu = menuStore.activeMenu
  switch (currentMenu) {
    case "overview":
      // 工作台数据加载
      workspaceOverviewRef.value?.loadData?.()
      break
    case "alerts":
      // 告警管理数据加载
      alertManagerRef.value?.loadData?.()
      break
    case "rules":
      // 告警规则数据加载
      alertRulesRef.value?.loadData?.()
      break
    case "noise":
    case "noise-aggregate":
    case "noise-inhibit":
    case "noise-silence":
      // NOTE: 各降噪规则子组件通过自身 onMounted/watch workspaceId 自行加载数据
      break
    case "members":
      // 团队成员数据加载
      teamMembersRef.value?.loadData?.()
      break
    case "settings":
      // 空间配置数据加载
      settingsRef.value?.loadData?.()
      break
  }
}

// 组件挂载时加载基础数据
onMounted(async () => {
  await loadWorkspaceData()
  await loadSilenceRules()
  // 加载当前菜单的数据
  nextTick(() => {
    loadCurrentMenuData()
  })
})

// 页面激活时重新加载数据（用于从其他页面返回时）
onActivated(() => {
  loadCurrentMenuData()
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

.workspace-content {
  display: flex;
  gap: 16px;
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
    }
  }

  .workspace-main {
    flex: 1;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    min-width: 0; // 确保 flex 子元素可以收缩
    overflow: hidden; // 防止内容溢出
  }
}

// 通用页面样式
.overview-page,
.rules-page,
.noise-page,
.members-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.alerts-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workspace-section-pane {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
