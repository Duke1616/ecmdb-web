<template>
  <div class="codebook-container">
    <div class="codebook-shell" :class="{ 'assistant-open': assistantVisible }">
      <CodebookSidebar
        v-model:keyword="keyword"
        :active-project-name="activeProjectName"
        :current-directory-name="currentDirectoryName"
        :selected-tree-key="selectedTreeKey"
        :tree-data="treeData"
        :tree-props="treeProps"
        :tree-loading="treeLoading"
        :allow-drag="allowTreeDrag"
        :allow-drop="allowTreeDrop"
        @back="backToProjects"
        @refresh="fetchTreeData"
        @node-click="handleTreeNodeClick"
        @node-contextmenu="handleNodeContextMenu"
        @node-drop="handleTreeNodeDrop"
      />

      <main class="codebook-main">
        <DirectoryPanel
          v-if="activeEditor.kind === 'DIRECTORY'"
          :active-directory="activeEditor"
          :directory-children="directoryChildren"
          :children-loading="childrenLoading"
          :readonly="isReadonlyCodebook(activeEditor)"
          @create-directory="createDirectoryDraft"
          @create-file="createFileDraft"
          @delete="handleDelete"
          @select="selectCodebook"
          @sort="handleCodebookSort"
        />

        <EditorPanel
          v-else
          :active-editor="activeEditor"
          :opened-files="openedFiles"
          :saving="saving"
          :detail-loading="detailLoading"
          :assistant-open="assistantVisible"
          :readonly="isReadonlyCodebook(activeEditor)"
          @select="selectCodebook"
          @close-tab="closeTab"
          @open-version="handleOpenVersionDrawer"
          @open-runner="handleOpenRunnerDrawer"
          @open-meta="openMetaDialog"
          @delete="handleDelete"
          @run="handleOpenRunDrawer"
          @save="saveActiveFile"
          @toggle-assistant="toggleAssistant"
          @update-code="handleEditorCodeChange"
        />
      </main>

      <CodeAssistPanel
        v-if="assistantVisible"
        class="codebook-assistant"
        :project-id="activeProjectId"
        :project-name="activeProjectName"
        :active-file="activeEditor"
        :readonly="isReadonlyCodebook(activeEditor)"
        @apply-code="handleEditorCodeChange"
        @close="assistantVisible = false"
      />
    </div>

    <!-- 脚本元信息对话框 -->
    <FormDialog
      v-model="metaDialogVisible"
      :title="metaForm.kind === 'DIRECTORY' ? (metaForm.id ? '编辑目录' : '新增目录') : '脚本信息'"
      subtitle="配置资源名称和负责人"
      width="520px"
      :header-icon="metaForm.kind === 'DIRECTORY' ? FolderOpened : DocumentAdd"
      :confirm-loading="metaSubmitting || saving"
      confirm-text="保存"
      @cancel="metaDialogVisible = false"
      @confirm="saveMetaDialog"
      @opened="clearMetaValidation"
    >
      <el-form
        ref="metaFormRef"
        :model="metaForm"
        :rules="metaRules"
        label-position="top"
        @submit.prevent="saveMetaDialog"
      >
        <el-form-item :label="metaForm.kind === 'DIRECTORY' ? '目录名称' : '脚本名称'" prop="name">
          <el-input
            v-if="metaForm.kind === 'DIRECTORY'"
            v-model="metaForm.name"
            class="meta-name-input"
            placeholder="请输入目录名称"
            :validate-event="false"
            @input="clearMetaNameValidation"
          />
          <div v-else class="script-name-composer">
            <el-input
              v-model="metaForm.name"
              class="script-base-name-input"
              :placeholder="scriptNamePlaceholder"
              :validate-event="false"
              @input="clearMetaNameValidation"
            />
            <el-select
              v-model="scriptFileType"
              class="script-type-select"
              aria-label="脚本文件类型"
              :validate-event="false"
              @change="handleScriptTypeChange"
            >
              <el-option
                v-for="option in scriptFileTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item v-if="metaForm.id" label="负责人" prop="owner">
          <UserPicker v-model="metaForm.owner" placeholder="选择负责人" />
        </el-form-item>
      </el-form>
    </FormDialog>

    <RunnerDrawer ref="runnerDrawerRef" />
    <CodebookRunDrawer ref="runDrawerRef" />
    <VersionDrawer
      ref="versionDrawerRef"
      @version-created="handleVersionChanged"
      @version-used="handleVersionChanged"
    />

    <CodebookContextMenu
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :target="contextMenuTarget"
      :readonly="isReadonlyCodebook(contextMenuTarget)"
      @action="handleContextMenuAction"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, h } from "vue"
