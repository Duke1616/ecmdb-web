<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from "vue"
import { Search, Edit, Delete, Plus, FolderAdd, FolderOpened, Folder } from "@element-plus/icons-vue"
import MenuForm from "./form.vue"
import Tip from "./tip.vue"
import { deleteMenuApi, listMenusByPlatformApi } from "@/api/menu"
import { menu } from "@/api/menu/types/menu"
import { ElMessage, ElMessageBox, ElTree, ElScrollbar } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
const platforms = ref([
  { id: "cmdb", name: "资产管理" },
  { id: "order", name: "工单管理" },
  { id: "alert", name: "告警平台" },
  { id: "system", name: "系统管理" }
])

const currentPlatform = ref<string>("cmdb")

// 切换平台
const handlePlatformChange = (platformId: string) => {
  if (currentPlatform.value === platformId) return

  currentPlatform.value = platformId
  currentNodeKey.value = null
  empty.value = false

  refreshMenuData()

  const platformName = platforms.value.find((p) => p.id === platformId)?.name
  ElMessage.success(`已切换到${platformName}`)
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
// 菜单操作
const handleUpdate = () => {
  menuUpdateRef.value?.submitUpdateForm()
}

const handleDelete = () => {
  if (!currentNodeKey.value) return

  const node = findMenuById(menuTreeData.value, currentNodeKey.value)
  if (!node) return

  ElMessageBox({
    title: "删除确认",
    message: `确定要删除菜单 "${node.meta.title}" 吗？`,
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteMenuApi(currentNodeKey.value!).then(() => {
      ElMessage.success("删除成功")
      isExpand.value = false

      // 清空当前选中状态，显示空状态
      currentNodeKey.value = null
      empty.value = false

      refreshMenuData()
    })
  })
}

const handleCreate = () => {
  menuCreateRef.value?.submitCreateForm(currentPlatform.value)
}

const handleCloseDialog = (id?: number) => {
  dialogVisible.value = false
  if (id) {
    currentNodeKey.value = id
  }
}

// 当前选中的菜单节点
const currentNodeKey = ref<number | null>(null)

// 处理菜单节点点击
const handleNodeClick = async (node: menu) => {
  if (currentNodeKey.value === node.id) {
    // 取消选中
    currentNodeKey.value = null
    empty.value = false
  } else {
    // 选中节点
    currentNodeKey.value = node.id
    empty.value = true

    await nextTick()
    loadMenuData(node)
  }
}

// 加载菜单数据到表单
const loadMenuData = (node: menu) => {
  if (!node) return

  // 确保 platform 字段正确
  if (node.meta) {
    node.meta.platform = currentPlatform.value
  }

  // 设置菜单数据到更新表单
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

// 菜单树数据
const menuTreeData = ref<menu[]>([])

// 刷新菜单数据
const refreshMenuData = async () => {
  try {
    const { data } = await listMenusByPlatformApi(currentPlatform.value)
    menuTreeData.value = data

    await nextTick()

    // 如果之前有选中的节点，重新选中并加载数据
    if (currentNodeKey.value && treeRef.value) {
      treeRef.value.setCurrentKey(currentNodeKey.value)
      const node = findMenuById(data, currentNodeKey.value)
      if (node) {
        loadMenuData(node)
      } else {
        // 如果节点不存在（被删除了），清空选中状态
        currentNodeKey.value = null
        empty.value = false
      }
    }
  } catch (error) {
    console.error("加载菜单数据失败:", error)
    menuTreeData.value = []
  }
}

// 查找菜单节点
const findMenuById = (menus: menu[], id: number): menu | null => {
  for (const menu of menus) {
    if (menu.id === id) return menu
    if (menu.children?.length > 0) {
      const found = findMenuById(menu.children, id)
      if (found) return found
    }
  }
  return null
}

// 展开/收起所有节点
const toggleAllNodes = (expanded: boolean) => {
  const nodes = treeRef.value?.store?.nodesMap
  if (!nodes) return

  const toggleRecursive = (menuList: menu[]) => {
    for (const menu of menuList) {
      if (nodes[menu.id]) {
        nodes[menu.id].expanded = expanded
      }
      if (menu.children?.length > 0) {
        toggleRecursive(menu.children)
      }
    }
  }

  toggleRecursive(menuTreeData.value)
}

// 展开/收起状态
const isExpand = ref(false)

// 切换展开/收起
const handleToggleExpand = () => {
  isExpand.value = !isExpand.value
  toggleAllNodes(isExpand.value)
}

// 添加子菜单
const addSubMenu = () => {
  if (!currentNodeKey.value) {
    ElMessage.warning("请先选择一个菜单")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    menuCreateRef.value?.resetForm()
    menuCreateRef.value?.setMenuType(2)
    menuCreateRef.value?.setFromForPid(currentNodeKey.value!)
  })
}
// 添加菜单
const addMenu = () => {
  dialogVisible.value = true
  nextTick(() => {
    menuCreateRef.value?.resetForm()
  })
}

// 搜索防抖
let searchTimer: NodeJS.Timeout | null = null
watch(filterInput, (val: string) => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    treeRef.value?.filter(val)
  }, 300)
})

// 组件挂载时加载数据
onMounted(() => {
  refreshMenuData()
})
</script>

