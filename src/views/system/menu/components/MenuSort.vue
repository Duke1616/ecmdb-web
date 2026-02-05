<template>
  <Teleport to="body">
    <div v-if="visible" class="menu-sort-fullscreen">
      <ManagerHeader
        title="菜单排序管理"
        subtitle="拖拽调整同级顺序 • 右键剪切粘贴跨目录迁移"
        :show-back-button="currentPid !== 0"
        :show-add-button="false"
        :show-refresh-button="false"
        @back="handleBack"
      >
        <template #extra>
          <div class="header-breadcrumbs">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>
                <span class="breadcrumb-item" :class="{ active: currentPid === 0 }" @click="navigateTo(0)">
                  <el-icon><HomeFilled /></el-icon> 根目录
                </span>
              </el-breadcrumb-item>
              <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.id">
                <span class="breadcrumb-item" :class="{ active: currentPid === item.id }" @click="navigateTo(item.id)">
                  {{ item.meta.title }}
                </span>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </template>

        <template #actions>
          <el-button v-if="cutItem" type="warning" class="action-btn cancel-btn" @click="handleCancelCut">
            <el-icon><Close /></el-icon>
            <span>取消剪切</span>
          </el-button>
          <el-button class="action-btn refresh-btn" @click="refresh">
            <el-icon><Refresh /></el-icon>
            <span>刷新</span>
          </el-button>
          <el-button type="primary" class="action-btn complete-btn" @click="close">
            <el-icon><Check /></el-icon>
            <span>完成</span>
          </el-button>
        </template>
      </ManagerHeader>

      <div class="sort-content" v-loading="loading" @contextmenu.prevent="handleContentContextMenu">
        <div v-if="currentList.length === 0" class="empty-state">
          <el-empty description="当前 目录下没有菜单项" />
        </div>

        <draggable
          v-else
          v-model="currentList"
          item-key="id"
          class="menu-grid"
          ghost-class="ghost"
          drag-class="drag"
          @end="onDragEnd"
          :animation="200"
        >
          <template #item="{ element }">
            <div
              class="menu-card"
              :class="[getCardClass(element), { 'is-cut': cutItem?.id === element.id }]"
              @click="handleCardClick(element)"
              @contextmenu.prevent.stop="handleCardContextMenu($event, element)"
            >
              <div class="card-icon">
                <el-icon size="24" v-if="element.type === 1"><Folder /></el-icon>
                <el-icon size="24" v-else-if="element.type === 2"><Menu /></el-icon>
                <el-icon size="24" v-else><Operation /></el-icon>
              </div>

              <div class="card-info">
                <span class="card-title">{{ element.meta?.title }}</span>
                <span class="card-count" v-if="hasChildren(element)">{{ element.children.length }} 个子项</span>
                <span class="card-type">{{ getTypeName(element.type) }}</span>
              </div>

              <div class="drag-handle">
                <el-icon><Rank /></el-icon>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <!-- 右键菜单 -->
      <div
        v-if="contextMenuVisible"
        class="context-menu"
        :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
        @click="contextMenuVisible = false"
      >
        <div v-if="contextMenuItem" class="menu-item" @click="handleCut">
          <el-icon><Delete /></el-icon>
          <span>剪切</span>
          <span class="shortcut">Ctrl+X</span>
        </div>
        <div class="menu-item" :class="{ disabled: !cutItem }" @click="handlePaste">
          <el-icon><CopyDocument /></el-icon>
          <span>粘贴到此处</span>
          <span class="shortcut">Ctrl+V</span>
        </div>
      </div>

      <!-- 遮罩层 -->
      <div
        v-if="contextMenuVisible"
        class="context-menu-overlay"
        @click="contextMenuVisible = false"
        @contextmenu.prevent="contextMenuVisible = false"
      />
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue"
import { ElMessage } from "element-plus"
import {
  Folder,
  Menu,
  Operation,
  Rank,
  HomeFilled,
  Close,
  Delete,
  CopyDocument,
  Refresh,
  Check
} from "@element-plus/icons-vue"
import draggable from "vuedraggable"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { sortMenuApi } from "@/api/menu"
import type { menu } from "@/api/menu/types/menu"

const props = defineProps<{
  modelValue: boolean
  menuData: menu[]
}>()

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void
  (e: "refresh"): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
})

