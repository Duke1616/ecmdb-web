<template>
  <div class="app-container">
    <div class="layout">
      <div class="menu">
        <el-card>
          <el-button type="primary" @click="dialogVisible = true"> 添加菜单</el-button>
          <el-button type="primary"> 添加子菜单</el-button>
          <el-button type="primary"> 全部展开</el-button>
        </el-card>
        <el-card class="menu-tree">
          <el-input v-model="input1" size="large" placeholder="Please Input" :suffix-icon="Search" />
          <el-tree
            ref="treeRef"
            :data="data"
            show-checkbox
            :highlight-current="true"
            node-key="id"
            @node-click="handleNodeClick"
            :default-expanded-keys="[2, 3]"
            :current-node-key="currentNodeKey"
            :default-checked-keys="[5]"
            :props="defaultProps"
          />
        </el-card>
      </div>
      <div class="control">
        <el-card>
          <div v-if="empty">
            <MenuForm :menuData="data" />
            <div class="form-bottom">
              <el-form-item>
                <el-button type="primary" size="large" @click="handleUpdate">修改</el-button>
                <el-button type="danger" size="large" @click="handleDelete">删除</el-button>
              </el-form-item>
            </div>
          </div>

          <Tip :empty="empty" />
        </el-card>
      </div>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" title="添加菜单" @closed="resetForm">
    <MenuForm ref="menuRef" :menuData="data" />
    <template #footer>
      <el-button @click="resetForm">取消</el-button>
      <el-button type="primary" @click="handlerCreate">确认</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { Search } from "@element-plus/icons-vue"
import MenuForm from "./form.vue"
import Tip from "./tip.vue"
const input1 = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = {
  children: "children",
  label: "label"
}

const empty = ref<boolean>(false)

const menuRef = ref<InstanceType<typeof MenuForm>>()

const handleUpdate = () => {}
const handleDelete = () => {}
const handlerCreate = () => {
  console.log(menuRef.value?.getFormData())
}
const resetForm = () => {
  dialogVisible.value = false
}

const data = [
  {
    id: 1,
    label: "Level one 1",
    children: [
      {
        id: 4,
        label: "Level two 1-1",
        children: [
          {
            id: 9,
            label: "Level three 1-1-1"
          },
          {
            id: 10,
            label: "Level three 1-1-2"
          }
        ]
      }
    ]
  }
]

const currentNodeKey = ref(null)
const handleNodeClick = (node: any) => {
  if (currentNodeKey.value === node.id) {
    // 如果点击的节点已经是当前高亮节点，则取消高亮
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 否则设置当前点击的节点为高亮
    currentNodeKey.value = node.id
    empty.value = true
  }
}
</script>

<style lang="scss" scoped>
.layout {
  display: flex;
  height: 100%;
  align-items: stretch;
  gap: 12px;
}

.menu {
  flex: 0 0 30%;
}

.menu-tree {
  overflow-y: auto;
  max-height: 800px; /* 设置一个固定的最大高度 */
}

.control {
  flex: 1; /* 70% width */
}

.divider {
  margin: 10px;
}
</style>
