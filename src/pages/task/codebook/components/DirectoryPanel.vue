<template>
  <section class="directory-view">
    <div class="panel-heading">
      <div class="directory-title">
        <el-icon class="directory-title-icon"><FolderOpened /></el-icon>
        <div class="directory-title-text">
          <div class="directory-title-row">
            <h3>{{ activeDirectory.name || "全部资源" }}</h3>
            <el-tooltip v-if="isReadonly" content="资源只读" placement="top" :show-after="300">
              <el-icon class="readonly-lock"><Lock /></el-icon>
            </el-tooltip>
            <span class="directory-kind">Directory</span>
          </div>
          <p>{{ activeDirectory.runtime_path || `${directoryChildren.length} 个子资源` }}</p>
        </div>
      </div>
      <div class="panel-actions">
        <div v-if="viewMode === 'list' && selectedItems.length" class="selection-actions">
          <span>已选 {{ selectedItems.length }} 项</span>
          <el-button text :disabled="batchDeleting" @click="clearSelection">取消选择</el-button>
          <AuthButton
            :capability="capabilities.Codebook.Delete"
            disableMode
            size="small"
            type="danger"
            :icon="Delete"
            :loading="batchDeleting"
            @click="$emit('delete-batch', selectedItems)"
          >
            批量删除
          </AuthButton>
        </div>
        <AuthButton
          :capability="capabilities.CodeAssist.ViewConversation"
          disableMode
          size="small"
          class="assistant-button"
          :type="assistantOpen ? 'primary' : 'default'"
          :plain="assistantOpen"
          :icon="MagicStick"
          @click="$emit('toggle-assistant')"
          >AI 助手</AuthButton
        >
        <AuthButton
          v-if="!isReadonly"
          :capability="capabilities.Codebook.Add"
          disableMode
          size="small"
          :icon="Upload"
          @click="$emit('import-resources')"
        >
          导入文件/文件夹
        </AuthButton>
        <AuthButton
          v-if="activeDirectory.id && !isReadonly"
          :capability="capabilities.Codebook.Delete"
          disableMode
          size="small"
          type="danger"
          plain
          :icon="Delete"
          @click="$emit('delete', activeDirectory)"
          >删除</AuthButton
        >
        <el-button-group class="view-switch" aria-label="资源展示方式">
          <el-button
            :class="{ 'is-active': viewMode === 'grid' }"
            :icon="Grid"
            :aria-pressed="viewMode === 'grid'"
            aria-label="卡片视图"
            title="卡片视图"
            @click="setViewMode('grid')"
          />
          <el-button
            :class="{ 'is-active': viewMode === 'list' }"
            :icon="List"
            :aria-pressed="viewMode === 'list'"
            aria-label="列表视图"
            title="列表视图"
            @click="setViewMode('list')"
          />
        </el-button-group>
      </div>
    </div>

    <VueDraggable
      v-if="viewMode === 'grid'"
      v-model="localChildren"
      :animation="200"
      item-key="workspace_key"
      class="resource-grid"
      v-loading="childrenLoading"
      :disabled="isReadonly || !hasPermission(capabilities.Codebook.Sort)"
      @end="onDragEnd"
    >
      <template #header>
        <div v-if="!childrenLoading && localChildren.length === 0" class="resource-empty">
          <el-empty :image-size="130" description="当前目录暂无资源" />
        </div>
      </template>
      <button
        v-for="item in localChildren"
        :key="item.workspace_key || item.id"
        class="resource-card"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="resource-icon" :class="item.kind.toLowerCase()">
          <SvgIcon v-if="item.kind === 'FILE'" :name="getFileIconName(item.name)" size="20px" class="file-icon" />
          <el-icon v-else>
            <Folder />
          </el-icon>
        </span>
        <span class="resource-meta">
          <strong :title="item.name">{{ item.name }}</strong>
          <small>{{ item.kind === "DIRECTORY" ? "目录" : fileDescription(item) }}</small>
        </span>
        <el-tooltip v-if="isReadonly || isReadonlyCodebook(item)" content="资源只读" placement="top" :show-after="300">
          <el-icon class="resource-readonly-lock"><Lock /></el-icon>
        </el-tooltip>
        <el-tag v-if="item.kind === 'FILE'" size="small" effect="plain">
          {{ getFileExt(item.name) || "file" }}
        </el-tag>
      </button>
    </VueDraggable>

    <div v-else class="resource-list-shell" v-loading="childrenLoading">
      <div v-if="localChildren.length > 0" class="resource-list-header">
        <span class="resource-selection-header">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate="partiallySelected"
            :disabled="selectableItems.length === 0 || batchDeleting"
            aria-label="选择全部可删除资源"
            title="全选可删除资源"
            @change="toggleAllSelection"
          />
        </span>
        <span>名称</span>
        <span>种类</span>
        <span>大小</span>
        <span>修改日期</span>
      </div>
      <VueDraggable
        v-model="localChildren"
        :animation="200"
        item-key="workspace_key"
        class="resource-list"
        :disabled="isReadonly || !hasPermission(capabilities.Codebook.Sort)"
        @end="onDragEnd"
      >
        <div
          v-for="(item, index) in localChildren"
          :key="item.workspace_key || item.id"
          class="resource-item"
          :class="{ 'is-even': index % 2 === 1, 'is-selected': isItemSelected(item) }"
          role="button"
          tabindex="0"
          @click="$emit('select', item)"
          @keydown.enter.self.prevent="$emit('select', item)"
          @keydown.space.self.prevent="$emit('select', item)"
        >
          <span
            class="resource-selection-cell"
            role="checkbox"
            :aria-checked="isItemSelected(item)"
            :aria-disabled="!canSelectItem(item) || batchDeleting"
            :tabindex="canSelectItem(item) && !batchDeleting ? 0 : -1"
            title="按住并上下滑动可连续选择"
            @click.stop
            @keydown.space.stop.prevent="toggleItemSelection(item)"
            @pointerdown.stop.prevent="handleSelectionPointerDown($event, item)"
            @pointerenter="handleSelectionPointerEnter($event, item)"
          >
            <input
              type="checkbox"
              tabindex="-1"
              :checked="isItemSelected(item)"
              :disabled="!canSelectItem(item) || batchDeleting"
              aria-hidden="true"
            />
          </span>
          <span class="resource-name-cell">
            <span class="resource-icon" :class="item.kind.toLowerCase()">
              <SvgIcon v-if="item.kind === 'FILE'" :name="getFileIconName(item.name)" size="22px" class="file-icon" />
              <el-icon v-else>
                <Folder />
              </el-icon>
            </span>
            <strong :title="item.name">{{ item.name }}</strong>
            <el-tooltip
              v-if="isReadonly || isReadonlyCodebook(item)"
              content="资源只读"
              placement="top"
              :show-after="300"
            >
              <el-icon class="resource-readonly-lock"><Lock /></el-icon>
            </el-tooltip>
          </span>
          <span class="resource-kind-cell">{{ getResourceKind(item) }}</span>
          <span class="resource-size-cell">
            {{ item.kind === "FILE" ? formatFileSize(item.size || 0) : "--" }}
          </span>
          <span class="resource-date-cell">{{ formatModifiedTime(item.utime) }}</span>
        </div>
      </VueDraggable>
      <div v-if="!childrenLoading && localChildren.length === 0" class="resource-empty">
        <el-empty :image-size="130" description="当前目录暂无资源" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { Delete, Folder, FolderOpened, Grid, List, Lock, MagicStick, Upload } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { formatTimestamp } from "@/common/utils/day"
