<template>
  <div class="dept-user-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" class="u-gov-btn" @click="handleAddMembers"> 添加成员 </el-button>
    </div>

    <!-- 用户列表数据表格 -->
    <DataTable
      :data="usersData"
      :columns="columns"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 主身份信息 -->
      <template #user_info="{ row }">
        <AssetIdentityCell :title="row.nickname || row.username" :sub-title="row.username" centered />
      </template>

      <!-- 操作权限: 移出部门 -->
      <template #actions="{ row }">
        <OperateBtn :items="userOperateItems" :operate-item="row" :max-length="1" @route-event="handleOperate" />
      </template>
    </DataTable>

    <!-- 用户选择对话框 -->
    <UserSelectDialog
      v-model="userSelectVisible"
      :exclude-codes="existingUsernames"
      :confirm-loading="submitting"
      @confirm="handleConfirmAssign"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue"
import { Plus, Delete } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import DataTable from "@/common/components/DataTable/index.vue"
import AssetIdentityCell from "@/common/components/AssetIdentityCell/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { usePagination } from "@/common/composables/usePagination"
import { listDeptMembersApi, assignUsersToDeptApi, removeUsersFromDeptApi } from "@/api/iam/department"
import type { IDeptUser } from "@/api/iam/department/type"
import type { User as ISelectUser } from "@/api/iam/user/type"
import UserSelectDialog from "@/pages/iam/user/components/UserSelectDialog.vue"

interface IDepartmentUserProps {
  departmentId: number
}

const props = defineProps<IDepartmentUserProps>()

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 数据源
const usersData = ref<IDeptUser[]>([])
const userSelectVisible = ref(false)
const submitting = ref(false)

// 已存在用户的用户名列表，传给选择器过滤已存在用户
const existingUsernames = computed(() => {
  return usersData.value.map((u) => u.username)
})

// 表格列定义
const columns = [
  { label: "主身份信息", prop: "username", slot: "user_info", minWidth: 180, align: "center" as const },
  { label: "电子邮箱", prop: "email", minWidth: 160, align: "center" as const },
  { label: "手机号", prop: "phone", width: 140, align: "center" as const }
]

// 操作按钮配置
const userOperateItems = [{ name: "移出部门", code: "revoke", type: "danger" as const, icon: Delete }]

const handleOperate = (row: IDeptUser, code: string) => {
  if (code === "revoke") {
    handleRevoke(row)
  }
}

/**
 * 查询部门下的用户列表
 */
const listUsersData = () => {
  if (!props.departmentId) {
    usersData.value = []
    paginationData.total = 0
    return
  }
  listDeptMembersApi({
    dept_id: props.departmentId,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    keyword: ""
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.members || []
    })
    .catch(() => {
      usersData.value = []
      paginationData.total = 0
    })
}

/**
 * 点击添加成员按钮
 */
const handleAddMembers = () => {
  if (!props.departmentId) {
    ElMessage.warning("请选择一个部门")
    return
  }
  userSelectVisible.value = true
}

/**
 * 确定分配选中的用户到当前部门
 */
const handleConfirmAssign = async (selectedUsers: ISelectUser[]) => {
  if (selectedUsers.length === 0) return
  submitting.value = true
  try {
    const userIds = selectedUsers.map((u) => u.id)
    await assignUsersToDeptApi({
      dept_id: props.departmentId,
      user_ids: userIds
    })
    ElMessage.success("分配成员成功")
    userSelectVisible.value = false
    listUsersData()
  } catch (error: any) {
    console.error("分配成员失败:", error)
  } finally {
    submitting.value = false
  }
}

/**
 * 移出部门成员
 */
const handleRevoke = (row: IDeptUser) => {
  ElMessageBox.confirm(`确定要将用户 "${row.nickname || row.username}" 从当前部门中移出吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await removeUsersFromDeptApi({
        dept_id: props.departmentId,
        user_ids: [row.id]
      })
      ElMessage.success("移出成员成功")
      listUsersData()
    } catch (error: any) {
      console.error("移出成员失败:", error)
    }
  })
}

defineExpose({ listUsersData })

// NOTE: 监听部门 ID 和分页参数变化，并在初次挂载时立即加载数据。当部门 ID 发生变化时，如果当前页码不为 1，则将其重置为 1 并立即返回以避免重复加载。页码变为 1 后会重新触发此 watch，发起仅一次的网络请求。
watch(
  [() => props.departmentId],
  ([newDeptId], [oldDeptId]) => {
    if (newDeptId !== oldDeptId) {
      if (paginationData.currentPage !== 1) {
        paginationData.currentPage = 1
        return
      }
    }
    listUsersData()
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.dept-user-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.u-gov-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 13px;

  &:hover {
    transform: translateY(-1px);
  }
}

:deep(.pagination-container) {
  justify-content: flex-end;
}
</style>
