/**
 * 版本管理相关的组合式函数
 */
import { ref, computed } from "vue"
import { ElMessage } from "element-plus"
import type { ChannelTemplate, TemplateVersion, CreateTemplateReq } from "@/api/alert/template/types"

export function useVersionManagement() {
  // 版本相关状态
  const templateVersions = ref<TemplateVersion[]>([])
  const currentVersionId = ref<number | null>(null)

  // 计算属性
  const hasVersions = computed(() => templateVersions.value.length > 0)

  // 获取当前版本名称
  const getCurrentVersionName = (template: ChannelTemplate | null): string => {
    if (!template) return ""
    const currentVersion = template.versions?.find((v) => v.id === template?.activeVersionId)
    return currentVersion?.name || ""
  }

  // 获取当前版本内容
  const getCurrentVersionContent = (template: ChannelTemplate | null): string => {
    if (!template) return ""
    const currentVersion = template.versions?.find((v) => v.id === template?.activeVersionId)
    return currentVersion?.content || ""
  }

  // 获取当前版本备注
  const getCurrentVersionRemark = (template: ChannelTemplate | null): string => {
    if (!template) return ""
    const currentVersion = template.versions?.find((v) => v.id === template?.activeVersionId)
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
      ElMessage.error("设置当前版本失败")
    }
  }

  // 新增版本
  const handleCreateVersion = (data: { name: string; remark: string }, activeVersionContent: string) => {
    // 创建新版本对象
    const newVersion: TemplateVersion = {
      id: Date.now(), // 临时 ID，实际应该由后端生成
      channelTemplateId: 0, // 临时值，实际应该由后端设置
      name: data.name,
      signature: "", // 临时值，实际应该由后端生成
      content: activeVersionContent, // 使用当前使用版本的内容
      remark: data.remark,
      ctime: Date.now(),
      utime: Date.now()
    }

    // 添加到版本列表
    templateVersions.value.push(newVersion)

    // 切换到新创建的版本
    currentVersionId.value = newVersion.id

    ElMessage.success("版本创建成功")
  }

  // 初始化版本数据
  const initVersions = (template: ChannelTemplate) => {
    templateVersions.value = template.versions || []
    currentVersionId.value = template.activeVersionId
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
    initVersions,
    updateVersions
  }
}
