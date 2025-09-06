<template>
  <div>
    <el-card shadow="never">
      <div class="table-wrapper">
        <el-table :data="rolesData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="角色名称" align="center" />
          <el-table-column prop="code" label="角色编码" align="center" />
          <el-table-column prop="desc" label="角色描述" align="center" />
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <el-button type="primary" plain text bg size="small" @click="handleUserAssignedRole(scope.row)"
                >分配</el-button
              >
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
import { h, ref, watch, nextTick } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listUserDoesNotHaveRoles } from "@/api/role"
import { role } from "@/api/role/types/role"
import { ElMessage, ElMessageBox } from "element-plus"
import { bindRoleCodesAPi } from "@/api/user"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

interface Props {
  codes: string[]
  userId?: number
}

const props = defineProps<Props>()
const emits = defineEmits(["set-codes"])

/** 查询模版列表 */
const rolesData = ref<role[]>([])
const listRolesData = () => {
  listUserDoesNotHaveRoles({
    codes: props.codes,
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

const handleUserAssignedRole = (row: role) => {
  // 判断用户ID是否为空
  if (props.userId === undefined) {
    ElMessage.warning("请先选择用户")
    return
  }

  // 组合已经存在的数组数据
  const roleCodes = ref<string[]>([])
  roleCodes.value.push(...props.codes, row.code)

  ElMessageBox({
    title: "确认新增绑定",
    message: h("p", null, [
      h("span", null, "正在绑定角色: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认绑定？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    bindRoleCodesAPi({
      id: props.userId as number,
      role_codes: roleCodes.value
    }).then(async () => {
      ElMessage.success("绑定成功")
      emits("set-codes", roleCodes.value)
      await nextTick()
      listRolesData()
    })
  })
}

defineExpose({
  listRolesData
})

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
