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
              <el-button type="danger" plain text bg size="small" @click="handleUserUnallocatedRole(scope.row)"
                >移除</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, nextTick } from "vue"
import { listUserHaveRolesApi } from "@/api/role"
import { role } from "@/api/role/types/role"
import { ElMessage, ElMessageBox } from "element-plus"
import { bindRoleCodesAPi } from "@/api/user"

interface Props {
  codes: string[]
  userId?: number
}

const props = defineProps<Props>()
/** 查询模版列表 */
const rolesData = ref<role[]>([])
const emits = defineEmits(["set-codes"])
const listRolesData = () => {
  listUserHaveRolesApi({
    codes: props.codes
  })
    .then(({ data }) => {
      rolesData.value = data.roles
    })
    .catch(() => {
      rolesData.value = []
    })
    .finally(() => {})
}

const handleUserUnallocatedRole = (row: role) => {
  // 判断用户ID是否为空
  if (props.userId === undefined) {
    ElMessage.warning("请先选择用户")
    return
  }

  // 删除 row.code 对应的元素
  const roleCodes = ref<string[]>([])

  console.log("传入数据", props.codes)
  roleCodes.value.push(...props.codes)

  console.log("删除数据", row.code)
  roleCodes.value = props.codes.filter((code) => code !== row.code)

  console.log("写入数据", roleCodes.value)

  ElMessageBox({
    title: "确认移除绑定角色",
    message: h("p", null, [
      h("span", null, "正在移除角色: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认移除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    bindRoleCodesAPi({
      id: props.userId as number,
      role_codes: roleCodes.value
    }).then(async () => {
      ElMessage.success("移除成功")
      emits("set-codes", roleCodes.value)
      await nextTick()
      listRolesData()
    })
  })
}

defineExpose({
  listRolesData
})
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