import { useRoute, useRouter } from "vue-router"
import { DocumentAdd, FolderOpened } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import { find, findIndex, some } from "lodash-es"
import { useUserStore } from "@/pinia/stores/user"
import UserPicker from "@@/components/Pickers/UserPicker/index.vue"
import { FormDialog } from "@/common/components/Dialogs"
import CodebookContextMenu from "./components/CodebookContextMenu.vue"
import CodebookSidebar from "./components/CodebookSidebar.vue"
import CodebookRunDrawer from "./components/CodebookRunDrawer.vue"
import CodeAssistPanel from "./components/codeassist/CodeAssistPanel.vue"
import DirectoryPanel from "./components/DirectoryPanel.vue"
import EditorPanel from "./components/EditorPanel.vue"
import RunnerDrawer from "./components/RunnerDrawer.vue"
import VersionDrawer from "./components/VersionDrawer.vue"
import { useCodebookContextMenu } from "./composables/useCodebookContextMenu"
import {
  activeFileToPayload,
  codebookToMetaPayload,
  createCodebookDraft,
  draftToCodebook
} from "./composables/useCodebookDraft"
import {
  createRootDirectory as createRootCodebook,
  filterWorkspaceTree,
  flattenWorkspaceTree,
  isReadonlyCodebook as isReadonlyWorkspaceItem,
  treeProps,
  workspaceNodeToCodebook,
  type CodebookTreeNode
} from "./composables/useCodebookTree"
import { useCodebookTreeDrag } from "./composables/useCodebookTreeDrag"
import { useCodebookOpenedFiles } from "./composables/useCodebookOpenedFiles"
import {
  buildScriptFileName,
  parseScriptFileName,
  scriptFileTypeOptions,
  type ScriptFileType
} from "./composables/useCodebookFile"
import { getDefaultScriptCode, isReplaceableScriptCode } from "./scriptTemplates"
import {
  childrenCodebookApi,
  createCodebookApi,
  deleteCodebookApi,
  detailCodebookApi,
  readWorkspaceFileApi,
  sortCodebookApi,
  treeCodebookApi,
  updateCodebookApi
} from "@/api/task/codebook"
import type {
  codebook,
  CodebookScope,
  createOrUpdateCodebookReq,
  WorkspaceNode
} from "@/api/task/codebook/types/codebook"

const userStore = useUserStore()

type EditorState = codebook

const route = useRoute()
const router = useRouter()

// 从路由参数中读取项目 ID 和项目名称
const activeProjectId = computed(() => Number(route.query.id || 0))
const activeProjectName = computed(() => String(route.query.name || ""))
const activeProjectScope = computed<CodebookScope>(() => (route.query.scope === "SYSTEM" ? "SYSTEM" : "TENANT"))

const runnerDrawerRef = ref<InstanceType<typeof RunnerDrawer>>()
const runDrawerRef = ref<InstanceType<typeof CodebookRunDrawer>>()
const versionDrawerRef = ref<InstanceType<typeof VersionDrawer>>()
const metaFormRef = ref<FormInstance>()
const keyword = ref("")
const treeLoading = ref(false)
const childrenLoading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const treeRawData = ref<WorkspaceNode[]>([])
const directoryChildren = ref<codebook[]>([])
const selectedTreeKey = ref("layer:project")
const activeEditor = ref<EditorState>(createRootDirectory())
const metaDialogVisible = ref(false)
const metaSubmitting = ref(false)
const scriptFileType = ref<ScriptFileType>("sh")
const assistantVisible = ref(false)

