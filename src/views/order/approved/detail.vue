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
            :template-id="props.templateId"
            :process-inst-id="props.processInstId"
            :task-id="props.taskId"
            @close="onClosed"
          />
        </el-tab-pane>
        <el-tab-pane lazy label="流程图" name="flow">
          <Flow :workflow-id="props.workflowId" />
        </el-tab-pane>
        <el-tab-pane lazy label="审批记录" name="process">Task</el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { TabsPaneContext } from "element-plus"
import { ref, watch } from "vue"
import Form from "./form.vue"
import Flow from "./flow.vue"

const activeName = ref<string>("form")
const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
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
const emits = defineEmits(["close"])

const onClosed = () => {
  drawerDialogVisible.value = false
  emits("close")
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
