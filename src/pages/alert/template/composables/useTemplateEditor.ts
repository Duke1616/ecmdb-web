import { computed, reactive, ref } from "vue"
import { useRoute } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { addItemApi, clearTemplatesApi, getTemplateSetApi } from "@/api/alert/template_set"
import type { TemplateSet, TemplateSetItem } from "@/api/alert/template_set/types"
import {
  createTemplateApi,
  forkVersionApi,
  getTemplateDetailApi,
  publishTemplateApi,
  updateVersionApi
} from "@/api/alert/template"
import { CHANNEL_TYPES, type ChannelTemplate, type ChannelType, type TemplateVersion } from "@/api/alert/template/types"
import {
  getAllChannelConfigs,
  getChannelLabel,
  getDefaultTemplate,
  getEditorLanguage,
  getPreviewMode
} from "../config/channels"
import { formatJsonContent } from "../utils"

export type EditableChannel = Exclude<ChannelType, "">

export interface ChannelDraft {
  channel: EditableChannel
  itemId?: number
  templateId?: number
  activeVersionId?: number
  versions: TemplateVersion[]
  versionId?: number
  versionName: string
  versionDesc: string
  content: string
  savedContent: string
  loaded: boolean
  dirty: boolean
  saving: boolean
}

export type TemplateChannelOption = ReturnType<typeof getAllChannelConfigs>[number] & { code: EditableChannel }

export const INITIAL_VERSION_NAME = "v1.0.0"

const LEGACY_INITIAL_VERSION_NAME = "默认版本"

