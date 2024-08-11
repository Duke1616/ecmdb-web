<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">新增</el-button>
          <!-- <el-button type="danger" :icon="Delete" @click="handleDelete">删除</el-button> -->
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listUsersData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="usersData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="username" label="用户名称" align="center" />
          <el-table-column prop="source_type" label="用户来源" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.source_type === 1" effect="plain" type="primary">系统</el-tag>
              <el-tag v-else-if="scope.row.source_type === 2" effect="plain" type="primary">LDAP</el-tag>
              <el-tag v-else type="info" effect="plain">未知类型</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="create_type" label="创建方式" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.create_type === 1" effect="plain" type="primary">系统同步</el-tag>
              <el-tag v-else-if="scope.row.create_type === 2" effect="plain" type="primary">登录创建</el-tag>
              <el-tag v-else type="info" effect="plain">未知类型</el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button type="primary" plain text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="success" plain text bg size="small" @click="handleBindRole(scope.row)">
                绑定角色
              </el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/user"
import { user } from "@/api/user/types/user"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>(false)
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
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const handleBindRole = (row: user) => {
  console.log(row)
}

const handleUpdate = (row: user) => {
  console.log(row)
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listUsersData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

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
