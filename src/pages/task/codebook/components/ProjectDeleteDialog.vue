<template>
  <FormDialog
    v-model="visible"
    title="删除项目"
    subtitle="确认删除影响并输入项目名称"
    width="min(600px, calc(100vw - 24px))"
    :header-icon="Delete"
    :show-close="!submitting"
    :before-close="beforeClose"
    confirm-text="删除"
    confirm-type="danger"
    :confirm-loading="submitting"
    :confirm-disabled="impactLoading || !impact || !nameMatches"
    :show-footer-info="false"
    @cancel="close"
    @confirm="submit"
    @closed="reset"
  >
    <div v-if="impactLoading" class="delete-dialog-loading">
      <el-skeleton animated :rows="5" />
    </div>

    <div v-else-if="impact" class="delete-dialog-content">
      <el-alert
        title="删除后无法恢复"
        description="项目源码、版本、AI 数据以及未被历史执行引用的制品将被永久清除。"
        type="error"
        show-icon
        :closable="false"
      />

      <section class="delete-impact-section">
        <h3>影响范围</h3>
        <div class="delete-impact-grid">
          <div class="delete-impact-item">
            <span>源码</span>
            <strong>{{ impact.codebook_node_count }}</strong>
            <small>{{ impact.codebook_version_count }} 个历史版本</small>
          </div>
          <div class="delete-impact-item">
            <span>制品发布</span>
            <strong>{{ impact.artifact_release_count }}</strong>
            <small>{{ formatBytes(impact.artifact_release_bytes) }}</small>
          </div>
          <div class="delete-impact-item">
            <span>项目快照</span>
            <strong>{{ impact.project_source_count }}</strong>
            <small>{{ formatBytes(impact.project_source_bytes) }}</small>
          </div>
          <div class="delete-impact-item">
            <span>关联数据</span>
            <strong>{{ impact.task_count }}</strong>
            <small>{{ impact.active_task_count }} 个任务将停用 · {{ impact.ai_conversation_count }} 个 AI 会话</small>
          </div>
        </div>
      </section>

      <el-alert
        v-if="hasRetainedObjects"
        :title="`历史执行仍引用 ${impact.retained_artifact_release_count} 个制品发布和 ${impact.retained_project_source_count} 个项目快照，这些对象会继续保留。`"
        type="warning"
        show-icon
        :closable="false"
      />

      <el-form class="delete-confirm-form" label-position="top" @submit.prevent="submit">
        <el-form-item :error="confirmName && !nameMatches ? '项目名称不匹配' : ''">
          <template #label>
            输入项目名称 <strong>{{ target?.name }}</strong> 以确认
          </template>
          <el-input
            v-model="confirmName"
            size="large"
            autocomplete="off"
            placeholder="请输入完整项目名称"
            :disabled="submitting"
            @keyup.enter="submit"
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Delete } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@/common/components/Dialogs"
import { deleteProjectApi, getProjectDeleteImpactApi } from "@/api/task/codebook"
import type { CodebookProject, ProjectDeleteImpact } from "@/api/task/codebook/types/codebook"

const emit = defineEmits<{ refresh: [] }>()

const visible = ref(false)
const impactLoading = ref(false)
const submitting = ref(false)
const target = ref<CodebookProject>()
const impact = ref<ProjectDeleteImpact>()
const confirmName = ref("")

const nameMatches = computed(() => Boolean(target.value) && confirmName.value === target.value?.name)
const hasRetainedObjects = computed(() => {
  const value = impact.value
  return Boolean(value && (value.retained_artifact_release_count > 0 || value.retained_project_source_count > 0))
})

async function open(project: CodebookProject) {
  target.value = project
  impact.value = undefined
  confirmName.value = ""
  impactLoading.value = true
  visible.value = true

  try {
    const { data } = await getProjectDeleteImpactApi(project.id)
    if (visible.value && target.value?.id === project.id) impact.value = data
  } catch (error) {
    if (target.value?.id === project.id) visible.value = false
    console.error("查询项目删除影响失败:", error)
  } finally {
    if (target.value?.id === project.id) impactLoading.value = false
  }
}

async function submit() {
  const project = target.value
  if (!project || !impact.value || !nameMatches.value || submitting.value) return

  submitting.value = true
  try {
    await deleteProjectApi(project.id, confirmName.value)
    ElMessage.success("项目已删除")
  } catch (error) {
    console.error("删除项目失败:", error)
  } finally {
    visible.value = false
    submitting.value = false
    emit("refresh")
  }
}

function close() {
  if (!submitting.value) visible.value = false
}

function beforeClose(done: () => void) {
  if (!submitting.value) done()
}

function reset() {
  target.value = undefined
  impact.value = undefined
  confirmName.value = ""
  impactLoading.value = false
  submitting.value = false
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

defineExpose({ open })
</script>

<style scoped lang="scss">
.delete-dialog-loading {
  min-height: 280px;
  padding: 18px 4px 8px;
}

.delete-dialog-content {
  display: flex;
  flex-direction: column;
  padding: 18px 4px 4px;
  gap: 16px;

  :deep(.el-alert) {
    align-items: flex-start;
    padding: 10px 12px;
  }
}

.delete-impact-section h3 {
  margin: 0 0 10px;
  color: #344054;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.5;
}

.delete-impact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.delete-impact-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  min-width: 0;
  min-height: 74px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  column-gap: 12px;

  span {
    color: #475467;
    font-size: 13px;
    font-weight: 600;
  }

  strong {
    color: #1d2939;
    font-size: 21px;
    font-weight: 700;
    line-height: 1;
  }

  small {
    grid-column: 1 / -1;
    min-width: 0;
    margin-top: 6px;
    color: #667085;
    font-size: 12px;
    line-height: 1.4;
  }
}

.delete-confirm-form {
  :deep(.el-form-item) {
    margin-bottom: 8px;
  }

  :deep(.el-form-item__label) {
    color: #344054;
    font-size: 13px;
    font-weight: 700;
  }

  :deep(.el-form-item__label strong) {
    color: #dc2626;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

@media (max-width: 560px) {
  .delete-impact-grid {
    grid-template-columns: 1fr;
  }

  .delete-impact-item {
    min-height: 68px;
  }
}
</style>
