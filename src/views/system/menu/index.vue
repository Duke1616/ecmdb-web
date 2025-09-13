<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from "vue"
import { Search, Edit, Delete, Plus, FolderAdd, FolderOpened, Folder } from "@element-plus/icons-vue"
import MenuForm from "./form.vue"
import Tip from "./tip.vue"
import MenuMigration from "./components/MenuMigration.vue"
import MenuDragTree from "./components/MenuDragTree.vue"
import { deleteMenuApi, listMenusByPlatformApi } from "@/api/menu"
import { menu } from "@/api/menu/types/menu"
import { ElMessage, ElMessageBox } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import PageContainer from "@/common/components/PageContainer/index.vue"
import { getPlatformsForMenu, getPlatformName } from "@/common/constants/platforms"

const platforms = ref(getPlatformsForMenu())
const currentPlatform = ref<string>("all")

// 切换平台
const handlePlatformChange = (platformId: string) => {
  if (currentPlatform.value === platformId) return

  currentPlatform.value = platformId
  currentNodeKey.value = null
  empty.value = false

  refreshMenuData()

  const platformName = platformId === "all" ? "全部菜单" : getPlatformName(platformId)
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
const menuDragTreeRef = ref<InstanceType<typeof MenuDragTree>>()
const menuCreateRef = ref<InstanceType<typeof MenuForm>>()
const menuUpdateRef = ref<InstanceType<typeof MenuForm>>()

// 迁移相关状态
const migrationDialogVisible = ref<boolean>(false)

// 拖拽相关状态
const isDragMode = ref<boolean>(false)
const dragLoading = ref<boolean>(false)
// 菜单操作
const handleUpdate = () => {
  menuUpdateRef.value?.submitUpdateForm()
}

const handleDelete = () => {
  if (!currentNodeKey.value || !menuTreeData.value) return

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
  menuCreateRef.value?.submitCreateForm()
}

const handleCloseDialog = (id?: number) => {
  dialogVisible.value = false
  if (id) {
    currentNodeKey.value = id
  }
}

// 迁移菜单到其他平台
// const handleMigration = () => {
//   if (!currentNodeKey.value || !menuTreeData.value) return

//   const node = findMenuById(menuTreeData.value, currentNodeKey.value)
//   if (!node) return

//   migrationDialogVisible.value = true
// }

// 处理迁移确认
const handleMigrationConfirm = () => {
  // 关闭对话框并刷新数据
  migrationDialogVisible.value = false
  currentNodeKey.value = null
  empty.value = false

  // 刷新当前平台的菜单数据
  refreshMenuData()
}

// 切换拖拽模式
// const toggleDragMode = () => {
//   isDragMode.value = !isDragMode.value
//   if (isDragMode.value) {
//     ElMessage.info("已进入拖拽模式，可以拖拽菜单项进行排序")
//   } else {
//     ElMessage.info("已退出拖拽模式")
//   }
// }

// 处理拖拽结束
const handleDragEnd = async (dragNode: any, dropNode: any) => {
  if (!dragNode || !dropNode) return

  try {
    dragLoading.value = true

    // 这里需要调用拖拽排序API，暂时用模拟
    await new Promise((resolve) => setTimeout(resolve, 500))

    ElMessage.success("菜单排序已更新")

    // 刷新菜单数据
    refreshMenuData()
  } catch (error) {
    ElMessage.error("排序更新失败，请重试")
  } finally {
    dragLoading.value = false
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

  // 处理平台数据：如果是单个平台字符串，转换为数组
  if (node.meta) {
    const meta = node.meta as any
    if (typeof meta.platform === "string") {
      meta.platforms = [meta.platform]
      delete meta.platform
    } else if (!meta.platforms) {
      meta.platforms = currentPlatform.value === "all" ? [] : [currentPlatform.value]
    }
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
    // 如果是全部菜单，传递空字符串给后端
    const platformParam = currentPlatform.value === "all" ? "" : currentPlatform.value
    const { data } = await listMenusByPlatformApi(platformParam)
    menuTreeData.value = data

    await nextTick()

    // 如果之前有选中的节点，重新选中并加载数据
    if (currentNodeKey.value && menuDragTreeRef.value) {
      menuDragTreeRef.value.treeRef?.setCurrentKey(currentNodeKey.value)
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
  const nodes = menuDragTreeRef.value?.treeRef?.store?.nodesMap
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

  toggleRecursive(menuTreeData.value || [])
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
    menuDragTreeRef.value?.treeRef?.filter(val)
  }, 300)
})

// 组件挂载时加载数据
onMounted(() => {
  refreshMenuData()
})
</script>

<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="菜单管理" subtitle="管理系统菜单和权限配置">
      <template #actions>
        <div class="platform-buttons">
          <el-button
            :type="currentPlatform === 'all' ? 'primary' : 'default'"
            @click="handlePlatformChange('all')"
            class="platform-button"
          >
            全部菜单
          </el-button>
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
              <span class="menu-count"> {{ menuTreeData?.length || 0 }} 个菜单 </span>
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

          <!-- 拖拽树形菜单组件 -->
          <MenuDragTree
            ref="menuDragTreeRef"
            :menu-tree-data="menuTreeData"
            :current-node-key="currentNodeKey"
            :is-drag-mode="isDragMode"
            :filter-node="filterNode"
            :default-props="defaultProps"
            @node-click="handleNodeClick"
            @drag-end="handleDragEnd"
          />
        </el-card>
      </div>

      <!-- 右侧内容区域 -->
      <div class="menu-details">
        <el-card class="details-card">
          <div v-if="empty" class="menu-content-wrapper">
            <div class="menu-form-container">
              <MenuForm ref="menuUpdateRef" :menuData="menuTreeData || []" @listMenusTreeData="refreshMenuData" />
            </div>
            <div class="menu-actions-footer">
              <!-- <el-button :type="isDragMode ? 'warning' : 'default'" @click="toggleDragMode" :loading="dragLoading">
                <el-icon><Rank /></el-icon>
                {{ isDragMode ? "退出拖拽" : "拖拽排序" }}
              </el-button>
              <el-button type="warning" @click="handleMigration">
                <el-icon><Switch /></el-icon>
                迁移到其他平台
              </el-button> -->
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
          :menuData="menuTreeData || []"
          @listMenusTreeData="refreshMenuData"
          @closed="handleCloseDialog"
        />
      </div>
    </FormDialog>

    <!-- 迁移菜单组件 -->
    <MenuMigration
      v-model:visible="migrationDialogVisible"
      :menu-title="currentNodeKey && menuTreeData ? findMenuById(menuTreeData, currentNodeKey)?.meta.title : ''"
      :current-platform="currentPlatform"
      @confirm="handleMigrationConfirm"
    />
  </PageContainer>
</template>

<style lang="scss" scoped>
.platform-buttons {
  display: flex;
  gap: calc(0.2rem + 0.05vw);
  padding: calc(0.2rem + 0.05vw);
  border-radius: calc(0.4rem + 0.1vw);

  .platform-button {
    border-radius: calc(0.3rem + 0.1vw);
    font-size: calc(0.7rem + 0.1vw);
    font-weight: 500;
    padding: calc(0.4rem + 0.1vw) calc(0.8rem + 0.2vw);
    border: 1px solid transparent;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(calc(-0.05rem + 0.02vw));
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.3rem + 0.1vw) rgba(0, 0, 0, 0.1);
    }

    &:active {
      transform: translateY(0);
    }

    // 默认状态
    &:not(.el-button--primary) {
      background: white;
      color: #64748b;
      border-color: #e2e8f0;

      &:hover {
        background: #f1f5f9;
        color: #475569;
        border-color: #cbd5e1;
      }
    }

    // 选中状态
    &.el-button--primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-color: #3b82f6;
      color: white;
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.3rem + 0.1vw) rgba(59, 130, 246, 0.3);

      &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 calc(0.2rem + 0.1vw) calc(0.4rem + 0.1vw) rgba(59, 130, 246, 0.4);
      }

      &:active {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.3rem + 0.1vw) rgba(59, 130, 246, 0.3);
      }
    }

    // 全部菜单按钮特殊样式
    &:first-child {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      color: #374151;
      font-weight: 600;
      border-color: #d1d5db;

      &:hover {
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        color: #1f2937;
        border-color: #9ca3af;
      }

      &.el-button--primary {
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        border-color: #6366f1;
        color: white;

        &:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        }
      }
    }
  }
}

