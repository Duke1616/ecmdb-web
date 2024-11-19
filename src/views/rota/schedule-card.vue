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
import { findByIdsApi } from "@/api/user"
import { isEqual } from "lodash-es"
import { defineProps, ref, watch } from "vue"

const props = defineProps<{
  title: string
  schedule: scheduleCard | undefined
  formatTimestamp: (timestamp: number | undefined) => string
}>()

// 存储用户数据的 Map
const userMap = ref(new Map<number, string>())

// 获取用户数据并缓存
const fetchUsers = async (ids: number[]) => {
  if (!ids || ids.length === 0) return

  try {
    const data = await findByIdsApi(ids)
    data.data.users.forEach((user) => {
      userMap.value.set(user.id, user.display_name)
    })
  } catch (error) {
    console.error("Failed to fetch users:", error)
  }
}

// 获取成员名字并处理缓存逻辑
const getMemberNames = (ids: number[] | undefined): string => {
  if (!ids || ids.length === 0) return ""

  // 从缓存中获取数据
  const names: string[] = ids.map((id) => userMap.value.get(id) || "")

  // 如果有未缓存的 ID，则请求接口
  const missingIds = ids.filter((id) => !userMap.value.has(id))
  if (missingIds.length > 0) fetchUsers(missingIds)

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
