<template>
  <div class="never">
    <div class="header">
      <el-button type="primary" @click="refreshCacheLdap"> 刷新缓存 </el-button>
      <el-input
        v-model="filterInput"
        size="default"
        placeholder="输入用户名称进行搜索"
        :suffix-icon="Search"
        @input="debouncedSearch"
        style="width: 200px"
      />
    </div>
    <div class="table-wrapper">
      <el-table
        :data="usersData"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="username" label="用户名称" align="center" />
        <el-table-column prop="display_name" label="显示名称" align="center" />
        <el-table-column prop="title" width="150" label="岗位" align="center" />
        <el-table-column prop="is_system_exist" label="已存在" align="center">
          <template #default="scope">
            <span v-if="scope.row.is_system_exist">
              <el-icon :size="16" style="color: green"><Check /></el-icon>
            </span>
            <span v-else>
              <el-icon :size="16" style="color: red"><Close /></el-icon>
            </span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="100" align="center">
          <template #default="scope">
            <el-button type="primary" plain text bg size="small" @click="handleSync(scope.row)">补充信息</el-button>
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
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { refreshCacheLdapApi, searchLdapUserApi } from "@/api/user"
import { Search } from "@element-plus/icons-vue"
import { user } from "@/api/user/types/ldap"
import { usePagination } from "@/hooks/usePagination"
import { debounce } from "lodash-es"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 6,
  layout: "total, prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

const filterInput = ref<string>("")
const usersData = ref<user[]>([])
const searchLdapUser = () => {
  searchLdapUserApi({
    keywords: filterInput.value,
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

const refreshCacheLdap = () => {
  refreshCacheLdapApi()
    .then(({ data }) => {
      console.log("data", data)

      if (paginationData.currentPage === 1) {
        searchLdapUser()
      } else {
        paginationData.currentPage = 1
      }
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const handleSync = (row: user) => {
  console.log(row)
}

const debouncedSearch = debounce(() => {
  paginationData.currentPage = 1
  searchLdapUser()
}, 388)

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], searchLdapUser, { immediate: true })
</script>
<style lang="scss">
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
</style>
