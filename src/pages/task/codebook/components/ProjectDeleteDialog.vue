<template>
  <FormDialog
    v-model="visible"
    title="删除项目"
    subtitle="确认删除影响范围并输入项目名称以彻底删除"
    width="min(580px, calc(100vw - 24px))"
    :header-icon="Delete"
    :show-close="!submitting"
    :before-close="beforeClose"
    confirm-text="彻底删除项目"
    confirm-type="danger"
    :confirm-loading="submitting"
    :confirm-disabled="impactLoading || !impact || !nameMatches || submitting"
    :show-footer-info="false"
    @cancel="close"
    @confirm="submit"
    @closed="reset"
  >
    <div v-if="impactLoading" class="delete-dialog-loading">
      <el-skeleton animated :rows="6" />
    </div>

    <div v-else-if="impact" class="delete-dialog-content">
      <!-- 目标项目身份横幅：左侧图标与项目名称，右侧命名空间或项目标识 -->
      <div class="target-hero-card">
        <div class="target-left">
          <div class="target-icon-box">
            <el-icon class="target-icon"><FolderOpened /></el-icon>
          </div>
          <div class="target-info">
            <span class="target-name">{{ target?.name || "未命名项目" }}</span>
            <span v-if="target?.desc" class="target-desc">{{ target.desc }}</span>
          </div>
        </div>

        <div class="target-right">
          <div v-if="target?.artifact_namespace" class="target-badge">
            <span class="badge-label">命名空间</span>
            <code class="badge-text">{{ target.artifact_namespace }}</code>
          </div>
          <div v-else class="target-badge">
            <span class="badge-label">项目ID</span>
            <code class="badge-text">#{{ target?.id }}</code>
          </div>
        </div>
      </div>

      <!-- 影响范围与保护说明：清晰精炼、字少直观的双栏布局 -->
      <div class="scope-grid">
        <!-- 左栏：未受保护，将被物理级联清除 -->
        <div class="scope-card destructive">
          <div class="scope-header">
            <el-icon class="header-icon text-danger"><DeleteFilled /></el-icon>
            <span class="header-title">将级联清理</span>
            <span class="header-tag danger">不可逆</span>
          </div>
          <ul class="scope-list">
            <li>
              <span class="dot danger" />
              <span>项目源码与全部历史版本</span>
            </li>
            <li>
              <span class="dot danger" />
              <span>未被引用的制品发布 ({{ unreferencedArtifactCount }})</span>
            </li>
            <li>
              <span class="dot danger" />
              <span>未被引用的项目快照 ({{ unreferencedSourceCount }})</span>
            </li>
            <li v-if="impact.ai_conversation_count > 0">
              <span class="dot danger" />
              <span>关联 AI 会话与变更集 ({{ impact.ai_conversation_count }})</span>
            </li>
          </ul>
        </div>

        <!-- 右栏：受保护保留规则与安全机制 -->
        <div class="scope-card protective">
          <div class="scope-header">
            <el-icon class="header-icon text-primary"><Lock /></el-icon>
            <span class="header-title">安全防护规则</span>
            <span class="header-tag info">自动保护</span>
          </div>
          <ul class="scope-list">
            <li>
              <span class="dot info" />
              <span>关联任务自动停用，不删记录</span>
            </li>
            <li>
              <span class="dot info" />
              <span>历史引用的制品安全保留 ({{ impact.retained_artifact_release_count }})</span>
            </li>
            <li>
              <span class="dot info" />
              <span>历史引用的快照安全保留 ({{ impact.retained_project_source_count }})</span>
            </li>
            <li>
              <span class="dot info" />
              <span>仅清理孤立对象，保障审计追溯</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 历史执行对象保留提醒条（当存在受保护保留的对象时展示） -->
      <div v-if="hasRetainedObjects" class="retained-notice-card">
        <el-icon class="notice-icon"><InfoFilled /></el-icon>
        <span class="notice-text">
          历史执行引用的 <strong>{{ retainedSummaryText }}</strong> 受系统保护，将继续保留。
        </span>
      </div>

      <!-- 输入确认表单 -->
      <el-form class="confirm-form" label-position="top" @submit.prevent="submit">
        <el-form-item :error="confirmName && !nameMatches ? '输入的内容与项目名称不匹配' : ''">
          <template #label>
            <div class="form-label-row">
              <span>输入项目名称</span>
              <code class="highlight-code" title="点击快速填入" @click="copyName">{{ target?.name }}</code>
              <span>确认删除：</span>
            </div>
          </template>
          <el-input
            v-model="confirmName"
            size="large"
            autocomplete="off"
            :placeholder="`请输入 ${target?.name || ''}`"
            :disabled="submitting"
            @keyup.enter="submit"
          >
            <template #suffix>
              <el-icon v-if="nameMatches" class="match-icon text-success"><Check /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Delete, DeleteFilled, Lock, Check, FolderOpened, InfoFilled } from "@element-plus/icons-vue"
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

