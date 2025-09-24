<template>
  <PageContainer>
    <!-- 页面头部 -->
    <ManagerHeader
      :title="isEdit && template ? template.name : isEdit ? '编辑模板' : '创建模板'"
      :subtitle="
        isEdit && template
          ? `${template.description || '暂无描述'} • ${getChannelLabel(template.channel)} • ${formatTimestamp(template.ctime)}`
          : isEdit
            ? '修改消息通知模板配置'
            : '创建新的消息通知模板'
      "
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEdit ? "保存修改" : "创建模板" }}
        </el-button>
      </template>

      <!-- 基本信息表单（仅编辑时在头部展示） -->
      <template #content v-if="isEdit">
        <div class="header-form">
          <el-form ref="formRef" :model="formData" :rules="templateFormRules" label-width="80px" size="small">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="模板名称" prop="name">
                  <el-input v-model="formData.name" placeholder="请输入模板名称" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="渠道类型" prop="channel">
                  <el-select v-model="formData.channel" placeholder="请选择渠道类型" style="width: 100%">
                    <el-option label="邮件" value="EMAIL" />
                    <el-option label="短信" value="SMS" />
                    <el-option label="钉钉" value="DINGTALK" />
                    <el-option label="企业微信" value="WECHAT" />
                    <el-option label="Slack" value="SLACK" />
                    <el-option label="飞书卡片" value="FEISHU_CARD" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8" v-if="isEdit && template">
                <el-form-item label="创建时间">
                  <el-input :value="formatTimestamp(template.ctime)" readonly />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="描述" prop="description">
                  <el-input v-model="formData.description" type="textarea" :rows="2" placeholder="请输入模板描述" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </template>
    </ManagerHeader>

    <!-- 主要内容区域 -->
    <div class="page-content">
      <div class="content-layout">
        <!-- 左侧：基本信息 / 版本管理 -->
        <div class="left-panel">
          <!-- 创建模式：基本信息 -->
          <el-card class="basic-info-card" v-if="!isEdit">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
              </div>
            </template>

            <el-form ref="formRef" :model="formData" :rules="templateFormRules" label-position="top">
              <el-form-item label="模板名称" prop="name">
                <el-input v-model="formData.name" placeholder="请输入模板名称" />
              </el-form-item>
              <el-form-item label="渠道类型" prop="channel">
                <el-select v-model="formData.channel" placeholder="请选择渠道类型" style="width: 100%">
                  <el-option label="邮件" value="EMAIL" />
                  <el-option label="短信" value="SMS" />
                  <el-option label="钉钉" value="DINGTALK" />
                  <el-option label="企业微信" value="WECHAT" />
                  <el-option label="Slack" value="SLACK" />
                  <el-option label="飞书卡片" value="FEISHU_CARD" />
                </el-select>
              </el-form-item>
              <el-form-item label="版本名称" prop="version.name">
                <el-input v-model="formData.version.name" placeholder="请输入版本名称" />
              </el-form-item>
              <el-form-item label="版本备注">
                <el-input v-model="formData.version.remark" placeholder="版本备注（可选）" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入模板描述（可选）"
                />
              </el-form-item>
            </el-form>
          </el-card>

          <!-- 版本管理 -->
          <el-card class="version-management-card" v-if="isEdit && template">
            <template #header>
              <div class="card-header">
                <h3>版本管理</h3>
                <div class="header-actions">
                  <span class="version-count">{{ templateVersions.length }} 个版本</span>
                  <el-button size="small" type="primary" @click="handleCreateVersion(formData)"> 新增版本 </el-button>
                </div>
              </div>
            </template>

            <div class="version-list" v-if="hasVersions">
              <div
                v-for="version in templateVersions"
                :key="version.id"
                class="version-item"
                :class="{ active: version.id === template?.activeVersionId }"
                @click="switchToVersion(version, formData)"
              >
                <div class="version-main">
                  <div class="version-title">
                    <span class="version-name">{{ version.name }}</span>
                    <div class="version-badges">
                      <el-tag v-if="version.id === template?.activeVersionId" type="success" size="small"
                        >当前使用</el-tag
                      >
                      <el-tag v-if="version.id === currentVersionId" type="primary" size="small">查看中</el-tag>
                      <span
                        v-if="version.id !== template?.activeVersionId && version.id !== currentVersionId"
                        class="version-badge-placeholder"
                      />
                    </div>
                  </div>
                  <div class="version-meta">
                    <div class="version-remark">{{ version.remark || "无备注" }}</div>
                    <div class="version-time">{{ formatTimestamp(version.ctime) }}</div>
                  </div>
                </div>
                <div class="version-actions">
                  <el-button
                    v-if="version.id !== template?.activeVersionId"
                    size="small"
                    type="primary"
                    @click.stop="setActiveVersion(version.id)"
                  >
                    设为当前
                  </el-button>
                </div>
              </div>
            </div>

            <div v-else class="version-empty">
              <el-empty description="暂无版本" />
            </div>
          </el-card>
        </div>

        <!-- 右侧：模板编辑器 -->
        <div class="right-panel">
          <el-card class="editor-card">
            <template #header>
              <div class="card-header">
                <h3>
                  模板内容
                  <span class="language-badge">{{ getEditorLanguage(formData).toUpperCase() }}</span>
                </h3>
                <CodeEditorToolbar
                  :language="getEditorLanguage(formData)"
                  :file-name="formData.name || 'template'"
                  :show-preview="showPreview"
                  @preview="togglePreview"
                  @format="() => formatJson(formData)"
                  @clear="() => handleClearContent(formData)"
                />
              </div>
            </template>
            <div class="editor-container">
              <div class="editor-split">
                <div class="editor-panel">
                  <CodeEditor
                    v-model:code="formData.version.content"
                    :language="getEditorLanguage(formData)"
                    :is-create="false"
                    class="template-editor"
                    :show-preview="showPreview"
                    :preview-content="renderedContent(formData.version.content)"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import CodeEditor from "@/common/components/CodeEditor/index.vue"
