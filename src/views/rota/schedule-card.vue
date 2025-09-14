<template>
  <el-card class="schedule-card" shadow="hover">
    <div class="card-header">
      <div class="title-section">
        <el-icon class="title-icon">
          <Calendar />
        </el-icon>
        <span class="card-title">{{ title }}</span>
      </div>
      <el-tag v-if="schedule" :type="isCurrent ? 'success' : 'info'" size="small" class="status-tag">
        {{ isCurrent ? "进行中" : "即将开始" }}
      </el-tag>
    </div>

    <div v-if="schedule" class="card-content">
      <div class="time-section">
        <el-icon class="time-icon">
          <Clock />
        </el-icon>
        <div class="time-text">
          <span class="time-label">开始</span>
          <span class="time-value">{{ formatTimestamp(schedule.start_time) }}</span>
          <span class="time-separator">-</span>
          <span class="time-label">结束</span>
          <span class="time-value">{{ formatTimestamp(schedule.end_time) }}</span>
        </div>
      </div>

      <div class="members-section">
        <el-icon class="members-icon">
          <User />
        </el-icon>
        <span class="members-label">值班人员</span>
        <div class="members-list">
          <el-tag v-for="(member, index) in memberList" :key="index" size="small" class="member-tag">
            {{ member }}
          </el-tag>
          <el-tag v-if="!memberList.length" size="small" type="info"> 暂无人员 </el-tag>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-icon class="empty-icon">
        <Calendar />
      </el-icon>
      <div class="empty-text">暂无{{ title }}</div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { schedule as scheduleCard } from "@/api/rota/types/rota"
import { isEqual } from "lodash-es"
import { defineProps, watch, computed } from "vue"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
import { Calendar, Clock, User } from "@element-plus/icons-vue"

const userToolsStore = useUserToolsStore()

const props = defineProps<{
  title: string
  schedule: scheduleCard | undefined
  formatTimestamp: (timestamp: number | undefined) => string
}>()

// 判断是否为当前值班
const isCurrent = computed(() => {
  if (!props.schedule) return false
  const now = Date.now()
  return now >= props.schedule.start_time && now <= props.schedule.end_time
})

// 获取成员名字列表
const memberList = computed(() => {
  if (!props.schedule?.rota_group?.members) return []

  const usernames = props.schedule.rota_group.members
  userToolsStore.setByUsernames(usernames)

  return usernames.map((username) => userToolsStore.getOnlyDisplayName(username) || username).filter((name) => name)
})

// 获取成员名字并处理缓存逻辑
const getMemberNames = (usernames: string[] | undefined): string => {
  if (!usernames || usernames.length === 0) return ""

  // 录入 map 数据
  userToolsStore.setByUsernames(usernames)

  // 从缓存中获取数据
  const names: string[] = usernames.map((username) => userToolsStore.getOnlyDisplayName(username) || "")

  return names.filter((name) => name).join(", ")
}

watch(
  () => props.schedule?.rota_group?.members,
  (newUsernames, oldUsernames) => {
    if (isEqual(oldUsernames, newUsernames)) {
      getMemberNames(newUsernames)
    }
  },
  { immediate: false }
)
</script>

<style lang="scss" scoped>
.schedule-card {
  height: 100%;
  border-radius: calc(0.5rem + 0.1vw);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    padding: calc(1rem + 0.2vw);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: calc(0.75rem + 0.2vw);
}

.title-section {
  display: flex;
  align-items: center;
  gap: calc(0.5rem + 0.1vw);
}

.title-icon {
  font-size: calc(1.25rem + 0.2vw);
  color: var(--el-color-primary);
}

.card-title {
  font-size: calc(1rem + 0.2vw);
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.status-tag {
  font-size: calc(0.75rem + 0.1vw);
  border-radius: calc(0.25rem + 0.05vw);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(0.5rem + 0.1vw);
}

.time-section {
  display: flex;
  align-items: center;
  gap: calc(0.5rem + 0.1vw);
  padding: calc(0.5rem + 0.1vw);
  background: var(--el-fill-color-lighter);
  border-radius: calc(0.375rem + 0.05vw);
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.time-icon {
  font-size: calc(0.875rem + 0.1vw);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.time-text {
  display: flex;
  align-items: center;
  gap: calc(0.25rem + 0.05vw);
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.time-label {
  font-size: calc(0.75rem + 0.1vw);
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.time-value {
  font-size: calc(0.8rem + 0.1vw);
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.time-separator {
  font-size: calc(0.8rem + 0.1vw);
  color: var(--el-text-color-regular);
  font-weight: 500;
  margin: 0 calc(0.25rem + 0.05vw);
}

.members-section {
  display: flex;
  align-items: center;
  gap: calc(0.5rem + 0.1vw);
  padding: calc(0.5rem + 0.1vw);
  background: var(--el-fill-color-lighter);
  border-radius: calc(0.375rem + 0.05vw);
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }
}

.members-icon {
  font-size: calc(0.875rem + 0.1vw);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.members-label {
  font-size: calc(0.75rem + 0.1vw);
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: calc(0.2rem + 0.05vw);
  align-items: center;
}

.member-tag {
  font-size: calc(0.75rem + 0.1vw);
  border-radius: calc(0.25rem + 0.05vw);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: 1px solid var(--el-color-primary-light-7);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(2rem + 0.4vw);
  text-align: center;
  color: var(--el-text-color-placeholder);
}

.empty-icon {
  font-size: calc(2rem + 0.4vw);
  margin-bottom: calc(0.5rem + 0.1vw);
  color: var(--el-text-color-placeholder);
}

.empty-text {
  font-size: calc(0.875rem + 0.1vw);
  color: var(--el-text-color-placeholder);
}
</style>
