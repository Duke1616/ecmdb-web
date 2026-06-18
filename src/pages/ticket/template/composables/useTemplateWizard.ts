import { ref } from "vue"
import { ElMessage } from "element-plus"
import { cloneDeep } from "lodash-es"
import { createTemplateApi, updateTemplateApi } from "@/api/ticket/template"
import { TICKET_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import type { template } from "@/api/ticket/template/types/template"
import { createDefaultTemplateFormData, TemplateEditorStep } from "../types"
import type { TemplateFormData } from "../types"

const cloneTemplatePayload = (row: template): TemplateFormData => {
  const { id: _id, ...rest } = row
  return {
    ...createDefaultTemplateFormData(),
    ...cloneDeep(rest),
    id: undefined,
    name: `${row.name}_copy`
  }
}

export function useTemplateWizard(options: { refresh: () => void }) {
  const { hasPermission } = usePermission()
  const templateEditorVisible = ref(false)
  const templateEditorStep = ref(TemplateEditorStep.Info)
  const templateFormData = ref<TemplateFormData>(createDefaultTemplateFormData())

  const openTemplateWizard = () => {
    templateEditorStep.value = TemplateEditorStep.Info
    templateEditorVisible.value = true
  }

  const handleCreateTemplate = () => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.Add)) {
      ElMessage.warning("暂无新增模板权限")
      return
    }
    templateFormData.value = createDefaultTemplateFormData()
    openTemplateWizard()
  }

  const handleUpdateTemplate = (row: template) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.Edit)) {
      ElMessage.warning("暂无修改模板权限")
      return
    }
    templateFormData.value = { ...createDefaultTemplateFormData(), ...row }
    openTemplateWizard()
  }

  const handleCloneTemplate = (row: template) => {
    if (!hasPermission(TICKET_CAPABILITIES.Template.Add)) {
      ElMessage.warning("暂无克隆模板权限")
      return
    }
    templateFormData.value = cloneTemplatePayload(row)
    openTemplateWizard()
  }

  const updateTemplateFormData = (data: TemplateFormData) => {
    templateFormData.value = { ...templateFormData.value, ...data }
  }

  const onClosedTemplate = () => {
    templateEditorStep.value = TemplateEditorStep.Info
    templateFormData.value = createDefaultTemplateFormData()
    templateEditorVisible.value = false
  }

  const saveTemplate = async () => {
    const capability = templateFormData.value.id ? TICKET_CAPABILITIES.Template.Edit : TICKET_CAPABILITIES.Template.Add
    if (!hasPermission(capability)) {
      ElMessage.warning("暂无保存模板权限")
      return
    }

    try {
      if (templateFormData.value.id) {
        await updateTemplateApi(templateFormData.value)
        ElMessage.success("模板更新成功")
      } else {
        await createTemplateApi(templateFormData.value)
        ElMessage.success("模板创建成功")
      }
      onClosedTemplate()
      options.refresh()
    } catch {
      ElMessage.error("模板保存失败")
    }
  }

  return {
    templateEditorVisible,
    templateEditorStep,
    templateFormData,
    handleCreateTemplate,
    handleUpdateTemplate,
    handleCloneTemplate,
    updateTemplateFormData,
    onClosedTemplate,
    saveTemplate
  }
}
