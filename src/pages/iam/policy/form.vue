<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="formRules"
    label-position="top"
    class="policy-logic-form"
  >
    <!-- 1. 基础信息配置卡片 (可由父组件控制隐藏) -->
    <div v-if="!hideBasic" class="base-config-section">
      <div class="section-title">基础配置</div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="策略名称" prop="name">
            <el-input v-model="formData.name" placeholder="例如: 财务只读权限" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="策略识别码 (Code)" prop="code">
            <el-input v-model="formData.code" placeholder="建议大驼峰，如 FinanceReadOnly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="策略描述" prop="desc">
            <el-input v-model="formData.desc" placeholder="简述该策略的用途..." />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 2. 权限语句编排区 -->
    <div class="statement-orchestrator-section">
      <!-- 编辑器模式切换与功能 Bar -->
      <div class="editor-tabs-bar">
        <div class="left-tabs">
          <el-radio-group v-model="editorMode" size="default" class="premium-radio-group">
            <el-radio-button label="visual">
              <el-icon><Monitor /></el-icon> 可视化编辑
            </el-radio-button>
            <el-radio-button label="json">
              <el-icon><Document /></el-icon> 脚本编辑
            </el-radio-button>
          </el-radio-group>
        </div>
        <div class="right-actions">
          <el-button link class="import-btn" @click="handleImport">
            <el-icon><Download /></el-icon> 导入策略
          </el-button>
        </div>
      </div>

      <!-- 模式切换渲染 -->
      <div class="editor-body">
        <!-- 可视化模式 -->
        <div v-if="editorMode === 'visual'" class="visual-editor-container">
          <TransitionGroup name="stmt-list">
            <PolicyStatement
              v-for="(stmt, index) in formData.statement"
              :key="index"
              :stmt="stmt"
              :index="index"
              :permission-manifest="permissionManifest"
              @update:stmt="(val) => (formData.statement[index] = val)"
              @duplicate="duplicateStatement"
              @remove="removeStatement"
            />
          </TransitionGroup>

          <!-- 快捷添加栏 -->
          <div class="action-footer">
            <el-button class="add-btn-v4" @click="addStatement">
              <el-icon><Plus /></el-icon>
              添加新的权限语句
            </el-button>
          </div>
        </div>

        <!-- 脚本模式 (CodeMirror) -->
        <div v-else class="json-editor-container">
          <codemirror
            v-model="jsonCode"
            placeholder="请输入 JSON 格式的权限策略脚本..."
            :style="{ height: '100%' }"
            :autofit="true"
            :indent-with-tab="true"
            :tab-size="2"
            :extensions="codemirrorExtensions"
          />
        </div>
      </div>
    </div>
  </el-form>

  <!-- 完善信息弹窗 -->
  <FormDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    :subtitle="dialogSubtitle"
    header-icon="Coordinate"
    width="500px"
    :confirm-text="dialogConfirmText"
    @confirm="handleFinalSubmit"
    @cancel="dialogVisible = false"
  >
    <div class="confirm-form-wrapper">
      <el-form ref="dialogFormRef" :model="formData" :rules="formRules" label-position="top">
        <el-form-item label="策略名称" prop="name">
          <el-input v-model="formData.name" :placeholder="namePlaceholder" />
        </el-form-item>
        <el-form-item label="策略识别码 (Code)" prop="code">
          <el-input v-model="formData.code" :disabled="isEdit" :placeholder="codePlaceholder" />
        </el-form-item>
        <el-form-item label="策略描述" prop="desc">
          <el-input v-model="formData.desc" type="textarea" :rows="3" placeholder="简述该策略的应用场景..." />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { ElMessage, type FormInstance } from "element-plus"
import { Plus, Monitor, Document, Download } from "@element-plus/icons-vue"
import { Codemirror } from "vue-codemirror"
import { json } from "@codemirror/lang-json"
import { FormDialog } from "@@/components/Dialogs"
import { usePolicyForm } from "./composables/usePolicyForm"
import PolicyStatement from "./components/PolicyStatement.vue"