.content {
  display: flex;
  flex: 1;
  gap: calc(0.8rem + 0.2vw);
  overflow: hidden;
  min-height: 0;
  height: calc(100vh - 7.5rem);
  max-height: calc(100vh - 7.5rem);
  position: relative;
}

.menu-panel {
  flex: 0 0 calc(19rem + 2vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.menu-card {
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: calc(0.4rem + 0.1vw);
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
  padding: calc(0.8rem + 0.2vw);
  border-bottom: 1px solid #f3f4f6;
  background: #fafafa;

  .header-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: calc(0.6rem + 0.1vw);

    .card-title {
      margin: 0;
      font-size: calc(0.8rem + 0.1vw);
      font-weight: 600;
      color: #374151;
    }

    .menu-count {
      background: #f3f4f6;
      color: #6b7280;
      padding: calc(0.1rem + 0.05vw) calc(0.4rem + 0.1vw);
      border-radius: calc(0.2rem + 0.05vw);
      font-size: calc(0.6rem + 0.1vw);
    }
  }

  .header-actions {
    display: flex;
    flex-direction: column;
    gap: calc(0.6rem + 0.1vw);

    .search-input {
      :deep(.el-input__wrapper) {
        border-radius: calc(0.3rem + 0.1vw);
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
        height: calc(1.6rem + 0.2vw);
        font-size: calc(0.7rem + 0.1vw);
      }
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: calc(0.2rem + 0.05vw);
      width: 100%;

      .el-button {
        border-radius: calc(0.3rem + 0.1vw);
        font-size: calc(0.6rem + 0.1vw);
        padding: calc(0.3rem + 0.1vw) calc(0.4rem + 0.1vw);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        &.el-button--small {
          height: calc(1.4rem + 0.2vw);
          min-width: 0;
        }

        &:first-child {
          border-top-right-radius: calc(0.3rem + 0.1vw);
          border-bottom-right-radius: calc(0.3rem + 0.1vw);
        }

        &:last-child {
          border-top-left-radius: calc(0.3rem + 0.1vw);
          border-bottom-left-radius: calc(0.3rem + 0.1vw);
        }
      }
    }
  }
}

.tree-container {
  flex: 1;
  min-height: 0;
  padding: calc(0.6rem + 0.2vw);

  .tree-scrollbar {
    height: 100%;
  }

  .menu-tree {
    height: 100%;

    :deep(.el-tree-node) {
      .el-tree-node__content {
        height: calc(1.8rem + 0.3vw);
        padding: 0 calc(0.6rem + 0.2vw);
        border-radius: calc(0.3rem + 0.1vw);
        margin-bottom: calc(0.1rem + 0.05vw);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;

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
        font-size: calc(0.7rem + 0.1vw);
        margin-right: calc(0.4rem + 0.1vw);
      }

      .el-tree-node__label {
        font-size: calc(0.7rem + 0.1vw);
        color: #374151;
        font-weight: 500;
      }

      .el-checkbox {
        margin-right: calc(0.4rem + 0.1vw);
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
    border-radius: calc(0.4rem + 0.1vw);
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
  gap: calc(0.4rem + 0.1vw);
  margin-top: calc(0.8rem + 0.2vw);
  padding-top: calc(0.8rem + 0.2vw);
  border-top: 1px solid #f3f4f6;

  .el-button {
    border-radius: calc(0.3rem + 0.1vw);
    font-weight: 500;

    .el-icon {
      margin-right: calc(0.2rem + 0.05vw);
    }
  }
}

@media (max-width: 1200px) {
  .menu-panel {
    flex: 0 0 calc(16rem + 2vw);
  }
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
    gap: calc(0.6rem + 0.1vw);
  }

  .menu-panel {
    flex: none;
    height: calc(20rem + 2vw);
  }

  .card-header .header-actions .action-buttons {
    grid-template-columns: 1fr;
    gap: calc(0.2rem + 0.05vw);

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
  gap: calc(0.8rem + 0.2vw);
  padding: calc(1rem + 0.3vw) calc(1.2rem + 0.3vw);
  margin-top: auto;

  .el-button {
    height: calc(2rem + 0.3vw);
    padding: 0 calc(1.2rem + 0.3vw);
    border-radius: calc(0.4rem + 0.1vw);
    font-size: calc(0.7rem + 0.1vw);
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(calc(-0.1rem + 0.05vw));
      box-shadow: 0 calc(0.2rem + 0.1vw) calc(0.6rem + 0.2vw) rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
    }

    .el-icon {
      margin-right: calc(0.3rem + 0.1vw);
      font-size: calc(0.8rem + 0.1vw);
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
