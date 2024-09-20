<template>
  <div class="steps-container">
    <el-steps class="steps" align-center :active="active">
      <el-step title="填写流程信息" :icon="Edit" @click="test" />
      <el-step title="定义配置流程" :icon="Ticket" />
      <el-step title="配置启动设置" :icon="Tools" />
    </el-steps>
  </div>
  <div class="flow-info" v-if="active === 1">
    <Info ref="infoRef" @next="next" @close="onClosed" />
  </div>
  <div v-if="active === 2">
    <Lf ref="lfRef" :data="formData" @previous="previous" @next="next" @close="onClosed" />
  </div>
  <div v-if="active === 3">
    <Setting @previous="previous" @save="save" @close="onClosed" />
  </div>
</template>

<script lang="ts" setup>
import { Edit, Tools, Ticket } from "@element-plus/icons-vue"
import { ref, nextTick } from "vue"
import Info from "./info.vue"
import Lf from "./lf.vue"
import Setting from "./setting.vue"
import { createOrUpdateWorkflowReq, workflow } from "@/api/workflow/types/workflow"
import { cloneDeep } from "lodash-es"
import { createWorkflowApi, updateWorkflowApi } from "@/api/workflow/workflow"
import { ElMessage } from "element-plus"
import { v4 as uuidv4 } from "uuid"

const test = () => {
  console.log("test")
}

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
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_data: graphData
}
const formData = ref<createOrUpdateWorkflowReq>(cloneDeep(DEFAULT_FORM_DATA))
const infoRef = ref<InstanceType<typeof Info>>()
const lfRef = ref<InstanceType<typeof Lf>>()

const next = (val: string) => {
  if (active.value++ > 2) active.value = 1

  switch (val) {
    case "info":
      formData.value = { ...formData.value, ...infoRef.value?.getForm() }
      break
    case "lf":
      formData.value.flow_data = lfRef.value?.getGraphData()
      break
  }
}

const previous = () => {
  if (active.value-- === 0) active.value = 1

  switch (active.value) {
    case 1:
      nextTick(() => {
        infoRef.value?.setForm(formData.value)
      })
      break
    case 2:
      break
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

const setUpdateForm = (row: workflow) => {
  formData.value = { ...formData.value, ...row }

  // 需要把第一个步骤的数据传输过去
  infoRef.value?.setForm(formData.value)
}

const setCreateForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  setCreateForm,
  setUpdateForm
})
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
