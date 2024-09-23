<template>
  <div class="cons">
    <div class="steps-container">
      <el-steps class="steps" align-center :active="active">
        <el-step title="填写流程信息" :icon="Edit" />
        <el-step title="定义配置流程" :icon="Ticket" />
        <el-step title="配置启动设置" :icon="Tools" />
      </el-steps>
    </div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" style="width: auto">
      <div class="flow-info" v-if="active === 1">
        <Info
          :formData="formData"
          @update:formData="updateFormData"
          @next="next"
          @close="onClosed"
          class="info-container"
        />
      </div>
      <div v-if="active === 2">
        <Lf
          :formData="formData"
          @update:formData="updateFormData"
          @previous="previous"
          @next="next"
          @close="onClosed"
        />
      </div>
      <div class="flow-info" v-if="active === 3">
        <Setting
          :formData="formData"
          @update:formData="updateFormData"
          @previous="previous"
          @save="save"
          @close="onClosed"
        />
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Tools, Ticket } from "@element-plus/icons-vue"
import { computed, ref } from "vue"
import Info from "./info.vue"
import Lf from "./lf.vue"
import Setting from "./setting.vue"
import { createOrUpdateWorkflowReq, workflow } from "@/api/workflow/types/workflow"
import { cloneDeep } from "lodash-es"
import { createWorkflowApi, updateWorkflowApi } from "@/api/workflow/workflow"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { v4 as uuidv4 } from "uuid"

// 流程步骤
const active = ref(1)

// 流程图默认数据
const graphData = {
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

const DEFAULT_FORM_DATA: createOrUpdateWorkflowReq = {
  id: undefined,
  is_notify: false,
  notify_method: 1,
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_data: graphData
}
const formData = ref<createOrUpdateWorkflowReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules = computed<FormRules>(() => {
  if (active.value === 1) {
    return {
      name: [{ required: true, message: "请输入流程名称", trigger: "blur" }],
      owner: [{ required: true, message: "请选择负责人", trigger: "change" }]
    }
  } else if (active.value === 2) {
    return {
      // 步骤2的验证规则
    }
  } else if (active.value === 3) {
    return {
      // 步骤3的验证规则
    }
  }
  return {}
})

// 下一步
const next = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) {
      return console.error("表单校验不通过", fields)
    }

    if (active.value++ > 2) active.value = 1
  })
}

// 上一步
const previous = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) {
      return console.error("表单校验不通过", fields)
    }

    if (active.value-- === 0) active.value = 1
  })
}

// 保存 或修改
const emits = defineEmits(["close", "list-templates"])
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
    .finally(() => {})
}

const onClosed = () => {
  // 重置 el-step 步骤为第一步
  active.value = 1

  // 初始化流程图，只有开始和结束两个节点
  resetGraphData()

  // 关闭弹窗
  emits("close", false)
}

// 为了保证取消后，新增节点 ID 会产生变化
const resetGraphData = () => {
  graphData.nodes = [
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
  ]
}

// 自组件调用传递数据
const updateFormData = (newFormData: createOrUpdateWorkflowReq) => {
  formData.value = { ...formData.value, ...newFormData }
}

// 新增事件 - 父组件调用
const setCreateForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// 修改方法 - 父组件调用
const setUpdateForm = (row: workflow) => {
  formData.value = { ...formData.value, ...row }
}

defineExpose({
  setCreateForm,
  setUpdateForm
})
</script>

<style lang="scss" scoped>
.cons {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.steps-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.steps {
  min-width: 700px;
}

.flow-info {
  display: flex;
  flex: 1;
  justify-content: center;
  height: 70vh;
}

.info-container {
  flex: 1;
  max-width: 600px;
  width: 100%;
}

.setting-container {
  flex: 1;
  max-width: 800px;
  width: 100%;
}

.lf-container {
  flex: 1;
  width: 100%;
  height: 100%;
}
</style>
