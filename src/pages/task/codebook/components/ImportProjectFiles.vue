<template>
  <input
    ref="fileInputRef"
    class="native-picker"
    type="file"
    multiple
    aria-label="选择导入文件"
    @change="handleSelected(false, $event)"
  />
  <input
    ref="directoryInputRef"
    class="native-picker"
    type="file"
    multiple
    webkitdirectory=""
    aria-label="选择导入文件夹"
    @change="handleSelected(true, $event)"
  />

  <FormDialog
    v-model="visible"
    title="导入项目资源"
    :subtitle="`导入到 ${targetName || 'project'}，保留所选目录结构`"
    width="min(1100px, 94vw)"
    top="4vh"
    :full-height="true"
    :header-icon="UploadFilled"
    :confirm-loading="submitting || collecting"
    :confirm-disabled="files.length === 0 || collecting"
    confirm-text="开始导入"
    :show-footer-info="false"
    @cancel="close"
    @closed="reset"
    @confirm="submit"
  >
    <div class="import-layout">
      <section class="import-source-panel">
        <div v-if="localPickerVisible" class="local-picker" v-loading="localPickerLoading || collecting">
          <template v-if="localRootReady">
            <div class="local-picker-header">
              <div>
                <strong>从 {{ localRootName }} 选择</strong>
                <span>文件和文件夹可以同时勾选、多选</span>
              </div>
              <el-button size="small" text @click="authorizeLocalRoot">更换浏览位置</el-button>
            </div>
            <el-tree
              ref="localTreeRef"
              class="local-picker-tree"
              :data="localTreeData"
              :props="localTreeProps"
              node-key="key"
              lazy
              show-checkbox
              :load="loadLocalChildren"
              @check="updateLocalCheckedCount"
            >
              <template #default="{ data }">
                <span class="local-picker-node">
                  <el-icon><Folder v-if="data.kind === 'directory'" /><Document v-else /></el-icon>
                  <span>{{ data.name }}</span>
                </span>
              </template>
            </el-tree>
            <div class="local-picker-footer">
              <span>已勾选 {{ localCheckedCount }} 项</span>
              <div>
                <el-button size="small" @click="closeLocalPicker">返回</el-button>
                <el-button size="small" type="primary" :disabled="!localCheckedCount" @click="confirmLocalSelection">
                  添加到右侧
                </el-button>
              </div>
            </div>
          </template>
          <div v-else class="local-picker-guide">
            <el-icon><FolderOpened /></el-icon>
            <div>
              <strong>先授权一个浏览位置</strong>
              <span>系统窗口只负责授予读取权限，不是最终选择。授权后会进入网页多选器。</span>
              <small>在网页多选器中，可用复选框同时选择多个文件和多个文件夹。</small>
            </div>
            <div class="local-picker-guide-actions">
              <el-button @click="closeLocalPicker">返回</el-button>
              <el-button type="primary" :icon="FolderOpened" @click="authorizeLocalRoot">授权并继续</el-button>
            </div>
          </div>
        </div>

        <div
          v-else
          class="drop-zone"
          :class="{ 'is-dragging': dragging, 'is-collecting': collecting }"
          @dragenter.prevent="handleDragEnter"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop"
        >
          <el-icon class="drop-icon"><UploadFilled /></el-icon>
          <div class="drop-copy">
            <strong>{{ collecting ? "正在读取目录内容…" : "拖入文件、文件夹" }}</strong>
            <span>支持一次拖入多个文件、多个文件夹或二者混合</span>
          </div>
          <div class="picker-actions">
            <el-button :disabled="collecting" type="primary" :icon="FolderOpened" @click="openLocalPicker">
              打开混合多选器
            </el-button>
            <div class="fallback-picker-actions">
              <el-button :disabled="collecting" :icon="DocumentAdd" @click="selectFiles">添加文件</el-button>
              <el-button :disabled="collecting" :icon="FolderAdd" @click="selectDirectory">添加文件夹</el-button>
            </div>
          </div>
        </div>

        <div class="source-notice">
          <el-icon><InfoFilled /></el-icon>
          <span>检测到同名文件时会提示逐个覆盖、全部覆盖或跳过，不会静默替换现有内容。</span>
        </div>
      </section>

      <aside class="import-selection-panel">
        <div class="selection-header">
          <div>
            <strong>已添加的文件</strong>
            <span v-if="rootDirectoryCount">来自 {{ rootDirectoryCount }} 个根目录</span>
            <span v-else>将导入到当前目录</span>
          </div>
          <el-button v-if="files.length" size="small" text @click="clearSelection">清空</el-button>
        </div>

        <div class="import-summary">
          <div>
            <strong>{{ files.length }}</strong
            ><span>文件</span>
          </div>
          <div>
            <strong>{{ directoryCount }}</strong
            ><span>目录</span>
          </div>
          <div>
            <strong>{{ formatFileSize(totalSize) }}</strong
            ><span>大小</span>
          </div>
        </div>

        <div v-if="files.length" class="file-preview">
          <div v-for="item in listedFiles" :key="item.path" class="file-row">
            <el-icon><Document /></el-icon>
            <span class="file-path" :title="item.path">{{ item.path }}</span>
            <span>{{ formatFileSize(item.file.size) }}</span>
            <el-button class="remove-file" text circle :icon="Close" @click="removeFile(item.path)" />
          </div>
          <div v-if="files.length > listedFiles.length" class="file-more">
            其余 {{ files.length - listedFiles.length }} 个文件也会一并导入
          </div>
        </div>
        <div v-else class="selection-empty">
          <el-icon><DocumentAdd /></el-icon>
          <strong>还没有添加文件</strong>
          <span>从左侧拖入或选择文件、文件夹</span>
        </div>
      </aside>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from "vue"
