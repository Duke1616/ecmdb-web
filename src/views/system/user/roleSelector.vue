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
        <div class="role-list">
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

    <!-- 底部按钮 -->
    <div class="role-footer">
      <el-button @click="handleCancel" class="footer-btn footer-btn-cancel" size="large"> 取消 </el-button>
      <el-button
        type="primary"
        @click="handleConfirm"
        class="footer-btn footer-btn-confirm"
        size="large"
        :disabled="selectedRolesCount === 0"
      >
        确认选择 ({{ selectedRolesCount }})
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { Search, Close } from "@element-plus/icons-vue"
import type { role } from "@/api/role/types/role"
import { listRolesApi } from "@/api/role"
import { usePagination } from "@/common/composables/usePagination"

interface Props {
  defaultSelectedRoles?: string[]
  userId?: number
}

interface Emits {
  (e: "confirm", roles: Array<{ id: number; name: string; code: string; desc: string }>): void
  (e: "cancel"): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

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

// 处理取消
const handleCancel = () => {
  emits("cancel")
}

// 确认时返回角色数据
const handleConfirm = () => {
  const selectedRoles = getSelectedRoles()
  emits("confirm", selectedRoles)
}
</script>

<style lang="scss" scoped>
/* 角色选择器容器 */
.role-selector-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-section {
  padding: 0px 20px 4px;
  border-bottom: 1px solid #e2e8f0;

  .search-container {
    .search-input {
      :deep(.el-input__wrapper) {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 6px 10px;
        height: 32px;
        transition: all 0.3s ease;

        &:hover {
          border-color: #cbd5e1;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      }

      :deep(.el-input__inner) {
        font-size: 11px;
        color: #1e293b;
        font-weight: 500;
      }

      :deep(.el-input__prefix) {
        color: #64748b;
      }
    }
  }
}

/* 主要内容区域 */
.content-wrapper {
  display: flex;
  gap: 20px;
  padding: 20px;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 1199px) {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
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
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 50vh;
}

/* 右侧：已选择角色面板 */
.selection-panel {
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 50vh;
}

/* 面板头部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;

  .panel-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }

  .selection-count {
    font-size: 12px;
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    padding: 4px 12px;
    border-radius: 16px;
    font-weight: 500;
  }
}

/* 角色列表 */
.role-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(50vh - 100px); /* 调整高度计算，给内容更多空间 */

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
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #94a3b8;
}

.role-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 70px;
  flex-shrink: 0;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }

  &.selected {
    background: rgba(59, 130, 246, 0.05);
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
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
    }

    .role-code {
      font-size: 12px;
      color: #64748b;
      font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .role-desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      max-width: 100%;
      word-break: break-word;
      word-wrap: break-word;
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

.role-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0; /* 防止被压缩 */

  .footer-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 12px;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    min-width: 90px;

    &:hover {
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }

  .footer-btn-cancel {
    background: white;
    color: #64748b;
    border-color: #e2e8f0;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      color: #475569;
    }
  }

  .footer-btn-confirm {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-color: #3b82f6;

    &:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      border-color: #1d4ed8;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
}
</style>
