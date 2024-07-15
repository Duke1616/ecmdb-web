<template>
  <div>
    <el-card v-show="visible" style="height: auto">
      <div class="steps-container">
        <el-steps class="steps" align-center :active="active">
          <el-step title="填写流程信息" :icon="Edit" />
          <el-step title="定义配置流程" :icon="Ticket" />
          <el-step title="配置启动设置" :icon="Tools" />
        </el-steps>
      </div>
      <div class="flow-info" v-if="active === 1">
        <Info @next="next" @close="onClosed" ref="infoRef" :data="formData" />
      </div>
      <div v-if="active === 2">
        <Lf @previous="previous" @next="next" @close="onClosed" ref="lfRef" :data="formData" />
      </div>
      <div v-if="active === 3">
        <Setting @previous="previous" @save="save" @close="onClosed" />
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { Edit, Tools, Ticket } from "@element-plus/icons-vue"
import { ref, watch } from "vue"
import Info from "./info.vue"
import Lf from "./lf.vue"
import Setting from "./setting.vue"
import { createOrUpdateWorkflowReq, workflow } from "@/api/workflow/types/workflow"
import { cloneDeep } from "lodash-es"
import { createWorkflowApi, updateWorkflowApi } from "@/api/workflow/workflow"
import { ElMessage } from "element-plus"
import { v4 as uuidv4 } from "uuid"

interface Props {
  createDialogVisible: boolean
  updateDialogVisible: boolean
  workflowData: workflow | undefined
}
const props = defineProps<Props>()
const visible = ref<boolean>(false)
const active = ref(1)
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
  name: "",
  desc: "",
  template_id: 0,
  icon: "",
  owner: "",
  flow_data: graphData
}
const formData = ref<createOrUpdateWorkflowReq>(cloneDeep(DEFAULT_FORM_DATA))
const infoRef = ref<InstanceType<typeof Info>>()
const lfRef = ref<InstanceType<typeof Lf>>()

const next = (val: string) => {
  if (active.value++ > 2) active.value = 1
  if (val === "info") {
    const data = infoRef.value?.getFormData()
    if (data) {
      formData.value = { ...formData.value, ...data }
    }
  }

  if (val === "lf") {
    const data = lfRef.value?.getGraphData()
    if (data) {
      formData.value.flow_data = data
    }
  }

  console.log(formData.value, "build")
}

const previous = () => {
  if (active.value-- === 0) active.value = 1
}
const save = () => {
  const api = props.createDialogVisible === true ? createWorkflowApi : updateWorkflowApi
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

const emits = defineEmits(["close", "list-templates"])
const onClosed = () => {
  active.value = 1
  resetGraphData()
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

watch(
  () => props.createDialogVisible,
  (val: boolean) => {
    visible.value = val
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
  },
  { immediate: true }
)

watch(
  () => props.updateDialogVisible,
  (val: boolean) => {
    formData.value = { ...formData.value, ...props.workflowData }
    visible.value = val
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.steps-container {
  display: flex;
  justify-content: center;
  height: 100%;
  align-items: center;
}

.steps {
  min-width: 700px;
  margin-bottom: 20px;
}

.flow-info {
  display: flex;
  flex: 1;
  justify-content: center;
  height: 600px;
}
</style>