import {
  Close,
  Document,
  DocumentAdd,
  Folder,
  FolderAdd,
  FolderOpened,
  InfoFilled,
  UploadFilled
} from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type LoadFunction } from "element-plus"
import { FormDialog } from "@/common/components/Dialogs"
import { formatFileSize } from "@/common/utils/file"
import { importCodebookApi } from "@/api/task/codebook"
import {
  collectDroppedFiles,
  buildLocalSelectionTree,
  filesFromInput,
  filesFromLocalNodes,
  findImportPathConflicts,
  listLocalDirectory,
  mergeSelectedFiles,
  type ExistingImportNode,
  type LocalFileSystemNode,
  type SelectedImportFile
} from "./importSelection"

type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: "read" }) => Promise<FileSystemDirectoryHandle>
}

interface LocalTreeInstance {
  getCheckedNodes(leafOnly?: boolean, includeHalfChecked?: boolean): LocalFileSystemNode[]
  setCheckedKeys(keys: string[]): void
}

const props = defineProps<{
  projectId: number
  parentId: number
  targetName: string
  existingNodes: ExistingImportNode[]
}>()

const emit = defineEmits<{
  (e: "imported"): void
}>()

const fileInputRef = ref<HTMLInputElement>()
const directoryInputRef = ref<HTMLInputElement>()
const localTreeRef = ref<LocalTreeInstance>()
const visible = ref(false)
const submitting = ref(false)
const collecting = ref(false)
const dragging = ref(false)
const dragDepth = ref(0)
const files = ref<SelectedImportFile[]>([])
const localRoot = shallowRef<FileSystemDirectoryHandle>()
const fallbackRootName = ref("")
const localTreeData = shallowRef<LocalFileSystemNode[]>([])
const localPickerVisible = ref(false)
const localPickerLoading = ref(false)
const localCheckedCount = ref(0)
const localTreeProps = { label: "name", isLeaf: "isLeaf" }

const mixedPickerSupported = computed(
  () => window.isSecureContext && typeof (window as PickerWindow).showDirectoryPicker === "function"
)
const localRootReady = computed(() => Boolean(localRoot.value || fallbackRootName.value))
const localRootName = computed(() => localRoot.value?.name || fallbackRootName.value || "本地目录")
const directorySelectionMode = ref<"append" | "browse">("append")