// NOTE: 存放当前工作区打开的所有脚本文件，实现类似 IDE 的多标签页编辑体验
const openedFiles = ref<codebook[]>([])
const {
  visible: contextMenuVisible,
  x: contextMenuX,
  y: contextMenuY,
  target: contextMenuTarget,
  open: openContextMenu,
  close: closeContextMenu
} = useCodebookContextMenu<codebook>()
const { allowTreeDrag, allowTreeDrop, handleTreeNodeDrop } = useCodebookTreeDrag({
  keyword,
  treeLoading,
  treeRawData: computed(() => flattenWorkspaceTree(treeRawData.value)),
  refreshAll
})
const { activateCodebook, closeOpenedFile, findOpenedFile, findOpenedFileIndex, isSameOpenedFile, upsertOpenedFile } =
  useCodebookOpenedFiles({
    activeEditor,
    openedFiles,
    selectedTreeKey,
    createRootDirectory
  })

const currentDirectory = computed(() => {
  if (activeEditor.value.kind === "DIRECTORY") return activeEditor.value
  const parentID = activeEditor.value.parent_id || 0
  return parentID ? find(projectSourceItems.value, { id: parentID }) || createRootDirectory() : createRootDirectory()
})
const currentDirectoryName = computed(() => currentDirectory.value.name || "全部资源")
const metaForm = ref<createOrUpdateCodebookReq>(createDefaultFileDraft())

const flatWorkspaceNodes = computed(() => flattenWorkspaceTree(treeRawData.value as CodebookTreeNode[]))
const projectSourceItems = computed(() =>
  flatWorkspaceNodes.value
    .filter((node) => node.layer === "PROJECT" && node.source_id > 0)
    .map((node) => workspaceNodeToCodebook(node))
)
const treeData = computed<CodebookTreeNode[]>(() =>
  filterWorkspaceTree(treeRawData.value as CodebookTreeNode[], keyword.value)
)

const metaRules = computed<FormRules>(() => ({
  name: [{ required: true, message: "请输入名称" }],
  owner: metaForm.value.id ? [{ required: true, message: "请选择负责人", trigger: "change" }] : []
}))
const scriptNamePlaceholder = computed(() =>
  scriptFileType.value === "custom" ? "请输入完整文件名，如 deploy.js" : "请输入脚本名称，如 deploy"
)

function isReadonlyCodebook(row?: Pick<codebook, "scope" | "readonly"> | null) {
  return isReadonlyWorkspaceItem(row)
}

function warnReadonly() {
  ElMessage.warning("制品依赖为只读资源，不能进行变更操作")
}

function toggleAssistant() {
  if (activeProjectId.value <= 0 || activeProjectScope.value === "SYSTEM") {
    ElMessage.warning("SYSTEM 组件库暂不支持项目级 AI 对话")
    return
  }
  assistantVisible.value = !assistantVisible.value
}

function clearMetaValidation() {
  metaFormRef.value?.clearValidate()
}

function clearMetaNameValidation() {
  metaFormRef.value?.clearValidate("name")
}

function createRootDirectory(): codebook {
  return {
    ...createRootCodebook(activeProjectId.value, activeProjectScope.value),
    workspace_key: "layer:project",
    runtime_path: ""
  }
}

function createDefaultFileDraft(): createOrUpdateCodebookReq {
  const draft = createCodebookDraft({
    projectID: activeProjectId.value,
    parentID: getCurrentParentID(),
    scope: getCurrentScope(),
    kind: "FILE"
  })
  draft.code = getDefaultScriptCode("sh")
  return draft
}