const loading = ref(false)
const currentPid = ref(0)
const currentList = ref<menu[]>([])
const cutItem = ref<menu | null>(null)
const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuItem = ref<menu | null>(null)

const breadcrumbList = computed(() => {
  const path: menu[] = []
  if (currentPid.value === 0) return path

  const findPath = (nodes: menu[], targetId: number, currentPath: menu[]): boolean => {
    for (const node of nodes) {
      if (node.id === targetId) {
        currentPath.push(node)
        return true
      }
      if (node.children && node.children.length > 0) {
        currentPath.push(node)
        if (findPath(node.children, targetId, currentPath)) {
          return true
        }
        currentPath.pop()
      }
    }
    return false
  }

  findPath(props.menuData, currentPid.value, path)
  return path
})

const initCurrentList = () => {
  if (currentPid.value === 0) {
    currentList.value = [...props.menuData]
  } else {
    const parent = findNode(props.menuData, currentPid.value)
    currentList.value = parent && parent.children ? [...parent.children] : []
  }
}

const findNode = (nodes: menu[], id: number): menu | null => {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

watch(
  [() => props.menuData, currentPid],
  () => {
    initCurrentList()
  },
  { immediate: true, deep: true }
)

const navigateTo = (pid: number) => {
  currentPid.value = pid
}

const handleBack = () => {
  if (currentPid.value === 0) return

  if (breadcrumbList.value.length >= 2) {
    currentPid.value = breadcrumbList.value[breadcrumbList.value.length - 2].id
  } else if (breadcrumbList.value.length === 1) {
    currentPid.value = 0
  }
}

const handleCardClick = (item: menu) => {
  if (item.type === 1 || item.type === 2) {
    currentPid.value = item.id
  }
}

const hasChildren = (item: menu) => {
  return item.children && item.children.length > 0
}

const getTypeName = (type: number) => {
  switch (type) {
    case 1:
      return "目录"
    case 2:
      return "菜单"
    case 3:
      return "按钮"
    default:
      return "未知"
  }
}

const getCardClass = (element: menu) => {
  return {
    "type-directory": element.type === 1,
    "type-menu": element.type === 2,
    "type-button": element.type === 3
  }
}

const handleCardContextMenu = (event: MouseEvent, item: menu) => {
  event.stopPropagation()
  contextMenuItem.value = item
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

const handleContentContextMenu = (event: MouseEvent) => {
  contextMenuItem.value = null
  contextMenuPos.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

const handleCut = () => {
  if (contextMenuItem.value) {
    cutItem.value = contextMenuItem.value
    ElMessage.success(`已剪切: ${cutItem.value.meta.title}`)
  }
  contextMenuVisible.value = false
}

const handlePaste = async () => {
  if (!cutItem.value) {
    contextMenuVisible.value = false
    return
  }

  try {
    loading.value = true

    await sortMenuApi({
      id: cutItem.value.id,
      target_pid: currentPid.value,
      target_position: currentList.value.length
    })

    ElMessage.success(`已将 "${cutItem.value.meta.title}" 移动到此处`)
    cutItem.value = null
    emit("refresh")
  } catch (error) {
    console.error("Paste error:", error)
    ElMessage.error("粘贴失败")
  } finally {
    loading.value = false
    contextMenuVisible.value = false
  }
}

const handleCancelCut = () => {
  cutItem.value = null
  ElMessage.info("已取消剪切")
}

const handleKeyDown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "x" && contextMenuItem.value) {
    e.preventDefault()
    handleCut()
  } else if ((e.ctrlKey || e.metaKey) && e.key === "v" && cutItem.value) {
    e.preventDefault()
    handlePaste()
  } else if (e.key === "Escape") {
    if (contextMenuVisible.value) {
      contextMenuVisible.value = false
    } else if (cutItem.value) {
      handleCancelCut()
    }
  }
}

onMounted(() => {
  document.addEventListener("keydown", handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown)
})

const refresh = () => {
  emit("refresh")
}

const close = () => {
  visible.value = false
  emit("refresh")
}

const onDragEnd = async (evt: any) => {
  const { newIndex, oldIndex } = evt
  if (newIndex === oldIndex) return

  try {
    loading.value = true
    const element = currentList.value[newIndex]

    await sortMenuApi({
      id: element.id,
      target_pid: currentPid.value,
      target_position: newIndex
    })

    ElMessage.success("排序已保存")
    emit("refresh")
  } catch (error) {
    console.error("Sort error:", error)
    ElMessage.error("排序失败")
    emit("refresh")
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.menu-sort-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: #f9fafb;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.manager-header) {
  flex-shrink: 0;
  margin-bottom: 0 !important;
}

.header-breadcrumbs {
  margin-top: 8px;

  .breadcrumb-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: #6b7280;
    transition: color 0.2s;

    &:hover {
      color: #3b82f6;
    }

    &.active {
      color: #111827;
      font-weight: 500;
      cursor: default;
    }
  }
}

// NOTE: 美化操作按钮
:deep(.action-btn) {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  padding: 10px 20px !important;
  min-width: 100px !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  border-radius: 8px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;

  .el-icon {
    font-size: 16px !important;
    transition: transform 0.3s ease !important;
  }

  &:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;

    .el-icon {
      transform: scale(1.1) !important;
    }
  }

  &:active {
    transform: translateY(0) !important;
  }

  // 刷新按钮 - 灰色渐变
  &.refresh-btn {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
    color: white !important;
    border: none !important;

    &:hover {
      background: linear-gradient(135deg, #4b5563 0%, #374151 100%) !important;
      box-shadow: 0 6px 16px rgba(75, 85, 99, 0.4) !important;

      .el-icon {
        animation: rotate 0.6s ease-in-out !important;
      }
    }
  }

  // 完成按钮 - 蓝色渐变
  &.complete-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
    color: white !important;
    border: none !important;

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
      box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4) !important;
    }
  }

  // 取消剪切按钮 - 橙色警告
  &.cancel-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
    color: white !important;
    border: none !important;

    &:hover {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4) !important;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sort-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f9fafb;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  align-content: start;
}

