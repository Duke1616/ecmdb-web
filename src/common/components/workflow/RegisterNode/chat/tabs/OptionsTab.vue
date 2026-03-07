<template>
  <div class="options-tab-container">
    <div class="search-wrapper" v-if="showSearch">
      <el-input v-model="searchQuery" placeholder="输入关键字进行搜索..." clearable :prefix-icon="Search" />
    </div>
    <div class="team-flow" v-loading="loading">
      <div
        v-for="item in displayItems"
        :key="item[valueKey]"
        class="team-chip"
        :class="{ active: isSelected(String(item[valueKey])) }"
        @click="toggle(String(item[valueKey]))"
      >
        <el-icon v-if="icon"><component :is="icon" /></el-icon>
        <span>{{ item[labelKey] }}</span>
        <el-icon v-if="isSelected(String(item[valueKey]))" class="chip-check"><Check /></el-icon>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="totalCount > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        hide-on-single-page
        background
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue"
import { Check, Search } from "@element-plus/icons-vue"

// NOTE: 通用选项卡面板，用于处理团队、排班、部门等多选项列表展示
interface Props {
  items?: any[]
  fetchMethod?: (params: { offset: number; limit: number; query?: string }) => Promise<{ items: any[]; total: number }>
  selectedIds: string[]
  icon?: any
  labelKey?: string
  valueKey?: string
  pageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  selectedIds: () => [],
  labelKey: "name",
  valueKey: "id",
  pageSize: 30
})

const emits = defineEmits<{
  (e: "toggle", id: string): void
  (e: "loaded", items: any[]): void
}>()

const currentPage = ref(1)
const searchQuery = ref("")
const loading = ref(false)

const serverItems = ref<any[]>([])
const serverTotal = ref(0)

const isSelected = (id: string) => props.selectedIds.includes(id)

const loadServerData = async () => {
  if (!props.fetchMethod) return
  loading.value = true
  try {
    const res = await props.fetchMethod({
      offset: (currentPage.value - 1) * props.pageSize,
      limit: props.pageSize,
      query: searchQuery.value
    })
    serverItems.value = res.items
    serverTotal.value = res.total
    emits("loaded", res.items)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const displayItems = computed(() => {
  if (props.fetchMethod) return serverItems.value

  if (!searchQuery.value) return pagedItems.value
  const lowerQuery = searchQuery.value.toLowerCase()
  const filtered = props.items.filter((item) => {
    const label = item[props.labelKey]
    return label && String(label).toLowerCase().includes(lowerQuery)
  })
  const start = (currentPage.value - 1) * props.pageSize
  return filtered.slice(start, start + props.pageSize)
})

const totalCount = computed(() => {
  if (props.fetchMethod) return serverTotal.value
  if (!searchQuery.value) return props.items.length

  const lowerQuery = searchQuery.value.toLowerCase()
  return props.items.filter((item) => {
    const label = item[props.labelKey]
    return label && String(label).toLowerCase().includes(lowerQuery)
  }).length
})

const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return props.items.slice(start, end)
})

const showSearch = computed(() => {
  return props.fetchMethod != null || props.items.length > 20
})

watch(searchQuery, () => {
  currentPage.value = 1
  if (props.fetchMethod) loadServerData()
})

watch(currentPage, (newVal, oldVal) => {
  if (props.fetchMethod && newVal !== oldVal) {
    loadServerData()
  }
})

onMounted(() => {
  if (props.fetchMethod) loadServerData()
})

const toggle = (id: string) => {
  emits("toggle", id)
}

const handlePageChange = (val: number) => {
  currentPage.value = val
}
</script>

<style lang="scss" scoped>
.options-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.search-wrapper {
  margin-bottom: 16px;
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e2e8f0;
    &:hover,
    &.is-focus {
      border-color: #3b82f6;
      background: #fff;
    }
  }
}
.team-flow {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
  flex: 1;
}
.team-chip {
  height: fit-content;
  padding: 10px 18px;
  border-radius: 10px;
  border: 1.5px solid #f1f5f9;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  }
}
.pagination-wrapper {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
}
</style>
