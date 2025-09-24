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
                  <el-select
                    v-model="formData.channel"
                    placeholder="请选择渠道类型"
                    style="width: 100%"
                    @change="handleChannelChangeEvent"
                  >
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
            @channel-change="handleChannelChangeEvent"
          />

          <!-- 版本管理 -->
          <TemplateVersionManagement
            v-if="isEdit && template"
            :template="template"
            :template-versions="templateVersions"
            :current-version-id="currentVersionId"
            :has-versions="hasVersions"
            @create-version="() => handleCreateVersion(formData)"
            @switch-version="(version) => switchToVersion(version, formData)"
            @set-active-version="setActiveVersion"
          />
        </div>

        <!-- 右侧：模板编辑器 -->
        <div class="right-panel">
          <TemplateEditor
            v-model="formData.version.content"
            :language="getEditorLanguage(formData.channel)"
            :file-name="formData.name || 'template'"
            :show-preview="showPreview"
            :preview-content="renderedContent(formData.version.content)"
            :preview-mode="previewMode(formData.channel)"
            @preview="togglePreview"
            @format="() => formatJson(formData.channel)"
            @clear="() => handleClearContent(formData.channel)"
            @update:model-value="handleContentChange"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import TemplateBasicInfo from "./components/TemplateBasicInfo.vue"
import TemplateVersionManagement from "./components/TemplateVersionManagement.vue"
import TemplateEditor from "./components/TemplateEditor.vue"
import { createTemplateApi, updateTemplateApi, getTemplateDetailApi } from "@/api/alert/template"
import type { CreateTemplateReq, ChannelTemplate } from "@/api/alert/template/types"
import { formatTimestamp } from "./utils"
import { getChannelOptions, getChannelLabel as getChannelLabelFromConfig } from "./config/channels"
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
  currentChannel,
  previewMode,
  renderedContent,
  togglePreview,
  handleClearContent,
  formatJson,
  getEditorLanguage,
  initializeMultiChannelData,
  handleChannelChange,
  updateCurrentChannelContent,
  getCurrentChannelContent,
  clearAllChannelData
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
const basicInfoRef = ref()

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
  // 根据模式选择不同的表单引用
  const currentFormRef = isEdit.value ? formRef.value : basicInfoRef.value?.formRef

  if (!currentFormRef) return

  try {
    await currentFormRef.validate()
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

// 返回操作
const handleBack = () => {
  router.push("/alert/template")
}

// 处理渠道切换
const handleChannelChangeEvent = (newChannel: string) => {
  handleChannelChange(formData.value, newChannel)
}

// 处理内容变化
const handleContentChange = (content: string) => {
  updateCurrentChannelContent(content)
  formData.value.version.content = content
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
    // 重新初始化多渠道数据
    initializeMultiChannelData()
    currentChannel.value = formData.value.channel
    formData.value.version.content = getCurrentChannelContent()
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
    // 设置当前渠道为第一个渠道
    currentChannel.value = formData.value.channel
    // 设置默认内容
    formData.value.version.content = getCurrentChannelContent()
  }
})

// 页面卸载时清理
onUnmounted(() => {
  clearAllChannelData()
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
