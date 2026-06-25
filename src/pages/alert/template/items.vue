<template>
  <PageContainer>
    <ManagerHeader
      :title="templateSet ? `模板集合 - ${templateSet.name}` : '模板集合'"
      subtitle="按通知渠道维护模板内容"
      :show-back-button="true"
      @refresh="loadTemplateSet"
      @back="handleBack"
    >
      <template #actions>
        <el-button :icon="RefreshRight" class="action-btn" @click="loadTemplateSet">刷新</el-button>
        <el-button type="danger" plain :icon="Delete" class="action-btn" :loading="clearingAll" @click="handleClearAll">
          清空全部渠道
        </el-button>
        <el-button type="primary" :icon="Check" class="action-btn" :loading="activeDraft?.saving" @click="handleSave">
          保存当前渠道
        </el-button>
      </template>
    </ManagerHeader>

    <div class="template-workbench" v-loading="loading">
      <CreateVersionDialog
        v-model="createVersionVisible"
        :template-versions="activeDraft?.versions || []"
        :current-active-version-id="activeDraft?.activeVersionId || 0"
        @confirm="handleCreateVersion"
      />

      <TemplateChannelRail
        :channels="channelOptions"
        :active-channel="activeChannel"
        :get-channel-state="getChannelConfigText"
        :can-delete-channel="canClearChannel"
        :deleting-channel="clearingChannel"
        @select="selectChannel"
        @delete="handleClearChannel"
      />

      <section v-if="activeDraft" class="editor-shell">
        <div class="editor-layout">
          <div class="editor-main">
            <TemplateEditor
              :model-value="activeDraft.content"
              :language="getEditorLanguage(activeChannel)"
              :file-name="getGeneratedTemplateName(activeChannel)"
              :show-preview="showPreview"
              :preview-content="previewContent"
              :preview-mode="getPreviewMode(activeChannel)"
              :channel-label="editorHeaderLabel"
              class="set-template-editor"
              @update:model-value="handleContentUpdate"
              @preview="showPreview = !showPreview"
              @format="handleFormat"
              @clear="handleClear"
            >
              <template #toolbar-actions>
                <button class="editor-version-btn" @click="versionPanelVisible = !versionPanelVisible">
                  <span class="btn-icon">▦</span>
                  <span class="btn-text">版本</span>
                </button>
              </template>
            </TemplateEditor>
          </div>
        </div>
      </section>

      <TemplateVersionDrawer
        v-model="versionPanelVisible"
        :draft="activeDraft"
        :channel-label="getChannelLabel(activeChannel)"
        :initial-version-name="INITIAL_VERSION_NAME"
        @create-version="createVersionVisible = true"
        @switch-version="switchVersion"
        @publish-version="publishVersion"
      />
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useRouter } from "vue-router"
import { Check, Delete, RefreshRight } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import TemplateEditor from "./components/TemplateEditor.vue"
import CreateVersionDialog from "./components/CreateVersionDialog.vue"
import TemplateChannelRail from "./components/TemplateChannelRail.vue"
import TemplateVersionDrawer from "./components/TemplateVersionDrawer.vue"
import { INITIAL_VERSION_NAME, useTemplateEditor } from "./composables/useTemplateEditor"

const router = useRouter()

const {
  templateSet,
  loading,
  clearingAll,
  clearingChannel,
  showPreview,
  createVersionVisible,
  versionPanelVisible,
  activeChannel,
  activeDraft,
  channelOptions,
  editorHeaderLabel,
  previewContent,
  loadTemplateSet,
  selectChannel,
  handleContentUpdate,
  handleClear,
  handleClearChannel,
  handleClearAll,
  canClearChannel,
  handleFormat,
  handleSave,
  handleCreateVersion,
  switchVersion,
  publishVersion,
  getChannelConfigText,
  getGeneratedTemplateName,
  getChannelLabel,
  getEditorLanguage,
  getPreviewMode
} = useTemplateEditor()

const handleBack = () => {
  router.go(-1)
}

onMounted(() => {
  loadTemplateSet()
})
</script>

<style lang="scss" scoped>
.template-workbench {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
}

.editor-shell {
  min-height: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-layout {
  flex: 1;
  min-height: 0;
  position: relative;
  display: flex;
}

.editor-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
}

.set-template-editor {
  flex: 1;
  width: 100%;
  min-height: 0;

  :deep(.editor-card) {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  :deep(.editor-container) {
    padding: 0;
  }
}

.editor-version-btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;

  &:hover {
    background: #f9fafb;
    border-color: #9ca3af;
  }
}

@media (max-width: 900px) {
  .template-workbench {
    grid-template-columns: 1fr;
  }
}
</style>
