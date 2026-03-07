<template>
  <div class="adaptive-selector" ref="containerRef">
    <!-- 顶部/左侧：团队导航 -->
    <nav class="nav-section">
      <div class="nav-header">
        <el-icon><MenuIcon /></el-icon>
        <span>选择团队</span>
        <div class="nav-total-count" v-if="modelValue.length > 0">
          {{ modelValue.length }}
        </div>
      </div>

      <div class="nav-wrapper scroll-hide">
        <div
          v-for="team in teams"
          :key="team.id"
          class="nav-pill"
          :class="{ active: selectedTeamId === team.id }"
          @click="selectedTeamId = team.id"
        >
          <span class="pill-name">{{ team.name }}</span>
          <span v-if="getSelectedCount(team.id) > 0" class="pill-dot" />
        </div>
      </div>
    </nav>

    <!-- 主体：渠道列表 -->
    <main class="content-section">
      <header class="content-header">
        <div class="current-path">
          <span class="path-leaf">{{ currentTeamName || "未选中" }}</span>
          <span v-if="selectedTeamId" class="path-stat">({{ currentTeamGroups.length }} 渠道)</span>
        </div>
        <div class="header-tools" v-if="selectedTeamId && currentTeamGroups.length > 0">
          <el-button link type="primary" size="small" @click="selectAllInTeam">全选</el-button>
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

              <!-- 核心：左右布局的信息展示 -->
              <div class="row-content">
                <span class="name-text">{{ group.name }}</span>
                <span class="channel-label" :class="group.channel.toLowerCase()">
                  {{ getChannelLabel(group.channel) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <p>当前团队暂无可用渠道</p>
          </div>
        </template>

        <div v-else class="empty-state">
          <p>请选择团队开始配置</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { Check, Menu as MenuIcon } from "@element-plus/icons-vue"
import { CHANNEL_TYPES } from "@/api/alert/template/types"

interface ChatGroup {
  id?: number
  team_id?: number
  channel: string
  chat_id: string
  name: string
}

interface Team {
  id: number
  name: string
  chat_groups: ChatGroup[]
}

const props = defineProps<{ teams: Team[] }>()
const modelValue = defineModel<number[]>({ default: () => [] })

const containerRef = ref<HTMLElement | null>(null)
const selectedTeamId = ref<number>()

// --- Display Logic ---
const CHANNEL_MAP: Record<string, string> = {
  [CHANNEL_TYPES.LARK_CARD]: "飞书",
  [CHANNEL_TYPES.WECHAT]: "微信",
  [CHANNEL_TYPES.EMAIL]: "邮件"
}
const getChannelLabel = (c: string) => CHANNEL_MAP[c] || c

// --- Computed ---
const currentTeamGroups = computed(() => {
  return props.teams.find((t) => t.id === selectedTeamId.value)?.chat_groups || []
})

const currentTeamName = computed(() => {
  return props.teams.find((t) => t.id === selectedTeamId.value)?.name
})

// --- Methods ---
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
  display: flex;
  flex-direction: column;
  height: 310px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 10px rgba(0, 0, 0, 0.03);

  @media (min-width: 640px) {
    flex-direction: row;
  }
}

// Scrollbars
.scroll-slim {
  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
}
.scroll-hide {
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 导航区 */
.nav-section {
  background: #fcfcfd;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #f8fafc;

  @media (min-width: 640px) {
    width: 130px;
    border-bottom: none;
    border-right: 1px solid #f1f5f9;
  }

  .nav-header {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    .nav-total-count {
      margin-left: auto;
      font-size: 10px;
      color: #3b82f6;
      background: #eff6ff;
      padding: 0 4.5px;
      border-radius: 4px;
    }
  }

  .nav-wrapper {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 0 8px 6px;
    gap: 6px;

    @media (min-width: 640px) {
      flex-direction: column;
      overflow-y: auto;
      padding: 2px 6px;
    }
  }

  .nav-pill {
    flex-shrink: 0;
    padding: 6px 10px;
    background: #fff;
    border: 1px solid #edf2f7;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.2s;

    &.active {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #2563eb;
      font-weight: 800;
    }

    .pill-dot {
      width: 4px;
      height: 4px;
      background: #22c55e;
      border-radius: 50%;
    }

    @media (min-width: 640px) {
      width: 100%;
      border-color: transparent;
      background: transparent;
      padding: 7px 10px;
      &:hover {
        background: #f1f5f9;
      }
      &.active {
        background: #fff;
        border-color: #e2e8f0;
      }
    }
  }
}

/* 内容区 */
.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;

  .content-header {
    padding: 8px 14px;
    border-bottom: 1px solid #f8fafc;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .current-path {
      display: flex;
      align-items: baseline;
      gap: 6px;
      .path-leaf {
        color: #1e293b;
        font-weight: 800;
        font-size: 13px;
      }
      .path-stat {
        font-size: 11px;
        color: #94a3b8;
      }
    }

    :deep(.el-button) {
      font-weight: 700;
      font-size: 11px;
      height: 20px;
      padding: 0;
    }
  }

  .items-container {
    flex: 1;
    overflow-y: auto;
    padding: 6px 10px;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .group-row-linear {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px; // 保持合适的线性间距
    background: #fff;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #f8fafc;
    }

    &.is-selected {
      background: #f0fdf4;
      border-color: #bbf7d0;
      .row-checkbox {
        background: #22c55e;
        border-color: #22c55e;
        color: #fff;
      }
      .name-text {
        font-weight: 800;
        color: #166534;
      }
    }

    .row-checkbox {
      width: 15px;
      height: 15px;
      border: 1.5px solid #e2e8f0;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .row-content {
      flex: 1;
      display: flex;
      justify-content: space-between; // 核心：左右布局
      align-items: center;
      min-width: 0;

      .name-text {
        font-size: 13.5px;
        color: #334155;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding-right: 12px;
      }

      .channel-label {
        font-size: 11px;
        font-weight: 800;
        padding: 0 6px;
        border-radius: 3px;
        flex-shrink: 0;

        &.lark_card {
          background: #dcfce7;
          color: #15803d;
        }
        &.wechat {
          background: #dcfce7;
          color: #166534;
        }
        &.email {
          background: #fee2e2;
          color: #991b1b;
        }
      }
    }
  }

  .empty-state {
    padding: 40px 0;
    text-align: center;
    p {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}
</style>
