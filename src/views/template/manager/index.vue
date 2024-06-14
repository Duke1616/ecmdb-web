<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listTemplatesData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="templatesData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="create_type" label="来源" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.create_type === 1" effect="plain" type="primary">系统自建</el-tag>
              <el-tag v-else-if="scope.row.create_type === 2" effect="plain" type="warning">企业微信</el-tag>
              <el-tag v-else type="info" effect="plain">未知类型</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                v-if="scope.row.create_type === 1"
                type="primary"
                text
                bg
                size="small"
                @click="handleUpdate(scope.row)"
                >修改</el-button
              >
              <el-button
                v-if="scope.row.create_type === 2"
                type="warning"
                text
                bg
                size="small"
                @click="handlerSync(scope.row)"
                >同步</el-button
              >
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
    <addTemplate :dialog-visible="addDialogVisible" @close="onClosed" @list-templates="listTemplatesData" />

    <!-- 修改或查看模版 -->
    <updateTemplate :dialog-visible="updateDialogVisible" :template-data="updateTemplateData" @close="onClosed" />
  </div>
</template>

<script lang="ts" setup>
import { h, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { template } from "@/api/template/types/template"
import { deleteTemplateApi, listTemplateApi } from "@/api/template"
import addTemplate from "./add-template.vue"
import updateTemplate from "./update-template.vue"
import { ElMessageBox } from "element-plus"
import { ElMessage } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogVisible = ref<boolean>(false)
const updateDialogVisible = ref<boolean>(false)
const updateTemplateData = ref<template>()

/** 查询关联类型 */
const templatesData = ref<template[]>([])
const listTemplatesData = () => {
  listTemplateApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      templatesData.value = data.templates
    })
    .catch(() => {
      templatesData.value = []
    })
    .finally(() => {})
}

const onClosed = (val: boolean) => {
  addDialogVisible.value = val
  updateDialogVisible.value = val
}

const handlerCreate = () => {
  addDialogVisible.value = true
}

const handleUpdate = (row: template) => {
  updateTemplateData.value = row
  updateDialogVisible.value = true
}

const handlerSync = (row: template) => {
  console.log(row)
}

const handleDelete = (row: template) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除模版: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteTemplateApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listTemplatesData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listTemplatesData, { immediate: true })
</script>

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
