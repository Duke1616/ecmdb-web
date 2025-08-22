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
            <el-button type="primary" plain text bg size="small" @click="handlerSyncLdapUser(scope.row)"
              >导入</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="footer">
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

      <div class="button">
        <el-button @click="onClosedSync">取消</el-button>
        <el-button type="primary" @click="handlerBatchSyncLdapUser"> 导入 </el-button>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :before-close="onClosedImportUser" title="导入用户" width="500px">
      <createOrUpdate ref="apiRef" @closed="onClosedImportUser" @callback="callback" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlerImportUser"> 确定 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from "vue"
import { refreshCacheLdapApi, searchLdapUserApi } from "@/api/user"
import { Search } from "@element-plus/icons-vue"
import { user } from "@/api/user/types/ldap"
import { usePagination } from "@/common/composables/usePagination"
import { debounce } from "lodash-es"
import { ElMessage } from "element-plus"
import createOrUpdate from "./createOrUpdate.vue"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 8,
  layout: "total, prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)
const dialogVisible = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof createOrUpdate>>()

const emits = defineEmits(["closed", "listUsersData"])
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

const callback = () => {
  searchLdapUser()
  emits("listUsersData")
}

// 关闭导入用户页面
const onClosedImportUser = () => {
  dialogVisible.value = false
}

// 关闭用户列表
const onClosedSync = () => {
  emits("closed")
}

const refreshCacheLdap = () => {
  refreshCacheLdapApi()
    .then(() => {
      if (paginationData.currentPage === 1) {
        searchLdapUser()
      } else {
        paginationData.currentPage = 1
      }

      ElMessage.success("刷新缓存成功")
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const handlerSyncLdapUser = (row: user) => {
  if (row.is_system_exist === true) {
    ElMessage.warning("该用户已存在, 无需导入")
    return
  }

  dialogVisible.value = true

  nextTick(() => {
    apiRef.value?.setSyncForm(row)
  })
}

const handlerImportUser = () => {
  apiRef.value?.submitForm()
}

const handlerBatchSyncLdapUser = () => {
  ElMessage.warning("暂不支持批量导入功能")
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

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
</style>
