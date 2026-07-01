<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ArrowLeft, ArrowRight, Monitor, Search } from "@element-plus/icons-vue"
import { listResourceApi } from "@/api/cmdb/resource"
import type { Resource } from "@/api/cmdb/resource/types/resource"
import TerminalPage from "@/pages/cmdb/terminal/index.vue"

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const keyword = ref("")
const hostResources = ref<Resource[]>([])
const sidebarCollapsed = ref(false)

const resourceId = computed(() => String(route.query.resource_id || ""))
const filteredResources = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return hostResources.value

  return hostResources.value.filter((item) => {
    const name = String(item.name || "").toLowerCase()
    const id = String(item.id || "").toLowerCase()
    return name.includes(text) || id.includes(text)
  })
})

const fetchHostResources = async () => {
  loading.value = true

  try {
    const { data } = await listResourceApi({
      model_uid: "host",
      offset: 0,
      limit: 1000
    })
    hostResources.value = data.resources || []
  } catch (error) {
    console.error("获取主机列表失败:", error)
    hostResources.value = []
  } finally {
    loading.value = false
  }
}

const handleResourceSelect = (resource: Resource) => {
  if (String(resource.id) === resourceId.value) return

  const nextQuery: Record<string, string> = {
    resource_id: String(resource.id),
    title: resource.name
  }

  router.replace({
    path: route.path,
    query: nextQuery
  })
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

onMounted(() => {
  fetchHostResources()
})

watch(
  () => route.query.title,
  (title) => {
    const name = String(title || "")
    if (!name) return

    const exists = hostResources.value.some((item) => item.name === name)
    if (exists) return

    hostResources.value = [
      {
        id: Number(resourceId.value) || Date.now(),
        name,
        model_uid: "host",
        data: {}
      },
      ...hostResources.value
    ]
  },
  { immediate: true }
)
</script>

<template>
  <section class="term-layout">
    <section class="term-workspace">
      <aside class="term-sidebar" :class="{ 'is-collapsed': sidebarCollapsed }">
        <div class="sidebar-toolbar">
          <div v-if="!sidebarCollapsed" class="sidebar-title">
            <el-icon><Monitor /></el-icon>
            <span>主机列表</span>
          </div>
          <div class="sidebar-actions">
            <el-button
              :icon="sidebarCollapsed ? ArrowRight : ArrowLeft"
              circle
              text
              @click="toggleSidebar"
            />
          </div>
        </div>

        <el-input v-if="!sidebarCollapsed" v-model="keyword" placeholder="搜索主机名或 ID" clearable class="sidebar-search">
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <div v-if="!sidebarCollapsed" v-loading="loading" class="sidebar-list">
          <button
            v-for="item in filteredResources"
            :key="item.id"
            type="button"
            class="resource-item"
            :class="{ active: String(item.id) === resourceId }"
            @click="handleResourceSelect(item)"
          >
            <span class="resource-item__name">{{ item.name || `主机 ${item.id}` }}</span>
            <span class="resource-item__meta">ID {{ item.id }}</span>
          </button>

          <el-empty v-if="!loading && filteredResources.length === 0" :image-size="80" description="暂无主机数据" />
        </div>

        <div v-else class="sidebar-collapsed-bar">
          <button
            v-for="item in filteredResources.slice(0, 10)"
            :key="item.id"
            type="button"
            class="collapsed-resource-dot"
            :class="{ active: String(item.id) === resourceId }"
            :title="item.name || `主机 ${item.id}`"
            @click="handleResourceSelect(item)"
          >
            <span>{{ (item.name || String(item.id)).slice(0, 1).toUpperCase() }}</span>
          </button>
        </div>
      </aside>

      <main class="term-body">
        <TerminalPage class="term-view" />
      </main>
    </section>
  </section>
</template>

<style lang="scss" scoped>
.term-layout {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #f3f5f8;
}

.term-workspace {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.term-sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid #dbe3ee;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition:
    width 0.2s ease,
    min-width 0.2s ease;

  &.is-collapsed {
    width: 56px;
    min-width: 56px;
  }
}

.sidebar-toolbar {
  height: 56px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.sidebar-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.sidebar-search {
  padding: 12px 14px;
}

.sidebar-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 8px 10px;
}

.resource-item {
  width: 100%;
  min-height: 60px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    background: #eff6ff;
  }

  &.active {
    background: #dbeafe;
  }
}

.sidebar-collapsed-bar {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.collapsed-resource-dot {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: #ffffff;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px #dbe3ee;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    background: #eff6ff;
    color: #1d4ed8;
  }

  &.active {
    background: #dbeafe;
    color: #1d4ed8;
    box-shadow: inset 0 0 0 1px #93c5fd;
  }
}

.resource-item__name {
  width: 100%;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-item__meta {
  font-size: 12px;
  line-height: 1.4;
  color: #64748b;
}

.term-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
}

.term-view {
  width: 100%;
  height: 100%;
  min-height: 0;
}

@media (max-width: 768px) {
  .term-workspace {
    flex-direction: column;
  }

  .term-sidebar {
    width: 100%;
    min-width: 0;
    min-height: 220px;
    border-right: 0;
    border-bottom: 1px solid #dbe3ee;

    &.is-collapsed {
      width: 100%;
      min-width: 0;
      min-height: 56px;
    }
  }

  .sidebar-toolbar {
    height: auto;
    min-height: 56px;
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 14px;
  }

  .sidebar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .sidebar-collapsed-bar {
    flex-direction: row;
    align-items: center;
    padding: 0 12px 12px;
  }

  .term-body {
    padding: 12px;
  }
}
</style>
