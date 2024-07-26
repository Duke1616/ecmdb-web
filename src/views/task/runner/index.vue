<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listRunnerData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="runnersData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="worker_name" label="工作节点" align="center" />
          <el-table-column prop="codebook_uid" label="绑定模版" align="center" />
          <el-table-column prop="tags" label="标签" align="center">
            <template #default="scope">
              <el-tag
                v-for="tag in scope.row.tags"
                :key="tag"
                :style="{ marginRight: '5px' }"
                effect="plain"
                type="primary"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
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
    <!-- 注册Runner -->
    <reigsterRunner
      :dialog-visible="addDialogDrawer"
      :createOrUpdate="createOrUpdate"
      :runnerRow="runnerRow"
      @close="onClosed"
      @list-runners="listRunnerData"
    />
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
// import { ElMessage, ElMessageBox } from "element-plus"
import { runner } from "@/api/runner/types/runner"
import { deleteRunnerApi, listRunnerApi } from "@/api/runner"
import reigsterRunner from "./registerOrUpdate.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { cloneDeep } from "lodash-es"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogDrawer = ref<boolean>(false)
const createOrUpdate = ref<string>("")

const handlerCreate = () => {
  createOrUpdate.value = "create"
  addDialogDrawer.value = true
}

const onClosed = (val: boolean) => {
  addDialogDrawer.value = val
}

const runnerRow = ref<runner>({
  id: 0,
  name: "",
  worker_name: "",
  codebook_uid: "",
  codebook_secret: "",
  desc: "",
  tags: [],
  variables: []
})

/** 查询模版列表 */
const runnersData = ref<runner[]>([])
const listRunnerData = () => {
  listRunnerApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      runnersData.value = data.runners
    })
    .catch(() => {
      runnersData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: runner) => {
  console.log("row", row)
  console.log(runnersData, "data")
  createOrUpdate.value = "update" + row.id
  runnerRow.value = cloneDeep(row)
  addDialogDrawer.value = true
}

const handleDelete = (row: runner) => {
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
    deleteRunnerApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listRunnerData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRunnerData, { immediate: true })
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
