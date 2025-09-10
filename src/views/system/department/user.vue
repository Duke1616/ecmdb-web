<template>
  <DataTable
    :data="usersData"
    :columns="columns"
    :actions="actions"
    :show-pagination="true"
    :total="paginationData.total"
    :page-size="paginationData.pageSize"
    :current-page="paginationData.currentPage"
    :table-props="{ border: true }"
    @sizeChange="handleSizeChange"
    @currentChange="handleCurrentChange"
    @action="onAction"
  />
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { usePagination } from "@/common/composables/usePagination"
import { user } from "@/api/user/types/user"
import { listUsersByDepartmentApi } from "@/api/user"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

interface Props {
  departmentId: number
}
const props = defineProps<Props>()

// 表格列定义
const columns = [
  { prop: "username", label: "用户名", showOverflowTooltip: true },
  { prop: "display_name", label: "展示名称", showOverflowTooltip: true },
  { prop: "title", label: "岗位", showOverflowTooltip: true },
  { prop: "email", label: "邮箱", showOverflowTooltip: true }
]

// 操作按钮
const actions = [{ key: "revoke", label: "移除组", type: "danger" as const, plain: true, size: "small" as const }]

// 数据源
const usersData = ref<user[]>([])
const listUsersData = () => {
  listUsersByDepartmentApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    department_id: props.departmentId
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const handleRevoke = (row: user) => {
  console.log(row)
}

const onAction = (key: string, row: user) => {
  if (key === "revoke") handleRevoke(row)
}

defineExpose({ listUsersData })
// 监听分页参数变化
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })
</script>

<style lang="scss" scoped>
/* DataTable 自带分页容器与滚动，这里仅保留卡片间距适配 */
:deep(.pagination-container) {
  justify-content: flex-end;
}
</style>
