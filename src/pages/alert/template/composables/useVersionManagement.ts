/**
 * 版本管理相关的组合式函数
 */
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import type { ChannelTemplate, TemplateVersion, CreateTemplateReq } from "@/api/alert/template/types"
import { forkVersionApi, publishTemplateApi, updateVersionApi } from "@/api/alert/template"

export function useVersionManagement() {
  // 版本相关状态
  const templateVersions = ref<TemplateVersion[]>([])
  const currentVersionId = ref<number | null>(null)

  // 计算属性
  const hasVersions = computed(() => templateVersions.value.length > 0)

  // 获取当前版本名称
  const getCurrentVersionName = (template: ChannelTemplate | null): string => {
    if (!template || !currentVersionId.value) return ""
    const currentVersion = template.versions?.find((v) => v.id === currentVersionId.value)
    return currentVersion?.name || ""
  }

  // 获取当前版本内容
  const getCurrentVersionContent = (template: ChannelTemplate | null): string => {
    if (!template || !currentVersionId.value) return ""
    const currentVersion = template.versions?.find((v) => v.id === currentVersionId.value)
    return currentVersion?.content || ""
  }

  // 获取当前版本备注
  const getCurrentVersionRemark = (template: ChannelTemplate | null): string => {
    if (!template || !currentVersionId.value) return ""
    const currentVersion = template.versions?.find((v) => v.id === currentVersionId.value)
    return currentVersion?.remark || ""
  }

  // 获取查看中的版本名称
  const getViewingVersionName = (template: ChannelTemplate | null): string => {
    if (!template || !currentVersionId.value) return ""
    const viewingVersion = template.versions?.find((v) => v.id === currentVersionId.value)
    return viewingVersion?.name || ""
  }

  // 获取当前使用版本的内容
  const getActiveVersionContent = (template: ChannelTemplate | null): string => {
    if (!template) return ""
    const activeVersion = template.versions?.find((v) => v.id === template.activeVersionId)
    return activeVersion?.content || ""
  }

  // 切换到版本
  const switchToVersion = (version: TemplateVersion, formData: CreateTemplateReq) => {
    currentVersionId.value = version.id
    formData.version = {
      name: version.name,
      content: version.content,
      remark: version.remark || ""
    }
  }

  // 设置为当前版本
  const setActiveVersion = async (versionId: number): Promise<void> => {
    try {
      // 这里应该调用设置当前版本的 API
      console.log(versionId)
      // await setActiveVersionApi(versionId)
      ElMessage.success("版本设置成功")
    } catch (error) {
      console.error("设置当前版本失败:", error)

    }
  }

  // 新增版本（Fork 版本）
  const handleCreateVersion = async (data: { name: string; versionId: number }, onSuccess?: () => void) => {
    try {
      // 调用 fork 版本 API
      const response = await forkVersionApi({
        version_name: data.name,
        version_id: data.versionId
      })

      // 将新版本添加到版本列表
      templateVersions.value.push(response.data.template_version)

      // 切换到新创建的版本
      currentVersionId.value = response.data.template_version.id

      ElMessage.success("版本创建成功")

      // 执行成功回调
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("创建版本失败:", error)

    }
  }

  // 发布版本
  const handlePublishVersion = async (templateId: number, versionId: number, onSuccess?: () => void) => {
    try {
      // 调用发布模板 API
      await publishTemplateApi({
        template_id: templateId,
        version_id: versionId
      })

      ElMessage.success("版本发布成功")

      // 执行成功回调
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("发布版本失败:", error)

    }
  }

  // 更新版本
  const handleUpdateVersion = async (versionId: number, name: string, content: string, onSuccess?: () => void) => {
    try {
      // 调用更新版本 API
      await updateVersionApi({
        version_id: versionId,
        name,
        signature: "", // 暂时为空，实际应该由后端生成
        content
      })

      // 更新本地版本数据
      const versionIndex = templateVersions.value.findIndex((v) => v.id === versionId)
      if (versionIndex !== -1) {
        templateVersions.value[versionIndex].name = name
        templateVersions.value[versionIndex].content = content
        templateVersions.value[versionIndex].utime = Date.now()
      }

      ElMessage.success("版本更新成功")

      // 执行成功回调
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("更新版本失败:", error)
    }
  }

  // 初始化版本数据
  const initVersions = (template: ChannelTemplate) => {
    templateVersions.value = template.versions || []
    // 设置默认选中的版本：优先选中当前使用版本，否则选中第一个
    if (template.activeVersionId) {
      currentVersionId.value = template.activeVersionId
    } else if (template.versions && template.versions.length > 0) {
      currentVersionId.value = template.versions[0].id
    } else {
      currentVersionId.value = null
    }
  }

  // 更新版本列表
  const updateVersions = (versions: TemplateVersion[]) => {
    templateVersions.value = versions
  }

  return {
    // 状态
    templateVersions,
    currentVersionId,

    // 计算属性
    hasVersions,

    // 方法
    getCurrentVersionName,
    getCurrentVersionContent,
    getCurrentVersionRemark,
    getViewingVersionName,
    getActiveVersionContent,
    switchToVersion,
    setActiveVersion,
    handleCreateVersion,
    handlePublishVersion,
    handleUpdateVersion,
    initVersions,
    updateVersions
  }
}