const props = defineProps<{ isEdit: boolean; code?: string; hideBasic?: boolean }>()
const emit = defineEmits(["success", "update:submitting"])

const codemirrorExtensions = [json()]
const dialogVisible = ref(false)
const dialogFormRef = ref<FormInstance>()

const {
  formRef,
  formData,
  formRules,
  loading,
  permissionManifest,
  editorMode,
  jsonCode,
  addStatement,
  removeStatement,
  duplicateStatement,
  validateStatements,
  submitForm
} = usePolicyForm(props, emit)

// --- 弹窗 UI 文本计算 ---
const isEdit = computed(() => props.isEdit)
const dialogTitle = computed(() => (isEdit.value ? "确认策略信息" : "完善策略信息"))
const dialogSubtitle = computed(() =>
  isEdit.value ? "您可以修改策略名称或描述，识别码 (Code) 通常不建议变更" : "为您的权限策略设置名称与识别码"
)
const dialogConfirmText = computed(() => (isEdit.value ? "确认并保存" : "确认并提交"))
const namePlaceholder = computed(() => (isEdit.value ? "" : "建议简单明了，如：财务读写权限"))
const codePlaceholder = computed(() => (isEdit.value ? "" : "建议大驼峰或下划线，如：FinanceAdmin"))

/**
 * 校验并开启提交对话框
 */
const validateAndOpenDialog = () => {
  if (validateStatements()) {
    dialogVisible.value = true
  }
}

/**
 * 最终提交逻辑
 */
const handleFinalSubmit = async () => {
  if (!dialogFormRef.value) return

  try {
    await dialogFormRef.value.validate()
    emit("update:submitting", true)
    await submitForm()
    dialogVisible.value = false
  } catch (error) {
    console.warn("[PolicyFormValidation]", error)
  } finally {
    emit("update:submitting", false)
  }
}

const handleImport = () => {
  ElMessage.info("策略导入功能开发中...")
}

// 暴露给父组件调用
defineExpose({
  validateAndOpenDialog,
  formData
})
</script>

<style lang="scss" scoped>
.policy-logic-form {
  padding: 0 4px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .base-config-section {
    flex-shrink: 0;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 12px;
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 16px;
      border-left: 4px solid #409eff;
      padding-left: 12px;
    }
  }

  .statement-orchestrator-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    /* 编辑器切换条样式 */
    .editor-tabs-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      padding: 10px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);

      .premium-radio-group {
        :deep(.el-radio-button__inner) {
          border-radius: 4px !important;
          border: none !important;
          background: transparent;
          color: #64748b;
          font-weight: 500;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 0 4px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 6px;
          &:hover {
            color: #409eff;
          }
        }
        :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
          background: #f1f5f9 !important;
          color: #409eff !important;
          box-shadow: none !important;
        }
      }

      .import-btn {
        color: #64748b;
        font-size: 14px;
        padding: 0 12px;
        &:hover {
          color: #409eff;
        }
      }
    }

    /* 核心编辑器区域 */
    .editor-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* 可视化模式容器 */
    .visual-editor-container {
      flex: 1;
      overflow-y: auto;
      padding-right: 4px;
    }

    /* 脚本模式容器 */
    .json-editor-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      border: 1px solid #e2e8f0;
      border-radius: 0 0 6px 6px;
      overflow: hidden;
      background: #f8fafc;
      :deep(.cm-editor) {
        flex: 1;
        font-family:
          ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 14px;
      }
    }
  }

  .action-footer {
    flex-shrink: 0;
    padding: 8px 0;
    .add-btn-v4 {
      width: 100%;
      height: 48px;
      border: 1px dashed #cbd5e1;
      background: #fff;
      color: #475569;
      font-size: 15px;
      font-weight: 500;
      &:hover {
        border-color: #409eff;
        color: #409eff;
        background: #f0f7ff;
      }
    }
  }
}

.stmt-list-enter-active,
.stmt-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.stmt-list-enter-from,
.stmt-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.confirm-form-wrapper {
  padding: 8px 4px;
}
</style>
