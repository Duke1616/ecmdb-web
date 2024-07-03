<template>
  <div>
    <el-card v-show="visible" height="1000px">
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
import { createWorkflowReq } from "@/api/workflow/types/workflow"
import { cloneDeep } from "lodash-es"
import { createWorkflowApi } from "@/api/workflow/workflow"
import { ElMessage } from "element-plus"
interface Props {
  dialogVisible: boolean
}
const props = defineProps<Props>()
const visible = ref<boolean>(false)
const active = ref(1)
const graphData = {
  nodes: [
    {
      id: "386cc810-3f14-4453-b939-d1f96806bda4",
      type: "start",
      x: 350,
      y: 160,
      properties: {}
    },
    {
      id: "a03a5d7b-e2f2-4a16-ae15-862f3de90b78",
      type: "end",
      x: 610,
      y: 160,
      properties: {}
    }
  ],
  edges: []
}

const DEFAULT_FORM_DATA: createWorkflowReq = {
  name: "",
  desc: "",
  template_id: 0,
  icon: "",
  owner: "",
  flow_data: graphData
}
const formData = ref<createWorkflowReq>(cloneDeep(DEFAULT_FORM_DATA))
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
  createWorkflowApi(formData.value)
    .then(() => {
      onClosed()
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
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  emits("close", false)
}

watch(
  () => props.dialogVisible,
  (val: boolean) => {
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
}
</style>