import { formatFileSize, getFileExt, getFileIconName, getFileTypeLabel, inferLanguage } from "@/common/utils/file"
import { isReadonlyCodebook } from "../composables/useCodebookTree"
import { useDragSelection } from "../composables/useDragSelection"
import type { codebook } from "@/api/task/codebook/types/codebook"

const { hasPermission } = usePermission()
const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  activeDirectory: codebook
  directoryChildren: codebook[]
  childrenLoading: boolean
  assistantOpen?: boolean
  readonly?: boolean
  batchDeleting?: boolean
}>()

const emit = defineEmits<{
  (e: "import-resources"): void
  (e: "delete", row: codebook): void
  (e: "delete-batch", rows: codebook[]): void
  (e: "select", row: codebook): void
  (e: "sort", id: number, targetPosition: number): void
  (e: "toggle-assistant"): void
}>()

const localChildren = ref<codebook[]>([])
const isReadonly = computed(() => props.readonly || isReadonlyCodebook(props.activeDirectory))
const canSelectItem = (item: codebook) =>
  Boolean(item.id && !isReadonly.value && !isReadonlyCodebook(item) && hasPermission(capabilities.Codebook.Delete))
const selection = useDragSelection({
  items: localChildren,
  getKey: (item) => item.workspace_key || `resource:${item.id}`,
  isSelectable: canSelectItem
})
const {
  allSelected,
  clear: clearSelection,
  isSelected: isItemSelected,
  partiallySelected,
  selectableItems,
  selectedItems,
  toggle: toggleItemSelection,
  toggleAll: toggleAllSelection
} = selection
type ResourceViewMode = "grid" | "list"
const viewModeStorageKey = "codebook-resource-view-mode"

function getInitialViewMode(): ResourceViewMode {
  if (typeof window === "undefined") return "list"
  try {
    return window.localStorage.getItem(viewModeStorageKey) === "grid" ? "grid" : "list"
  } catch {
    return "list"
  }
}

const viewMode = ref<ResourceViewMode>(getInitialViewMode())

function setViewMode(mode: ResourceViewMode) {
  viewMode.value = mode
  if (mode !== "list") selection.clear()
  try {
    window.localStorage.setItem(viewModeStorageKey, mode)
  } catch {
    // 浏览器禁用本地存储时仍允许在当前页面切换视图。
  }
}

function finishSelectionGesture() {
  selection.finishGesture()
  window.removeEventListener("pointerup", finishSelectionGesture)
}