function createDefaultDirectoryDraft(): createOrUpdateCodebookReq {
  return createCodebookDraft({
    projectID: activeProjectId.value,
    parentID: getCurrentParentID(),
    scope: getCurrentScope(),
    kind: "DIRECTORY"
  })
}

function setMetaForm(payload: createOrUpdateCodebookReq) {
  const next = { ...payload }
  if (next.kind === "FILE") {
    const parsed = parseScriptFileName(next.name)
    next.name = parsed.name
    scriptFileType.value = parsed.type
  }
  metaForm.value = next
}

function handleScriptTypeChange(type: ScriptFileType) {
  if (metaForm.value.id || activeEditor.value.id || activeEditor.value.kind !== "FILE") return
  if (!isReplaceableScriptCode(activeEditor.value.code)) return
  const code = getDefaultScriptCode(type)
  metaForm.value.code = code
  handleEditorCodeChange(code)
}

function draftToEditor(req: createOrUpdateCodebookReq): codebook {
  return draftToCodebook(req, createRootDirectory(), activeProjectId.value)
}

function getCurrentParentID() {
  return activeEditor.value.kind === "DIRECTORY" ? activeEditor.value.id : activeEditor.value.parent_id || 0
}

function getCurrentScope() {
  return (currentDirectory.value.scope || activeProjectScope.value) as CodebookScope
}

function handleEditorCodeChange(code: string) {
  if (isReadonlyCodebook(activeEditor.value)) return
  const nextEditor = { ...activeEditor.value, code }
  activeEditor.value = nextEditor
  const index = findOpenedFileIndex(nextEditor)
  if (index > -1) {
    openedFiles.value[index] = nextEditor
  }
}

async function selectCodebook(row: codebook) {
  if (row.kind === "DIRECTORY") {
    activateCodebook(row)
    fetchChildren(row.id, row.workspace_key)
    return
  }

  const existing = findOpenedFile(row)
  if (existing) {
    activateCodebook(existing)
    return
  }

  if (!row.id && !row.release_id) {
    openedFiles.value.push(row)
    activateCodebook(row)
    return
  }

  detailLoading.value = true
  try {
    const fileWithDetail = row.release_id
      ? {
          ...row,
          code: (
            await readWorkspaceFileApi({
              project_id: activeProjectId.value,
              release_id: row.release_id,
              digest: row.digest || "",
              artifact_path: row.artifact_path || ""
            })
          ).data.code
        }
      : await detailCodebookApi(row.id).then(({ data }) => ({ ...row, ...data, code: data.code || "" }))
    openedFiles.value.push(fileWithDetail)
    activateCodebook(fileWithDetail)
  } finally {
    detailLoading.value = false
  }
}

function handleTreeNodeClick(data: CodebookTreeNode) {
  selectCodebook(workspaceNodeToCodebook(data))
}

// NOTE: 关闭指定的标签页。如果关闭的是当前激活的脚本，会遵循 IDE (如 VS Code) 习惯，优先激活右侧顶替的标签，若无则激活左侧标签
function closeTab(file: codebook) {
  closeOpenedFile(file, selectCodebook)
}

function createFileDraft() {
  if (isReadonlyCodebook(currentDirectory.value)) {
    warnReadonly()
    return
  }
  const draft = createDefaultFileDraft()
  const editorDraft = draftToEditor(draft)

  // 检查是否已有草稿
  const hasDraft = some(openedFiles.value, (item) => !item.id && !item.workspace_key && item.kind === "FILE")
  if (!hasDraft) {
    openedFiles.value.push(editorDraft)
  }
  activateCodebook(editorDraft)

  setMetaForm(draft)
  nextTick(() => {
    metaDialogVisible.value = true
  })
}

function createDirectoryDraft() {
  if (isReadonlyCodebook(currentDirectory.value)) {
    warnReadonly()
    return
  }
  setMetaForm(createDefaultDirectoryDraft())
  metaDialogVisible.value = true
}

