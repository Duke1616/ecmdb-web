<template>
  <PageContainer>
    <!-- 页面头部 -->
    <ManagerHeader
      :title="isEdit && template ? template.name : isEdit ? '编辑模板' : '创建模板'"
      :subtitle="
        isEdit && template
          ? `${template.description || '暂无描述'} • ${getChannelLabelFromConfig(template.channel)} • ${formatTimestamp(template.ctime)}`
          : isEdit
            ? '修改消息通知模板配置'
            : '创建新的消息通知模板'
      "
      :show-back-button="true"
      @refresh="handleRefresh"
      @back="handleBack"
    >
      <template #actions>
        <el-button type="primary" @click="handleSave" class="action-btn" :loading="saving">
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
                    <el-option
                      v-for="option in getChannelOptions()"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    >
                      <div>
                        <div>{{ option.label }}</div>
                        <div style="font-size: 12px; color: #999">{{ option.description }}</div>
                      </div>
                    </el-option>
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
          <TemplateBasicInfo
            v-if="!isEdit"
            ref="basicInfoRef"
            v-model:form-data="formData"
            :form-rules="templateFormRules"
          />

          <!-- 版本管理 -->
          <TemplateVersionManagement
            v-if="isEdit && template"
            :template="template"
            :template-versions="templateVersions"
            :current-version-id="currentVersionId"
            :has-versions="hasVersions"
            @create-version="(data) => handleCreateVersion(data, loadTemplateDetail)"
            @switch-version="(version) => switchToVersion(version, formData)"
            @publish-version="
              (versionId: number) => {
                if (templateIdValue) {
                  handlePublishVersion(templateIdValue, versionId, loadTemplateDetail)
                }
              }
            "
          />
        </div>

        <!-- 右侧：模板编辑器 -->
        <div class="right-panel">
          <TemplateEditor
            v-model="formData.version.content"
            :language="editorLanguage"
            :file-name="formData.name || 'template'"
            :show-preview="showPreview"
            :preview-content="renderedContent"
            :preview-mode="previewMode"
            :channel-label="editorHeaderLabel"
            @preview="togglePreview"
            @format="formatJson"
            @clear="handleClearContent"
            @update:model-value="handleContentChange"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import TemplateBasicInfo from "./components/TemplateBasicInfo.vue"
import TemplateVersionManagement from "./components/TemplateVersionManagement.vue"
import TemplateEditor from "./components/TemplateEditor.vue"
import { createTemplateApi, updateTemplateApi, getTemplateDetailApi } from "@/api/alert/template"
import type { ChannelTemplate } from "@/api/alert/template/types"
import { formatTimestamp } from "./utils"
import { getChannelOptions, getChannelLabel as getChannelLabelFromConfig } from "./config/channels"
import { templateFormRules } from "./config/formRules"
import { useVersionManagement } from "./composables/useVersionManagement"
import { useTemplateForm } from "./composables/useTemplateForm"

const route = useRoute()
const router = useRouter()

// 页面状态
const templateId = computed(() => {
  const id = route.params.id as string
  return id && !isNaN(Number(id)) ? parseInt(id) : null
})
const isEdit = computed(() => !!templateId.value)
const isCopy = computed(() => route.query.mode === "copy")

// 为了在模板中使用，创建一个响应式的 templateId
const templateIdValue = computed(() => templateId.value)

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
  getViewingVersionName,
  switchToVersion,
  handleCreateVersion,
  handlePublishVersion,
  handleUpdateVersion,
  initVersions
} = useVersionManagement()

// 模板表单管理
const {
  formData,
  showPreview,
  previewMode,
  editorLanguage,
  renderedContent,
  initializeMultiChannelData,
  handleChannelChange,
  handleContentChange,
  togglePreview,
  handleClearContent,
  formatJson,
  resetForm,
  setFormData
} = useTemplateForm()

// 表单引用
const formRef = ref()
const basicInfoRef = ref()

