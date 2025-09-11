<template>
  <Drawer
    v-model="dialogVisible"
    :title="computedActionName"
    :subtitle="orderInfo?.id ? `工单号: ${orderInfo.id}` : ''"
    :header-icon="Document"
    size="50%"
    direction="rtl"
    :show-footer="false"
    @closed="onClosed"
  >
    <div class="detail-container">
      <CustomTabs :tabs="tabs" :default-active="activeName" @tab-change="handleTabChange">
        <template #default="{ activeTab }">
          <Form
            v-if="activeTab === 'form'"
            ref="formRef"
            :template-id="props.orderInfo?.template_id"
            :process-inst-id="props.orderInfo?.process_instance_id"
            :task-id="props.orderInfo?.task_id"
            :action="props.action"
            @close="onClosed"
            @refresh-data="refreshData"
          />
          <Flow
            v-if="activeTab === 'flow'"
            ref="flowRef"
            :workflow-id="props.orderInfo?.workflow_id"
            :process-inst-id="props.orderInfo?.process_instance_id"
            :status="props.orderInfo?.status"
          />
          <Record
            v-if="activeTab === 'process'"
            ref="recordRef"
            :process-inst-id="props.orderInfo?.process_instance_id"
          />
          <Task v-if="activeTab === 'task'" ref="taskRef" :process-inst-id="props.orderInfo?.process_instance_id" />
        </template>
      </CustomTabs>
    </div>
  </Drawer>
</template>
<script setup lang="ts">
import { ref, computed } from "vue"
import Form from "./form.vue"
import Flow from "./flow.vue"
import Record from "./record.vue"
import Task from "./task.vue"
import CustomTabs from "@@/components/Tabs/CustomTabs.vue"
import { order } from "@/api/order/types/order"
import { Drawer } from "@@/components/Dialogs"
import { Document } from "@element-plus/icons-vue"

const activeName = ref<string>("form")

// 标签页配置
const tabs = [
  { name: "form", label: "表单信息" },
  { name: "flow", label: "流程图" },
  { name: "process", label: "审批记录" },
  { name: "task", label: "任务记录" }
]

const recordRef = ref<InstanceType<typeof Record>>()
const taskRef = ref<InstanceType<typeof Task>>()

// 处理标签页切换
const handleTabChange = (tabName: string) => {
  activeName.value = tabName
  if (tabName === "flow") {
    // 流程图相关逻辑
  } else if (tabName === "process") {
    recordRef.value?.listOrderTaskRecordsData()
  } else if (tabName === "task") {
    taskRef.value?.listTasksData()
  }
}

// 接收父组建传递
interface Props {
  action: string
  dialogVisible: boolean | undefined
  orderInfo: order | undefined
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "refresh-data"])

// 计算属性：根据 action 显示不同的标题
const computedActionName = computed(() => {
  const actionMap: Record<string, string> = {
    todo: "待办审批",
    my: "我的工单",
    "my-Start": "我的工单",
    history: "历史工单",
    view: "查看详情"
  }
  return actionMap[props.action] || "审批服务"
})

const dialogVisible = computed({
  get: () => props.dialogVisible || false,
  set: (val) => {
    if (!val) {
      onClosed()
    }
  }
})

const onClosed = () => {
  activeName.value = "form"
  emits("close")
}

const refreshData = () => {
  emits("refresh-data")
}
</script>

<style lang="scss" scoped>
.detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);

  // 确保 CustomTabs 填充剩余空间
  :deep(.custom-tabs) {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
    border-radius: 12px;
    box-shadow: none;

    .tabs-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 0;

      // 确保子组件填充剩余空间
      > * {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    }
  }
}
</style>
