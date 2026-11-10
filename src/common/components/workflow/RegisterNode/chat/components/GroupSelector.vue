<template>
  <div class="adaptive-selector" ref="containerRef">
    <!-- 左侧：团队导航 -->
    <nav class="nav-section">
      <div class="nav-header">
        <el-icon class="header-icon"><MenuIcon /></el-icon>
        <span class="header-title">团队列表</span>
        <span class="header-count" v-if="modelValue.length > 0">({{ modelValue.length }})</span>
      </div>

      <div class="nav-wrapper scroll-slim">
        <div
          v-for="team in teams"
          :key="team.id"
          class="nav-item"
          :class="{ active: selectedTeamId === team.id }"
          @click="selectedTeamId = team.id"
        >
          <span class="team-name" :title="team.name">{{ team.name }}</span>
          <!-- 优雅克制的计数徽标 -->
          <span v-if="getSelectedCount(team.id) > 0" class="team-count-badge">
            {{ getSelectedCount(team.id) }}
          </span>
        </div>
      </div>
    </nav>

    <!-- 右侧：渠道列表 -->
    <main class="content-section">
      <header class="content-header">
        <div class="current-path">
          <span class="path-leaf">{{ currentTeamName || "请选择团队" }}</span>
          <span v-if="selectedTeamId" class="path-stat">({{ currentTeamGroups.length }} 个渠道)</span>
        </div>
        <div class="header-tools" v-if="selectedTeamId && currentTeamGroups.length > 0">
          <el-button link type="primary" size="small" @click="selectAllInTeam">全选本组</el-button>
        </div>
      </header>

      <div class="items-container scroll-slim">
        <template v-if="selectedTeamId">
          <div class="items-list" v-if="currentTeamGroups.length > 0">
            <div
              v-for="group in currentTeamGroups"
              :key="group.id"
              class="group-row-linear"
              :class="{ 'is-selected': isGroupSelected(group.id!) }"
              @click="toggleGroup(group.id!)"
            >
              <!-- 前置 Checkbox -->
              <div class="row-checkbox">
                <el-icon v-if="isGroupSelected(group.id!)"><Check /></el-icon>
              </div>

              <!-- 左右布局的信息展示 -->
              <div class="row-content">
                <span class="name-text" :title="group.name">{{ group.name }}</span>
                <span class="channel-label" :class="group.channel.toLowerCase()">
                  {{ getChannelLabel(group.channel) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <el-icon class="empty-icon"><ChatDotSquare /></el-icon>
            <p>当前团队暂无可用通知渠道</p>
          </div>
        </template>

        <div v-else class="empty-state">
          <el-icon class="empty-icon"><MenuIcon /></el-icon>
          <p>请在左侧选择团队以查看通知渠道</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { Check, Menu as MenuIcon, ChatDotSquare } from "@element-plus/icons-vue"
import { CHANNEL_TYPES } from "@/api/alert/template/types"
import type { Team } from "@/api/alert/team/types"

const props = defineProps<{ teams: Team[] }>()

// NOTE: 该组件为群组选择器 UI 控件，双向同步选中的群组 ID 列表
const modelValue = defineModel<number[]>({ default: () => [] })

const containerRef = ref<HTMLElement | null>(null)
const selectedTeamId = ref<number>()

// --- 渠道标签映射 ---
const CHANNEL_MAP: Record<string, string> = {
  [CHANNEL_TYPES.LARK_CARD]: "飞书",
  [CHANNEL_TYPES.WECHAT]: "微信",
  [CHANNEL_TYPES.EMAIL]: "邮件"
}
const getChannelLabel = (c: string) => CHANNEL_MAP[c] || c

// --- 计算属性 ---
const currentTeamGroups = computed(() => {
  return props.teams.find((t) => t.id === selectedTeamId.value)?.chat_groups || []
})

const currentTeamName = computed(() => {
  return props.teams.find((t) => t.id === selectedTeamId.value)?.name
})

// --- 方法 ---
const isGroupSelected = (id: number) => modelValue.value.includes(id)

const toggleGroup = (id: number) => {
  const index = modelValue.value.indexOf(id)
  if (index > -1) {
    modelValue.value.splice(index, 1)
  } else {
    modelValue.value.push(id)
  }
}

const selectAllInTeam = () => {
  currentTeamGroups.value.forEach((g) => {
    if (g.id && !isGroupSelected(g.id)) {
      modelValue.value.push(g.id)
    }
  })
}

const getSelectedCount = (teamId: number) => {
  const team = props.teams.find((t) => t.id === teamId)
  if (!team?.chat_groups) return 0
  return team.chat_groups.filter((g) => g.id && modelValue.value.includes(g.id)).length
}

onMounted(() => {
  const teamWithSelection = props.teams.find((t) => getSelectedCount(t.id) > 0)
  if (teamWithSelection) {
    selectedTeamId.value = teamWithSelection.id
  } else if (props.teams.length > 0) {
    selectedTeamId.value = props.teams[0].id
  }
})
</script>

<style lang="scss" scoped>
.adaptive-selector {
  width: 100% !important;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  height: 290px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #94a3b8;
  }
}

// 优雅细滚动条
.scroll-slim {
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* ── 左侧团队导航 ─────────────────────────────────── */
.nav-section {
  width: 136px;
  flex-shrink: 0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;

  .nav-header {
    height: 38px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    box-sizing: border-box;

    .header-icon {
      font-size: 13px;
      color: #94a3b8;
    }

    .header-title {
      color: #475569;
    }

    .header-count {
      font-size: 11px;
      color: #3b82f6;
      font-weight: 600;
    }
  }

  .nav-wrapper {
    flex: 1;
    overflow-y: auto;
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    height: 34px;
    padding: 0 10px;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.15s ease-in-out;

    .team-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    &:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    // 扁平现代的选中态：浅蓝底色 + 品牌字色，杜绝生硬凸起的白框
    &.active {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 600;

      .team-count-badge {
        background: #dbeafe;
        color: #1d4ed8;
      }
    }

    // 小巧精致的计数标：统一灰度与柔和色系，杜绝突兀的大药丸
    .team-count-badge {
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      padding: 0 5px;
      box-sizing: border-box;
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      background: #e2e8f0;
      color: #64748b;
      border-radius: 9px;
      margin-left: 6px;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }
  }
}

/* ── 右侧渠道列表 ─────────────────────────────────── */
.content-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;

  .content-header {
    height: 38px;
    padding: 0 14px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    box-sizing: border-box;

    .current-path {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;

      .path-leaf {
        color: #0f172a;
        font-weight: 600;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .path-stat {
        font-size: 11.5px;
        color: #94a3b8;
        white-space: nowrap;
      }
    }

    :deep(.el-button) {
      font-weight: 500;
      font-size: 12px;
      height: 24px;
      padding: 0 4px;
    }
  }

  .items-container {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .group-row-linear {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: #ffffff;
    border: 1px solid #f1f5f9;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease-in-out;

    &:hover {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    &.is-selected {
      background: #f0fdf4;
      border-color: #bbf7d0;
      .row-checkbox {
        background: #10b981;
        border-color: #10b981;
        color: #ffffff;
      }
      .name-text {
        font-weight: 600;
        color: #166534;
      }
    }

    .row-checkbox {
      width: 16px;
      height: 16px;
      border: 1.5px solid #cbd5e1;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .row-content {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 0;

      .name-text {
        font-size: 13px;
        color: #334155;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 10px;
      }

      .channel-label {
        font-size: 11px;
        font-weight: 500;
        padding: 1px 6px;
        border-radius: 4px;
        flex-shrink: 0;

        &.lark_card {
          background: #eff6ff;
          color: #2563eb;
        }
        &.wechat {
          background: #ecfdf5;
          color: #059669;
        }
        &.email {
          background: #fef2f2;
          color: #dc2626;
        }
      }
    }
  }

  .empty-state {
    height: 100%;
    min-height: 160px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #94a3b8;

    .empty-icon {
      font-size: 26px;
      color: #cbd5e1;
    }

    p {
      margin: 0;
      font-size: 12px;
    }
  }
}
</style>
