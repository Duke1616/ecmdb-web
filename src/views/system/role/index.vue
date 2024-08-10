<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="dialogVisible = true">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listRolesData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="rolesData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="name" label="角色名称" align="center" />
          <el-table-column prop="code" label="角色编码" align="center" />
          <el-table-column prop="status" label="角色状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === true" type="primary" effect="plain"> 启用 </el-tag>
              <el-tag v-if="scope.row.status === false" type="danger" effect="plain"> 禁用 </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="250" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleMenuPermission(scope.row)">
                菜单权限
              </el-button>
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
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
      <el-dialog v-model="dialogVisible" title="添加角色" @closed="resetForm" width="500">
        <createOrUpdate ref="apiRef" @list-roles="listRolesData" />
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handlerSubmitRole"> 保存 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    <div>
      <el-dialog v-model="dialogPermission" title="分配菜单权限" @closed="closeMenePermission" width="500">
        <Menu ref="menuRef" />
        <template #footer>
          <div class="dialog-footer">
            <el-button plain type="primary" @click="handlerCheckedTreeNodeAll">
              {{ isExpand ? "全部选中" : "全部取消" }}
            </el-button>
            <el-button plain type="primary" @click="handlerExpandAllNodes">
              {{ isExpand ? "全部收起" : "全部展开" }}
            </el-button>
            <el-button type="primary" @click="handlerSubmitRolePermission"> 提交 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { listRolesApi } from "@/api/role"
import { role } from "@/api/role/types/role"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import createOrUpdate from "./createOrUpdate.vue"
import Menu from "./menu.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const dialogVisible = ref<boolean>(false)
const dialogPermission = ref<boolean>(false)

const apiRef = ref<InstanceType<typeof createOrUpdate>>()
const menuRef = ref<InstanceType<typeof Menu>>()

const handlerSubmitRole = () => {
  apiRef.value?.submitForm()
  resetStatus()
}

const isChecked = ref(false)
const handlerCheckedTreeNodeAll = () => {
  isChecked.value = !isChecked.value
  menuRef.value?.toggleTreeChecked(isChecked.value)
}

const isExpand = ref(true)
const handlerExpandAllNodes = () => {
  isExpand.value = !isExpand.value
  menuRef.value?.expandAllNodes(isExpand.value)
}

const resetStatus = () => {
  isExpand.value = true
  isChecked.value = false
}

const handlerSubmitRolePermission = () => {
  menuRef.value?.submitTree(roleCode.value)
}

const closeMenePermission = () => {
  dialogPermission.value = false
  resetStatus()
}

const handleUpdate = async (row: role) => {
  dialogVisible.value = true

  // 添加数据
  await nextTick()
  apiRef.value?.setFrom(row)
}

const roleCode = ref<string>("")
const handleMenuPermission = async (row: role) => {
  dialogPermission.value = true

  await nextTick()

  roleCode.value = row.code
  menuRef.value?.listMenuPermissionTreeData(row.code)
}

const handleDelete = (row: role) => {
  console.log(row)
}
const resetForm = () => {
  apiRef.value?.resetForm()
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