const nameMatches = computed(() => Boolean(target.value) && confirmName.value.trim() === target.value?.name)

/**
 * 根据 etask 后端实现：
 * 被历史任务执行（TaskExecution）引用的制品发布和项目快照将受系统保护保留。
 */
const hasRetainedObjects = computed(() => {
  const value = impact.value
  return Boolean(value && (value.retained_artifact_release_count > 0 || value.retained_project_source_count > 0))
})

/** 未被历史执行引用的制品数量（将被清理） */
const unreferencedArtifactCount = computed(() => {
  if (!impact.value) return 0
  return Math.max(0, impact.value.artifact_release_count - impact.value.retained_artifact_release_count)
})

/** 未被历史执行引用的快照数量（将被清理） */
const unreferencedSourceCount = computed(() => {
  if (!impact.value) return 0
  return Math.max(0, impact.value.project_source_count - impact.value.retained_project_source_count)
})

/** 受保护保留的资产简述（字少清晰） */
const retainedSummaryText = computed(() => {
  if (!impact.value) return ""
  const parts: string[] = []
  if (impact.value.retained_artifact_release_count > 0) {
    parts.push(`${impact.value.retained_artifact_release_count} 个制品`)
  }
  if (impact.value.retained_project_source_count > 0) {
    parts.push(`${impact.value.retained_project_source_count} 个快照`)
  }
  return parts.join("与")
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

function copyName() {
  if (!target.value?.name) return
  confirmName.value = target.value.name
  ElMessage.success("已填入项目名称")
}

async function submit() {
  const project = target.value
  if (!project || !impact.value || !nameMatches.value || submitting.value) return

  submitting.value = true
  try {
    await deleteProjectApi(project.id, confirmName.value.trim())
    ElMessage.success("项目已彻底删除")
    visible.value = false
    emit("refresh")
  } catch (error) {
    console.error("删除项目失败:", error)
  } finally {
    submitting.value = false
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

defineExpose({ open })
</script>

<style scoped lang="scss">
.delete-dialog-loading {
  min-height: 240px;
  padding: 16px 4px 8px;
}

.delete-dialog-content {
  display: flex;
  flex-direction: column;
  padding: 4px 2px 2px;
  gap: 14px;
}

// 目标身份卡片：左右两端对齐
.target-hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.target-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .target-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .target-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .target-desc {
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.target-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  flex-shrink: 0;

  .target-icon {
    font-size: 18px;
    color: #2563eb;
  }
}

.target-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.target-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .badge-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
  }

  .badge-text {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
    color: #0369a1;
    background: #f0f9ff;
    border: 1px solid #e0f2fe;
    padding: 1px 6px;
    border-radius: 4px;
  }
}

// 影响与保护区块：双栏布局
.scope-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.scope-card {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid transparent;

  &.destructive {
    background: #fffbfa;
    border-color: #fee4e2;
  }

  &.protective {
    background: #f8fafc;
    border-color: #e2e8f0;
  }
}

.scope-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;

  .header-icon {
    font-size: 14px;
  }

  .header-title {
    font-size: 12.5px;
    font-weight: 700;
    color: #1e293b;
    flex: 1;
  }

  .header-tag {
    font-size: 10.5px;
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;

    &.danger {
      color: #b42318;
      background: #fef3f2;
      border: 1px solid #fee4e2;
    }

    &.info {
      color: #0369a1;
      background: #f0f9ff;
      border: 1px solid #e0f2fe;
    }
  }
}

.scope-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #475467;
    line-height: 1.4;
    white-space: nowrap;

    strong {
      color: #1e293b;
      font-weight: 600;
    }

    .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;

      &.danger {
        background: #ef4444;
      }

      &.info {
        background: #0ea5e9;
      }
    }
  }
}

// 历史保留对象通知条
.retained-notice-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 6px;
  color: #92400e;
  font-size: 11.5px;
  line-height: 1.5;

  .notice-icon {
    font-size: 14px;
    color: #d97706;
    margin-top: 2px;
    flex-shrink: 0;
  }

  strong {
    font-weight: 700;
    color: #78350f;
  }
}

// 确认表单
.confirm-form {
  margin-top: 2px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  .form-label-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 12.5px;
    font-weight: 600;
    color: #334155;

    .highlight-code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      font-weight: 700;
      color: #dc2626;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      padding: 1px 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #fee2e2;
        border-color: #fca5a5;
      }
    }
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    transition: all 0.2s ease;

    &:focus-within {
      box-shadow: 0 0 0 1px #dc2626 inset !important;
    }
  }

  .match-icon {
    font-size: 16px;
  }
}

.text-danger {
  color: #dc2626;
}

.text-primary {
  color: #0284c7;
}

.text-success {
  color: #16a34a;
}

.text-warning {
  color: #d97706;
}

@media (max-width: 540px) {
  .target-hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .target-right {
    width: 100%;
    justify-content: flex-start;
  }

  .scope-grid {
    grid-template-columns: 1fr;
  }
}
</style>
