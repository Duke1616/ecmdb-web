<template>
  <div class="tree-tab-container" v-loading="loading">
    <div class="search-wrapper">
      <el-input v-model="filterText" placeholder="输入部门名称过滤..." clearable :prefix-icon="Search" />
    </div>
    <div class="tree-wrapper">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ children: 'children', label: 'name' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="selectedIds"
        :default-expand-all="false"
        :filter-node-method="filterNode"
        @check="handleCheck"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { Search } from "@element-plus/icons-vue"
import { listDepartmentTreeApi } from "@/api/department"

const props = defineProps({
  selectedIds: { type: Array as () => string[], default: () => [] }
})

const emits = defineEmits(["update-ids", "loaded"])

const filterText = ref("")
const treeData = ref<any[]>([])
const treeRef = ref()
const loading = ref(false)

const loadTree = async () => {
  loading.value = true
  try {
    const { data } = await listDepartmentTreeApi()
    treeData.value = data

    // 扁平化以解析名字，回传给外部作为 displayName 缓存
    const flatten = (depts: any[], parentPath = ""): any[] => {
      let res: any[] = []
      depts.forEach((dept) => {
        const currentPath = parentPath ? `${parentPath} - ${dept.name}` : dept.name
        res.push({ id: String(dept.id), name: dept.name, path: currentPath })
        if (dept.children?.length) {
          res = res.concat(flatten(dept.children, currentPath))
        }
      })
      return res
    }
    const flatList = flatten(data)
    emits("loaded", flatList)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTree()
})

watch(filterText, (val) => {
  treeRef.value!.filter(val)
})

const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.name.includes(value)
}

const handleCheck = () => {
  // 获取所有选中的节点 key，不包含半选节点
  const keys = treeRef.value!.getCheckedKeys(false)
  emits("update-ids", keys.map(String))
}
</script>

<style lang="scss" scoped>
.tree-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.search-wrapper {
  margin-bottom: 16px;
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid #e2e8f0;
    &:hover,
    &.is-focus {
      border-color: #3b82f6;
      background: #fff;
    }
  }
}
.tree-wrapper {
  flex: 1;
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  padding: 8px;
  :deep(.el-tree-node__content) {
    height: 34px;
    border-radius: 6px;
    &:hover {
      background-color: #f1f5f9;
    }
  }
}
</style>