<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <ManagerHeader title="菜单管理" subtitle="管理系统菜单和权限配置">
      <template #actions>
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
      </template>
    </ManagerHeader>

    <div class="content">
      <!-- 左侧面板 -->
      <div class="menu-panel">
        <el-card class="menu-card">
          <!-- 操作按钮区域 -->
          <div class="card-header">
            <div class="header-top">
              <h3 class="card-title">菜单列表</h3>
              <span class="menu-count">{{ menuTreeData.length }} 个菜单</span>
            </div>

            <div class="header-actions">
              <el-input
                v-model="filterInput"
                placeholder="搜索菜单..."
                :prefix-icon="Search"
                class="search-input"
                clearable
              />
              <div class="action-buttons">
                <el-button size="small" type="primary" @click="addMenu" :icon="Plus"> 添加菜单 </el-button>
                <el-button size="small" :disabled="!currentNodeKey" @click="addSubMenu" :icon="FolderAdd">
                  添加子菜单
                </el-button>
                <el-button size="small" @click="handleToggleExpand" :icon="isExpand ? FolderOpened : Folder">
                  {{ isExpand ? "收起" : "展开" }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 树形菜单区域 -->
          <div class="tree-container">
            <el-scrollbar class="tree-scrollbar">
              <el-tree
                ref="treeRef"
                :data="menuTreeData"
                show-checkbox
                node-key="id"
                :highlight-current="true"
                :expand-on-click-node="false"
                @node-click="handleNodeClick"
                :current-node-key="currentNodeKey || undefined"
                :props="defaultProps"
                :filter-node-method="filterNode"
                class="menu-tree"
              />
            </el-scrollbar>
          </div>
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="menu-details">
        <el-card class="details-card">
          <div v-if="empty" class="menu-content-wrapper">
            <div class="menu-form-container">
              <MenuForm ref="menuUpdateRef" :menuData="menuTreeData" @listMenusTreeData="refreshMenuData" />
            </div>
            <div class="menu-actions-footer">
              <el-button type="primary" @click="handleUpdate">
                <el-icon><Edit /></el-icon>
                修改
              </el-button>
              <el-button type="danger" @click="handleDelete">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
          <div v-else>
            <Tip :empty="empty" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 添加菜单 dialog 展示 -->
    <FormDialog
      v-model="dialogVisible"
      title="添加菜单"
      subtitle="创建新的菜单项"
      height="80vh"
      header-icon="Plus"
      confirm-text="确认"
      cancel-text="取消"
      @confirm="handleCreate"
      @cancel="handleCloseDialog"
      @closed="handleCloseDialog"
    >
      <div class="form-content">
        <MenuForm
          ref="menuCreateRef"
          :menuData="menuTreeData"
          @listMenusTreeData="refreshMenuData"
          @closed="handleCloseDialog"
        />
      </div>
    </FormDialog>
  </div>
</template>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  background-color: var(--background);
  overflow: hidden;
}

.platform-buttons {
  display: flex;
  gap: 12px;
}

.content {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 120px);
  max-height: calc(100vh - 120px);
  position: relative;
}

.menu-panel {
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.menu-card {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: white;

  :deep(.el-card__body) {
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

.card-header {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .card-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .menu-count {
      background: #f3f4f6;
      color: #6b7280;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: 6px;
        border: 1px solid #d1d5db;
        background: white;
        box-shadow: none;

        &:hover {
          border-color: #9ca3af;
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      }

      :deep(.el-input__inner) {
        height: 32px;
        font-size: 14px;
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      width: 100%;

      .el-button {
        border-radius: 6px;
        font-size: 12px;
        padding: 6px 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.el-button--small {
          height: 28px;
          min-width: 0;
        }

        &:first-child {
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        &:last-child {
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
        }
      }
    }
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  padding: 8px;

  .tree-scrollbar {
    height: 100%;
  }

  .menu-tree {
    height: 100%;

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: 32px;
        padding: 0 8px;
        border-radius: 4px;
        margin-bottom: 1px;
        transition: background-color 0.2s;

        &:hover {
          background: #f9fafb;
        }
      }

      &.is-current > .el-tree-node__content {
        background: #eff6ff;
        color: #1d4ed8;
        font-weight: 500;
      }

      .el-tree-node__expand-icon {
        color: #9ca3af;
        font-size: 12px;
      }
    }
  }
}

.menu-details {
  flex: 1;
  overflow: hidden;
  height: 100%;

  .details-card {
    height: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: white;

    :deep(.el-card__body) {
      height: 100%;
      overflow-y: auto;
    }
  }
}

.menu-actions-bottom {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;

  .el-button {
    border-radius: 6px;
    font-weight: 500;

    .el-icon {
      margin-right: 4px;
    }
  }
}

@media (max-width: 1200px) {
  .menu-panel {
    flex: 0 0 320px;
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    gap: 12px;
  }

  .menu-panel {
    flex: none;
    height: 400px;
  }

  .card-header .header-actions .action-buttons {
    grid-template-columns: 1fr;
    gap: 4px;

    .el-button {
      width: 100%;
      justify-content: center;
    }
  }
}

/* 表单内容区域样式 */
.form-content {
  height: 60vh;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

/* 菜单内容包装器 - 参考 DataTable 布局 */
.menu-content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 菜单表单容器 - 可滚动内容区域 */
.menu-form-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0;
  margin: 0;
}

/* 菜单操作底部 - 固定底部按钮 */
.menu-actions-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 20px 24px;
  margin-top: auto;

  .el-button {
    height: 40px;
    padding: 0 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }

    /* 修改按钮样式 */
    &[type="primary"] {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      }
    }

    /* 删除按钮样式 */
    &[type="danger"] {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      border: none;
      color: #ffffff;

      &:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
      }
    }
  }
}
</style>
