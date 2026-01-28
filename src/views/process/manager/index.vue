<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      v-show="elCardVisibe"
      title="流程管理"
      subtitle="管理工作流程和部署"
      add-button-text="新增流程"
      @add="handleCreate"
      @refresh="listFlowsData"
    />

    <!-- 主内容区域 -->
    <DataTable
      v-show="elCardVisibe"
      :data="flowsData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
      @selection-change="handleSelectionChange"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 负责人插槽 -->
      <template #ownerName="{ row }">
        {{ formatOwner(row) }}
      </template>

      <!-- 消息通知插槽 -->
      <template #isNotify="{ row }">
        <el-tag v-if="row.is_notify === true" effect="plain" type="primary" disable-transitions class="status-tag">
          开启
        </el-tag>
        <el-tag v-else type="warning" effect="plain" disable-transitions class="status-tag"> 关闭 </el-tag>
      </template>

      <!-- 发送媒介插槽 -->
      <template #notifyMethod="{ row }">
        <el-tag v-if="row.notify_method === 1" effect="plain" type="primary" disable-transitions class="method-tag">
          飞书
        </el-tag>
        <el-tag
          v-else-if="row.notify_method === 2"
          effect="plain"
          type="success"
          disable-transitions
          class="method-tag"
        >
          微信
        </el-tag>
        <el-tag v-else type="info" effect="plain" disable-transitions class="method-tag"> 暂未开启 </el-tag>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="operateBtnStatus" @routeEvent="operateEvent" :operateItem="row" :maxLength="2" />
      </template>
    </DataTable>
    <!-- 新增模版 -->
    <el-card v-if="visibleWorkflow">
      <WizardContainer
        :steps="workflowSteps"
        :formData="workflowFormData"
        :formRules="workflowFormRules"
        @update:formData="updateWorkflowFormData"
        @close="onClosed"
        @save="saveWorkflow"
        ref="workflowWizardRef"
      />
    </el-card>

    <!-- 预览 -->
    <el-dialog v-model="graphPreviewVisible" width="60%" @closed="onPreviewClosed">
      <Preview ref="previewRef" @close="onPreviewClosed" />
    </el-dialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { h, ref, watch, nextTick, computed } from "vue"
import { CopyDocument } from "@element-plus/icons-vue"
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
import Info from "./info.vue"
import WorkflowEditor from "./lf.vue"
import Setting from "./setting.vue"
import { v4 as uuidv4 } from "uuid"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import { refreshGraphId } from "@/common/utils/logicflow"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const previewRef = ref<InstanceType<typeof Preview>>()

// 表格列定义
const tableColumns = [
  { prop: "name", label: "名称", showOverflowTooltip: true },
  { prop: "owner", label: "负责人", slot: "ownerName" },
  { prop: "is_notify", label: "消息通知", slot: "isNotify" },
  { prop: "notify_method", label: "发送媒介", slot: "notifyMethod" },
  { prop: "desc", label: "描述", showOverflowTooltip: true }
]

// 选择处理
const handleSelectionChange = (selection: workflow[]) => {
  console.log("Selected workflows:", selection)
}

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

const operateEvent = (data: workflow, action: string) => {
  if (action === "preview") {
    graphPreviewVisible.value = true
    nextTick(() => {
      previewRef.value?.initLf(data.flow_data)
    })
  } else if (action === "deploy") {
    deployWorkflow(data)
  } else if (action === "edit") {
    handleUpdate(data)
  } else if (action === "delete") {
    handleDelete(data)
  } else if (action === "clone") {
    handleClone(data)
  }
}

const handleClone = (row: workflow) => {
  elCardVisibe.value = false
  visibleWorkflow.value = true

  nextTick(() => {
    workflowWizardRef.value?.setStep(0)

    // 深拷贝数据
    const clonedData = JSON.parse(JSON.stringify(row))

    // 重生成图数据 ID
    if (clonedData.flow_data) {
      clonedData.flow_data = refreshGraphId(clonedData.flow_data)
    }

    workflowFormData.value = {
      ...workflowFormData.value,
      ...clonedData,
      id: undefined,
      name: `${row.name}_copy`
    }
  })
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
    code: "deploy",
    icon: "Open"
  },
  {
    name: "克隆",
    code: "clone",
    icon: CopyDocument,
    type: "success"
  },
  {
    name: "预览",
    code: "preview",
    icon: "View"
  },
  {
    name: "编辑",
    code: "edit",
    icon: "EditPen"
  },
  {
    name: "删除",
    code: "delete",
    icon: "Delete",
    type: "danger"
  }
])

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listFlowsData, { immediate: true })
</script>

<style lang="scss" scoped>
/* 状态标签样式 */
.status-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid;
  min-width: 50px;
  text-align: center;
  white-space: nowrap;
  display: inline-block;

  &.el-tag--primary {
    color: #3b82f6;
    background: #eff6ff;
    border-color: #dbeafe;
  }

  &.el-tag--warning {
    color: #d97706;
    background: #fef3c7;
    border-color: #fde68a;
  }
}

/* 方法标签样式 */
.method-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid;
  min-width: 60px;
  text-align: center;
  white-space: nowrap;
  display: inline-block;

  &.el-tag--primary {
    color: #3b82f6;
    background: #eff6ff;
    border-color: #dbeafe;
  }

  &.el-tag--success {
    color: #059669;
    background: #ecfdf5;
    border-color: #d1fae5;
  }

  &.el-tag--info {
    color: #6b7280;
    background: #f9fafb;
    border-color: #e5e7eb;
  }
}

/* WizardContainer 现在自动处理全屏覆盖，无需额外样式 */
</style>
