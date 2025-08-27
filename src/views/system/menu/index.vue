<script lang="ts" setup>
import { h, nextTick, onMounted, ref, watch } from "vue"
import { Search } from "@element-plus/icons-vue"
import MenuForm from "./form.vue"
import Tip from "./tip.vue"
import { deleteMenuApi, listMenuTreeApi } from "@/api/menu"
import { menu } from "@/api/menu/types/menu"
import { ElMessage, ElMessageBox, ElTree } from "element-plus"
const platforms = ref([
  { id: 1, name: "平台1" },
  { id: 2, name: "平台2" },
  { id: 3, name: "平台3" }
])

const currentPlatform = ref(1) // 默认选中平台1

const handlePlatformChange = (platformId: number) => {
  if (currentPlatform.value === platformId) {
    return // 如果点击的是当前平台，不做任何操作
  }

  // 更新当前平台
  currentPlatform.value = platformId

  // 清空当前选中的节点
  currentNodeKey.value = null
  empty.value = false

  // 重新加载对应平台的菜单数据
  listMenusTreeData()

  // 可选：显示切换成功的提示
  ElMessage.success(`已切换到${platforms.value.find((p) => p.id === platformId)?.name}`)
}

const filterInput = ref("")

const dialogVisible = ref<boolean>(false)
const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const empty = ref<boolean>(false)
const treeRef = ref<InstanceType<typeof ElTree>>() as any
const menuCreateRef = ref<InstanceType<typeof MenuForm>>()
const menuUpdateRef = ref<InstanceType<typeof MenuForm>>()
const handleUpdate = () => {
  menuUpdateRef.value?.submitUpdateForm()
}

