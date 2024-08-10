<template>
  <div class="input-tree-container">
    <el-input v-model="input1" size="default" placeholder="Please Input" :suffix-icon="Search" />
    <el-tree
      ref="treeRef"
      :data="menuPermissionTreeData?.menus"
      show-checkbox
      node-key="id"
      default-expand-all
      check-strictly
      :highlight-current="true"
      :default-checked-keys="menuPermissionTreeData?.authz_ids"
      :expand-on-click-node="false"
      :props="defaultProps"
    />
  </div>
</template>

<script lang="ts" setup>
import { menu } from "@/api/menu/types/menu"
import { getRolePermissionApi } from "@/api/role"
import { rolePermission } from "@/api/role/types/role"
import { Search } from "@element-plus/icons-vue"
import { ElTree } from "element-plus"
import { ref } from "vue"

const input1 = ref<string>("")

const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const treeRef = ref<InstanceType<typeof ElTree>>() as any
const menuPermissionTreeData = ref<rolePermission>()
const listMenuPermissionTreeData = (roleCode: string) => {
  console.log("123", roleCode)
  getRolePermissionApi(roleCode)
    .then(({ data }) => {
      menuPermissionTreeData.value = data
    })
    .catch(() => {})
    .finally(() => {})
}

const toggleTreeChecked = (value: boolean) => {
  const alreadyCheckedKeys = menuPermissionTreeData.value?.authz_ids || []
  if (value) {
    const allNodes = menuPermissionTreeData.value?.menus || []
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

const submitTree = (roleCode: string) => {
  const checkedKeys = treeRef.value.getCheckedKeys()
  console.log(checkedKeys, roleCode)
}

defineExpose({
  listMenuPermissionTreeData,
  toggleTreeChecked,
  expandAllNodes,
  submitTree
})
</script>

<style lang="scss" scoped>
.input-tree-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
