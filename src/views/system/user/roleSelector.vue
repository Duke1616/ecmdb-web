<template>
  <div class="role-selector-container">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-container">
        <el-input
          v-model="filterInput"
          size="large"
          placeholder="输入角色名称或编码进行搜索..."
          :prefix-icon="Search"
          class="search-input"
        />
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-wrapper">
      <!-- 左侧：角色列表 -->
      <div class="role-panel">
        <div class="panel-header">
          <h4 class="panel-title">可选角色</h4>
          <span class="selection-count">已选择 {{ checkedKeys.length }} 个</span>
        </div>
        <div class="role-list-wrapper">
          <div class="role-list">
            <div v-for="role in filteredRoles" :key="role.id" class="role-card" @click="toggleRole(role)">
              <div class="role-checkbox">
                <el-checkbox :model-value="isRoleSelected(role)" @change="toggleRole(role)" @click.stop />
              </div>
              <div class="role-info">
                <div class="role-header">
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-code">{{ role.code }}</span>
                </div>
                <div class="role-desc">{{ role.desc || "暂无描述" }}</div>
              </div>
            </div>
            <div v-if="filteredRoles.length === 0" class="empty-state">
              <el-empty description="暂无可选角色" :image-size="80" />
            </div>
          </div>
        </div>
        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="paginationData.currentPage"
            v-model:page-size="paginationData.pageSize"
            :page-sizes="paginationData.pageSizes"
            :total="paginationData.total"
            :layout="paginationData.layout"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 右侧：已选择角色 -->
      <div class="selection-panel">
        <div class="panel-header">
          <h4 class="panel-title">已选择角色</h4>
          <span class="selection-count">已选择 {{ selectedRolesCount }} 个</span>
        </div>
        <div class="selected-role-list-wrapper">
          <div v-if="selectedRolesCount === 0" class="empty-state">
            <el-icon class="empty-icon"><User /></el-icon>
            <p class="empty-text">暂无选择的角色</p>
            <p class="empty-hint">请在左侧选择需要分配的角色权限</p>
          </div>
          <div v-else class="selected-role-list">
            <div v-for="role in getSelectedRoles()" :key="role.id" class="role-card selected">
              <div class="role-info">
                <div class="role-header">
                  <span class="role-name">{{ role.name }}</span>
                  <span class="role-code">{{ role.code }}</span>
                </div>
                <div class="role-desc">{{ role.desc || "暂无描述" }}</div>
              </div>
              <button class="remove-btn" @click="removeRole(role)" title="移除">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { Search, Close, User } from "@element-plus/icons-vue"
import type { role } from "@/api/role/types/role"
import { listRolesApi } from "@/api/role"
import { usePagination } from "@/common/composables/usePagination"

interface Props {
  defaultSelectedRoles?: string[]
  userId?: number
}

const props = defineProps<Props>()

const init = {
  currentPage: 1,
  pageSize: 10,
  layout: "prev, pager, next"
}

// 使用分页组合式函数
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

// 响应式数据
const filterInput = ref("")
const allRoles = ref<role[]>([]) // 当前页的角色数据
const checkedKeys = ref<string[]>([]) // 已选择的角色代码
const selectedRolesData = ref<role[]>([]) // 已选择的角色完整数据

// 计算属性
const selectedRolesCount = computed(() => checkedKeys.value.length)

// 过滤后的角色列表（当前页）
const filteredRoles = computed(() => {
  let roles = allRoles.value

  // 如果有搜索关键词，先过滤
  if (filterInput.value) {
    const keyword = filterInput.value.toLowerCase()
    roles = roles.filter(
      (role) =>
        role.name.toLowerCase().includes(keyword) ||
        role.code.toLowerCase().includes(keyword) ||
        (role.desc && role.desc.toLowerCase().includes(keyword))
    )
  }

  return roles
})

