<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="任务历史"
      subtitle="查看任务执行历史和状态"
      :show-add-button="false"
      @refresh="listTasksData"
    />

    <!-- 主内容区域 -->
    <DataTable
      :data="tasksData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 状态列插槽 -->
      <template #status="{ row }">
        <EnumTag :value="row.status" :map="statusMap" effect="plain" />
      </template>

      <!-- 定时任务列插槽 -->
      <template #is_timing="{ row }">
        <EnumTag :value="row.is_timing" :map="timingMap" effect="plain" />
      </template>

      <!-- 执行时间列插槽 -->
      <template #run_time="{ row }">
        <span>{{ row.start_time }}</span>
      </template>

      <!-- 操作列插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnStatus" @routeEvent="operateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
    <!-- 任务结果查看对话框 -->
    <TaskResultDialog
      v-model="resultVisible"
      :result="result"
      :language="language"
      :type="currentDialogType"
      :task-id="taskId"
      @closed="onResultDialogClosed"
      @save="handleSaveResult"
    />

    <!-- 任务重试确认对话框 -->
    <TaskRetryDialog
      v-model="retryDialogVisible"
      :task-id="taskId"
      width="400px"
      :loading="retryLoading"
      @confirm="handleRetryConfirm"
    />
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { task } from "@/api/task/types/task"
import { listTasksApi, retryTaskApi, updateTaskArgsApi, updateTaskVariablesApi } from "@/api/task"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { ElMessage } from "element-plus"
import { TagInfo } from "@/common/components/EnumTag/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import TaskResultDialog from "./components/TaskResultDialog.vue"
import TaskRetryDialog from "./components/TaskRetryDialog.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表格列配置
const tableColumns = [
  { prop: "order_id", label: "工单号", align: "center" as const },
  { prop: "codebook_name", label: "任务模版", align: "center" as const },
  { prop: "worker_name", label: "工作节点", align: "center" as const },
  { prop: "status", label: "状态", align: "center" as const, slot: "status" },
  { prop: "is_timing", label: "定时任务", align: "center" as const, slot: "is_timing" },
  { prop: "run_time", label: "执行时间", align: "center" as const, slot: "run_time", width: 200 }
]

// 选中的行
const selectedRows = ref<task[]>([])

// 选择变化事件
const handleSelectionChange = (selection: task[]) => {
  selectedRows.value = selection
}

/** 查询模版列表 */
const tasksData = ref<task[]>([])
const listTasksData = () => {
  listTasksApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      tasksData.value = data.tasks
    })
    .catch(() => {
      tasksData.value = []
    })
    .finally(() => {})
}

const timingMap: Record<string, TagInfo> = {
  true: { type: "primary", text: "是" },
  false: { type: "warning", text: "否" }
}

const statusMap: Record<number, TagInfo> = {
  0: { type: "info", text: "未知" },
  1: { type: "success", text: "成功" },
  2: { type: "danger", text: "失败" },
  3: { type: "primary", text: "运行中" },
  4: { type: "warning", text: "等待中" },
  5: { type: "warning", text: "暂停中" },
  6: { type: "warning", text: "调度中" },
  7: { type: "warning", text: "重试" },
  8: { type: "warning", text: "等待中" }
}

const operateBtnStatus = ref([
  {
    name: "输入",
    code: "input",
    icon: "View"
  },
  {
    name: "输出",
    code: "output",
    icon: "View"
  },
  {
    name: "调参",
    code: "args",
    icon: "Tools",
    type: "primary"
  },
  {
    name: "变量",
    code: "variables",
    icon: "Shop",
    type: "primary"
  },
  {
    name: "重试",
    code: "retry",
    icon: "Refresh",
    type: "primary"
  }
])

const currentDialogType = ref<"input" | "output" | "args" | "variables">("input")
const retryDialogVisible = ref<boolean>(false)
const retryLoading = ref<boolean>(false)

const operateEvent = (data: task, name: string) => {
  taskId.value = data.id

  switch (name) {
    case "input":
      result.value = data.code
      language.value = data.language
      currentDialogType.value = "input"
      resultVisible.value = true
      break
    case "output":
      result.value = data.result
      language.value = data.language
      currentDialogType.value = "output"
      resultVisible.value = true
      break
    case "args":
      tempResult.value = JSON.parse(data.args)
      result.value = JSON.parse(data.args)
      currentDialogType.value = "args"
      language.value = "json"
      resultVisible.value = true
      break
    case "variables":
      tempResult.value = JSON.parse(data.variables)
      result.value = JSON.parse(data.variables)
      currentDialogType.value = "variables"
      language.value = "json"
      resultVisible.value = true
      break
    case "retry":
      retryDialogVisible.value = true
      break
  }
}

const onResultDialogClosed = () => {
  result.value = ""
  language.value = ""
  resultVisible.value = false
  taskId.value = 0
}

const handleSaveResult = async (data: { taskId: number; result: any; type: string }) => {
  try {
    switch (data.type) {
      case "args":
        await handlerUpdateArgs(data.taskId, data.result)
        break
      case "variables":
        await handlerUpdateVariables(data.taskId, data.result)
        break
    }
  } catch (error) {
    console.error("保存失败:", error)
  }
}

const handleRetryConfirm = () => {
  retryLoading.value = true
  retryTaskApi(taskId.value)
    .then(() => {
      ElMessage.success("重试已提交，请稍后查看结果")
      retryDialogVisible.value = false
      listTasksData()
    })
    .catch((error) => {
      console.error("重试任务失败:", error)
      ElMessage.error("重试任务失败")
    })
    .finally(() => {
      retryLoading.value = false
    })
}

const taskId = ref<number>(0)
const tempResult = ref<any>("")
const result = ref<any>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)

const handlerUpdateArgs = async (id: number, args: any) => {
  try {
    await updateTaskArgsApi({
      id: id,
      args: args
    })
    listTasksData()
    ElMessage.success("修改传递参数成功")
  } catch (error) {
    ElMessage.error("修改传递参数失败")
    throw error
  }
}

const handlerUpdateVariables = async (id: number, variables: any) => {
  try {
    await updateTaskVariablesApi({
      id: id,
      variables: JSON.stringify(variables)
    })
    listTasksData()
    ElMessage.success("修改传递变量成功")
  } catch (error) {
    ElMessage.error("修改传递变量失败")
    throw error
  }
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTasksData, { immediate: true })
</script>

<style scoped lang="scss">
// 任务历史页面样式优化
.task-history-container {
  .el-table {
    .el-table__header {
      th {
        background: #f8fafc;
        color: #374151;
        font-weight: 600;
      }
    }

    .el-table__row {
      &:hover {
        background: #f8fafc;
      }
    }
  }
}

// 操作按钮样式优化
.operate-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .el-button {
    font-size: 12px;
    padding: 4px 8px;
    height: auto;
    min-height: 28px;
  }
}

// 状态标签样式优化
.status-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

// 时间显示样式优化
.time-display {
  font-family: "Monaco", "Consolas", monospace;
  font-size: 12px;
  color: #6b7280;
}
</style>
