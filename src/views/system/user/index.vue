<template>
  <div class="user-manager">
    <!-- 头部区域 -->
    <div class="manager-header">
      <div class="header-left">
        <h2 class="manager-title">用户管理</h2>
        <p class="manager-subtitle">管理系统用户和角色分配</p>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerCreateUser">
          新增用户
        </el-button>
        <el-button type="success" :icon="User" class="action-btn" @click="handleSyncUser"> 同步用户 </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="manager-content">
      <div class="content-card">
        <!-- 表格区域 -->
        <div class="table-container">
          <DataTable
            :data="usersData"
            :columns="tableColumns"
            :actions="tableActions"
            :show-selection="true"
            :show-pagination="true"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            :page-sizes="paginationData.pageSizes"
            :pagination-layout="paginationData.layout"
            :table-props="{}"
            @action="handleTableAction"
            @selection-change="handleSelectionChange"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          >
            <!-- 用户名称插槽 -->
            <template #userName="{ row }">
              <div class="user-name">
                <span>{{ row.username }}</span>
              </div>
            </template>

            <!-- 创建方式插槽 -->
            <template #createType="{ row }">
              <el-tag v-if="row.create_type === 1" type="primary" effect="plain" class="type-tag" disable-transitions>
                SYSTEM
              </el-tag>
              <el-tag
                v-else-if="row.create_type === 2"
                type="success"
                effect="plain"
                class="type-tag"
                disable-transitions
              >
                LDAP
              </el-tag>
              <el-tag v-else type="info" effect="plain" class="type-tag" disable-transitions> 未知类型 </el-tag>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
    <div>
      <el-dialog v-model="dialogVisible" :before-close="onClosedCreateOrUpdae" :title="titel" width="500px">
        <createOrUpdate ref="apiRef" @closed="onClosedCreateOrUpdae" @callback="listUsersData" />
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="onClosedCreateOrUpdae">取消</el-button>
            <el-button type="primary" @click="handlerSubmitUser"> 保存 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    <!-- 角色管理弹窗 -->
    <el-dialog v-model="dialogBindRole" :show-close="false" :with-header="false" :close-on-click-modal="false">
      <RoleSelector
        v-if="dialogBindRole && selectedUser"
        :default-selected-roles="getUserRoleCodes()"
        :user-id="selectedUser.id"
        @confirm="handleRoleConfirm"
        @cancel="handleRoleCancel"
      />
    </el-dialog>

    <div>
      <el-dialog v-model="dialogSyncUser" title="LDAP 用户列表" width="700px">
        <Sync
          ref="syncRef"
          @closed="onClosedSyncUser"
          style="max-height: 70vh; overflow-y: auto"
          @listUsersData="listUsersData"
        />
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { CirclePlus, RefreshRight, User, Edit, UserFilled } from "@element-plus/icons-vue"
import { listUsersApi, bindRoleCodesAPi } from "@/api/user"
import RoleSelector from "./roleSelector.vue"
import { user } from "@/api/user/types/user"
import createOrUpdate from "./createOrUpdate.vue"
import Sync from "./sync.vue"
import { ElMessage } from "element-plus"
import DataTable from "@@/components/DataTable/index.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogBindRole = ref<boolean>(false)
const dialogSyncUser = ref<boolean>(false)

const apiRef = ref<InstanceType<typeof createOrUpdate>>()
const titel = ref<string>("")

// 表格列配置
const tableColumns = [
  {
    prop: "username",
    label: "用户名称",
    minWidth: 120,
    slot: "userName"
  },
  {
    prop: "display_name",
    label: "显示名称",
    minWidth: 120
  },
  {
    prop: "title",
    label: "岗位",
    minWidth: 120
  },
  {
    prop: "create_type",
    label: "创建方式",
    width: 120,
    slot: "createType"
  }
]

// 表格操作配置
const tableActions = [
  {
    key: "edit",
    label: "修改",
    type: "primary" as const,
    icon: Edit
  },
  {
    key: "bindRole",
    label: "绑定角色",
    type: "success" as const,
    icon: UserFilled
  }
]

const handleSyncUser = () => {
  dialogSyncUser.value = true
}

const onClosedSyncUser = () => {
  dialogSyncUser.value = false
}

const handleRefresh = () => {
  listUsersData()
}

// 表格操作处理
const handleTableAction = (key: string, row: user) => {
  switch (key) {
    case "edit":
      handleUpdate(row)
      break
    case "bindRole":
      handleBindRole(row)
      break
  }
}

// 选择变化处理
const handleSelectionChange = (selection: any[]) => {
  console.log("选中的用户:", selection)
}

/** 查询模版列表 */
const usersData = ref<user[]>([])

const listUsersData = () => {
  listUsersApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users

      reset()
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const selectedUser = ref<user>()

const reset = () => {
  selectedUser.value = undefined
}

const handleBindRole = (row: user) => {
  // 打开弹窗
  dialogBindRole.value = true

  // 数据传递
  selectedUser.value = row
}

// 获取用户的角色代码列表
const getUserRoleCodes = (): string[] => {
  // 这里可以根据需要从用户数据中获取角色代码
  return selectedUser.value?.role_codes || []
}

// 处理角色选择确认
const handleRoleConfirm = async (selectedRoles: Array<{ id: number; name: string; code: string; desc: string }>) => {
  if (!selectedUser.value) return

  try {
    const roleCodes = selectedRoles.map((role) => role.code)
    await bindRoleCodesAPi({
      id: selectedUser.value.id,
      role_codes: roleCodes
    })

    ElMessage.success("角色更新成功")
    dialogBindRole.value = false
    listUsersData() // 刷新用户列表
  } catch (error) {
    console.error("角色更新失败:", error)
    ElMessage.error("角色更新失败")
  }
}

// 处理角色选择取消
const handleRoleCancel = () => {
  dialogBindRole.value = false
}

const handlerCreateUser = () => {
  ElMessage.warning("暂不支持外部新增用户功能")
}

const handleUpdate = (row: user) => {
  dialogVisible.value = true
  titel.value = "修改用户"
  nextTick(() => {
    apiRef.value?.setFrom(row)
  })
}

const handlerSubmitUser = () => {
  apiRef.value?.submitForm()
}

const onClosedCreateOrUpdae = () => {
  apiRef.value?.resetForm()
  dialogVisible.value = false
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })
</script>

<style lang="scss" scoped>
/* 用户管理容器 */
.user-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}

/* 头部区域 */
.manager-header {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 65px;
  margin-bottom: 18px;

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .manager-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
    }

    .manager-subtitle {
      margin: 0;
      font-size: 13px;
      color: #64748b;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    height: 36px;
  }

  .refresh-btn {
    width: 36px;
    height: 36px;
  }
}

/* 主内容区域 */
.manager-content {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.content-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

/* 表格容器 */
.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

/* 用户名称样式 */
.user-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .user-icon {
    color: #3b82f6;
  }
}

/* 类型标签样式 */
.type-tag {
  font-size: 11px;
  font-weight: 500;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-manager {
    padding: 16px;
  }

  .manager-header {
    padding: 16px 20px;
    margin-bottom: 16px;

    .header-left {
      .manager-title {
        font-size: 16px;
      }

      .manager-subtitle {
        font-size: 12px;
      }
    }

    .header-right {
      gap: 8px;

      .action-btn {
        height: 32px;
        font-size: 12px;
        padding: 0 12px;
      }

      .refresh-btn {
        width: 32px;
        height: 32px;
      }
    }
  }
}
</style>
