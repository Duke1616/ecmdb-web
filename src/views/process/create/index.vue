<template>
  <div class="wizard-container">
    <div class="wizard-header">
      <div class="step-indicator">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{
            'step-active': currentStep === index,
            'step-completed': currentStep > index
          }"
        >
          <div class="step-circle">
            <component v-if="currentStep > index" :is="CheckIcon" class="step-check-icon" />
            <component v-else :is="step.icon" class="step-icon" />
          </div>
          <div class="step-content">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-description">{{ step.description }}</div>
          </div>
          <div v-if="index < steps.length - 1" class="step-connector" />
        </div>
      </div>
    </div>
    <div class="wizard-body">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" class="wizard-form">
        <component
          :is="currentStepComponent"
          :key="currentStep"
          :formData="formData"
          @update:formData="updateFormData"
          @next="goToNext"
          @previous="goToPrevious"
          @close="onClosed"
          @save="save"
          class="step-content"
        />
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Tools, Ticket, Check } from "@element-plus/icons-vue"
import { computed, ref } from "vue"
import Info from "./info.vue"
import WorkflowEditor from "./lf.vue"
import Setting from "./setting.vue"
import { createOrUpdateWorkflowReq, workflow } from "@/api/workflow/types/workflow"
import { cloneDeep } from "lodash-es"
import { createWorkflowApi, updateWorkflowApi } from "@/api/workflow/workflow"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { v4 as uuidv4 } from "uuid"

const CheckIcon = Check

const steps = [
  {
    title: "填写流程信息",
    description: "基本信息设置",
    icon: Edit,
    component: Info
  },
  {
    title: "定义配置流程",
    description: "可视化流程设计",
    icon: Ticket,
    component: WorkflowEditor
  },
  {
    title: "配置启动设置",
    description: "通知和参数配置",
    icon: Tools,
    component: Setting
  }
]

const currentStep = ref(0)

const currentStepComponent = computed(() => steps[currentStep.value]?.component)

const formData = ref<createOrUpdateWorkflowReq>({
  id: undefined,
  is_notify: false,
  notify_method: 1,
  name: "",
  desc: "",
  icon: "",
  owner: "", // 保持为空字符串以符合类型定义
  flow_data: {
    nodes: [
      {
        id: uuidv4(),
        type: "start",
        x: 350,
        y: 160,
        properties: {}
      },
      {
        id: uuidv4(),
        type: "end",
        x: 610,
        y: 160,
        properties: {}
      }
    ],
    edges: []
  }
})

const formRef = ref<FormInstance | null>(null)

const formRules = computed<FormRules>(() => {
  if (currentStep.value === 0) {
    return {
      name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
      owner: [{ required: true, message: "请选择负责人", trigger: "change" }]
    }
  }
  return {}
})

const goToNext = () => {
  if (currentStep.value === 0) {
    formRef.value?.validate((valid: boolean, fields: any) => {
      if (!valid) {
        return console.error("表单校验不通过", fields)
      }
      goToStep(currentStep.value + 1)
    })
  } else {
    goToStep(currentStep.value + 1)
  }
}

const goToPrevious = () => {
  goToStep(currentStep.value - 1)
}

const goToStep = (stepIndex: number) => {
  if (stepIndex >= 0 && stepIndex < steps.length) {
    currentStep.value = stepIndex
  } else {
    console.log(`[v0] Invalid step index: ${stepIndex}`)
  }
}

const updateFormData = (newFormData: createOrUpdateWorkflowReq) => {
  try {
    console.log("index.vue 接收到数据更新:", newFormData) // 调试信息
    console.log("index.vue 当前formData:", formData.value) // 调试信息
    formData.value = { ...formData.value, ...newFormData }
    console.log("index.vue 更新后的formData:", formData.value) // 调试信息
  } catch (error) {
    console.error("[v0] Error updating form data:", error)
  }
}

const save = () => {
  const api = formData.value.id === undefined ? createWorkflowApi : updateWorkflowApi
  api(formData.value)
    .then(() => {
      onClosed()
      emits("list-templates")
      ElMessage.success("保存成功")
    })
    .catch((error) => {
      console.log("catch", error)
    })
}

const onClosed = () => {
  currentStep.value = 0
  formData.value = cloneDeep({
    id: undefined,
    is_notify: false,
    notify_method: 1,
    name: "",
    desc: "",
    icon: "",
    owner: "", // 保持为空字符串以符合类型定义
    flow_data: {
      nodes: [
        {
          id: uuidv4(),
          type: "start",
          x: 350,
          y: 160,
          properties: {}
        },
        {
          id: uuidv4(),
          type: "end",
          x: 610,
          y: 160,
          properties: {}
        }
      ],
      edges: []
    }
  })
  emits("close", false)
}

const emits = defineEmits(["close", "list-templates"])

defineExpose({
  setCreateForm: () => {
    currentStep.value = 0
    formData.value = cloneDeep({
      id: undefined,
      is_notify: false,
      notify_method: 1,
      name: "",
      desc: "",
      icon: "",
      owner: "", // 保持为空字符串以符合类型定义
      flow_data: {
        nodes: [
          {
            id: uuidv4(),
            type: "start",
            x: 350,
            y: 160,
            properties: {}
          },
          {
            id: uuidv4(),
            type: "end",
            x: 610,
            y: 160,
            properties: {}
          }
        ],
        edges: []
      }
    })
  },
  setUpdateForm: (row: workflow) => {
    currentStep.value = 0
    formData.value = { ...formData.value, ...row }
  }
})
</script>

<style lang="scss" scoped>
.wizard-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  height: 100vh;
}

.wizard-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.step-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  max-width: 200px;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
}

.step-item.step-active .step-circle {
  background: #667eea;
  border-color: #667eea;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.step-item.step-completed .step-circle {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

.step-icon {
  width: 16px;
  height: 16px;
}

.step-check-icon {
  width: 16px;
  height: 16px;
}

.step-title {
  font-weight: 600;
  color: #374151;
  font-size: 12px;
  margin-bottom: 2px;
}

.step-item.step-active .step-title {
  color: #667eea;
}

.step-description {
  font-size: 10px;
  color: #6b7280;
}

.step-connector {
  position: absolute;
  top: 16px;
  left: 60%;
  right: -40%;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.step-item.step-completed .step-connector {
  background: #667eea;
}

.wizard-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.wizard-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.step-content {
  flex: 1;
  display: flex;
  text-align: center;
  flex-direction: column;
  padding: 10px 0px;
  min-height: 0;
}
</style>
