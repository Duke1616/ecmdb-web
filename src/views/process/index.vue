<template>
  <div class="app-container">
    <el-card shadow="never" v-show="elCardVisibe">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handleCreate">新增流程</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listFlowsData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="flowsData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="owner" label="负责人" align="center" :formatter="formatOwner" />
          <el-table-column prop="is_notify" label="消息通知" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.is_notify === true" effect="plain" type="primary">开启</el-tag>
              <el-tag v-else type="warning" effect="plain">关闭</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notify_method" label="发送媒介" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.notify_method === 1" effect="plain" type="primary">飞书</el-tag>
              <el-tag v-else-if="scope.row.notify_method === 2" effect="plain" type="primary">微信</el-tag>
              <el-tag v-else type="info" effect="plain">暂未开启</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="desc" label="描述" align="center" />
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
    <!-- 新增模版 -->
    <el-card v-show="visibleWorkflow" style="height: auto">
      <createWorkflow ref="apiRef" @close="onClosed" @list-templates="listFlowsData" />
    </el-card>

    <!-- 预览 -->
    <el-dialog v-model="graphPreviewVisible" width="60%" @closed="onPreviewClosed">
      <Preview ref="previewRef" @close="onPreviewClosed" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, watch, nextTick } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import createWorkflow from "./create/index.vue"
import { deleteWorkflowApi, deployWorkflowApi, listWorkflowApi } from "@/api/workflow/workflow"
import { workflow } from "@/api/workflow/types/workflow"
import OperateBtn from "@/components/OperateBtn/index.vue"
import Preview from "./preview/Preview.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { findByUsernamesApi } from "@/api/user"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const apiRef = ref<InstanceType<typeof createWorkflow>>()
const previewRef = ref<InstanceType<typeof Preview>>()
// 控制列表卡片
const elCardVisibe = ref<boolean>(true)
// 控制新增修改
const visibleWorkflow = ref<boolean>(false)
// 预览流程图
const graphPreviewVisible = ref<boolean>(false)

const handleCreate = () => {
  // 展示新增页面，隐藏底层列表卡片
  elCardVisibe.value = false
  visibleWorkflow.value = true

  // 渲然初始化页面
  nextTick(() => {
    apiRef.value?.setCreateForm()
  })
}

const handleUpdate = (row: workflow) => {
  // 展示新增页面，隐藏底层列表卡片
  elCardVisibe.value = false
  visibleWorkflow.value = true

  nextTick(() => {
    apiRef.value?.setUpdateForm(row)
  })
}

// 关闭事件 - 父子通信
const onClosed = () => {
  visibleWorkflow.value = false
  elCardVisibe.value = true
}

const onPreviewClosed = () => {
  graphPreviewVisible.value = false
}

const flowsData = ref<workflow[]>([])
const listFlowsData = () => {
  listWorkflowApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      flowsData.value = data.workflows
      const uniqueOwners = new Set<string>()

      // 遍历 flowsData.value，提取 onwer 并添加到 Set 中
      data.workflows.forEach((item) => {
        console.log(item)
        if (item.owner) {
          uniqueOwners.add(item.owner)
        }
      })

      getUsernamesData(Array.from(uniqueOwners))
    })
    .catch(() => {
      flowsData.value = []
    })
    .finally(() => {})
}
const userMaps = ref(new Map<string, string>())
const getUsernamesData = (uns: string[]) => {
  findByUsernamesApi(uns)
    .then(({ data }) => {
      data.users.forEach((node) => {
        userMaps.value.set(node.username, node.display_name)
      })
    })
    .catch(() => {})
    .finally(() => {})
}

const formatOwner = (row: workflow) => {
  return userMaps.value.get(row.owner) || "未知用户"
}

const operateEvent = (data: workflow, name: string) => {
  if (name === "预览") {
    graphPreviewVisible.value = true
    nextTick(() => {
      previewRef.value?.initLf(data.flow_data)
    })
  }

  if (name === "部署") {
    deployWorkflow(data)
  }

  // 编辑
  if (name === "3") {
    handleUpdate(data)
  }

  // 删除
  if (name === "4") {
    handleDelete(data)
  }
}

const handleDelete = (row: workflow) => {
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
    deleteWorkflowApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listFlowsData()
    })
  })
}

const deployWorkflow = (row: workflow) => {
  ElMessageBox({
    title: "部署确认",
    message: h("p", null, [
      h("span", null, "正在部署名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认部署？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deployWorkflowApi(row.id).then(() => {
      ElMessage.success("部署成功")
      listFlowsData()
    })
  })
}

const operateBtnStatus = ref([
  {
    name: "部署",
    code: "1",
    icon: "Open"
  },
  {
    name: "预览",
    code: "2",
    icon: "View"
  },
  {
    name: "编辑",
    code: "3",
    icon: "EditPen"
  },
  {
    name: "删除",
    code: "4",
    icon: "Delete",
    type: "danger"
  }
])

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listFlowsData, { immediate: true })
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