export function useTemplateEditor() {
  const route = useRoute()

  const templateSet = ref<TemplateSet | null>(null)
  const items = ref<TemplateSetItem[]>([])
  const loading = ref(false)
  const clearingAll = ref(false)
  const clearingChannel = ref<EditableChannel | null>(null)
  const showPreview = ref(false)
  const createVersionVisible = ref(false)
  const versionPanelVisible = ref(false)
  const activeChannel = ref<EditableChannel>(CHANNEL_TYPES.EMAIL)
  const drafts = reactive<Record<EditableChannel, ChannelDraft>>({} as Record<EditableChannel, ChannelDraft>)

  const setId = computed(() => Number(route.query.id || route.params.id))
  const channelOptions = computed(
    () => getAllChannelConfigs().filter((channel) => channel.code) as TemplateChannelOption[]
  )
  const activeDraft = computed(() => drafts[activeChannel.value])
  const editorHeaderLabel = computed(
    () => `${getChannelLabel(activeChannel.value)} · ${activeDraft.value?.versionName || INITIAL_VERSION_NAME}`
  )
  const previewContent = computed(() => renderContent(activeDraft.value?.content || ""))

  const createDefaultDraft = (channel: EditableChannel, item?: TemplateSetItem): ChannelDraft => ({
    channel,
    itemId: item?.id,
    templateId: item?.template_id,
    activeVersionId: undefined,
    versions: [],
    versionId: undefined,
    versionName: INITIAL_VERSION_NAME,
    versionDesc: "",
    content: getDefaultTemplate(channel),
    savedContent: getDefaultTemplate(channel),
    loaded: !item,
    dirty: false,
    saving: false
  })

  const initializeDrafts = () => {
    channelOptions.value.forEach((channel) => {
      const item = items.value.find((current) => current.channel === channel.code)
      drafts[channel.code] = createDefaultDraft(channel.code, item)
    })
  }

  const loadTemplateSet = async () => {
    if (!setId.value) return

    loading.value = true
    try {
      const response = await getTemplateSetApi(setId.value)
      templateSet.value = response.data.template_set
      items.value = response.data.template_set.items || []
      initializeDrafts()
      await ensureDraftLoaded(activeChannel.value)
    } finally {
      loading.value = false
    }
  }

  const ensureDraftLoaded = async (channel: EditableChannel) => {
    const draft = drafts[channel]
    if (!draft || draft.loaded || !draft.templateId) return

    const response = await getTemplateDetailApi(draft.templateId)
    applyTemplateToDraft(draft, response.data)
  }

  const normalizeInitialVersionNames = (versions: TemplateVersion[]) => {
    if (versions.length !== 1) return versions

    const [version] = versions
    if (version.name && version.name !== LEGACY_INITIAL_VERSION_NAME) return versions

    return [{ ...version, name: INITIAL_VERSION_NAME }]
  }

  const applyTemplateToDraft = (draft: ChannelDraft, template: ChannelTemplate) => {
    const versions = normalizeInitialVersionNames(template.versions || [])
    const activeVersion = versions.find((version) => version.id === template.activeVersionId) || versions[0]

    draft.activeVersionId = template.activeVersionId || activeVersion?.id
    draft.versions = versions
    draft.versionId = activeVersion?.id
    draft.versionName = activeVersion?.name || INITIAL_VERSION_NAME
    draft.versionDesc = activeVersion?.desc || ""
    draft.content = activeVersion?.content || getDefaultTemplate(draft.channel)
    draft.savedContent = draft.content
    draft.loaded = true
    draft.dirty = false
  }

  const selectChannel = async (channel: EditableChannel) => {
    activeChannel.value = channel
    versionPanelVisible.value = false
    await ensureDraftLoaded(channel)
  }

  const handleContentUpdate = (content: string) => {
    if (!activeDraft.value) return
    activeDraft.value.content = content
    activeDraft.value.dirty = content !== activeDraft.value.savedContent
  }

  const handleClearChannel = async (channel: EditableChannel) => {
    const draft = drafts[channel]
    if (!draft || !setId.value) return

    if (!draft.templateId) {
      if (channel === activeChannel.value) {
        handleContentUpdate("")
      }
      return
    }

    try {
      await ElMessageBox.confirm(`确定要清空 ${getChannelLabel(channel)} 渠道模板吗？`, "确认清空", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
    } catch {
      return
    }

    draft.saving = true
    clearingChannel.value = channel
    try {
      await clearTemplatesApi({
        set_id: setId.value,
        channel
      })
      ElMessage.success("渠道模板已清空")
      await loadTemplateSet()
    } finally {
      draft.saving = false
      clearingChannel.value = null
    }
  }

  const handleClear = () => handleClearChannel(activeChannel.value)

  const handleClearAll = async () => {
    if (!setId.value) return

    try {
      await ElMessageBox.confirm("确定要清空当前模板集的全部渠道模板吗？", "确认清空", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
    } catch {
      return
    }

    clearingAll.value = true
    try {
      await clearTemplatesApi({ set_id: setId.value })
      ElMessage.success("全部渠道模板已清空")
      await loadTemplateSet()
    } finally {
      clearingAll.value = false
    }
  }

  const canClearChannel = (channel: EditableChannel) => Boolean(drafts[channel]?.templateId)

  const handleFormat = () => {
    if (!activeDraft.value) return
    const formatted = formatJsonContent(activeDraft.value.content)
    if (formatted === activeDraft.value.content) {
      ElMessage.info("当前内容无法按严格 JSON 格式化")
      return
    }
    handleContentUpdate(formatted)
  }

  const handleSave = async () => {
    const draft = activeDraft.value
    if (!draft || !setId.value) return
    if (!draft.content.trim()) {
      ElMessage.warning("请输入模板内容")
      return
    }

    draft.saving = true
    try {
      if (draft.templateId) {
        if (draft.versionId) {
          await updateVersionApi({
            version_id: draft.versionId,
            name: draft.versionName || INITIAL_VERSION_NAME,
            signature: "",
            content: draft.content,
            desc: draft.versionDesc
          })
        }
      } else {
        const response = await createTemplateApi({
          ownerId: templateSet.value?.owner_id || 1,
          name: getGeneratedTemplateName(draft.channel),
          description: getGeneratedTemplateDescription(draft.channel),
          channel: draft.channel,
          version: {
            name: draft.versionName || INITIAL_VERSION_NAME,
            content: draft.content,
            desc: draft.versionDesc
          }
        })

        const template = response.data.template
        draft.templateId = template.id
        draft.versionId = template.activeVersionId || template.versions?.[0]?.id

        if (draft.versionId) {
          await publishTemplateApi({
            template_id: template.id,
            version_id: draft.versionId
          })
        }

        await addItemApi({
          set_id: setId.value,
          channel: draft.channel,
          template_id: template.id
        })
      }

      draft.loaded = true
      draft.savedContent = draft.content
      draft.dirty = false
      ElMessage.success("模板已保存")
      await loadTemplateSet()
    } finally {
      draft.saving = false
    }
  }

  const getChannelConfigText = (channel: EditableChannel) => {
    const draft = drafts[channel]
    if (!draft) return "未配置"
    return draft.templateId ? `已配置 ${draft.versions.length || 1} 个版本` : "未配置"
  }

  const getGeneratedTemplateName = (channel: EditableChannel) =>
    `${templateSet.value?.name || "通知模板"}-${getChannelLabel(channel)}`

  const getGeneratedTemplateDescription = (channel: EditableChannel) =>
    templateSet.value?.description || `${templateSet.value?.name || "通知模板"} ${getChannelLabel(channel)} 渠道模板`

  const switchVersion = (version: TemplateVersion) => {
    const draft = activeDraft.value
    if (!draft) return
    if (draft.dirty) {
      ElMessage.warning("请先保存当前修改后再切换版本")
      return
    }

    draft.versionId = version.id
    draft.versionName = version.name
    draft.versionDesc = version.desc || ""
    draft.content = version.content || getDefaultTemplate(draft.channel)
    draft.savedContent = draft.content
    draft.dirty = false
  }

  const publishVersion = async (versionId: number) => {
    const draft = activeDraft.value
    if (!draft?.templateId) return

    await publishTemplateApi({
      template_id: draft.templateId,
      version_id: versionId
    })
    ElMessage.success("版本已发布")
    await loadTemplateSet()
  }

  const handleCreateVersion = async (data: { name: string; versionId: number; desc?: string }) => {
    const draft = activeDraft.value
    if (!draft?.templateId) return

    const response = await forkVersionApi({
      version_name: data.name,
      version_id: data.versionId,
      desc: data.desc
    })
    const version = response.data.template_version
    draft.versions = [...draft.versions, version]
    switchVersion(version)
    ElMessage.success("版本已创建")
  }

  const renderContent = (content: string) => {
    if (!content) return ""

    if (content.trim().startsWith("{")) {
      try {
        return `<pre><code>${escapeHtml(JSON.stringify(JSON.parse(content), null, 2))}</code></pre>`
      } catch {
        return `<pre><code>${escapeHtml(content)}</code></pre>`
      }
    }

    if (/<[^>]+>/.test(content)) {
      return content
    }

    return content
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
      .replace(/\n/gim, "<br>")
  }

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")

  return {
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
  }
}
