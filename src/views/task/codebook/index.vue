<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listCodebooksData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="codebooksData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="identifier" label="唯一标识" align="center" />
          <el-table-column prop="secret" label="密钥" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
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
    <!-- 新增模版 -->
    <addCodebook
      :dialog-visible="addDialogDrawer"
      :createOrUpdate="createOrUpdate"
      :codebookRow="codebookRow"
      @close="onClosed"
      @list-codebooks="listCodebooksData"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import addCodebook from "./createOrUpdate.vue"
import { codebook } from "@/api/codebook/types/codebook"
import { cloneDeep } from "lodash-es"
import { deleteCodebookApi, listCodebookApi } from "@/api/codebook"
import { ElMessage, ElMessageBox } from "element-plus"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogDrawer = ref<boolean>(false)

const createOrUpdate = ref<string>("")

const handlerCreate = () => {
  createOrUpdate.value = "create"
  addDialogDrawer.value = true
}

const codebookRow = ref<codebook>({
  id: 0,
  name: "",
  owner: 0,
  code: "",
  language: "",
  identifier: "",
  secret: ""
})

const handleUpdate = (row: codebook) => {
  createOrUpdate.value = "update" + row.id
  codebookRow.value = cloneDeep(row)
  addDialogDrawer.value = true
}

const onClosed = (val: boolean) => {
  addDialogDrawer.value = val
}

/** 查询模版列表 */
const codebooksData = ref<codebook[]>([])
const listCodebooksData = () => {
  listCodebookApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      codebooksData.value = data.codebooks
    })
    .catch(() => {
      codebooksData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: codebook) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteCodebookApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listCodebooksData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listCodebooksData, { immediate: true })
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
