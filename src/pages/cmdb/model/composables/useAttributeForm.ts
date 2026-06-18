import { computed, ref } from "vue"
import { cloneDeep } from "lodash-es"
import { v4 as uuidv4 } from "uuid"
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus"
import { CreateAttributeApi, UpdateAttributeApi } from "@/api/cmdb/attribute"
import type { Attribute, createOrUpdateAttributeReq } from "@/api/cmdb/attribute/types/attribute"

type FieldType = "string" | "multiline" | "list" | "file"
type SettingKey = "required" | "secure" | "link"

interface OptionRow {
  id: string
  name: string
}

interface AttributeFormProps {
  modelUid: string
  groupId: number | undefined
}

export const FIELD_TYPE_OPTIONS: Array<{
  value: FieldType
  label: string
  description: string
  icon: string
}> = [
  { value: "string", label: "字符串", description: "单行文本输入", icon: "Document" },
  { value: "multiline", label: "多行文本", description: "多行文本输入", icon: "Edit" },
  { value: "list", label: "列表", description: "下拉选择列表", icon: "List" },
  { value: "file", label: "文件", description: "文件上传", icon: "Folder" }
]

const FIELD_TYPE_SETTINGS: Record<FieldType, SettingKey[]> = {
  string: ["required", "secure", "link"],
  multiline: ["required", "secure"],
  list: ["required"],
  file: ["required"]
}

const createOptionRow = (name = ""): OptionRow => ({ id: uuidv4(), name })

const validateForm = (form: FormInstance | null) =>
  new Promise<boolean>((resolve) => {
    if (!form) {
      resolve(false)
      return
    }

    form.validate((valid) => resolve(valid))
  })

export const useAttributeForm = (props: AttributeFormProps, emitRefresh: () => void) => {
  const formRef = ref<FormInstance | null>(null)
  const optionRows = ref<OptionRow[]>([createOptionRow()])
  const originalFormData = ref<createOrUpdateAttributeReq | null>(null)

  const createDefaultFormData = (): createOrUpdateAttributeReq => ({
    model_uid: props.modelUid,
    group_id: props.groupId ?? 0,
    field_uid: "",
    field_name: "",
    field_type: "string",
    required: false,
    link: false,
    secure: false,
    option: ""
  })

  const formData = ref<createOrUpdateAttributeReq>(createDefaultFormData())
  const fieldRules: FormRules = {
    field_uid: [
      { required: true, message: "必须输入属性唯一标识", trigger: "blur" },
      {
        type: "string",
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: "名称以字母开头，只能包含字母、数字、下划线",
        trigger: "blur"
      }
    ],
    field_name: [{ required: true, message: "必须输入属性名称", trigger: "blur" }]
  }

  const currentFieldType = computed(() => formData.value.field_type as FieldType)
  const availableSettings = computed(() => FIELD_TYPE_SETTINGS[currentFieldType.value] || [])
  const isListField = computed(() => currentFieldType.value === "list")

  const syncOptionsToForm = () => {
    formData.value.option = isListField.value ? optionRows.value.map((item) => item.name).filter(Boolean) : ""
  }

  const resetUnsupportedSettings = () => {
    if (!availableSettings.value.includes("secure")) formData.value.secure = false
    if (!availableSettings.value.includes("link")) formData.value.link = false
  }

  const selectFieldType = (fieldType: FieldType) => {
    formData.value.field_type = fieldType
    resetUnsupportedSettings()
    syncOptionsToForm()
  }

  const addOption = () => {
    optionRows.value.push(createOptionRow())
    syncOptionsToForm()
  }

  const removeOption = (index: number) => {
    optionRows.value.splice(index, 1)
    if (optionRows.value.length === 0) optionRows.value.push(createOptionRow())
    syncOptionsToForm()
  }

  const hasSecureFieldChanges = () => {
    return Boolean(originalFormData.value && formData.value.secure !== originalFormData.value.secure)
  }

  const confirmSecureFieldChange = () =>
    ElMessageBox.confirm(
      "检测到您修改了属性的加密设置，这会影响该属性在资源管理中的显示和存储方式。\n\n请确认是否继续保存？",
      "属性加密设置修改提醒",
      {
        confirmButtonText: "确认保存",
        cancelButtonText: "取消",
        type: "warning",
        dangerouslyUseHTMLString: false,
        customClass: "secure-field-warning-dialog"
      }
    )

  const buildPayload = () => {
    syncOptionsToForm()
    return cloneDeep(formData.value)
  }

  const handlerCreateOrUpdateAttribute = async () => {
    if (!(await validateForm(formRef.value))) {
      ElMessage.error("表单校验不通过，请检查必填项")
      return false
    }

    const isEdit = formData.value.id !== undefined
    if (isEdit && hasSecureFieldChanges()) {
      try {
        await confirmSecureFieldChange()
      } catch {
        return false
      }
    }

    try {
      const api = isEdit ? UpdateAttributeApi : CreateAttributeApi
      await api(buildPayload())
      ElMessage.success("保存成功")
      emitRefresh()
      return true
    } catch (error) {
      console.error("保存属性失败:", error)
      return false
    }
  }

  const resetForm = () => {
    formRef.value?.clearValidate()
    formData.value = createDefaultFormData()
    originalFormData.value = null
    optionRows.value = [createOptionRow()]
  }

  const setFrom = (row: Attribute) => {
    formData.value = cloneDeep(row)
    originalFormData.value = cloneDeep(row)
    optionRows.value =
      Array.isArray(row.option) && row.option.length > 0 ? row.option.map(createOptionRow) : [createOptionRow()]
  }

  return {
    FIELD_TYPE_OPTIONS,
    formRef,
    formData,
    fieldRules,
    optionRows,
    availableSettings,
    isListField,
    selectFieldType,
    addOption,
    removeOption,
    syncOptionsToForm,
    resetForm,
    setFrom,
    handlerCreateOrUpdateAttribute
  }
}
