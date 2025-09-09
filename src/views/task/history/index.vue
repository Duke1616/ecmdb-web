<template>
  <div class="app-container">
    <!-- 头部区域 -->
    <ManagerHeader title="任务历史" subtitle="查看任务执行历史和状态" @refresh="listTasksData" />

    <!-- 主内容区域 -->
    <DataTable
      :data="tasksData"
      :columns="tableColumns"
      :actions="[]"
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
    <div>
      <!--  代码块 -->
      <el-dialog v-model="resultVisible" width="40%" @close="onclose" :close-on-click-modal="closeOnClickModal">
        <div class="code-container">
          <prism-editor
            v-if="language !== 'json'"
            class="my-editor"
            v-model="result"
            :readonly="true"
            :highlight="highlighter"
            line-numbers
          />
          <div v-if="language === 'json'">
            <vue-json-pretty
              :deep="3"
              v-model:data="result"
              selectableType="single"
              :editable="true"
              :showLineNumber="true"
              :showLine="true"
              path="res"
            />
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { task } from "@/api/task/types/task"
import { listTasksApi, retryTaskApi, updateTaskArgsApi, updateTaskVariablesApi } from "@/api/task"
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-bash"
import "prismjs/components/prism-json"
import "prismjs/themes/prism-dark.css"

import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { TagInfo } from "@/common/components/EnumTag/index.vue"
import EnumTag from "@/common/components/EnumTag/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 表格列配置
const tableColumns = [
  { prop: "order_id", label: "工单号", align: "center" as const },
  { prop: "codebook_name", label: "任务模版", align: "center" as const },
  { prop: "worker_name", label: "工作节点", align: "center" as const },
  { prop: "status", label: "状态", align: "center" as const, slot: "status" },
  { prop: "is_timing", label: "定时任务", align: "center" as const, slot: "is_timing" },
  { prop: "run_time", label: "执行时间", align: "center" as const, slot: "run_time" },
  { prop: "actions", label: "操作", align: "center" as const, slot: "actions", width: 200 }
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
    code: "1",
    icon: "View"
  },
  {
    name: "输出",
    code: "2",
    icon: "View"
  },
  {
    name: "调参",
    code: "3",
    icon: "Tools",
    type: "primary"
  },
  {
    name: "变量",
    code: "4",
    icon: "Shop",
    type: "primary"
  },
  {
    name: "重试",
    code: "5",
    icon: "Refresh",
    type: "primary"
  }
])

const active = ref<string>("")
const operateEvent = (data: task, name: string) => {
  taskId.value = data.id
  resultVisible.value = true

  switch (name) {
    case "输入":
      result.value = data.code
      language.value = data.language
      break
    case "输出":
      result.value = data.result
      language.value = data.language
      break
    case "3":
      tempResult.value = JSON.parse(data.args)
      result.value = JSON.parse(data.args)
      closeOnClickModal.value = false
      active.value = "参数"
      language.value = "json"
      break
    case "4":
      tempResult.value = JSON.parse(data.variables)
      result.value = JSON.parse(data.variables)
      closeOnClickModal.value = false
      active.value = "变量"
      language.value = "json"
      break
    case "5":
      resultVisible.value = false
      retryTask()
      break
  }
}

const onclose = () => {
  if (language.value === "json") {
    if (JSON.stringify(tempResult.value) !== JSON.stringify(result.value)) {
      switch (active.value) {
        case "参数":
          handlerUpdateArgs()
          break
        case "变量":
          handlerUpdateVaribales()
          break
      }
    }
  }

  result.value = ""
  language.value = ""
  resultVisible.value = false
  closeOnClickModal.value = true
  taskId.value = 0
}

const taskId = ref<number>(0)
const tempResult = ref<any>("")
const result = ref<any>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)
const closeOnClickModal = ref<boolean>(true)
const highlighter = (code: string) => {
  switch (language.value) {
    case "json":
      return highlight(code, languages.bash)
    case "python":
      return highlight(code, languages.python)
    case "shell":
      return highlight(code, languages.bash)
    case "javascript":
      return highlight(code, languages.javascript)
  }
}

const handlerUpdateArgs = () => {
  updateTaskArgsApi({
    id: taskId.value,
    args: result.value
  }).then(() => {
    listTasksData()
    ElMessage.success("修改传递参数成功")
  })
}

const handlerUpdateVaribales = () => {
  updateTaskVariablesApi({
    id: taskId.value,
    variables: JSON.stringify(result.value)
  }).then(() => {
    listTasksData()
    ElMessage.success("修改传递变量成功")
  })
}

const retryTask = () => {
  ElMessageBox({
    title: "重试任务",
    message: h("p", null, [
      h("span", null, "正在重试任务ID: "),
      h("i", { style: "color: red" }, `${taskId.value}`),
      h("span", null, " 确认？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    retryTaskApi(taskId.value).then(() => {
      ElMessage.success("重试已提交，请稍后查看结果")
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTasksData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}

.code-container {
  height: 70vh;
  overflow: auto;
}
</style>
