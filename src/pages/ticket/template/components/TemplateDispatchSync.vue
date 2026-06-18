<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
    <el-form-item prop="template_group_id" label="模版组">
      <el-select v-model="formData.template_group_id" placeholder="请选择模版字段">
        <el-option v-for="item in templateGroups" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item
      prop="sync_template_id"
      label="模板"
      :rules="[{ required: true, message: '请选择模板', trigger: 'change' }]"
    >
      <el-select
        v-model="formData.sync_template_id"
        placeholder="请先选择模板组"
        :disabled="!formData.template_group_id"
        clearable
      >
        <el-option
          v-for="template in currentTemplates"
          :key="template.id"
          :label="template.name"
          :value="template.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { syncDispatchApi } from "@/api/ticket/dispatch"
import type { syncDispatchReq } from "@/api/ticket/dispatch/types/dispatch"
import { listTemplateApi, listTemplateGroupSummaryApi } from "@/api/ticket/template"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { onMounted, ref, watch } from "vue"

const emits = defineEmits(["closed", "callback"])

// 接收父组件传递
interface Props {
  templateId: number | undefined
}

const props = defineProps<Props>()

const DEFAULT_FORM_DATA: syncDispatchReq = {
  template_id: undefined,
  sync_template_id: undefined,
  template_group_id: undefined
}

const formData = ref<syncDispatchReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  template_group_id: [{ required: true, message: "必须输入模版组", trigger: "blur" }],
  sync_template_id: [{ required: true, message: "必须输入模版", trigger: "blur" }]
}

const templateGroups = ref<templateGroupSummary[]>([])
const listTemplateGroups = async () => {
  try {
    const { data } = await listTemplateGroupSummaryApi()
    templateGroups.value = data.template_groups || []
  } catch {
    templateGroups.value = []
  }
}

const syncSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (!props.templateId) return
    formData.value.template_id = props.templateId

    await syncDispatchApi(formData.value)

    ElMessage.success("同步成功")
    onClosed()
    emits("callback")
  } catch (error) {
    // 表单验证错误已由Element Plus处理
    if (!(error instanceof Error)) {
      console.error("操作失败:", error)
    }
  }
}

const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()

  emits("closed")
}

// 当前模板选项
const currentTemplates = ref<template[]>([])

// 监听模板组变化，更新模板列表
watch(
  () => formData.value.template_group_id,
  async (newGroupId: number | undefined) => {
    if (!newGroupId) {
      currentTemplates.value = []
      formData.value.sync_template_id = undefined
      return
    }

    const { data } = await listTemplateApi({
      offset: 0,
      limit: 100,
      group_id: newGroupId
    })
    currentTemplates.value = data.templates || []
    formData.value.sync_template_id = undefined
  }
)

onMounted(() => {
  listTemplateGroups()
})

defineExpose({
  syncSubmit
})
</script>

<style lang="scss"></style>
