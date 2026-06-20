<template>
  <Drawer
    v-model="visible"
    title="版本历史"
    :subtitle="currentCodebook ? `管理脚本【${currentCodebook.name}】的版本快照` : '查看脚本版本'"
    :header-icon="Clock"
    size="58%"
    direction="rtl"
    :show-footer="false"
    class="codebook-version-drawer"
    @closed="handleClosed"
  >
    <div class="version-shell">
      <aside class="version-list-panel">
        <div class="version-toolbar">
          <el-button type="primary" :icon="Plus" :disabled="!currentCodebook?.id" @click="openCreateDialog">
            创建版本
          </el-button>
          <el-button :icon="RefreshRight" circle :loading="loading" @click="fetchVersions" />
        </div>

        <div class="version-list" v-loading="loading">
          <button
            v-for="item in versions"
            :key="item.id"
            class="version-item"
            :class="{ 'is-active': selectedVersion?.id === item.id, 'is-current': item.id === currentVersionID }"
            type="button"
            @click="selectVersion(item)"
          >
            <span class="version-main">
              <strong>v{{ item.version_no }}</strong>
              <el-tag v-if="item.id === currentVersionID" size="small" type="success" effect="plain">当前</el-tag>
            </span>
            <span class="version-message">{{ item.message || "无版本说明" }}</span>
            <span class="version-time">{{ formatVersionTime(item.ctime) }}</span>
          </button>

          <el-empty v-if="!loading && versions.length === 0" :image-size="96" description="暂无版本记录" />
        </div>
      </aside>

      <section class="version-preview-panel">
        <template v-if="selectedVersion">
          <div class="preview-heading">
            <div class="preview-title">
              <h3>v{{ selectedVersion.version_no }}</h3>
              <p>{{ selectedVersion.message || "无版本说明" }}</p>
            </div>
            <div class="preview-actions">
              <el-button
                type="primary"
                plain
                :disabled="selectedVersion.id === currentVersionID"
                :loading="usingVersion"
                @click="handleUseVersion(selectedVersion)"
              >
                使用此版本
              </el-button>
            </div>
          </div>

          <div class="version-code-preview" v-loading="detailLoading">
            <CodeEditor :code="selectedVersion.code || ''" :language="language" read-only />
          </div>
        </template>

        <div v-else class="preview-empty">
          <el-empty :image-size="120" description="选择左侧版本查看代码" />
        </div>
      </section>
    </div>

    <FormDialog
      v-model="createDialogVisible"
      title="创建脚本版本"
      subtitle="保存当前代码为一个可回溯版本"
      width="520px"
      :header-icon="Clock"
      :confirm-loading="creating"
      confirm-text="创建"
      @cancel="createDialogVisible = false"
      @confirm="handleCreateVersion"
    >
      <el-form ref="versionFormRef" :model="versionForm" :rules="versionRules" label-position="top">
        <el-form-item label="版本说明" prop="message">
          <el-input
            v-model="versionForm.message"
            type="textarea"
            :rows="4"
            placeholder="描述本次脚本变更，例如：修复部署参数处理"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </FormDialog>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from "vue"
