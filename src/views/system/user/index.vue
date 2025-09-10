<template>
  <div class="user-manager">
    <!-- 头部区域 -->
    <ManagerHeader
      title="用户管理"
      subtitle="管理系统用户和角色分配"
      add-button-text="新增用户"
      @add="handlerCreateUser"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" class="action-btn" @click="handlerCreateUser"> 新增用户 </el-button>
        <el-button type="success" :icon="User" class="action-btn" @click="handleSyncUser"> 同步用户 </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="usersData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
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
        <el-tag v-else-if="row.create_type === 2" type="success" effect="plain" class="type-tag" disable-transitions>
          LDAP
        </el-tag>
        <el-tag v-else type="info" effect="plain" class="type-tag" disable-transitions> 未知类型 </el-tag>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnItems" @routeEvent="handleOperateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
    <!-- 新增/编辑用户对话框 -->
    <FormDialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑用户' : '新增用户'"
      :subtitle="isEditMode ? '修改用户信息' : '创建新的用户'"
      width="500px"
      header-icon="User"
      @closed="onClosedCreateOrUpdae"
      @confirm="handlerSubmitUser"
      @cancel="onClosedCreateOrUpdae"
    >
      <Form ref="apiRef" @closed="onClosedCreateOrUpdae" @callback="listUsersData" />
    </FormDialog>

    <!-- 角色管理弹窗 -->
    <FormDialog
      v-model="dialogBindRole"
      title="角色分配"
      subtitle="为用户分配相应的角色权限"
      header-icon="UserFilled"
      confirm-text="确认分配"
      :show-footer-info="false"
      @closed="handleRoleCancel"
      @confirm="handleRoleDialogConfirm"
      @cancel="handleRoleCancel"
    >
      <RoleSelector
        v-if="dialogBindRole && selectedUser"
        :default-selected-roles="getUserRoleCodes()"
        :user-id="selectedUser.id"
        @confirm="handleRoleConfirm"
        @cancel="handleRoleCancel"
      />
    </FormDialog>

    <!-- 同步用户弹窗 -->
    <FormDialog
      v-model="dialogSyncUser"
      title="LDAP 用户同步"
      subtitle="从 LDAP 服务器同步用户信息"
      header-icon="Refresh"
      :show-footer="false"
      @closed="onClosedSyncUser"
    >
      <Sync ref="syncRef" @closed="onClosedSyncUser" @listUsersData="listUsersData" />
    </FormDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { User, Edit, UserFilled, RefreshRight } from "@element-plus/icons-vue"
import { listUsersApi, bindRoleCodesAPi } from "@/api/user"
import RoleSelector from "./roleSelector.vue"
import { user } from "@/api/user/types/user"
import Form from "./form.vue"
import Sync from "./sync.vue"
import { ElMessage } from "element-plus"
import DataTable from "@@/components/DataTable/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { FormDialog } from "@@/components/Dialogs"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogBindRole = ref<boolean>(false)
const dialogSyncUser = ref<boolean>(false)
const isEditMode = ref<boolean>(false)

const apiRef = ref<InstanceType<typeof Form>>()
const syncRef = ref<InstanceType<typeof Sync>>()

// 表格列配置
const tableColumns = [
  {
    prop: "username",
    label: "用户名称",
    slot: "userName"
  },
  {
    prop: "display_name",
    label: "显示名称",
  },
  {
    prop: "title",
    label: "岗位",
  },
  {
    prop: "create_type",
    label: "创建方式",
    slot: "createType"
  }
]

// 表格操作配置
// 操作按钮配置
const operateBtnItems = [
  { name: "修改", code: "edit", type: "primary", icon: Edit },
  { name: "绑定角色", code: "bindRole", type: "success", icon: UserFilled }
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
const handleOperateEvent = (operateItem: user, actionName: string) => {
  switch (actionName) {
    case "edit":
      handleUpdate(operateItem)
      break
    case "bindRole":
      handleBindRole(operateItem)
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

// 处理角色弹窗确认
const handleRoleDialogConfirm = () => {
  // 调用 RoleSelector 的确认方法
  // 这里需要从 RoleSelector 获取选中的角色
  ElMessage.info("角色分配功能已触发")
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
  isEditMode.value = false
  dialogVisible.value = true
}

const handleUpdate = (row: user) => {
  isEditMode.value = true
  dialogVisible.value = true
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
  isEditMode.value = false
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

/* 按钮样式 */
.action-btn {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.refresh-btn {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
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
