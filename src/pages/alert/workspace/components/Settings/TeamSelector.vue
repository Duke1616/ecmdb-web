<template>
  <Drawer
    v-model="visible"
    title="选择团队"
    subtitle="为工作空间选择所属团队"
    :header-icon="User"
    size="40%"
    direction="rtl"
    :show-footer="true"
    cancel-button-text="取消"
    confirm-button-text="确定"
    @closed="onClosed"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div class="team-selector">
      <div class="team-list" v-loading="loading">
        <!-- 团队网格布局 -->
        <div class="team-grid">
          <div 
            v-for="team in teams" 
            :key="team.id" 
            class="team-card"
            :class="{ active: selectedTeamId === team.id }"
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
            <el-icon class="team-arrow" v-if="selectedTeamId === team.id">
              <ArrowRight />
            </el-icon>
          </div>
        </div>
        
        <div v-if="teams.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无团队数据" :image-size="80" />
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { User, ArrowRight } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { listTeamsApi } from "@/api/alert/team"
import type { Team } from "@/api/alert/team/types"

interface Props {
  modelValue: boolean
  currentTeamId?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentTeamId: 0
})

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  confirm: [teamId: number, teamName: string]
}>()

// 响应式数据
const visible = ref(false)
const teams = ref<Team[]>([])
const loading = ref(false)
const selectedTeamId = ref<string | number>("")

// 监听显示状态
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      // 打开时初始化选择状态
      selectedTeamId.value = props.currentTeamId || 0
      loadTeamsData()
    }
  }
)

// 监听内部显示状态
watch(visible, (newVal) => {
  emit("update:modelValue", newVal)
})

// 加载团队数据
const loadTeamsData = async () => {
  loading.value = true
  try {
    const { data } = await listTeamsApi({
      offset: 0,
      limit: 100
    })
    teams.value = data.teams || []
  } catch (error) {
    console.error("加载团队数据失败:", error)
    ElMessage.error("加载团队数据失败")
    teams.value = []
  } finally {
    loading.value = false
  }
}

// 选择团队
const selectTeam = (team: Team) => {
  selectedTeamId.value = team.id
}

// 生成团队头像颜色
const generateTeamColor = (name: string) => {
  const colors = [
    "#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe",
    "#43e97b", "#38f9d7", "#fa709a", "#fee140", "#a8edea", "#fed6e3"
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

// 抽屉关闭处理
const onClosed = () => {
  // 重置选择状态
  selectedTeamId.value = ""
  teams.value = []
}

// 取消处理
const handleCancel = () => {
  visible.value = false
}

// 确认处理
const handleConfirm = () => {
  if (!selectedTeamId.value) {
    ElMessage.warning("请选择一个团队")
    return
  }
  
  const selectedTeam = teams.value.find(team => team.id === selectedTeamId.value)
  if (!selectedTeam) {
    ElMessage.warning("请选择一个有效的团队")
    return
  }
  
  emit("confirm", selectedTeam.id, selectedTeam.name)
  visible.value = false
}
</script>

<style lang="scss" scoped>
// 团队选择抽屉样式
.team-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .team-list {
    flex: 1;
    overflow-y: auto;
    padding: 0px 12px;
    height: calc(100vh - 200px);
  }

  // 团队网格布局
  .team-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .team-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #ffffff;
    min-height: 80px;

    &:hover {
      border-color: #3b82f6;
      background: #f8fafc;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
    }


    .team-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0; // 防止内容溢出

      .team-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;

      }

      .team-details {
        flex: 1;
        min-width: 0; // 防止内容溢出

        .team-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .team-members {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .team-arrow {
      color: #3b82f6;
      font-size: 16px;
      flex-shrink: 0;
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    grid-column: 1 / -1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .team-selector {
    .team-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
