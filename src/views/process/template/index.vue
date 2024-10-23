<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreateTemplate">新增模版</el-button>
          <el-button type="primary" :icon="CirclePlus" @click="groupDialogVisible = true">新增分组</el-button>
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
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="group_id" label="所属组" align="center" />
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
                >流程</el-button
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
    <!-- 新增 或 修改模版 -->
    <el-drawer
      class="add-drawer"
      v-model="templateDialogDrawer"
      :title="templateTitle"
      direction="ttb"
      size="100%"
      @closed="onClosedTemplate"
    >
      <Template ref="tRef" @closed="onClosedTemplate" @list-templates="listTemplatesData" />
    </el-drawer>

    <!-- 新增分组 -->
    <el-dialog v-model="groupDialogVisible" :title="'新增模版分组'" width="30%">
      <TemplateGroup ref="tgRef" @closed="onClosedThirdParty" />
      <template #footer>
        <el-button @click="onClosedTemplateGroup">取消</el-button>
        <el-button type="primary" @click="handlerCreateTemplateGroup">确认</el-button>
      </template>
    </el-dialog>

    <!-- 第三方流程绑定、如对接企业微信 OR 飞书 -->
    <el-dialog v-model="thirdpartyDialogVisible" :title="'绑定第三方流程'" width="35%">
      <thirdParty ref="thirdRef" @closed="onClosedThirdParty" />
      <template #footer>
        <el-button @click="onClosedThirdParty">取消</el-button>
        <el-button type="primary" @click="handlerCreateThirdParty">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { h, nextTick, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { template } from "@/api/template/types/template"
import { deleteTemplateApi, listTemplateApi } from "@/api/template"
import Template from "./template.vue"
import TemplateGroup from "./group.vue"
import thirdParty from "./thirdparty.vue"
import { ElMessageBox } from "element-plus"
import { ElMessage } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const templateDialogDrawer = ref<boolean>(false)
const groupDialogVisible = ref<boolean>(false)
const thirdpartyDialogVisible = ref<boolean>(false)

const tRef = ref<InstanceType<typeof Template>>()
const tgRef = ref<InstanceType<typeof TemplateGroup>>()
const thirdRef = ref<InstanceType<typeof thirdParty>>()

const templateTitle = ref<string>("创建模版")

/** 查询模版列表 */
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

const onClosedThirdParty = () => {
  thirdpartyDialogVisible.value = false
  thirdRef.value?.resetForm()
}

const onClosedTemplateGroup = () => {
  tgRef.value?.resetForm()
  groupDialogVisible.value = false
}

const onClosedTemplate = () => {
  tRef.value?.resetForm()
  templateDialogDrawer.value = false
}

const handlerCreateTemplateGroup = () => {
  tgRef.value?.handlerCreate()
}

const handleUpdate = (row: template) => {
  templateDialogDrawer.value = true
  templateTitle.value = "修改模版"

  nextTick(() => {
    tRef.value?.setForm(row)
  })
}

const handleCreateTemplate = () => {
  templateDialogDrawer.value = true
  templateTitle.value = "创建模版"
}
const handlerSync = (row: template) => {
  thirdpartyDialogVisible.value = true

  nextTick(() => {
    thirdRef.value?.setForm(row)
  })
}

const handlerCreateThirdParty = () => {
  thirdRef.value?.handleCreate()
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

.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