function openMetaDialog(row: codebook) {
  if (isReadonlyCodebook(row)) {
    warnReadonly()
    return
  }
  setMetaForm(codebookToMetaPayload(row, activeProjectId.value))
  metaDialogVisible.value = true
}

function buildPayloadFromActive(): createOrUpdateCodebookReq {
  return activeFileToPayload(activeEditor.value, activeProjectId.value)
}

async function saveActiveFile() {
  if (activeEditor.value.kind !== "FILE") return
  if (isReadonlyCodebook(activeEditor.value)) {
    warnReadonly()
    return
  }
  const payload = buildPayloadFromActive()
  if (!payload.name || !payload.owner) {
    setMetaForm(payload)
    metaDialogVisible.value = true
    return
  }
  if (!payload.code?.trim()) {
    ElMessage.warning("请输入脚本代码")
    return
  }
  await persistCodebook(payload)
}

async function saveMetaDialog() {
  if (!metaFormRef.value || metaSubmitting.value) return
  metaSubmitting.value = true
  try {
    await submitMetaDialog()
  } finally {
    metaSubmitting.value = false
  }
}

async function submitMetaDialog() {
  if (!metaFormRef.value) return
  if (metaForm.value.id) {
    const editingTarget =
      find(projectSourceItems.value, { id: metaForm.value.id }) ||
      find(openedFiles.value, { id: metaForm.value.id }) ||
      activeEditor.value
    if (isReadonlyCodebook(editingTarget)) {
      warnReadonly()
      return
    }
  } else if (isReadonlyCodebook(currentDirectory.value)) {
    warnReadonly()
    return
  }

  const valid = await metaFormRef.value.validate().catch(() => false)
  if (!valid) return

  const payload: createOrUpdateCodebookReq = {
    ...metaForm.value,
    sort_no: metaForm.value.sort_no || 0
  }
  if (!payload.id) {
    payload.parent_id = getCurrentParentID()
    payload.scope = getCurrentScope()
    payload.project_id = activeProjectId.value
    payload.owner = userStore.username || "admin" // 新建时默认负责人为当前创建人
    payload.sort_no = 0 // 新建时排序号默认为 0
  }
  if (payload.kind === "DIRECTORY") {
    payload.code = ""
  } else if (!payload.id) {
    payload.code = activeEditor.value.kind === "FILE" ? activeEditor.value.code : payload.code || ""
  }

  if (payload.kind === "FILE") {
    payload.name = buildScriptFileName(payload.name, scriptFileType.value)
    payload.code = activeEditor.value.kind === "FILE" ? activeEditor.value.code || payload.code : payload.code
    payload.version_no = payload.id ? undefined : payload.version_no || 1
  }

  await persistCodebook(payload)
}

async function persistCodebook(payload: createOrUpdateCodebookReq) {
  if (payload.id) {
    const target =
      find(projectSourceItems.value, { id: payload.id }) ||
      find(openedFiles.value, { id: payload.id }) ||
      activeEditor.value
    if (isReadonlyCodebook(target)) {
      warnReadonly()
      return
    }
  } else if (payload.scope === "SYSTEM" || isReadonlyCodebook(currentDirectory.value)) {
    warnReadonly()
    return
  }
  saving.value = true
  try {
    const { data } = payload.id ? await updateCodebookApi(payload) : await createCodebookApi(payload)
    ElMessage.success("保存成功")
    metaDialogVisible.value = false
    await refreshAll()
    if (payload.kind === "FILE") {
      const id = payload.id || data
      if (id) {
        // 获取最新详情
        detailLoading.value = true
        const { data: latestDetail } = await detailCodebookApi(id)
        const normalizedDetail = { ...latestDetail, code: latestDetail.code || "" }
        upsertOpenedFile(normalizedDetail)
        activateCodebook(normalizedDetail)
      }
    } else if (payload.id) {
      const current = find(projectSourceItems.value, { id: payload.id })
      if (current) selectCodebook(current)
    }
  } finally {
    saving.value = false
    detailLoading.value = false
  }
}