import CodeEditorToolbar from "@/common/components/CodeEditor/toolbar.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import { createTemplateApi, updateTemplateApi, getTemplateDetailApi } from "@/api/alert/template"
import type { CreateTemplateReq, ChannelTemplate, TemplateVersion } from "@/api/alert/template/types"
import { formatTimestamp, getChannelLabel, formatJsonContent } from "./utils"
import { templateFormRules } from "./config/formRules"
import { useVersionManagement } from "./composables/useVersionManagement"
import { useTemplateEditor } from "./composables/useTemplateEditor"

const route = useRoute()
const router = useRouter()

// 页面状态
const isEdit = computed(() => route.name === "AlertTemplateEdit")
const isCopy = computed(() => route.query.mode === "copy")
const templateId = computed(() => parseInt(route.params.id as string))

// 数据状态
const template = ref<ChannelTemplate | null>(null)
const saving = ref(false)

// 版本管理
const {
  templateVersions,
  currentVersionId,
  hasVersions,
  getCurrentVersionName,
  getCurrentVersionContent,
  getCurrentVersionRemark,
  switchToVersion,
  setActiveVersion,
  handleCreateVersion,
  initVersions
} = useVersionManagement()

// 模板编辑器
const {
  showPreview,
  isJsonTemplate,
  renderedContent,
  togglePreview,
  handleClearContent,
  formatJson,
  getEditorLanguage,
  setDefaultContent
} = useTemplateEditor()

// 表单数据
const formData = ref<CreateTemplateReq>({
  ownerId: 1,
  name: "",
  description: "",
  channel: "",
  version: {
    name: "",
    content: "",
    remark: ""
  }
})

// 表单引用
const formRef = ref()