// 加载缺失的角色数据
const loadMissingRoles = async (roleCodes: string[]) => {
  try {
    // 这里需要调用API根据角色代码获取角色详细信息
    // 由于当前API可能不支持按代码查询，我们使用搜索功能
    const searchPromises = roleCodes.map(async (code) => {
      try {
        // 使用搜索API查找角色
        const { data } = await listRolesApi({
          offset: 0,
          limit: 1000,
          keyword: code // 使用角色代码作为搜索关键词
        } as any)

        // 从搜索结果中找到匹配的角色
        const matchedRole = data.roles?.find((role: role) => role.code === code)
        if (matchedRole) {
          return matchedRole
        }
        return null
      } catch (error) {
        console.error(`加载角色 ${code} 失败:`, error)
        return null
      }
    })

    const results = await Promise.all(searchPromises)
    const validRoles = results.filter((role) => role !== null)

    if (validRoles.length > 0) {
      // 将找到的角色添加到已选择数据中
      selectedRolesData.value = [...selectedRolesData.value, ...validRoles]
    }
  } catch (error) {
    console.error("加载缺失角色数据失败:", error)
  }
}

// 根据角色代码加载已选择的角色数据
const loadSelectedRolesData = async (roleCodes: string[]) => {
  try {
    // 从当前页数据中匹配角色
    const currentPageSelectedRoles = allRoles.value.filter((role) => roleCodes.includes(role.code))

    // 保留已存在的角色数据（来自其他页面）
    const existingRoles = selectedRolesData.value.filter((role) => !roleCodes.includes(role.code))

    // 合并数据：已存在的角色 + 当前页匹配的角色
    selectedRolesData.value = [...existingRoles, ...currentPageSelectedRoles]

    // 如果当前页没有包含所有已选择的角色，需要额外加载
    const missingCodes = roleCodes.filter((code) => !selectedRolesData.value.some((role) => role.code === code))
    if (missingCodes.length > 0) {
      // 调用API获取缺失的角色信息
      await loadMissingRoles(missingCodes)
    }
  } catch (error) {
    console.error("加载已选择角色数据失败:", error)
  }
}

// 监听 defaultSelectedRoles 变化
watch(
  () => props.defaultSelectedRoles,
  (newRoles) => {
    if (newRoles && Array.isArray(newRoles) && newRoles.length > 0) {
      checkedKeys.value = [...newRoles]
      // 如果已经有角色数据，立即加载已选择的角色
      if (allRoles.value.length > 0) {
        loadSelectedRolesData(newRoles)
      }
    } else {
      checkedKeys.value = []
      selectedRolesData.value = []
    }
  },
  { immediate: true }
)

// 监听搜索关键词变化，添加防抖
let searchTimer: NodeJS.Timeout | null = null
watch(
  () => filterInput.value,
  () => {
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    searchTimer = setTimeout(() => {
      // 搜索时重置到第一页
      paginationData.currentPage = 1
      loadRolesData()
    }, 500) // 500ms 防抖
  }
)

// 初始化时加载角色数据
onMounted(() => {
  loadRolesData()
})

// 加载角色数据
const loadRolesData = async () => {
  try {
    const params: any = {
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    }

    // 如果有搜索关键词，添加到参数中
    if (filterInput.value.trim()) {
      params.keyword = filterInput.value.trim()
    }

    const { data } = await listRolesApi(params)

    allRoles.value = data.roles || []
    paginationData.total = data.total || 0

    // 更新已选择的角色数据（从当前页数据中匹配）
    if (checkedKeys.value.length > 0) {
      // 调用 loadSelectedRolesData 来处理已选择的角色
      loadSelectedRolesData(checkedKeys.value)
    } else if (props.defaultSelectedRoles && props.defaultSelectedRoles.length > 0) {
      // 如果是初始化且有默认选中的角色，重新加载
      loadSelectedRolesData(props.defaultSelectedRoles)
    }
  } catch (error) {
    console.error("获取角色数据失败:", error)
    allRoles.value = []
    paginationData.total = 0
  }
}

// 监听分页变化，重新加载数据
watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  loadRolesData()
})