const totalSize = computed(() => files.value.reduce((total, item) => total + item.file.size, 0))
// 限制一次渲染的行数，避免导入超大目录时清单本身拖慢弹窗。
const listedFiles = computed(() => files.value.slice(0, 200))
const rootDirectoryCount = computed(() => new Set(files.value.map((item) => item.rootDirectory).filter(Boolean)).size)
const directoryCount = computed(() => {
  const directories = new Set<string>()
  files.value.forEach(({ path }) => {
    const segments = path.split("/")
    segments.pop()
    segments.forEach((_, index) => directories.add(segments.slice(0, index + 1).join("/")))
  })
  return directories.size
})

function open() {
  files.value = []
  visible.value = true
}

function close() {
  visible.value = false
  reset()
}

function reset() {
  files.value = []
  dragging.value = false
  dragDepth.value = 0
  localPickerVisible.value = false
  localCheckedCount.value = 0
  directorySelectionMode.value = "append"
  if (fallbackRootName.value) {
    fallbackRootName.value = ""
    localTreeData.value = []
  }
}

function openLocalPicker() {
  if (!mixedPickerSupported.value) {
    selectBrowseDirectory()
    return
  }
  localPickerVisible.value = true
}

async function authorizeLocalRoot() {
  if (!mixedPickerSupported.value) {
    selectBrowseDirectory()
    return
  }
  try {
    const root = await (window as PickerWindow).showDirectoryPicker?.({ mode: "read" })
    if (!root) return
    localPickerLoading.value = true
    localRoot.value = root
    fallbackRootName.value = ""
    localTreeData.value = await listLocalDirectory(root)
    localCheckedCount.value = 0
    localPickerVisible.value = true
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return
    ElMessage.error(`打开本地目录失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    localPickerLoading.value = false
  }
}

const loadLocalChildren: LoadFunction = async (node, resolve) => {
  const data = node.data as LocalFileSystemNode | undefined
  if (!data || data.kind !== "directory") {
    resolve([])
    return
  }
  if (data.children) {
    resolve(data.children)
    return
  }
  if (!data.handle) {
    resolve([])
    return
  }
  try {
    resolve(await listLocalDirectory(data.handle as FileSystemDirectoryHandle, data.path))
  } catch (error) {
    ElMessage.error(`读取目录 ${data.name} 失败：${error instanceof Error ? error.message : String(error)}`)
    resolve([])
  }
}

function updateLocalCheckedCount(_node: LocalFileSystemNode, state: { checkedNodes: LocalFileSystemNode[] }) {
  localCheckedCount.value = state.checkedNodes.length
}

function closeLocalPicker() {
  localPickerVisible.value = false
  localCheckedCount.value = 0
  localTreeRef.value?.setCheckedKeys([])
}

async function confirmLocalSelection() {
  const nodes = localTreeRef.value?.getCheckedNodes(false, false) || []
  if (!nodes.length || collecting.value) return
  collecting.value = true
  try {
    const incoming = await filesFromLocalNodes(nodes)
    if (!incoming.length) {
      ElMessage.warning("所选内容没有可导入文件；空文件夹暂不支持导入")
      return
    }
    addFiles(incoming)
    closeLocalPicker()
  } catch (error) {
    ElMessage.error(`读取所选内容失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    collecting.value = false
  }
}

function selectFiles() {
  fileInputRef.value?.click()
}

function selectDirectory() {
  directorySelectionMode.value = "append"
  directoryInputRef.value?.click()
}

function selectBrowseDirectory() {
  directorySelectionMode.value = "browse"
  directoryInputRef.value?.click()
}

function handleSelected(directory: boolean, event: Event) {
  const input = event.target as HTMLInputElement
  const selected = Array.from(input.files || [])
  input.value = ""
  if (!selected.length) return
  if (directory && directorySelectionMode.value === "browse") {
    const tree = buildLocalSelectionTree(selected)
    localRoot.value = undefined
    fallbackRootName.value = tree.rootName
    localTreeData.value = tree.nodes
    localCheckedCount.value = 0
    localPickerVisible.value = true
    directorySelectionMode.value = "append"
    return
  }
  directorySelectionMode.value = "append"
  addFiles(filesFromInput(selected, directory))
}

function addFiles(incoming: SelectedImportFile[]) {
  const result = mergeSelectedFiles(files.value, incoming)
  files.value = result.files
  if (result.duplicateCount) {
    ElMessage.warning(`已忽略 ${result.duplicateCount} 个重复路径的文件`)
  }
}

function handleDragEnter() {
  dragDepth.value += 1
  dragging.value = true
}

function handleDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
  dragging.value = dragDepth.value > 0
}

