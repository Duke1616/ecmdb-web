<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索团队..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="id"
    label-field="name"
    :fallback-builder="fallbackBuilder"
    :disabled="disabled"
    :page-size="pageSize"
  >
    <template #item="{ item }">
      <div class="team-item-option">
        <div class="team-item-header">
          <span class="team-name">{{ item.name }}</span>
          <span class="team-meta">{{ item.members?.length || 0 }} 人</span>
        </div>
        <div class="team-owner">负责人：{{ item.owner || "-" }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script lang="ts" setup>
import { getTeamDetailApi, listTeamsApi } from "@/api/alert/team"
import type { Team } from "@/api/alert/team/types"
import GenericPicker from "@@/components/Pickers/GenericPicker/index.vue"

interface ITeamPickerProps {
  placeholder?: string
  multiple?: boolean
  variant?: "fancy" | "simple" | "element"
  disabled?: boolean
  pageSize?: number
}

withDefaults(defineProps<ITeamPickerProps>(), {
  placeholder: "请选择团队",
  multiple: false,
  variant: "fancy",
  disabled: false,
  pageSize: 10
})

const model = defineModel<number | number[]>()

const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listTeamsApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: data.teams || []
  }
}

const resolveApi = async (id: number): Promise<Team | null> => {
  const { data } = await getTeamDetailApi(id)
  return data || null
}

const fallbackBuilder = (id: number): Team => {
  return {
    id,
    name: `团队 #${id}`,
    owner: "",
    members: [],
    chat_groups: [],
    ctime: 0,
    utime: 0
  }
}
</script>

<style lang="scss" scoped>
.team-item-option {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
}

.team-item-header {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.team-name {
  min-width: 0;
  overflow: hidden;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-meta {
  flex-shrink: 0;
  color: #64748b;
  font-size: 11px;
}

.team-owner {
  width: 100%;
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

