import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { CreateModelRelationApi, UpdateModelRelationApi } from "@/api/cmdb/relation"
import type {
  CreateModelRelationReq,
  ListRelationTypeData,
  ModelRelation,
  UpdateModelRelationReq
} from "@/api/cmdb/relation/types/relation"

interface RelationFormProps {
  modelUid: string
  relationTypeData: ListRelationTypeData[]
  activeRelation: ModelRelation | null
}

export const MAPPING_OPTIONS = [
  { value: "1-1", label: "1-1", description: "一对一关系" },
  { value: "1-N", label: "1-N", description: "一对多关系" },
  { value: "N-N", label: "N-N", description: "多对多关系" }
]

const validateForm = (form: FormInstance | null) =>
  new Promise<boolean>((resolve) => {
    if (!form) {
      resolve(false)
      return
    }

    form.validate((valid) => resolve(valid))
  })

export const useModelRelationForm = (props: RelationFormProps) => {
  const formRef = ref<FormInstance | null>(null)
  const loading = ref(false)

  const createDefaultFormData = (): CreateModelRelationReq => ({
    source_model_uid: props.modelUid,
    target_model_uid: "",
    relation_type_uid: "",
    mapping: "",
    description: undefined
  })

  const formData = ref<CreateModelRelationReq>(createDefaultFormData())
  const formRules: FormRules<CreateModelRelationReq> = {
    source_model_uid: [{ required: true, trigger: "blur", message: "必须选择源模型" }],
    target_model_uid: [{ required: true, trigger: "blur", message: "必须选择目标模型" }],
    relation_type_uid: [{ required: true, trigger: "blur", message: "必须选择关联类型" }],
    mapping: [{ required: true, trigger: "blur", message: "必须选择关联映射关系" }]
  }

  const setEditData = (data: ModelRelation) => {
    formData.value = {
      source_model_uid: data.source_model_uid,
      target_model_uid: data.target_model_uid,
      relation_type_uid: data.relation_type_uid,
      mapping: data.mapping,
      description: undefined
    }
  }

  const resetForm = () => {
    formRef.value?.clearValidate()
    formData.value = createDefaultFormData()
  }

  const buildPayload = (): CreateModelRelationReq | UpdateModelRelationReq => {
    const payload = cloneDeep(formData.value)
    return props.activeRelation?.id ? { ...payload, id: props.activeRelation.id } : payload
  }

  const handleCreate = async () => {
    if (!(await validateForm(formRef.value))) {
      ElMessage.error("表单校验不通过，请检查必填项")
      return false
    }

    try {
      loading.value = true
      const api = props.activeRelation ? UpdateModelRelationApi : CreateModelRelationApi
      await api(buildPayload() as any)
      ElMessage.success(props.activeRelation ? "关联更新成功" : "关联创建成功")
      return true
    } catch (error) {
      console.error("保存模型关联失败:", error)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    MAPPING_OPTIONS,
    formRef,
    formData,
    formRules,
    loading,
    setEditData,
    resetForm,
    handleCreate
  }
}
