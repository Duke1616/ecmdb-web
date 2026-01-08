<template>
  <div class="matrix-permission-page">
    <PageContainer>
      <!-- 页面头部 -->
      <ManagerHeader
        title="矩阵权限配置"
        :subtitle="getSubtitle()"
        :show-back-button="true"
        :show-add-button="false"
        :show-refresh-button="false"
        :sticky="true"
        @back="goBack"
      >
        <template #actions>
          <el-select
            v-model="selectedPlatforms"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="选择平台过滤"
            clearable
            style="width: 200px; margin-right: 12px"
            size="default"
          >
            <el-option v-for="platform in PLATFORMS" :key="platform.id" :label="platform.name" :value="platform.id" />
          </el-select>
          <el-button @click="handleToggleSelectAll" class="action-btn">
            <el-icon>
              <component :is="isAllSelected ? Close : Check" />
            </el-icon>
            {{ isAllSelected ? "取消全选" : "全选" }}
          </el-button>
          <el-button @click="handleReset" :loading="loading" class="action-btn">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button type="primary" @click="handleSave" :loading="saving" class="action-btn">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </template>
      </ManagerHeader>

      <!-- 表格 -->
      <div class="scrollable-content">
        <div v-loading="loading" class="table-container">
          <DataTable
            :data="flatMenuList"
            :columns="tableColumns"
            :show-selection="false"
            :show-pagination="false"
            :table-props="{ border: true }"
          >
            <!-- 菜单名称列 -->
            <template #menuName="{ row }">
              <div class="menu-cell" :style="row.level > 0 ? { paddingLeft: `${row.level * 20}px` } : {}">
                <el-checkbox
                  :model-value="checkedKeys.includes(row.id)"
                  @change="(val) => handleCheck(row, val as boolean)"
                >
                  {{ row.meta?.title || row.name }}
                </el-checkbox>
              </div>
            </template>

            <!-- 操作权限列 -->
            <template #permissions="{ row }">
              <div v-if="row.actions && row.actions.length > 0" class="actions-cell">
                <el-checkbox
                  v-for="action in row.actions"
                  :key="action.id"
                  :model-value="checkedKeys.includes(action.id)"
                  @change="(val) => handleCheck(action, val as boolean)"
                  size="small"
                >
                  {{ action.meta?.title || action.name }}
                </el-checkbox>
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { Check, Close, RefreshLeft } from "@element-plus/icons-vue"
import { ElMessageBox } from "element-plus"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import { useMatrixPermission } from "./composables/useMatrixPermission"
import { PLATFORMS } from "@/common/constants/platforms"

const route = useRoute()
const router = useRouter()

const roleCode = ref(route.params.roleCode as string)
const roleName = ref((route.query.roleName as string) || roleCode.value)

const {
  checkedKeys,
  loading,
  saving,
  menuTreeData,
  flatMenuList,
  selectedPlatforms,
  loadPermissionData,
  handleCheck,
  toggleSelectAll,
  savePermission,
  resetPermission
} = useMatrixPermission()

// 表格列配置
const tableColumns = [
  {
    prop: "menuName",
    label: "菜单名称",
    minWidth: 70,
    align: "center" as const,
    slot: "menuName"
  },
  {
    prop: "permissions",
    label: "操作权限",
    minWidth: 400,
    slot: "permissions"
  }
]

const isAllSelected = computed(() => {
  const getAllIds = (menus: typeof menuTreeData.value): number[] => {
    const ids: number[] = []
    menus.forEach((menu) => {
      ids.push(menu.id)
      if (menu.children) {
        ids.push(...getAllIds(menu.children))
      }
    })
    return ids
  }
  const allIds = getAllIds(menuTreeData.value)
  return allIds.length > 0 && allIds.every((id) => checkedKeys.value.includes(id))
})

// 获取副标题，显示过滤状态
const getSubtitle = () => {
  let subtitle = `${roleName.value} · 已选 ${checkedKeys.value.length} 项`

  if (selectedPlatforms.value.length > 0) {
    const platformNames = selectedPlatforms.value.map((id) => PLATFORMS.find((p) => p.id === id)?.name || id).join(", ")
    subtitle += ` · 过滤: ${platformNames}`
  }

  return subtitle
}

const handleToggleSelectAll = () => toggleSelectAll()

const handleSave = async () => {
  await savePermission(roleCode.value)
}

const handleReset = async () => {
  try {
    await ElMessageBox.confirm("确定要重置吗？", "确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })
    await resetPermission(roleCode.value)
  } catch {
    // 用户取消
  }
}

const goBack = () => router.back()

onMounted(() => {
  loadPermissionData(roleCode.value)
})
</script>

<style lang="scss" scoped>
.matrix-permission-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.page-container) {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0;
    background: #f8fafc;
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.menu-cell {
  display: flex;
  align-items: center;
  min-height: 40px;

  :deep(.el-checkbox) {
    .el-checkbox__label {
      font-size: 14px;
      font-weight: 450;
      color: #1e293b;
    }
  }
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  :deep(.el-checkbox) {
    margin-right: 0;

    .el-checkbox__label {
      font-size: 14px;
      font-weight: 450;
      color: #1e293b;
    }

    &.is-checked .el-checkbox__label {
      color: #3b82f6;
      font-weight: 500;
    }
  }
}
</style>