// 加载模板详情
const loadTemplateDetail = async () => {
  try {
    const response = await getTemplateDetailApi(templateId.value)
    template.value = response.data

    // 初始化版本数据
    initVersions(response.data)

    // 填充表单数据
    formData.value = {
      ownerId: response.data.ownerId,
      name: response.data.name,
      description: response.data.description,
      channel: response.data.channel,
      version: {
        name: getCurrentVersionName(response.data),
        content: getCurrentVersionContent(response.data),
        remark: getCurrentVersionRemark(response.data)
      }
    }
  } catch (error: any) {
    console.error("加载模板详情失败:", error)
    ElMessage.error("加载模板详情失败")
  }
}
// 保存模板
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    if (isEdit.value) {
      await updateTemplateApi({ ...formData.value, id: templateId.value })
      ElMessage.success("模板更新成功")
    } else {
      await createTemplateApi(formData.value)
      ElMessage.success("模板创建成功")
    }

    router.push("/alert/template")
  } catch (error: any) {
    console.error("保存失败:", error)
    ElMessage.error("保存失败")
  } finally {
    saving.value = false
  }
}

// 取消操作
const handleCancel = () => {
  router.push("/alert/template")
}

// 刷新操作
const handleRefresh = () => {
  if (isEdit.value) {
    loadTemplateDetail()
  } else {
    // 重置表单
    formData.value = {
      ownerId: 1,
      name: "",
      description: "",
      channel: "",
      version: {
        name: "",
        content: "",
        remark: ""
      }
    }
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  }
}

// 页面初始化
onMounted(() => {
  if (isEdit.value) {
    loadTemplateDetail()
  } else if (isCopy.value) {
    // 复制模式，加载原模板数据
    loadTemplateDetail()
  } else {
    // 创建模式，设置默认内容
    setDefaultContent(formData.value)
  }
})
</script>


<style lang="scss" scoped>
.page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-layout {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0;
  width: 100%;
}

// 左侧面板
.left-panel {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

// 右侧面板
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

// 卡片样式
.form-card,
.basic-info-card,
.editor-card,
.version-management-card {
  height: 100%;

  :deep(.el-card__body) {
    padding: 20px;
  }
}

.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0;
    min-height: 0;
  }
}

// 头部表单样式
.header-form {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;

  .el-form {
    margin: 0;
  }

  .el-form-item {
    margin-bottom: 16px;
  }

  .el-form-item:last-child {
    margin-bottom: 0;
  }
}

// 卡片头部
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;

    .language-badge {
      padding: 2px 8px;
      background: #dbeafe;
      color: #1d4ed8;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .version-count {
      font-size: 12px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 2px 8px;
      border-radius: 12px;
    }
  }
}

// 编辑器头部操作按钮

// CodeEditor Toolbar 样式
:deep(.editor-toolbar) {
  margin-top: 0;
  padding: 0;
  border-top: none;
}

// 编辑器容器
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.editor-split {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-panel {
  flex: 1;
  min-height: 0;
}

// 模板编辑器
.template-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.code-mirror) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :deep(.editor) {
    flex: 1;
    min-height: 0;
  }

  :deep(.cm-editor) {
    height: 100% !important;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
    font-size: 14px;
    line-height: 1.6;
    border: none;
    border-radius: 0;

    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    /* 自定义滚轮样式 - 参考 FileManager 实现 */
    .cm-scroller {
      &::-webkit-scrollbar {
        width: 8px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        transition: background 0.3s ease;

        &:hover {
          background: #94a3b8;
        }
      }
    }
  }
}

// 版本管理样式
.version-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.version-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  &:hover {
    border-color: #3b82f6;
  }

  &.active {
    border-color: #10b981;
    background: #f0fdf4;
  }
}

.version-main {
  flex: 1;
  min-width: 0;
}

.version-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.version-name {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.version-badges {
  display: flex;
  gap: 4px;
  min-height: 20px; // 确保容器有最小高度
}

.version-badge-placeholder {
  display: inline-block;
  width: 0;
  height: 20px; // 与 el-tag 相同的高度
}

.version-meta {
  font-size: 12px;
  color: #6b7280;
}

.version-remark {
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-time {
  color: #9ca3af;
}

.version-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.version-empty {
  text-align: center;
  padding: 20px;
}

// 响应式设计
@media (max-width: 1024px) {
  .content-layout {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    max-height: none;
  }
}
</style>
