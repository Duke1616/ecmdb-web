<template>
  <div class="role-manager">
    <!-- 主内容区域 -->
    <div class="manager-content">
      <!-- 头部区域 -->
      <div class="manager-header">
        <div class="header-left">
          <h2 class="manager-title">角色管理</h2>
          <p class="manager-subtitle">管理系统角色和权限分配</p>
        </div>
        <div class="header-right">
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true" class="action-btn">
            新增角色
          </el-button>
          <el-button type="danger" :icon="Delete" @click="handleDelete" class="action-btn danger"> 批量删除 </el-button>
          <el-tooltip content="刷新数据">
            <el-button type="primary" :icon="RefreshRight" circle @click="listRolesData" class="refresh-btn" />
          </el-tooltip>
        </div>
      </div>

      <div class="content-card">
        <!-- 表格区域 -->
        <div class="table-container">
          <el-table :data="rolesData" class="role-table" stripe height="100%">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="name" label="角色名称" align="center" min-width="120">
              <template #default="scope">
                <div class="role-name">
                  <el-icon class="role-icon"><User /></el-icon>
                  <span>{{ scope.row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="code" label="角色编码" align="center" min-width="120">
              <template #default="scope">
                <el-tag type="info" effect="plain" class="code-tag">{{ scope.row.code }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="角色状态" align="center" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === true" type="success" effect="dark" class="status-tag">
                  <el-icon><Check /></el-icon>
                  启用
                </el-tag>
                <el-tag v-if="scope.row.status === false" type="danger" effect="dark" class="status-tag">
                  <el-icon><Close /></el-icon>
                  禁用
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" align="center" min-width="200" show-overflow-tooltip />
            <el-table-column fixed="right" label="操作" width="320" align="center">
              <template #default="scope">
                <div class="action-buttons">
                  <el-button type="primary" plain size="small" @click="handleUpdate(scope.row)" class="action-btn">
                    <el-icon><Edit /></el-icon>
                    修改
                  </el-button>
                  <el-button
                    type="success"
                    plain
                    size="small"
                    @click="handleMenuPermission(scope.row)"
                    class="action-btn"
                  >
                    <el-icon><Menu /></el-icon>
                    菜单权限
                  </el-button>
                  <el-button type="danger" plain size="small" @click="handleDeleteSingle(scope.row)" class="action-btn">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 分页器 -->
        <div class="pagination-container">
          <el-pagination
            background
            :layout="paginationData.layout"
            :page-sizes="paginationData.pageSizes"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :currentPage="paginationData.currentPage"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            class="pagination"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      @closed="resetForm"
      :show-close="false"
      :with-header="false"
      class="role-dialog"
      :close-on-click-modal="false"
    >
      <createOrUpdate ref="apiRef" @list-roles="listRolesData" @close="dialogVisible = false" />
    </el-dialog>

    <!-- 菜单权限分配对话框 -->
    <el-dialog
      v-model="dialogPermission"
      :show-close="false"
      :with-header="false"
      @closed="closeMenePermission"
      width="60%"
      class="permission-dialog"
      :close-on-click-modal="false"
    >
      <MenuPermission ref="menuRef" @confirm="handleMenuPermissionConfirm" @cancel="closeMenePermission" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listRolesApi } from "@/api/role"
import { changeRoleMenuPermissionApi } from "@/api/permission"
import { role } from "@/api/role/types/role"
import { CirclePlus, RefreshRight, Delete, User, Check, Close, Edit, Menu } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import createOrUpdate from "./createOrUpdate.vue"
import MenuPermission from "./menu.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogPermission = ref<boolean>(false)
const isEditMode = ref<boolean>(false)

const apiRef = ref<InstanceType<typeof createOrUpdate>>()
const menuRef = ref<InstanceType<typeof MenuPermission>>()

const closeMenePermission = () => {
  dialogPermission.value = false
}

const handleUpdate = (row: role) => {
  isEditMode.value = true
  dialogVisible.value = true

  nextTick(() => {
    apiRef.value?.setFrom(row)
  })
}

const handleMenuPermissionConfirm = async (selectedMenus: any[]) => {
  try {
    console.log("确认分配菜单权限:", selectedMenus)

    // 提取选中的菜单ID
    const selectedMenuIds = selectedMenus.map((menu) => menu.id)

    // 调用保存菜单权限的API
    const { data } = await changeRoleMenuPermissionApi(selectedMenuIds, roleCode.value)

    if (data) {
      ElMessage.success("菜单权限分配成功")
      closeMenePermission()
      // 刷新角色列表
      listRolesData()
    }
  } catch (error) {
    console.error("保存菜单权限失败:", error)
    ElMessage.error("菜单权限分配失败")
  }
}

const roleCode = ref<string>("")
const handleMenuPermission = (row: role) => {
  dialogPermission.value = true
  roleCode.value = row.code

  nextTick(() => {
    menuRef.value?.getMenuPermissionData(roleCode.value)
  })
}

const handleDelete = () => {}

const handleDeleteSingle = async (row: role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 这里调用删除API
    // await deleteRoleApi(row.id)

    ElMessage.success("删除成功")
    listRolesData()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  }
}
const resetForm = () => {
  apiRef.value?.resetForm()
  isEditMode.value = false
}

/** 查询模版列表 */
const rolesData = ref<role[]>([])
const listRolesData = () => {
  listRolesApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      rolesData.value = data.roles
    })
    .catch(() => {
      rolesData.value = []
    })
    .finally(() => {})
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRolesData, { immediate: true })
</script>