function handleSelectionPointerDown(event: PointerEvent, item: codebook) {
  if (event.button !== 0 || props.batchDeleting || !selection.beginGesture(item)) return
  window.addEventListener("pointerup", finishSelectionGesture, { once: true })
}

function handleSelectionPointerEnter(event: PointerEvent, item: codebook) {
  if ((event.buttons & 1) === 0) {
    finishSelectionGesture()
    return
  }
  selection.continueGesture(item)
}

onBeforeUnmount(finishSelectionGesture)

function fileDescription(item: codebook) {
  if (!item.download_only) return inferLanguage(item.name)
  return `${formatFileSize(item.size || 0)} · 仅支持下载`
}

function getResourceKind(item: codebook) {
  return item.kind === "DIRECTORY" ? "文件夹" : getFileTypeLabel(item.name)
}

function formatModifiedTime(timestamp?: number) {
  return timestamp ? formatTimestamp(timestamp) : "--"
}

watch(
  () => props.directoryChildren,
  (newVal) => {
    localChildren.value = [...newVal]
  },
  { immediate: true, deep: true }
)

const onDragEnd = (evt: any) => {
  const { newIndex } = evt
  if (newIndex === undefined) return
  const movedItem = localChildren.value[newIndex]
  if (movedItem) {
    emit("sort", movedItem.id, newIndex)
  }
}
</script>

<style lang="scss" scoped>
.directory-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  min-height: 56px;
  padding: 8px 18px;
  box-sizing: border-box;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.directory-title {
  display: flex;
  flex: 1 1 140px;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.directory-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
}

.directory-title-text {
  min-width: 0;

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.directory-title-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;

  h3 {
    margin: 0;
    overflow: hidden;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.directory-kind {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.readonly-lock,
.resource-readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 13px;
}

.panel-actions {
  display: flex;
  max-width: 100%;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  :deep(.el-button) {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
  }

  :deep(.assistant-button.el-button--primary.is-plain) {
    --el-button-text-color: #1d4ed8;
    --el-button-border-color: #bfdbfe;
    --el-button-bg-color: #eff6ff;
  }
}

.selection-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 12px;
  white-space: nowrap;

  :deep(.el-button.is-text) {
    padding: 0 4px;
  }
}

.view-switch {
  display: inline-flex;
  flex-shrink: 0;

  :deep(.el-button) {
    width: 31px;
    padding: 0;
    color: #64748b;
    background: #fff;
  }

  :deep(.el-button.is-active) {
    z-index: 1;
    color: #2563eb;
    background: #eff6ff;
    border-color: #93c5fd;
  }
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  flex: 1;
  align-content: start;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.resource-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 68px;
  padding: 0 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
  }
}

.resource-grid .resource-icon {
  width: 34px;
  height: 34px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;

  &.directory {
    color: #d97706;
    background: #fffbeb;
  }
}

.resource-meta {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #111827;
    font-size: 14px;
  }

  small {
    color: #64748b;
    font-size: 12px;
  }
}

.resource-list-shell {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 18px 18px;
  background: #fff;
}

.resource-list {
  min-width: 650px;
}

.resource-list-header,
.resource-item {
  display: grid;
  grid-template-columns: 34px minmax(220px, 1fr) minmax(110px, 0.34fr) minmax(84px, 0.2fr) minmax(150px, 0.38fr);
  align-items: center;
}

.resource-list-header {
  position: sticky;
  z-index: 2;
  top: 0;
  min-width: 650px;
  height: 34px;
  padding: 0 12px;
  box-sizing: border-box;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  background: #f8fafc;
  border-bottom: 1px solid #dfe5ec;

  span + span {
    border-left: 1px solid #e2e8f0;
    padding-left: 14px;
  }
}

.resource-selection-header,
.resource-selection-cell {
  display: flex;
  align-items: center;
  justify-content: center;

  input {
    width: 14px;
    height: 14px;
    margin: 0;
    cursor: pointer;
    accent-color: #2563eb;
  }
}

.resource-selection-cell {
  align-self: stretch;
  cursor: default;
  user-select: none;

  input {
    pointer-events: none;
  }

  &[aria-disabled="true"] input {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #93c5fd;
    outline-offset: -4px;
  }
}

.resource-item {
  width: 100%;
  min-width: 650px;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  color: #475569;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-radius: 6px;
  font-size: 12px;
  text-align: left;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &.is-even {
    background: #f8fafc;
  }

  &.is-selected {
    color: #1d4ed8;
    background: #eff6ff;
  }

  &:hover {
    color: #1d4ed8;
    background: #eff6ff;
  }

  > span:not(:first-child) {
    overflow: hidden;
    padding-left: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.resource-empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
}

.resource-grid .resource-empty {
  grid-column: 1 / -1;
}

.resource-name-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 9px;

  strong {
    overflow: hidden;
    color: #1e293b;
    font-size: 13px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.resource-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  color: #2563eb;

  &.directory {
    color: #e0a126;
    font-size: 21px;
  }
}

.resource-size-cell,
.resource-date-cell {
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
</style>
