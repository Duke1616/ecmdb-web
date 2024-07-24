<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="table-wrapper">
        <el-table :data="tasksData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="order_id" label="工单ID" align="center" />
          <el-table-column prop="codebook_uid" label="任务模版" align="center" />
          <el-table-column prop="worker_name" label="工作节点" align="center" />
          <el-table-column prop="status" label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.status === 3" type="primary" effect="plain"> 运行中 </el-tag>
              <el-tag v-if="scope.row.status === 4" type="warning" effect="plain"> 等待中 </el-tag>
              <el-tag v-if="scope.row.status === 1" type="success" effect="plain"> 成功 </el-tag>
              <el-tag v-if="scope.row.status === 2" type="danger" effect="plain"> 失败 </el-tag>
              <el-tag v-if="scope.row.status === 0" type="info" effect="plain"> 未知 </el-tag>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleInput(scope.row)">输入</el-button>
              <el-button type="primary" text bg size="small" @click="handleResult(scope.row)">输出</el-button>
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
      <el-dialog v-model="resultVisible" width="50%" @close="onclose">
        <prism-editor class="my-editor" v-model="result" :readonly="true" :highlight="highlighter" line-numbers />
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { task } from "@/api/task/types/task"
import { listTasksApi } from "@/api/task"
import { PrismEditor } from "vue-prism-editor"
import "vue-prism-editor/dist/prismeditor.min.css"
import { highlight, languages } from "prismjs/components/prism-core"
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import "prismjs/components/prism-python"
import "prismjs/components/prism-bash"
import "prismjs/themes/prism-dark.css"

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

const onclose = () => {
  result.value = ""
  language.value = ""
  resultVisible.value = false
}

const result = ref<string>("")
const language = ref<string>("")
const resultVisible = ref<boolean>(false)
const highlighter = (code: string) => {
  if (language.value === "python") {
    return highlight(code, languages.python)
  }
  if (language.value === "javascript") {
    return highlight(code, languages.javascript)
  }
  if (language.value === "shell") {
    console.log("shell", code)
    return highlight(code, languages.bash)
  }
}

const handleInput = (row: task) => {
  result.value = row.code
  resultVisible.value = true
  language.value = row.language
}

const handleResult = (row: task) => {
  result.value = row.result
  resultVisible.value = true
  language.value = row.language
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
</style>
