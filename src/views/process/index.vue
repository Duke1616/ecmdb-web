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
              <el-tag v-if="scope.row.is_notify === true" effect="plain" type="primary" disable-transitions
                >开启</el-tag
              >
              <el-tag v-else type="warning" effect="plain" disable-transitions>关闭</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="notify_method" label="发送媒介" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.notify_method === 1" effect="plain" type="primary" disable-transitions
                >飞书</el-tag
              >
              <el-tag v-else-if="scope.row.notify_method === 2" effect="plain" type="primary" disable-transitions
                >微信</el-tag
              >
              <el-tag v-else type="info" effect="plain" disable-transitions>暂未开启</el-tag>
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
    <el-card
      v-show="visibleWorkflow"
      style="height: 100vh; margin: 0; position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000"
    >
      <WizardContainer
        :steps="workflowSteps"
        :formData="workflowFormData"
        :formRules="workflowFormRules"
        @update:formData="updateWorkflowFormData"
        @next="goToNextWorkflow"
        @previous="goToPreviousWorkflow"
        @close="onClosed"
        @save="saveWorkflow"
        ref="workflowWizardRef"
      />
    </el-card>

    <!-- 预览 -->
    <el-dialog v-model="graphPreviewVisible" width="60%" @closed="onPreviewClosed">
      <Preview ref="previewRef" @close="onPreviewClosed" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, watch, nextTick, computed } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import {
  deleteWorkflowApi,
  deployWorkflowApi,
  listWorkflowApi,
  createWorkflowApi,
  updateWorkflowApi
} from "@/api/workflow/workflow"
import { workflow, createOrUpdateWorkflowReq } from "@/api/workflow/types/workflow"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import Preview from "./preview/Preview.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { findByUsernamesApi } from "@/api/user"
import WizardContainer from "@/common/components/WizardContainer/index.vue"
import { COMMON_STEPS } from "@/common/constants/wizard-steps"
import { getFormRulesByStep } from "@/common/constants/form-rules"
import Info from "./create/info.vue"
import WorkflowEditor from "./create/lf.vue"
import Setting from "./create/setting.vue"
import { v4 as uuidv4 } from "uuid"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const previewRef = ref<InstanceType<typeof Preview>>()

// 工作流向导相关
const workflowWizardRef = ref()
const workflowSteps = [
  {
    ...COMMON_STEPS.INFO,
    title: "填写流程信息",
    component: Info
  },
  {
    ...COMMON_STEPS.DESIGN,
    title: "定义配置流程",
    description: "可视化流程设计",
    component: WorkflowEditor
  },
  {
    ...COMMON_STEPS.SETTING,
    title: "配置启动设置",
    description: "通知和参数配置",
    component: Setting
  }
]

const workflowFormData = ref<createOrUpdateWorkflowReq>({
  id: undefined,
  is_notify: false,
  notify_method: 1,
  name: "",
  desc: "",
  icon: "",
  owner: "",
  flow_data: {
    nodes: [
      {
        id: uuidv4(),
        type: "start",
        x: 350,
        y: 160,
        properties: {}
      },
      {
        id: uuidv4(),
        type: "end",
        x: 610,
        y: 160,
        properties: {}
      }
    ],
    edges: []
  }
})

const workflowFormRules = computed(() => {
  return getFormRulesByStep("WORKFLOW_INFO", workflowWizardRef.value?.currentStep || 0)
})

// 控制列表卡片
const elCardVisibe = ref<boolean>(true)
// 控制新增修改
const visibleWorkflow = ref<boolean>(false)
// 预览流程图
const graphPreviewVisible = ref<boolean>(false)

// 工作流向导相关函数
const updateWorkflowFormData = (data: createOrUpdateWorkflowReq) => {
  workflowFormData.value = { ...workflowFormData.value, ...data }
}

const goToNextWorkflow = () => {
  workflowWizardRef.value?.goToNext()
}

const goToPreviousWorkflow = () => {
  workflowWizardRef.value?.goToPrevious()
}

const saveWorkflow = async () => {
  try {
    if (workflowFormData.value.id) {
      await updateWorkflowApi(workflowFormData.value)
      ElMessage.success("流程更新成功")
    } else {
      await createWorkflowApi(workflowFormData.value)
      ElMessage.success("流程创建成功")
    }
    // 保存成功后关闭页面并刷新列表
    onClosed()
    listFlowsData()
  } catch (error) {
    ElMessage.error("操作失败")
  }
}

const handleCreate = () => {
  // 展示新增页面，隐藏底层列表卡片
  elCardVisibe.value = false
  visibleWorkflow.value = true

  // 渲然初始化页面
  nextTick(() => {
    workflowWizardRef.value?.setStep(0)
    workflowFormData.value = {
      id: undefined,
      is_notify: false,
      notify_method: 1,
      name: "",
      desc: "",
      icon: "",
      owner: "",
      flow_data: {
        nodes: [
          {
            id: uuidv4(),
            type: "start",
            x: 350,
            y: 160,
            properties: {}
          },
          {
            id: uuidv4(),
            type: "end",
            x: 610,
            y: 160,
            properties: {}
          }
        ],
        edges: []
      }
    }
  })
}

const handleUpdate = (row: workflow) => {
  // 展示新增页面，隐藏底层列表卡片
  elCardVisibe.value = false
  visibleWorkflow.value = true

  nextTick(() => {
    workflowWizardRef.value?.setStep(0)
    workflowFormData.value = { ...workflowFormData.value, ...row }
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
