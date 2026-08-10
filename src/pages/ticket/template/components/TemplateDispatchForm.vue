<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="route-form">
    <el-form-item v-if="!props.fixedAutomationNodeId" label="自动化节点">
      <el-select v-model="selectedAutomationNodeId" placeholder="请选择自动化节点" @change="selectAutomationNode">
        <el-option v-for="node in props.automationNodes" :key="node.id" :label="node.name" :value="node.id" />
      </el-select>
    </el-form-item>

    <div class="condition-fields">
      <el-form-item prop="field" label="匹配字段">
        <el-select v-model="formData.field" placeholder="请选择工单字段" filterable>
          <el-option v-for="[field, title] in Array.from(props.fieldsMap)" :key="field" :label="title" :value="field" />
        </el-select>
      </el-form-item>
      <el-form-item prop="value" label="匹配值">
        <el-input v-model="formData.value" placeholder="请输入匹配值" />
      </el-form-item>
    </div>

    <el-form-item prop="priority" label="优先级">
      <el-input-number v-model="formData.priority" :min="1" :max="10000" controls-position="right" />
    </el-form-item>

    <el-form-item prop="runner_id" label="目标执行单元">
      <el-select v-model="formData.runner_id" placeholder="请选择目标执行单元" filterable>
        <el-option v-for="item in filteredRunners" :key="item.id" :label="item.name" :value="item.id">
          <div class="runner-option">
            <span>{{ item.name }}</span>
            <span>{{ item.target }} / {{ item.handler }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import type { createOrUpdateDispatchReq, dispatch } from "@/api/ticket/dispatch/types/dispatch"
import type { runner } from "@/api/task/runner/types/runner"
import type { AutomationNode } from "@/api/ticket/workflow/types/workflow"
import { computed, ref, watch } from "vue"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { createDispatchApi, updateDispatchApi } from "@/api/ticket/dispatch"

const emits = defineEmits(["closed", "callback"])

// 接收父组件传递
interface Props {
  fieldsMap: Map<string, string>
  automationNodes: AutomationNode[]
  runners: runner[]
  templateId: number | undefined
  fixedAutomationNodeId?: string
}

const props = defineProps<Props>()

const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()

  emits("closed")
}

type DispatchFormData = Omit<createOrUpdateDispatchReq, "runner_id"> & { runner_id?: number }

const DEFAULT_FORM_DATA: DispatchFormData = {
  template_id: 0,
  automation_node_id: "",
  runner_id: undefined,
  field: "",
  value: "",
  priority: 100
}

const formData = ref<DispatchFormData>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const selectedAutomationNodeId = ref("")

const selectedNode = computed(() => props.automationNodes.find((node) => node.id === selectedAutomationNodeId.value))
const getNodeRunners = (node?: AutomationNode) => {
  if (!node) return []
  return props.runners.filter((item) => item.codebook_id === node.codebook_id)
}
const filteredRunners = computed(() => getNodeRunners(selectedNode.value))

const selectRunner = (item: runner) => {
  formData.value = {
    ...formData.value,
    template_id: props.templateId ?? 0,
    automation_node_id: selectedAutomationNodeId.value,
    runner_id: item.id
  }
  formRef.value?.clearValidate()
}

const formRules: FormRules = {
  field: [{ required: true, message: "必须输入字段名称", trigger: "blur" }],
  value: [{ required: true, message: "必须输入匹配值", trigger: "blur" }],
  priority: [{ required: true, message: "必须设置优先级", trigger: "change" }],
  runner_id: [{ required: true, message: "请选择目标执行单元", trigger: "change" }]
}

watch(
  [() => props.automationNodes, () => props.fixedAutomationNodeId] as const,
  ([nodes, fixedAutomationNodeId]) => {
    if (!nodes.length) {
      selectedAutomationNodeId.value = ""
      return
    }

    const fixedNodeExists = fixedAutomationNodeId && nodes.some((node) => node.id === fixedAutomationNodeId)
    selectedAutomationNodeId.value = fixedNodeExists
      ? fixedAutomationNodeId
      : nodes.some((node) => node.id === selectedAutomationNodeId.value)
        ? selectedAutomationNodeId.value
        : nodes[0].id
  },
  { immediate: true }
)

watch(selectedNode, () => {
  const exists = filteredRunners.value.some((item) => item.id === formData.value.runner_id)
  if (!exists) {
    const firstRunner = filteredRunners.value[0]
    if (firstRunner) {
      selectRunner(firstRunner)
    } else {
      formData.value.runner_id = undefined
      formData.value.automation_node_id = selectedAutomationNodeId.value
      formData.value.template_id = props.templateId ?? 0
    }
  }
})

const submitForm = async () => {
  try {
    if (!formData.value.automation_node_id) {
      ElMessage.warning("请选择自动化节点")
      return
    }
    const runnerID = formData.value.runner_id
    if (!runnerID) {
      ElMessage.warning("请选择目标执行单元")
      return
    }

    await formRef.value?.validate()
    if (!props.templateId) return
    formData.value.template_id = props.templateId

    const api = formData.value.id === undefined ? createDispatchApi : updateDispatchApi
    await api({ ...formData.value, runner_id: runnerID })

    ElMessage.success("保存成功")
    onClosed()
    emits("callback")
  } catch (error) {
    // 表单验证错误已由Element Plus处理
    if (!(error instanceof Error)) {
      console.log(error)
    }
  }
}

const setForm = (row: dispatch) => {
  formData.value = cloneDeep(row)
  selectedAutomationNodeId.value = row.automation_node_id
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()
  selectedAutomationNodeId.value = props.automationNodes[0]?.id || ""
  const firstRunner = filteredRunners.value[0]
  if (firstRunner) {
    selectRunner(firstRunner)
  } else {
    formData.value.automation_node_id = selectedAutomationNodeId.value
    formData.value.template_id = props.templateId ?? 0
  }
}

const selectAutomationNode = (id?: string) => {
  const targetId = id || selectedAutomationNodeId.value
  selectedAutomationNodeId.value = props.automationNodes.some((node) => node.id === targetId)
    ? targetId
    : props.automationNodes[0]?.id || ""
  const firstRunner = filteredRunners.value[0]
  if (firstRunner) {
    selectRunner(firstRunner)
  } else {
    formData.value = {
      ...cloneDeep(DEFAULT_FORM_DATA),
      template_id: props.templateId ?? 0,
      automation_node_id: selectedAutomationNodeId.value
    }
  }
}

defineExpose({
  submitForm,
  setForm,
  resetForm,
  selectAutomationNode
})
</script>

<style lang="scss" scoped>
.condition-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}

.runner-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  span:last-child {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .condition-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