<style lang="scss" scoped>
/* 角色管理器容器 */
.role-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

/* 头部区域 */
.manager-header {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 70px;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .manager-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    .manager-subtitle {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 400;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    height: 36px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.danger {
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    }
  }

  .refresh-btn {
    width: 36px;
    height: 36px;
    transition: all 0.3s ease;

    &:hover {
      transform: rotate(180deg) translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }
}

/* 主内容区域 */
.manager-content {
  flex: 1;
  padding: 24px 24px;
  overflow-y: auto;
}

.content-card {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 200px);
}

/* 表格容器 */
.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
}

/* 表格样式 */
.role-table {
  flex: 1;
  width: 100%;

  :deep(.el-table) {
    height: 100%;
  }

  :deep(.el-table__body-wrapper) {
    overflow-y: auto;
  }

  :deep(.el-table__header) {
    background: #f8fafc;

    th {
      background: #f8fafc !important;
      color: #374151;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
      vertical-align: middle;
      height: 36px;
      padding: 6px 8px;

      @media (max-width: 768px) {
        height: 32px;
        padding: 4px 6px;
        font-size: 13px;
      }
    }
  }

  :deep(.el-table__body) {
    tr {
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%) !important;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }

      td {
        vertical-align: middle;
        height: 44px;
        padding: 6px 8px;

        @media (max-width: 768px) {
          height: 38px;
          padding: 4px 6px;
        }
      }
    }
  }

  .role-name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: #1e293b;
    justify-content: center;
    min-height: 20px;

    @media (max-width: 768px) {
      gap: 4px;
      min-height: 18px;
      font-size: 13px;
    }

    .role-icon {
      color: #3b82f6;
      font-size: 13px;
      flex-shrink: 0;

      @media (max-width: 768px) {
        font-size: 12px;
      }
    }

    span {
      flex: 1;
      text-align: center;
    }
  }

  .code-tag {
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 10px;
    padding: 2px 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 18px;

    @media (max-width: 768px) {
      font-size: 9px;
      padding: 2px 4px;
      min-height: 16px;
    }
  }

  .status-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-weight: 500;
    min-height: 18px;
    justify-content: center;
    font-size: 10px;

    @media (max-width: 768px) {
      font-size: 9px;
      min-height: 16px;
      gap: 1px;
    }
  }

  .action-buttons {
    display: flex;
    gap: 4px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      gap: 3px;
      flex-direction: column;
      align-items: stretch;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 3px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 500;
      transition: all 0.3s ease;
      white-space: nowrap;
      min-height: 20px;

      @media (max-width: 768px) {
        padding: 2px 4px;
        font-size: 9px;
        min-height: 18px;
        justify-content: center;
      }

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
    }
  }
}

/* 分页器 */
.pagination-container {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
  margin-top: auto;

  .pagination {
    :deep(.el-pagination__total),
    :deep(.el-pagination__jump) {
      color: #64748b;
      font-weight: 500;
      font-size: 12px;

      @media (max-width: 768px) {
        font-size: 11px;
      }
    }

    @media (max-width: 768px) {
      :deep(.el-pagination__sizes) {
        display: none;
      }

      :deep(.el-pagination__jump) {
        display: none;
      }
    }

    :deep(.el-pager li) {
      border-radius: 6px;
      margin: 0 2px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
      }

      &.is-active {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      }
    }

    :deep(.btn-prev),
    :deep(.btn-next) {
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
      }
    }
  }
}

/* 对话框样式 */
.role-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }
}

.permission-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;
    padding: 20px 24px;

    .el-dialog__title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-container {
    padding: 16px;
  }

  .toolbar-wrapper {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;

    .toolbar-right {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .table-wrapper {
    padding: 0 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
