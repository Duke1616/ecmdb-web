<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreateUser">新增</el-button>
          <el-button type="primary" :icon="User" @click="handleSyncUser">同步用户</el-button>
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
          <el-table-column prop="username" label="用户名称" align="center" />
          <el-table-column prop="display_name" label="显示名称" align="center" />
          <el-table-column prop="title" label="岗位" align="center" />
          <el-table-column prop="create_type" label="创建方式" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.create_type === 1" effect="plain" type="primary">SYSTEM</el-tag>
              <el-tag v-else-if="scope.row.create_type === 2" effect="plain" type="primary">LDAP</el-tag>
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
    <div>
      <el-dialog v-model="dialogBindRole" title="分配角色" width="800px">
        <Role
          ref="roleRef"
          @closed="handlerClousedRole"
          :roleCodes="codes ?? []"
          :userId="userId"
          @listUsersData="listUsersData"
        />
      </el-dialog>
    </div>

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
import { usePagination } from "@/hooks/usePagination"
import { CirclePlus, RefreshRight, User } from "@element-plus/icons-vue"
import { listUsersApi } from "@/api/user"
import Role from "./role.vue"
import { user } from "@/api/user/types/user"
import createOrUpdate from "./createOrUpdate.vue"
import Sync from "./sync.vue"
import { ElMessage } from "element-plus"

const roleRef = ref<InstanceType<typeof Role>>()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogBindRole = ref<boolean>(false)
const dialogSyncUser = ref<boolean>(false)

const apiRef = ref<InstanceType<typeof createOrUpdate>>()

const titel = ref<string>("")
const handlerClousedRole = () => {
  dialogBindRole.value = false
  roleRef.value?.onClosed()
  apiRef.value?.resetForm()
}

const handleSyncUser = () => {
  dialogSyncUser.value = true
}

const onClosedSyncUser = () => {
  dialogSyncUser.value = false
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

const codes = ref<string[]>([])
const userId = ref<number>()

const reset = () => {
  codes.value = []
  userId.value = 0
}
const handleBindRole = (row: user) => {
  // 打开弹窗
  dialogBindRole.value = true

  // 数据传递
  codes.value = row.role_codes
  userId.value = row.id
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
