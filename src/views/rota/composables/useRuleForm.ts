import { ref } from "vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { addRuleReq } from "@/api/rota/types/rota"
import { addShifSchedulingRuleApi } from "@/api/rota"

export function useRuleForm() {
  const DEFAULT_FORM_DATA: addRuleReq = {
    id: 0,
    rota_rule: {
      start_time: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
      end_time: 0,
      rota_groups: [],
      rotate: {
        time_unit: 4,
        time_duration: 1
      }
    }
  }

  const formData = ref<addRuleReq>(cloneDeep(DEFAULT_FORM_DATA))
  const formRef = ref<FormInstance | null>(null)

  const formRules: FormRules = {
    name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
    owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
  }

  const setFrom = (row: addRuleReq) => {
    formData.value = cloneDeep(row)
  }

  const getFrom = () => {
    return formData
  }

  const resetForm = () => {
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
  }

  const submitForm = (rotaId: number) => {
    formData.value.id = rotaId
    if (formData.value.id === 0) {
      ElMessage.error("值班不存在，无法保存")
      return Promise.reject("值班不存在")
    }

    return addShifSchedulingRuleApi(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
      })
      .catch((error) => {
        console.log("catch", error)
        throw error
      })
  }

  return {
    formData,
    formRef,
    formRules,
    setFrom,
    getFrom,
    resetForm,
    submitForm
  }
}
