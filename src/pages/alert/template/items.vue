<template>
  <ProGovernanceLayout
    :title="templateSet ? `模板集合 - ${templateSet.name}` : '模板集合'"
    subtitle="按通知渠道维护模板内容"
    show-back-button
    is-detail
    :swap-actions="false"
    :primary-action="{
      capability: saveCapability,
      mode: savePermissionMode,
      label: '保存模版',
      icon: Check,
      loading: activeDraft?.saving,
      disabled: isReadonlyTemplateSet
    }"
    :danger-action="{
      capability: ALERT_CAPABILITIES.TemplateSet.TemplateClear,
      label: '清空模版',
      icon: Delete,
      loading: clearingAll,
      disabled: isReadonlyTemplateSet
    }"
    @refresh="loadTemplateSet"
    @primary-action="handleSave"
    @danger-action="handleClearAll"
    @back="handleBack"
  >
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
        :readonly="isReadonlyTemplateSet"
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
              :clear-capability="ALERT_CAPABILITIES.TemplateSet.TemplateClear"
              :clear-disabled="isReadonlyTemplateSet"
              :read-only="isReadonlyTemplateSet"
              class="set-template-editor"
              @update:model-value="handleTemplateContentUpdate"
              @preview="showPreview = !showPreview"
              @format="handleFormat"
              @clear="handleClearActiveChannel"
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
        :readonly="isReadonlyTemplateSet"
        @create-version="handleOpenCreateVersion"
        @switch-version="switchVersion"
        @publish-version="handlePublishVersion"
      />
    </div>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Check, Delete } from "@element-plus/icons-vue"
import { useUserStore } from "@/pinia/stores/user"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import { PermissionMode } from "@/common/composables/usePermission"
import { isReadonlySystemResource, SYSTEM_RESOURCE_READONLY_MESSAGE } from "./utils"
import TemplateEditor from "./components/TemplateEditor.vue"
import CreateVersionDialog from "./components/CreateVersionDialog.vue"
import TemplateChannelRail from "./components/TemplateChannelRail.vue"
import TemplateVersionDrawer from "./components/TemplateVersionDrawer.vue"
import { INITIAL_VERSION_NAME, useTemplateEditor } from "./composables/useTemplateEditor"

const router = useRouter()
const userStore = useUserStore()

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
  handleClear: clearActiveChannelTemplate,
  handleClearChannel: clearChannelTemplate,
  handleClearAll: clearAllTemplates,
  canClearChannel,
  handleFormat,
  handleSave: saveTemplate,
  handleCreateVersion: createTemplateVersion,
  switchVersion,
  publishVersion: publishTemplateVersion,
  getChannelConfigText,
  getGeneratedTemplateName,
  getChannelLabel,
  getEditorLanguage,
  getPreviewMode
} = useTemplateEditor()

const currentTenant = computed(() =>
  userStore.tenants.find((tenant) => Number(tenant.id) === Number(userStore.currentTenantId))
)
const isReadonlyTemplateSet = computed(() =>
  isReadonlySystemResource(templateSet.value, userStore.currentTenantId, currentTenant.value)
)

const saveCapability = computed(() => {
  if (activeDraft.value?.templateId) {
    return ALERT_CAPABILITIES.Template.VersionEdit
  }
  return [ALERT_CAPABILITIES.Template.Add, ALERT_CAPABILITIES.TemplateSet.ItemAdd]
})

const savePermissionMode = computed(() => (activeDraft.value?.templateId ? PermissionMode.ANY : PermissionMode.ALL))

const guardReadonlySystemResource = () => {
  if (!isReadonlyTemplateSet.value) return false
  ElMessage.warning(SYSTEM_RESOURCE_READONLY_MESSAGE)
  return true
}

const handleTemplateContentUpdate = (content: string) => {
  if (isReadonlyTemplateSet.value) return
  handleContentUpdate(content)
}

const handleSave = async () => {
  if (guardReadonlySystemResource()) return
  await saveTemplate()
}

const handleClearAll = async () => {
  if (guardReadonlySystemResource()) return
  await clearAllTemplates()
}

const handleClearActiveChannel = async () => {
  if (guardReadonlySystemResource()) return
  await clearActiveChannelTemplate()
}

const handleClearChannel = async (channel: Parameters<typeof clearChannelTemplate>[0]) => {
  if (guardReadonlySystemResource()) return
  await clearChannelTemplate(channel)
}

const handleOpenCreateVersion = () => {
  if (guardReadonlySystemResource()) return
  createVersionVisible.value = true
}

const handlePublishVersion = async (versionId: number) => {
  if (guardReadonlySystemResource()) return
  await publishTemplateVersion(versionId)
}

const handleCreateVersion = async (data: { name: string; versionId: number; desc?: string }) => {
  if (guardReadonlySystemResource()) return
  await createTemplateVersion(data)
}

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
