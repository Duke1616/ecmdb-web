<template>
  <FormDialog
    v-model="visible"
    title="删除模型"
    subtitle="确认模型影响范围并输入唯一标识以彻底删除"
    width="min(580px, calc(100vw - 24px))"
    :header-icon="Delete"
    :show-close="!submitting"
    :before-close="beforeClose"
    confirm-text="彻底删除模型"
    confirm-type="danger"
    :confirm-loading="submitting"
    :confirm-disabled="!uidMatches || submitting"
    :show-footer-info="false"
    @cancel="close"
    @confirm="submit"
    @closed="reset"
  >
    <div class="delete-dialog-content">
      <!-- 目标模型身份横幅：左侧图标与名称，右侧类型与唯一标识 -->
      <div class="target-hero-card">
        <div class="target-left">
          <div class="target-icon-box">
            <AppIcon :name="target?.icon" fallback="Document" class="target-icon" />
          </div>
          <span class="target-name">{{ target?.name || "未命名模型" }}</span>
        </div>

        <div class="target-right">
          <div class="target-uid-badge">
            <span class="uid-label">唯一标识</span>
            <code class="uid-text">{{ target?.uid || "-" }}</code>
          </div>
        </div>
      </div>

      <!-- 影响范围与保护说明：左右双栏布局，文字精炼短小 -->
      <div class="scope-grid">
        <!-- 左栏：级联清除 -->
        <div class="scope-card destructive">
          <div class="scope-header">
            <el-icon class="header-icon text-danger"><DeleteFilled /></el-icon>
            <span class="header-title">将级联清理</span>
            <span class="header-tag danger">不可逆</span>
          </div>
          <ul class="scope-list">
            <li>
              <span class="dot danger" />
              <span>模型基础配置与图标定义</span>
            </li>
            <li>
              <span class="dot danger" />
              <span>名下绑定的所有属性字段</span>
            </li>
            <li>
              <span class="dot danger" />
              <span>所有属性展示分组配置</span>
            </li>
          </ul>
        </div>

        <!-- 右栏：安全阻断 -->
        <div class="scope-card protective">
          <div class="scope-header">
            <el-icon class="header-icon text-primary"><Lock /></el-icon>
            <span class="header-title">安全防护规则</span>
            <span class="header-tag info">自动拦截</span>
          </div>
          <ul class="scope-list">
            <li>
              <span class="dot info" />
              <span>若存在存量资产，将拒绝删除</span>
            </li>
            <li>
              <span class="dot info" />
              <span>若被拓扑关系引用，将拒绝删除</span>
            </li>
            <li>
              <span class="dot info" />
              <span>内置核心模型受系统保护不可删</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 输入确认表单 -->
      <el-form class="confirm-form" label-position="top" @submit.prevent="submit">
        <el-form-item :error="confirmUid && !uidMatches ? '输入的内容与模型唯一标识不匹配' : ''">
          <template #label>
            <div class="form-label-row">
              <span>输入模型唯一标识</span>
              <code class="highlight-code" @click="copyUid" title="点击快速填入">{{ target?.uid }}</code>
              <span>确认删除：</span>
            </div>
          </template>
          <el-input
            v-model="confirmUid"
            size="large"
            autocomplete="off"
            :placeholder="`请输入 ${target?.uid || ''}`"
            :disabled="submitting"
            @keyup.enter="submit"
          >
            <template #suffix>
              <el-icon v-if="uidMatches" class="match-icon text-success"><Check /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { Delete, DeleteFilled, Check, Lock } from "@element-plus/icons-vue"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@/common/components/Dialogs"
import { deleteModelApi } from "@/api/cmdb/model"
import type { Model } from "@/api/cmdb/model/types/model"

const emit = defineEmits<{ success: [] }>()

const visible = ref(false)
const submitting = ref(false)
const target = ref<Model>()
const confirmUid = ref("")

const uidMatches = computed(() => Boolean(target.value) && confirmUid.value.trim() === target.value?.uid)

function open(model: Model) {
  target.value = model
  confirmUid.value = ""
  visible.value = true
}

function copyUid() {
  if (!target.value?.uid) return
  confirmUid.value = target.value.uid
  ElMessage.success("已填入模型唯一标识")
}

async function submit() {
  const model = target.value
  if (!model || !uidMatches.value || submitting.value) return

  submitting.value = true
  try {
    await deleteModelApi(model.uid)
    ElMessage.success("模型及关联属性已彻底删除")
    visible.value = false
    emit("success")
  } catch (error) {
    console.error("删除模型失败:", error)
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
  confirmUid.value = ""
  submitting.value = false
}

defineExpose({ open })
</script>

<style scoped lang="scss">
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

  .target-name {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
    white-space: nowrap;
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
    color: #475467;
  }
}

.target-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  .target-tag {
    font-size: 11px;
    border-radius: 4px;
  }
}

.target-uid-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .uid-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
  }

  .uid-text {
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