// 判断角色是否被选中
const isRoleSelected = (role: role): boolean => {
  return checkedKeys.value.includes(role.code)
}

// 切换角色选中状态
const toggleRole = (role: role) => {
  const index = checkedKeys.value.indexOf(role.code)
  if (index > -1) {
    // 取消选择
    checkedKeys.value.splice(index, 1)
    // 从已选择数据中移除
    const selectedIndex = selectedRolesData.value.findIndex((r) => r.code === role.code)
    if (selectedIndex > -1) {
      selectedRolesData.value.splice(selectedIndex, 1)
    }
  } else {
    // 选择角色
    checkedKeys.value.push(role.code)
    // 添加到已选择数据中
    selectedRolesData.value.push(role)
  }
}

// 移除角色
const removeRole = (role: role) => {
  const index = checkedKeys.value.indexOf(role.code)
  if (index > -1) {
    checkedKeys.value.splice(index, 1)
  }
  // 从已选择数据中移除
  const selectedIndex = selectedRolesData.value.findIndex((r) => r.code === role.code)
  if (selectedIndex > -1) {
    selectedRolesData.value.splice(selectedIndex, 1)
  }
}

// 获取已选择的角色信息
const getSelectedRoles = (): role[] => {
  return selectedRolesData.value
}
</script>

<style lang="scss" scoped>
/* 角色选择器容器 */
.role-selector-container {
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.search-section {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
  flex-shrink: 0;

  .search-container {
    display: flex;
    align-items: center;

    .search-input {
      width: 100%;

      :deep(.el-input__wrapper) {
        background: #f9fafb;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 0 12px;
        height: 40px;
        transition: all 0.2s ease;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
          background: #ffffff;
        }

        &.is-focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        color: #111827;
        font-weight: 400;

        &::placeholder {
          color: #6b7280;
          font-weight: 400;
        }
      }

      :deep(.el-input__prefix) {
        color: #6b7280;
        font-size: 16px;
      }
    }
  }
}

/* 主要内容区域 */
.content-wrapper {
  display: flex;
  gap: 12px;
  flex: 1;
  min-height: 0;

  @media (max-width: 1199px) {
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 1200px) {
    flex-direction: row;
  }
}

/* 左侧：角色面板 */
.role-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 右侧：已选择角色面板 */
.selection-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    padding: 14px 0;
  }
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .selection-count {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
}

/* 角色列表包装器 */
.role-list-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 角色列表 */
.role-list {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

/* 已选择角色列表包装器 */
.selected-role-list-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 已选择角色列表 */
.selected-role-list {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;

  /* 自定义滚动条 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

/* 分页样式 */
.pagination-wrapper {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  justify-content: center;

  :deep(.el-pagination) {
    .el-pagination__total {
      color: #64748b;
      font-size: 12px;
    }

    .el-pagination__sizes {
      .el-select {
        .el-input__wrapper {
          height: 28px;
          font-size: 12px;
        }
      }
    }

    .el-pager li {
      min-width: 28px;
      height: 28px;
      line-height: 28px;
      font-size: 12px;
    }

    .btn-prev,
    .btn-next {
      width: 28px;
      height: 28px;
      font-size: 12px;
    }
  }
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;

  .empty-icon {
    font-size: 36px;
    color: #cbd5e1;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    margin: 0 0 6px 0;
  }

  .empty-hint {
    font-size: 12px;
    color: #94a3b8;
    margin: 0;
  }
}

.role-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.15s ease;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .role-checkbox {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .role-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .role-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .role-name {
      font-size: 13px;
      font-weight: 500;
      color: #111827;
    }

    .role-code {
      font-size: 11px;
      color: #6b7280;
      font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
      background: #f3f4f6;
      padding: 1px 4px;
      border-radius: 3px;
    }

    .role-desc {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
    }
  }

  .remove-btn {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
      transform: scale(1.1);
    }

    .el-icon {
      font-size: 14px;
    }
  }
}
</style>