.menu-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1.5px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  user-select: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 12px 24px -6px rgba(0, 0, 0, 0.12),
      0 4px 8px -2px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;

    .drag-handle {
      opacity: 1;
    }

    .card-icon {
      transform: scale(1.05);
    }
  }

  &:active {
    transform: translateY(-2px);
  }

  &.type-directory {
    border-left: 4px solid #f59e0b;

    .card-icon {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #d97706;
    }
  }

  &.type-menu {
    border-left: 4px solid #3b82f6;

    .card-icon {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      color: #2563eb;
    }
  }

  &.type-button {
    border-left: 4px solid #10b981;

    .card-icon {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #059669;
    }
  }

  &.is-cut {
    opacity: 0.6;
    border: 2px dashed #f59e0b;
    background: #fffbeb;

    &::after {
      content: "已剪切";
      position: absolute;
      top: 8px;
      right: 8px;
      background: #f59e0b;
      color: white;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }
  }

  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    overflow: hidden;

    .card-title {
      font-weight: 600;
      font-size: 15px;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.4;
    }

    .card-count {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .card-type {
      font-size: 11px;
      color: #6b7280;
      background: #f3f4f6;
      width: fit-content;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
  }

  .drag-handle {
    padding: 8px;
    color: #9ca3af;
    opacity: 0;
    transition: all 0.2s ease;
    cursor: move;
    border-radius: 6px;

    &:hover {
      color: #3b82f6;
      background: #f0f9ff;
    }
  }
}

.ghost {
  opacity: 0.4;
  background: #f3f4f6;
  border: 2px dashed #cbd5e1;

  * {
    visibility: hidden;
  }
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;

  :deep(.el-empty__description) {
    color: #9ca3af;
    font-size: 14px;
  }
}

.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(1px);
}

.context-menu {
  position: fixed;
  z-index: 2001;
  background: #ffffff;
  border-radius: 10px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 6px;
  min-width: 200px;
  border: 1px solid #e5e7eb;
  animation: contextMenuFadeIn 0.15s ease-out;

  @keyframes contextMenuFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    border-radius: 6px;

    &:hover:not(.disabled) {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);

      .el-icon {
        color: #3b82f6;
        transform: scale(1.1);
      }

      span:not(.shortcut) {
        color: #1e40af;
      }
    }

    &.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .el-icon {
      font-size: 18px;
      color: #6b7280;
      transition: all 0.2s ease;
    }

    span {
      flex: 1;
      font-size: 14px;
      color: #374151;
      font-weight: 500;
    }

    .shortcut {
      font-size: 11px;
      color: #9ca3af;
      margin-left: auto;
      background: #f9fafb;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: "Monaco", "Menlo", monospace;
      font-weight: 600;
    }
  }
}
</style>
