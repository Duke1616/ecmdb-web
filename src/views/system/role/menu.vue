<template>
  <div class="input-tree-container">
    <el-input v-model="filterInput" size="default" placeholder="输入菜单名称搜索" :suffix-icon="Search" />
    <el-tree
      ref="treeRef"
      :data="menuPermissionData?.menus"
      show-checkbox
      node-key="id"
      check-strictly
      default-expand-all
      :highlight-current="true"
      :default-checked-keys="menuPermissionData?.authz_ids"
      :expand-on-click-node="false"
      :props="defaultProps"
      :filter-node-method="filterNode"
    />
  </div>
</template>

<script lang="ts" setup>
import { menu } from "@/api/menu/types/menu"
import { changeRoleMenuPermissionApi, getRolePermissionApi } from "@/api/permission"
import { rolePermission } from "@/api/permission/types/permission"
import { Search } from "@element-plus/icons-vue"
import { ElMessage, ElTree } from "element-plus"
import { ref, watch } from "vue"

const filterInput = ref<string>("")
const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const treeRef = ref<InstanceType<typeof ElTree>>() as any
const menuPermissionData = ref<rolePermission>()
const getMenuPermissionData = (roleCode: string) => {
  getRolePermissionApi(roleCode)
    .then(({ data }) => {
      menuPermissionData.value = data
      alert(menuPermissionData.value.authz_ids)
    })
    .catch((err) => {
      console.log(err)
    })
    .finally(() => {})
}

const toggleTreeChecked = (value: boolean) => {
  const alreadyCheckedKeys = menuPermissionData.value?.authz_ids || []
  if (value) {
    const allNodes = menuPermissionData.value?.menus || []
    const allKeys: number[] = []
    const getAllKeys = (nodes: menu[]) => {
      nodes.forEach((node) => {
        allKeys.push(node.id)
        if (node.children && node.children.length) {
          getAllKeys(node.children)
        }
      })
    }

    getAllKeys(allNodes)

    const combinedKeys = Array.from(new Set([...alreadyCheckedKeys, ...allKeys]))
    treeRef.value.setCheckedKeys(combinedKeys)
  } else {
    // 取消全选时清空所有选中的节点
    treeRef.value.setCheckedKeys(alreadyCheckedKeys)
  }
}

const expandAllNodes = (expanded: boolean) => {
  Object.values(treeRef.value.store.nodesMap).forEach((v: any) => (v.expanded = expanded))
}

interface Tree {
  [key: string]: any
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true

  // 确保data.label存在且是字符串
  return typeof data.meta.title === "string" && data.meta.title.includes(value)
}
const submitAddPermission = (roleCode: string) => {
  const checkedKeys = treeRef.value.getCheckedKeys()
  changeRoleMenuPermissionApi(checkedKeys, roleCode)
    .then(({ data }) => {
      if (data) {
        ElMessage.success("Success")
        return
      }
      ElMessage.error("Failed")
    })
    .catch(() => {})
    .finally(() => {})
}

defineExpose({
  getMenuPermissionData,
  toggleTreeChecked,
  expandAllNodes,
  submitAddPermission
})

watch(filterInput, (val: string) => {
  treeRef.value!.filter(val)
})
</script>

<style lang="scss" scoped>
.input-tree-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-tree .el-tree-node:focus > .el-tree-node__content {
  background-color: #ccc !important;
}
</style>