import { Clock, Plus, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import { find, findIndex, orderBy } from "lodash-es"
import { Drawer, FormDialog } from "@/common/components/Dialogs"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import { formatTimestamp } from "@/common/utils/day"
import {
  createCodebookVersionApi,
  detailCodebookVersionApi,
  listCodebookVersionsApi,
  useCodebookVersionApi
} from "@/api/task/codebook"
import type { codebook, CodebookVersion } from "@/api/task/codebook/types/codebook"
import { inferLanguage } from "../composables/useCodebookFile"

const emit = defineEmits<{
  (e: "version-used"): void
  (e: "version-created"): void
}>()

const visible = ref(false)
const loading = ref(false)
const detailLoading = ref(false)
const creating = ref(false)
const usingVersion = ref(false)
const createDialogVisible = ref(false)
const currentCodebook = ref<codebook | null>(null)
const versions = ref<CodebookVersion[]>([])
const selectedVersion = ref<CodebookVersion | null>(null)
const versionFormRef = ref<FormInstance>()
const versionForm = ref({
  message: ""
})

const versionRules: FormRules = {
  message: [{ required: true, message: "请输入版本说明", trigger: "blur" }]
}

const currentVersionID = computed(() => currentCodebook.value?.current_version_id || 0)
const language = computed(() => inferLanguage(currentCodebook.value?.name || ""))

const open = async (row: codebook) => {
  currentCodebook.value = row
  visible.value = true
  await fetchVersions()
}

async function fetchVersions() {
  if (!currentCodebook.value?.id) return
  loading.value = true
  try {
    const { data } = await listCodebookVersionsApi({ node_id: currentCodebook.value.id })
    versions.value = orderBy(data.versions || [], ["version_no", "id"], ["desc", "desc"])
    if (!versions.value.length) {
      selectedVersion.value = null
      return
    }
    const current = find(versions.value, { id: currentVersionID.value })
    await selectVersion(current || versions.value[0])
  } finally {
    loading.value = false
  }
}

async function selectVersion(version: CodebookVersion) {
  selectedVersion.value = version
  if (version.code) return
  detailLoading.value = true
  try {
    const { data } = await detailCodebookVersionApi(version.id)
    selectedVersion.value = data
    const index = findIndex(versions.value, { id: version.id })
    if (index >= 0) versions.value[index] = data
  } finally {
    detailLoading.value = false
  }
}

function openCreateDialog() {
  versionForm.value = {
    message: ""
  }
  nextTick(() => {
    versionFormRef.value?.clearValidate()
    createDialogVisible.value = true
  })
}

async function handleCreateVersion() {
  if (!currentCodebook.value?.id || !versionFormRef.value) return
  const valid = await versionFormRef.value.validate()
  if (!valid) return
  creating.value = true
  try {
    await createCodebookVersionApi({
      node_id: currentCodebook.value.id,
      code: currentCodebook.value.code || "",
      message: versionForm.value.message.trim()
    })
    ElMessage.success("创建版本成功")
    createDialogVisible.value = false
    emit("version-created")
    await fetchVersions()
  } finally {
    creating.value = false
  }
}

async function handleUseVersion(version: CodebookVersion) {
  if (!currentCodebook.value?.id) return
  await ElMessageBox.confirm(`确认将脚本切换到 v${version.version_no} 吗？`, "使用版本", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
  usingVersion.value = true
  try {
    await useCodebookVersionApi({
      node_id: currentCodebook.value.id,
      version_id: version.id
    })
    ElMessage.success("已切换脚本版本")
    currentCodebook.value = {
      ...currentCodebook.value,
      code: version.code || currentCodebook.value.code,
      current_version_id: version.id
    }
    emit("version-used")
    await fetchVersions()
  } finally {
    usingVersion.value = false
  }
}

function handleClosed() {
  versions.value = []
  selectedVersion.value = null
  currentCodebook.value = null
}

function formatVersionTime(timestamp?: number) {
  if (!timestamp) return "-"
  const normalized = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  return formatTimestamp(normalized)
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.version-shell {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  background: #fff;
}

.version-list-panel {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid #eef2f7;
  background: #f8fafc;
}

.version-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 58px;
  padding: 10px 14px;
  border-bottom: 1px solid #e5e7eb;
  box-sizing: border-box;

  .el-button:first-child {
    flex: 1;
    height: 36px;
    font-size: 13px;
  }
}

.version-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px;
}

.version-item {
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
  }

  &.is-active {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.08);
  }

  &.is-current {
    background: #f0fdf4;
    border-color: #bbf7d0;
  }
}

.version-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }
}

.version-message,
.version-time {
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-preview-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.preview-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 58px;
  padding: 10px 18px;
  border-bottom: 1px solid #eef2f7;
  box-sizing: border-box;
}

.preview-title {
  min-width: 0;

  h3 {
    margin: 0;
    color: #0f172a;
    font-size: 16px;
    font-weight: 700;
    line-height: 1.2;
  }

  p {
    margin: 3px 0 0;
    overflow: hidden;
    color: #64748b;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  :deep(.el-button) {
    height: 34px;
    padding: 0 16px;
  }
}

.version-code-preview {
  flex: 1;
  min-height: 0;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 1080px) {
  .version-shell {
    grid-template-columns: 1fr;
  }

  .version-list-panel {
    max-height: 280px;
    border-right: none;
    border-bottom: 1px solid #eef2f7;
  }
}
</style>
