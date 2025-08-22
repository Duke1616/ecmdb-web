<template>
  <el-card class="card-item">
    <span class="schedule-title">
      {{ title }}：{{ formatTimestamp(schedule?.start_time) }} -
      {{ formatTimestamp(schedule?.end_time) }}
    </span>
    <div class="schedule-info">
      <span>值班人：{{ getMemberNames(schedule?.rota_group?.members) || "无" }}</span>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { schedule as scheduleCard } from "@/api/rota/types/rota"
import { isEqual } from "lodash-es"
import { defineProps, watch } from "vue"
import { useUserToolsStore } from "@/pinia/stores/user-tools"
const userToolsStore = useUserToolsStore()

const props = defineProps<{
  title: string
  schedule: scheduleCard | undefined
  formatTimestamp: (timestamp: number | undefined) => string
}>()

// 获取成员名字并处理缓存逻辑
const getMemberNames = (ids: number[] | undefined): string => {
  if (!ids || ids.length === 0) return ""

  // 录入 map 数据
  userToolsStore.setByUserIds(ids)

  // 从缓存中获取数据
  const names: string[] = ids.map((id) => userToolsStore.getOnlyDisplayName(id) || "")

  return names.filter((name) => name).join(", ")
}

watch(
  () => props.schedule?.rota_group?.members,
  (newIds, oldIds) => {
    if (isEqual(oldIds, newIds)) {
      getMemberNames(newIds)
    }
  },
  { immediate: false }
)
</script>

<style scoped>
.schedule-title {
  font-size: 15px;
}

.schedule-info {
  margin-top: 6px;
  font-size: 15px;
}
</style>