async function handleDrop(event: DragEvent) {
  dragDepth.value = 0
  dragging.value = false
  if (!event.dataTransfer || collecting.value) return
  collecting.value = true
  try {
    const incoming = await collectDroppedFiles(Array.from(event.dataTransfer.items))
    if (!incoming.length) {
      ElMessage.warning("没有读取到可导入的文件；空文件夹暂不支持导入")
      return
    }
    addFiles(incoming)
  } catch (error) {
    ElMessage.error(`读取拖入内容失败：${error instanceof Error ? error.message : String(error)}`)
  } finally {
    collecting.value = false
  }
}

function clearSelection() {
  files.value = []
}

function removeFile(path: string) {
  files.value = files.value.filter((item) => item.path !== path)
}

async function submit() {
  if (!files.value.length || submitting.value || collecting.value) return
  const conflictResult = findImportPathConflicts(files.value, props.existingNodes)
  if (conflictResult.blocking) {
    const conflict = conflictResult.blocking
    const reason =
      conflict.reason === "DIRECTORY_EXISTS" ? "目标位置已存在同名目录" : "路径中的目录名称已被同名文件占用"
    ElMessage.error(`无法导入 ${conflict.path}：${reason}`)
    return
  }
  const resolution = await resolveImportConflicts(conflictResult.replaceable)
  if (!resolution) return
  if (!resolution.files.length) {
    ElMessage.info("所有同名文件均已跳过，没有需要导入的内容")
    return
  }
  await performImport(resolution.files, resolution.overwritePaths)
}

async function resolveImportConflicts(conflictPaths: string[]) {
  if (!conflictPaths.length) return { files: files.value, overwritePaths: [] as string[] }
  if (conflictPaths.length > 1) {
    try {
      await ElMessageBox.confirm(`发现 ${conflictPaths.length} 个同名文件，是否全部覆盖？`, "上传文件冲突", {
        confirmButtonText: "全部覆盖",
        cancelButtonText: "逐个处理",
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        type: "warning"
      })
      return { files: files.value, overwritePaths: conflictPaths }
    } catch (action) {
      if (action !== "cancel") return null
    }
  }

  const overwriteKeys = new Set<string>()
  for (const path of conflictPaths) {
    try {
      await ElMessageBox.confirm(`目标位置已存在 ${path}，是否使用上传内容创建新版本？`, "同名文件", {
        confirmButtonText: "覆盖",
        cancelButtonText: "跳过",
        distinguishCancelAndClose: true,
        closeOnClickModal: false,
        type: "warning"
      })
      overwriteKeys.add(path.toLowerCase())
    } catch (action) {
      if (action !== "cancel") return null
    }
  }

  const conflictKeys = new Set(conflictPaths.map((path) => path.toLowerCase()))
  return {
    files: files.value.filter(
      (item) => !conflictKeys.has(item.path.toLowerCase()) || overwriteKeys.has(item.path.toLowerCase())
    ),
    overwritePaths: conflictPaths.filter((path) => overwriteKeys.has(path.toLowerCase()))
  }
}

async function performImport(selectedFiles: SelectedImportFile[], confirmedOverwritePaths: string[]) {
  submitting.value = true
  try {
    const form = new FormData()
    form.append("project_id", String(props.projectId))
    form.append("parent_id", String(props.parentId || 0))
    form.append("paths", JSON.stringify(selectedFiles.map((item) => item.path)))
    form.append("overwrite_paths", JSON.stringify(confirmedOverwritePaths))
    selectedFiles.forEach(({ file }) => form.append("files", file, file.name))
    const { data } = await importCodebookApi(form)
    const overwritten = confirmedOverwritePaths.length
    ElMessage.success(
      overwritten ? `已导入 ${data.file_count} 个文件，其中覆盖 ${overwritten} 个` : `已导入 ${data.file_count} 个文件`
    )
    close()
    emit("imported")
  } finally {
    submitting.value = false
  }
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.native-picker {
  display: none;
}

.import-layout {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
  gap: 14px;
  min-height: 0;
  overflow: hidden;
}

.import-source-panel,
.import-selection-panel {
  min-width: 0;
  min-height: 0;
}

.import-source-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-selection-panel {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #dbe3ee;
  border-radius: 10px;
}

.local-picker {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
}

.local-picker-header,
.local-picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 14px;
  background: #f8fafc;
}