async function fetchFileDetail(id: number) {
  detailLoading.value = true
  try {
    const { data } = await detailCodebookApi(id)
    const workspaceNode = find(flatWorkspaceNodes.value, { source_id: id, layer: "PROJECT" })
    activeEditor.value = workspaceNode ? { ...workspaceNodeToCodebook(workspaceNode), ...data } : data
    selectedTreeKey.value = workspaceNode?.key || `file-${data.id}`
  } finally {
    detailLoading.value = false
  }
}

async function fetchChildren(parentID: number, workspaceKey?: string) {
  childrenLoading.value = true
  try {
    const workspaceNode = workspaceKey
      ? find(flatWorkspaceNodes.value, { key: workspaceKey })
      : find(flatWorkspaceNodes.value, { source_id: parentID, layer: "PROJECT" })
    if (workspaceNode) {
      directoryChildren.value = workspaceNode.children.map((node) => workspaceNodeToCodebook(node))
      return
    }
    const { data } = await childrenCodebookApi({
      parent_id: parentID,
      project_id: activeProjectId.value
    })
    directoryChildren.value = data.codebooks || []
  } finally {
    childrenLoading.value = false
  }
}

async function fetchTreeData() {
  treeLoading.value = true
  try {
    const { data } = await treeCodebookApi(activeProjectId.value)
    treeRawData.value = data.nodes || []
  } finally {
    treeLoading.value = false
  }
}

async function refreshAll() {
  await fetchTreeData()
  if (activeEditor.value.kind === "DIRECTORY") {
    await fetchChildren(activeEditor.value.id, activeEditor.value.workspace_key)
  }
}

async function handleCodebookSort(id: number, targetPosition: number) {
  const moved = find(directoryChildren.value, { id })
  if (isReadonlyCodebook(activeEditor.value) || isReadonlyCodebook(moved)) {
    warnReadonly()
    await fetchChildren(activeEditor.value.id, activeEditor.value.workspace_key)
    return
  }
  try {
    await sortCodebookApi({
      id,
      target_parent_id: activeEditor.value.id || 0,
      target_position: targetPosition
    })
    ElMessage.success("排序更新成功")
    await refreshAll()
  } catch (error) {
    ElMessage.error("排序失败，请重试")
    if (activeEditor.value.kind === "DIRECTORY") {
      await fetchChildren(activeEditor.value.id, activeEditor.value.workspace_key)
    }
  }
}

function buildDeleteMessage(row: codebook) {
  return h("p", null, [
    h("span", null, row.kind === "DIRECTORY" ? "正在删除目录: " : "正在删除脚本: "),
    h("i", { style: "color: red" }, row.name),
    h("span", null, row.kind === "DIRECTORY" ? "，目录下资源也会一并删除，确认删除？" : "，确认删除？")
  ])
}

function handleDelete(row: codebook) {
  if (isReadonlyCodebook(row)) {
    warnReadonly()
    return
  }
  if (!row.id) {
    // 如果是未保存的草稿，直接关闭 Tab 即可，不用调用 API
    closeTab(row)
    return
  }
  ElMessageBox({
    title: "删除确认",
    message: buildDeleteMessage(row),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    await deleteCodebookApi(row.id)
    ElMessage.success("删除成功")

    const idx = findOpenedFileIndex(row)
    if (idx > -1) {
      openedFiles.value.splice(idx, 1)
    }

    if (isSameOpenedFile(row, activeEditor.value)) {
      if (openedFiles.value.length > 0) {
        selectCodebook(openedFiles.value[openedFiles.value.length - 1])
      } else {
        activateCodebook(createRootDirectory())
      }
    }
    await refreshAll()
  })
}

function handleOpenRunnerDrawer(row: codebook) {
  if (row.kind !== "FILE" || !row.id) return
  if (isReadonlyCodebook(row)) {
    warnReadonly()
    return
  }
  runnerDrawerRef.value?.open(row)
}

