<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="table-wrapper">
        <el-table :data="tasksData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="order_id" label="工单号" align="center" />
          <el-table-column prop="codebook_name" label="任务模版" align="center" />
          <el-table-column prop="worker_name" label="工作节点" align="center" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 3" type="primary" effect="plain"> 运行中 </el-tag>
              <el-tag v-if="scope.row.status === 4" type="warning" effect="plain"> 等待中 </el-tag>
              <el-tag v-if="scope.row.status === 5" type="warning" effect="plain"> 暂停中 </el-tag>
              <el-tag v-if="scope.row.status === 6" type="warning" effect="plain"> 调度中 </el-tag>
              <el-tag v-if="scope.row.status === 7" type="warning" effect="plain"> 重试 </el-tag>
              <el-tag v-if="scope.row.status === 1" type="success" effect="plain"> 成功 </el-tag>
              <el-tag v-if="scope.row.status === 2" type="danger" effect="plain"> 失败 </el-tag>
              <el-tag v-if="scope.row.status === 0" type="info" effect="plain"> 未知 </el-tag>
            </template>
          </el-table-column>
          <!-- <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleInput(scope.row)">输入</el-button>
              <el-button type="primary" text bg size="small" @click="handleResult(scope.row)">输出</el-button>
            </template>
          </el-table-column> -->
          <el-table-column fixed="right" label="操作" width="200" align="center">
            <template #default="scope">
              <OperateBtn
                :items="operateBtnStatus"
                @routeEvent="operateEvent"
                :operateItem="scope.row"
                :maxLength="2"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
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
import { usePagination } from "@/hooks/usePagination"
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
import OperateBtn from "@/components/OperateBtn/index.vue"
import { ElMessage, ElMessageBox } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
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
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}

.code-container {
  height: 70vh;
  overflow: auto;
}
</style>
