<template>
  <el-card shadow="never">
    <div class="table-wrapper">
      <el-table
        :data="usersData"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="username" label="用户名" align="center" />
        <el-table-column prop="display_name" label="展示名称" align="center" />
        <el-table-column prop="title" label="岗位" align="center" />
        <el-table-column prop="email" label="邮箱" align="center" />
        <el-table-column prop="withdraw" fixed="right" label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="danger" text bg size="small" @click="handleRevoke(scope.row)">移除组</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :currentPage="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { user } from "@/api/user/types/user"
import { listUsersByDepartmentApi } from "@/api/user"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

interface Props {
  departmentId: number
}
const props = defineProps<Props>()

/** 查询模版列表 */
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

defineExpose({ listUsersData })
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })
</script>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