.local-picker-header {
  border-bottom: 1px solid #e2e8f0;

  div:first-child {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 11px;
  }
}

.local-picker-tree {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: auto;
}

.local-picker-guide {
  display: flex;
  flex: 1;
  min-height: 0;
  padding: 32px;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  text-align: center;

  > .el-icon {
    width: 52px;
    height: 52px;
    color: #2563eb;
    background: #dbeafe;
    border-radius: 14px;
    font-size: 26px;
  }

  > div:not(.local-picker-guide-actions) {
    display: flex;
    max-width: 460px;
    flex-direction: column;
    gap: 6px;
  }

  strong {
    color: #1e293b;
    font-size: 15px;
  }

  span {
    color: #475569;
    font-size: 13px;
  }

  small {
    color: #64748b;
    font-size: 12px;
  }
}

.local-picker-guide-actions {
  display: flex;
  gap: 8px;
}

.local-picker-node {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 7px;
  color: #334155;

  .el-icon {
    flex-shrink: 0;
    color: #3b82f6;
  }
}

.local-picker-footer {
  border-top: 1px solid #e2e8f0;

  > span {
    color: #64748b;
    font-size: 12px;
  }

  > div {
    display: flex;
    gap: 8px;
  }
}

.drop-zone {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 14px;
  padding: 28px;
  box-sizing: border-box;
  background: #f8fafc;
  border: 1px dashed #94a3b8;
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    box-shadow 0.2s ease;

  &.is-dragging {
    background: #eff6ff;
    border-color: #2563eb;
    box-shadow: inset 0 0 0 1px #2563eb;
  }

  &.is-collecting {
    cursor: progress;
    opacity: 0.8;
  }
}

.drop-icon {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  color: #2563eb;
  background: #dbeafe;
  border-radius: 10px;
  font-size: 22px;
}

.drop-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  text-align: center;

  strong {
    color: #1e293b;
    font-size: 14px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.picker-actions {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 8px;

  > .el-button {
    width: 100%;
  }
}

.fallback-picker-actions {
  display: flex;
  gap: 6px;
}

.source-notice {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 11px;
}

.selection-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  strong {
    color: #1e293b;
    font-size: 14px;
  }

  span {
    color: #64748b;
    font-size: 11px;
  }
}

.import-summary {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;

  div {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
    padding: 8px 9px;
    background: #f1f5f9;
    border-radius: 6px;
  }

  strong {
    color: #0f172a;
    overflow: hidden;
    font-size: 15px;
    text-overflow: ellipsis;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.file-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.file-row {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto 28px;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 8px 0 12px;
  color: #64748b;
  font-size: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.file-path {
  overflow: hidden;
  color: #334155;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  color: #94a3b8;

  &:hover {
    color: #ef4444;
  }
}

.file-more {
  padding: 10px 12px;
  color: #64748b;
  background: #f8fafc;
  font-size: 12px;
  text-align: center;
}

.selection-empty {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 6px;
  color: #94a3b8;
  text-align: center;

  .el-icon {
    margin-bottom: 4px;
    font-size: 34px;
  }

  strong {
    color: #475569;
    font-size: 13px;
  }

  span {
    font-size: 11px;
  }
}

@media (max-width: 900px) {
  .import-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(340px, 1fr) minmax(300px, 1fr);
    overflow-y: auto;
  }

  .import-source-panel,
  .import-selection-panel {
    min-height: 300px;
  }
}

@media (max-width: 640px) {
  .fallback-picker-actions {
    flex-wrap: wrap;
  }

  .local-picker-header,
  .local-picker-footer {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
