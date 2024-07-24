<template>
  <div>
    <el-drawer
      class="add-drawer"
      v-model="drawerDialogVisible"
      title="审批服务"
      direction="rtl"
      size="60%"
      @closed="onClosed"
    >
      <div>{{ actionName }}</div>
      <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
        <el-tab-pane lazy label="表单信息" name="form">
          <Form
            ref="formRef"
            :template-id="props.templateId"
            :process-inst-id="props.processInstId"
            :task-id="props.taskId"
            :action="props.action"
            @close="onClosed"
            @refresh-data="refreshData"
          />
        </el-tab-pane>
        <el-tab-pane lazy label="流程图" name="flow">
          <Flow ref="flowRef" :workflow-id="props.workflowId" :process-inst-id="props.processInstId" />
        </el-tab-pane>
        <el-tab-pane lazy label="审批记录" name="process">
          <Record ref="recordRef" :process-inst-id="props.processInstId" />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { TabsPaneContext } from "element-plus"
import { ref, watch } from "vue"
import Form from "./form.vue"
import Flow from "./flow.vue"
import Record from "./record.vue"

const activeName = ref<string>("form")

// const formRef = ref<InstanceType<typeof Form>>()
// const flowRef = ref<InstanceType<typeof Flow>>()
const recordRef = ref<InstanceType<typeof Record>>()
const handleClick = (tab: TabsPaneContext) => {
  console.log(tab.paneName)
  if (tab.paneName === "flow") {
    // todoRef.value?.listOrdersData()
  } else if (tab.paneName == "process") {
    recordRef.value?.listOrderTaskRecordsData()
  }
}

// 接收父组建传递
interface Props {
  action: string
  templateId: number | undefined
  processInstId: number | undefined
  dialogVisible: boolean | undefined
  workflowId: number | undefined
  taskId: number | undefined
}

const actionName = ref<string>("")
const drawerDialogVisible = ref<boolean>(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "refresh-data"])

const onClosed = () => {
  drawerDialogVisible.value = false
  activeName.value = "form"
  emits("close")
}

const refreshData = () => {
  console.log("重新获取数据")
  emits("refresh-data")
}

watch(
  () => props.dialogVisible,
  (val) => {
    if (val) {
      drawerDialogVisible.value = val
    }
  },
  { immediate: true }
)
</script>
