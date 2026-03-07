<template>
  <div class="tree-tab-container" v-loading="loading">
    <div class="header-wrapper">
      <div class="search-wrapper">
        <el-input v-model="filterText" placeholder="搜索部门名称..." clearable :prefix-icon="Search" />
      </div>
      <div class="pagination-wrapper" v-if="filteredDepts.length > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredDepts.length"
          layout="total, prev, next"
          @current-change="handlePageChange"
          hide-on-single-page
          small
        />
      </div>
    </div>
    <div class="dept-list">
      <div
        v-for="dept in paginatedDepts"
        :key="dept.id"
        class="dept-item"
        :class="{ active: isSelected(dept.id) }"
        @click="toggleDept(dept.id)"
      >
        <div class="dept-info">
          <div class="dept-name">{{ dept.name }}</div>
          <div class="dept-path">{{ dept.path }}</div>
        </div>
        <el-icon v-if="isSelected(dept.id)" class="check-icon"><Check /></el-icon>
      </div>

      <div v-if="filteredDepts.length === 0 && !loading" class="empty-state">
        <el-icon><OfficeBuilding /></el-icon>
        <span>{{ filterText ? "未找到匹配的部门" : "暂无部门数据" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { Search, Check, OfficeBuilding } from "@element-plus/icons-vue"
import { listDepartmentTreeApi } from "@/api/department"

const props = defineProps({
  selectedIds: { type: Array as () => string[], default: () => [] }
})

const emits = defineEmits(["update-ids", "loaded"])

const filterText = ref("")
const allDepts = ref<any[]>([])
const loading = ref(false)
const selectedDeptIds = ref<string[]>([])
const currentPage = ref(1)
const pageSize = 10

const loadTree = async () => {
  loading.value = true
  try {
    const { data } = await listDepartmentTreeApi()

    // 扁平化部门树
    const flatten = (depts: any[], parentPath = ""): any[] => {
      let res: any[] = []
      depts.forEach((dept) => {
        const currentPath = parentPath ? `${parentPath} / ${dept.name}` : dept.name
        res.push({
          id: String(dept.id),
          name: dept.name,
          path: currentPath
        })
        if (dept.children?.length) {
          res = res.concat(flatten(dept.children, currentPath))
        }
      })
      return res
    }

    allDepts.value = flatten(data)
    emits("loaded", allDepts.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredDepts = computed(() => {
  if (!filterText.value) return allDepts.value
  const query = filterText.value.toLowerCase()
  return allDepts.value.filter((dept) => dept.path.toLowerCase().includes(query))
})

const paginatedDepts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredDepts.value.slice(start, end)
})

const isSelected = (id: string) => {
  return selectedDeptIds.value.includes(id)
}

const toggleDept = (id: string) => {
  const index = selectedDeptIds.value.indexOf(id)
  if (index > -1) {
    selectedDeptIds.value.splice(index, 1)
  } else {
    selectedDeptIds.value.push(id)
  }
  emits("update-ids", [...selectedDeptIds.value])
}

const handlePageChange = () => {
  // 页码变化时的处理，这里不需要额外逻辑
}

watch(filterText, () => {
  currentPage.value = 1
})

watch(
  () => props.selectedIds,
  (ids) => {
    selectedDeptIds.value = [...ids]
  },
  { immediate: true }
)

onMounted(() => {
  loadTree()
})
</script>

<style lang="scss" scoped>
.tree-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.search-wrapper {
  flex: 1;
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
.dept-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dept-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;

  .dept-info {
    flex: 1;
    min-width: 0;
  }

  .dept-name {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dept-path {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .check-icon {
    font-size: 18px;
    color: #3b82f6;
    flex-shrink: 0;
  }

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  &.active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

    .dept-name {
      color: #1e40af;
    }

    .dept-path {
      color: #60a5fa;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #cbd5e1;
  text-align: center;

  .el-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  span {
    font-size: 13px;
  }
}

.pagination-wrapper {
  flex-shrink: 0;
  :deep(.el-pagination) {
    .btn-prev,
    .btn-next,
    .el-pagination__total {
      font-size: 12px;
    }
    .btn-prev,
    .btn-next {
      min-width: 24px;
      height: 24px;
      line-height: 24px;
    }
  }
}
</style>