// 加载模板详情
const loadTemplateDetail = async () => {
  if (!templateId.value) {
    console.warn("模板ID不存在，无法加载详情")
    return
  }

  try {
    const response = await getTemplateDetailApi(templateId.value)
    template.value = response.data

    // 初始化版本数据
    initVersions(response.data)

    // 填充表单数据
    setFormData({
      ownerId: response.data.ownerId,
      name: response.data.name,
      description: response.data.description,
      channel: response.data.channel,
      version: {
        name: getCurrentVersionName(response.data),
        content: getCurrentVersionContent(response.data),
        desc: getCurrentVersionRemark(response.data)
      }
    })
  } catch (error: any) {
    console.error("加载模板详情失败:", error)
    ElMessage.error("加载模板详情失败")
  }
}
// 验证基本信息表单
const validateBasicInfo = async (): Promise<void> => {
  if (isEdit.value) {
    // 编辑模式：验证头部表单
    if (!formRef.value) {
      console.warn("编辑模式下的表单引用不存在，跳过表单验证")
      return
    }
    await formRef.value.validate()
  } else {
    // 创建模式：验证基本信息表单
    if (!basicInfoRef.value?.formRef) {
      throw new Error("创建模式下的表单引用不存在")
    }
    await basicInfoRef.value.formRef.validate()
  }
}

// 保存版本内容
const saveVersionContent = async (): Promise<void> => {
  if (!currentVersionId.value) {
    throw new Error("没有选中的版本")
  }

  await handleUpdateVersion(
    currentVersionId.value,
    getCurrentVersionName(template.value as any) || formData.value.version.name,
    formData.value.version.content,
    loadTemplateDetail
  )
}

// 保存模板基本信息
const saveTemplateBasicInfo = async (): Promise<void> => {
  if (!templateId.value) {
    ElMessage.error("模板ID不存在，无法保存")
    return
  }

  await updateTemplateApi({ ...formData.value, id: templateId.value })
  ElMessage.success("模板更新成功")
}

// 创建模板并自动发布
const createTemplateAndPublish = async (): Promise<void> => {
  const response = await createTemplateApi(formData.value)
  ElMessage.success("模板创建成功")

  // 自动发布当前版本
  if (response.data.template.id && response.data.template.activeVersionId) {
    try {
      await handlePublishVersion(response.data.template.id, response.data.template.activeVersionId)
      ElMessage.success("版本已自动发布")
    } catch (error) {
      console.error("自动发布失败:", error)
    }
  }

  // 跳转到列表页
  router.push("/alert/notify/template")
}

// 保存模板
const handleSave = async (): Promise<void> => {
  try {
    saving.value = true

    // 验证基本信息表单
    try {
      await validateBasicInfo()
    } catch (error: any) {
      // 如果是创建模式且表单验证失败，则阻止保存
      if (!isEdit.value) {
        throw error
      }
      // 编辑模式下表单验证失败只显示警告，不阻止保存
      console.warn("表单验证失败:", error)
      ElMessage.warning("表单验证失败，但继续保存")
    }

    if (isEdit.value) {
      // 编辑模式：保存版本内容或基本信息
      if (currentVersionId.value) {
        await saveVersionContent()
      } else {
        await saveTemplateBasicInfo()
      }
    } else {
      // 创建模式：创建模板并自动发布
      await createTemplateAndPublish()
    }
  } catch (error: any) {
    console.error("保存失败:", error)
  } finally {
    saving.value = false
  }
}

// 返回操作
const handleBack = () => {
  router.go(-1)
}

// 监听渠道变化，自动切换内容
watch(
  () => formData.value.channel,
  (newChannel, oldChannel) => {
    // 只有在创建模式下且渠道真正改变时才处理
    if (!isEdit.value && newChannel && newChannel !== oldChannel) {
      handleChannelChange(newChannel)
    }
  }
)

// 刷新操作
const handleRefresh = () => {
  if (isEdit.value) {
    loadTemplateDetail()
  } else {
    // 重置表单
    resetForm()
    // 重新初始化多渠道数据
    initializeMultiChannelData()
    // 清理表单验证
    const currentFormRef = basicInfoRef.value?.formRef
    if (currentFormRef) {
      currentFormRef.clearValidate()
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
    // 创建模式，初始化多渠道数据
    initializeMultiChannelData()
  }
})

// 页面卸载时清理
onUnmounted(() => {
  // 清理工作由 useTemplateForm 内部处理
})

// 编辑器标题：渠道标签 · 查看中的版本名（创建模式用当前表单里的版本名）
const editorHeaderLabel = computed(() => {
  const channelLabel = getChannelLabelFromConfig(formData.value.channel)
  // 显式依赖 currentVersionId，确保左侧版本切换可触发重算
  const _currentId = currentVersionId.value
  // 编辑模式读取查看中的版本名；创建模式读取表单中的版本名
  const versionName = isEdit.value ? getViewingVersionName(template.value as any) : formData.value.version.name
  return versionName ? `${channelLabel} · ${versionName}` : channelLabel
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