const handleDelete = () => {
  const node = findMenuById(menuTreeData.value, currentNodeKey.value)
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除菜单: "),
      h("i", { style: "color: red" }, `${node?.meta.title}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteMenuApi(currentNodeKey.value).then(() => {
      ElMessage.success("删除成功")
      isExpand.value = false
      listMenusTreeData()
    })
  })
}

const handlerCreate = () => {
  menuCreateRef.value?.submitCreateForm()
}

const onClosed = (id: number) => {
  // 关闭弹窗
  dialogVisible.value = false

  // 避免触发 update 获取逻辑
  currentNodeKey.value = id
}

const resetForm = () => {
  dialogVisible.value = false
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

    updateMenuData(node)
  }
}

const updateMenuData = (node: menu | null) => {
  if (node === null) {
    return
  }

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

interface Tree {
  [key: string]: any
}

const filterNode = (value: string, data: Tree) => {
  if (!value) return true

  // 确保data.label存在且是字符串
  return typeof data.meta.title === "string" && data.meta.title.includes(value)
}

// const handlerExpandAll = () => {
//   Object.values(treeRef.value.store.nodesMap).forEach((v: any) => v.expand())
// }
// const handlerCollapse = () => {
//   Object.values(treeRef.value.store.nodesMap).forEach((v: any) => v.collapse())
// }

// const menuData = ref<menu>()
/** 查询模版列表 */
const menuTreeData = ref<menu[]>([])
const listMenusTreeData = async () => {
  listMenuTreeApi()
    .then(async ({ data }) => {
      menuTreeData.value = data

      await nextTick()
      // 设置当前节点
      if (currentNodeKey.value) {
        treeRef.value!.setCurrentKey(currentNodeKey.value)
        // 录入数据
        const node = findMenuById(data, currentNodeKey.value)
        updateMenuData(node)
        return
      }
    })
    .catch(() => {
      menuTreeData.value = []
    })
    .finally(() => {})
}

const findMenuById = (menus: menu[], id: number): menu | null => {
  for (const menu of menus) {
    if (menu.id === id) {
      return menu
    }

    if (menu.children.length > 0) {
      const found = findMenuById(menu.children, id)
      if (found) {
        return found
      }
    }
  }
  return null
}

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
  menuCreateRef.value?.setMenuType(2)
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

watch(filterInput, (val: string) => {
  treeRef.value!.filter(val)
})
</script>

<template>
  <div class="app-container">
    <div class="header">
      <h2>菜单管理</h2>
      <div class="platform-buttons">
        <el-button
          v-for="platform in platforms"
          :key="platform.id"
          :type="currentPlatform === platform.id ? 'primary' : 'default'"
          @click="handlePlatformChange(platform.id)"
          class="platform-button"
        >
          {{ platform.name }}
        </el-button>
      </div>
    </div>

    <div class="content">
      <div class="menu-panel">
        <!-- 固定操作按钮区域，防止被树形菜单挤压 -->
        <el-card class="menu-actions-fixed">
          <div class="action-buttons">
            <el-button type="primary" @click="addMenu">添加菜单</el-button>
            <el-button type="primary" :disabled="!currentNodeKey" @click="addSubMenu"> 添加子菜单 </el-button>
            <el-button type="primary" @click="handleCheckedTreeExpand">
              {{ isExpand ? "全部收起" : "全部展开" }}
            </el-button>
          </div>
        </el-card>

        <!-- 搜索框独立区域 -->
        <div class="search-section">
          <el-input v-model="filterInput" size="default" placeholder="输入菜单名称搜索" :suffix-icon="Search" />
        </div>

        <!-- 树形菜单区域优化高度计算 -->
        <el-card class="menu-tree-container">
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
            :filter-node-method="filterNode"
          />
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="menu-details">
        <el-card>
          <div v-if="empty">
            <MenuForm ref="menuUpdateRef" :menuData="menuTreeData" @listMenusTreeData="listMenusTreeData" />
            <div class="form-bottom">
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

    <!-- 添加菜单 dialog 展示 -->
    <div>
      <el-dialog v-model="dialogVisible" title="添加菜单" @closed="resetForm">
        <MenuForm
          style="max-height: 60vh; overflow-y: auto"
          ref="menuCreateRef"
          :menuData="menuTreeData"
          @listMenusTreeData="listMenusTreeData"
          @closed="onClosed"
        />
        <template #footer>
          <el-button @click="resetForm">取消</el-button>
          <el-button type="primary" @click="handlerCreate">确认</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  // min-height: 100vh;
  // max-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  overflow: hidden; /* 防止整个容器被撑开 */
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
  flex-shrink: 0;
  height: 80px;

  h2 {
    margin: 0;
    color: #1f2937;
    font-weight: 600;
  }
}

.platform-buttons {
  display: flex;
  gap: 12px;
}

.content {
  display: flex;
  flex: 1;
  gap: 20px;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
  position: relative; /* 确保定位上下文 */
}

.menu-panel {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  min-height: 0; /* 重要：允许flex子项收缩 */
}

.menu-actions-fixed {
  flex: 0 0 80px;
  height: 80px;
  min-height: 80px !important;
  max-height: 80px;

  :deep(.el-card__body) {
    padding: 12px;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;

    .el-button {
      flex: 1;
      min-width: 100px;
    }
  }
}

.search-section {
  flex: 0 0 40px;
  height: 40px;
  min-height: 40px !important;
  max-height: 40px;
  padding: 0 4px;
}

.menu-tree-container {
  flex: 1;
  min-height: 0;
  height: calc(100% - 80px - 40px - 32px); /* 总高度减去按钮区域、搜索区域和gap */
  max-height: calc(100% - 80px - 40px - 32px);
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 12px;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .el-tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    height: 100%;
    overscroll-behavior: contain; /* 阻止滚动事件冒泡到页面 */

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;

      &:hover {
        background: #a8a8a8;
      }
    }

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: 36px;
        padding: 0 8px;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background-color: #f3f4f6;
        }
      }

      &.is-current > .el-tree-node__content {
        background-color: #e1f5fe;
        color: #0277bd;
      }
    }
  }
}

.menu-details {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  height: 100%;
  max-height: 100%;
  min-height: 0; /* 重要：允许flex子项收缩 */

  :deep(.el-card) {
    height: 100%;

    .el-card__body {
      height: 100%;
      overflow-y: auto;
      overscroll-behavior: contain; /* 确保右侧区域滚动独立 */
    }
  }
}

.form-bottom {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;

  .el-form-item {
    margin-bottom: 0;

    .el-button {
      min-width: 80px;
    }
  }
}

@media (max-width: 1200px) {
  .menu-panel {
    flex: 0 0 300px;
  }

  .menu-actions-fixed .action-buttons .el-button {
    min-width: 80px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    gap: 16px;
  }

  .menu-panel {
    flex: none;
    height: 400px;
  }

  .menu-details {
    flex: 1;
  }
}
</style>
