<template>
  <div class="app-container">
    <div class="layout">
      <div class="menu">
        <el-card>
          <el-button type="primary" @click="addMenu"> 添加菜单</el-button>
          <el-button type="primary" :disabled="!currentNodeKey" @click="addSubMenu"> 添加子菜单</el-button>
          <el-button type="primary" @click="handleCheckedTreeExpand">
            {{ isExpand ? "全部收起" : "全部展开" }}
          </el-button>
        </el-card>
        <el-card class="menu-tree">
          <el-input v-model="input1" size="large" placeholder="Please Input" :suffix-icon="Search" />
          <el-tree
            ref="treeRef"
            :data="menuTreeData"
            show-checkbox
            node-key="id"
            :highlight-current="true"
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
            :current-node-key="currentNodeKey"
            :props="defaultProps"
          />
        </el-card>
      </div>
      <div class="control">
        <el-card>
          <div v-if="empty">
            <MenuForm ref="menuUpdateRef" :menuData="menuTreeData" @listMenusTreeData="listMenusTreeData" />
            <div class="form-bottom" style="margin-top: 20px">
              <el-form-item>
                <el-button type="primary" size="large" @click="handleUpdate">修改</el-button>
                <el-button type="danger" size="large" @click="handleDelete">删除</el-button>
              </el-form-item>
            </div>
          </div>
          <div>
            <Tip :empty="empty" />
          </div>
        </el-card>
      </div>
    </div>
    <div>
      <el-dialog v-model="dialogVisible" title="添加菜单" @closed="resetForm">
        <MenuForm ref="menuCreateRef" :menuData="menuTreeData" @list-tree-menu="listMenusTreeData" />
        <template #footer>
          <el-button @click="resetForm">取消</el-button>
          <el-button type="primary" @click="handlerCreate">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from "vue"
import { Search } from "@element-plus/icons-vue"
import MenuForm from "./form.vue"
import Tip from "./tip.vue"
import { listMenuTreeApi } from "@/api/menu"
import { menu } from "@/api/menu/types/menu"
import { ElTree } from "element-plus"
const input1 = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const empty = ref<boolean>(false)
const menuCreateRef = ref<InstanceType<typeof MenuForm>>()
const menuUpdateRef = ref<InstanceType<typeof MenuForm>>()
const handleUpdate = () => {
  menuUpdateRef.value?.submitForm()
}
const handleDelete = () => {}
const handlerCreate = () => {
  menuCreateRef.value?.submitForm()
}

const resetForm = () => {
  dialogVisible.value = false
}

// const menuData = ref<menu>()
/** 查询模版列表 */
const menuTreeData = ref<menu[]>([])
const listMenusTreeData = () => {
  currentNodeKey.value = null
  empty.value = false
  dialogVisible.value = false

  listMenuTreeApi()
    .then(({ data }) => {
      menuTreeData.value = data
    })
    .catch(() => {
      menuTreeData.value = []
    })
    .finally(() => {})
}

const currentNodeKey = ref<any>(null)
const handleNodeClick = async (node: menu) => {
  if (currentNodeKey.value === node.id) {
    // 如果点击的节点已经是当前高亮节点，则取消高亮
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 否则设置当前点击的节点为高亮
    currentNodeKey.value = node.id
    empty.value = true

    // 添加数据
    await nextTick()

    // 插入特性数据
    const me = ref<string[]>([])
    me.value.push(node.meta.is_affix ? "affix" : "")
    me.value.push(node.meta.is_hidden ? "hidden" : "")
    me.value.push(node.meta.is_keepalive ? "keepalive" : "")
    me.value = me.value.filter(Boolean)

    // 调用setCheckedCities，传入过滤后的me.value
    menuUpdateRef.value?.setCheckedCities(me.value)
    menuUpdateRef.value?.setMenuData(node)
  }
}

const treeRef = ref<InstanceType<typeof ElTree>>() as any
// const handlerExpandAll = () => {
//   Object.values(treeRef.value.store.nodesMap).forEach((v: any) => v.expand())
// }
// const handlerCollapse = () => {
//   Object.values(treeRef.value.store.nodesMap).forEach((v: any) => v.collapse())
// }

const recursionFn = (arr: menu[]) => {
  const nodes = treeRef.value?.store?.nodesMap
  if (arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i]?.children?.length > 0) {
        nodes[arr[i].id].expanded = isExpand.value
        recursionFn(arr[i]?.children)
      }
    }
  }
}

const isExpand = ref(false)
const handleCheckedTreeExpand = () => {
  isExpand.value = !isExpand.value
  const treeList = menuTreeData.value
  recursionFn(treeList)
}

const addSubMenu = async () => {
  dialogVisible.value = true
  await nextTick()
  menuCreateRef.value?.resetForm()

  // 插入特性数据
  menuCreateRef.value?.setFromForPid(currentNodeKey.value)
}
const addMenu = async () => {
  dialogVisible.value = true
  await nextTick()
  menuCreateRef.value?.resetForm()
}

onMounted(() => {
  listMenusTreeData()
})
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