function handleOpenRunDrawer(row: codebook) {
  if (row.kind !== "FILE" || !row.id) return
  runDrawerRef.value?.open(row)
}

function handleOpenVersionDrawer(row: codebook) {
  if (row.kind !== "FILE" || !row.id) return
  if (isReadonlyCodebook(row)) {
    warnReadonly()
    return
  }
  versionDrawerRef.value?.open(row)
}

async function handleVersionChanged() {
  if (!activeEditor.value.id) return
  await fetchTreeData()
  await fetchFileDetail(activeEditor.value.id)
  const latest = activeEditor.value
  const idx = findIndex(openedFiles.value, { id: latest.id })
  if (idx > -1) {
    openedFiles.value[idx] = latest
  }
}

function backToProjects() {
  router.go(-1)
}

function handleNodeContextMenu(event: MouseEvent, data: CodebookTreeNode) {
  openContextMenu(event, workspaceNodeToCodebook(data))
}

function handleContextMenuAction(action: "createFile" | "createDir" | "edit" | "delete") {
  closeContextMenu()
  if (!contextMenuTarget.value) return

  const target = contextMenuTarget.value

  if (action === "createFile") {
    activeEditor.value = target
    createFileDraft()
  } else if (action === "createDir") {
    activeEditor.value = target
    createDirectoryDraft()
  } else if (action === "edit") {
    openMetaDialog(target)
  } else if (action === "delete") {
    handleDelete(target)
  }
}

onMounted(async () => {
  window.addEventListener("click", closeContextMenu)
  if (!activeProjectId.value) {
    ElMessage.error("未找到项目参数")
    router.push("/task/codebook")
    return
  }
  await refreshAll()
})

onBeforeUnmount(() => {
  window.removeEventListener("click", closeContextMenu)
})
</script>

<style lang="scss" scoped>
.codebook-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: clamp(14px, 1.2vw, 22px);
  box-sizing: border-box;
}

.codebook-shell {
  position: relative;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;

  &.assistant-open {
    grid-template-columns: 300px minmax(480px, 1fr) minmax(350px, 400px);
  }
}

.codebook-main {
  display: flex;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.meta-name-input {
  :deep(.el-input__wrapper) {
    min-height: 42px;
    padding: 4px 12px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.06);
    }
  }

  :deep(.el-input__inner) {
    color: #1e293b;
    font-size: 13px;
    font-weight: 500;
  }
}

.script-name-composer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  width: 100%;
  min-height: 42px;
  overflow: hidden;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
  }

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.06);
  }

  :deep(.script-base-name-input .el-input__wrapper),
  :deep(.script-type-select .el-select__wrapper) {
    min-height: 40px;
    border: 0;
    border-radius: 0;
    box-shadow: none !important;
  }

  :deep(.script-base-name-input .el-input__wrapper) {
    padding: 4px 14px;
  }

  .script-type-select {
    width: 112px;
    border-left: 1px solid #e2e8f0;
  }

  :deep(.script-type-select .el-select__wrapper) {
    padding: 4px 12px 4px 14px;
    background: #f8fafc;
  }

  :deep(.script-type-select .el-select__selected-item) {
    color: #475569;
    font-size: 13px;
    font-weight: 600;
  }
}

:deep(.el-form-item.is-error .script-name-composer) {
  border-color: var(--el-color-danger);
}

@media (max-width: 1380px) {
  .codebook-shell.assistant-open {
    grid-template-columns: 260px minmax(420px, 1fr) 360px;
  }
}

@media (max-width: 1080px) {
  .codebook-shell {
    grid-template-columns: 240px minmax(0, 1fr);
  }

  .codebook-assistant {
    position: absolute;
    z-index: 20;
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, 92%);
    box-shadow: -12px 0 30px rgba(15, 23, 42, 0.16);
  }
}
</style>
