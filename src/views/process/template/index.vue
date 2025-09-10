<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="模板管理"
      subtitle="管理系统模板和分组"
      add-button-text="新增模版"
      @add="handleCreateTemplate"
      @refresh="listTemplatesData"
    >
      <template #actions>
        <el-button type="primary" :icon="CirclePlus" @click="handleCreateTemplate">新增模版</el-button>
        <el-button type="success" :icon="CirclePlus" @click="groupDialogVisible = true">新增分组</el-button>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="listTemplatesData" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="templatesData"
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
      <!-- 所属组插槽 -->
      <template #groupName="{ row }">
        {{ formatGroup(row) }}
      </template>

      <!-- 来源插槽 -->
      <template #createType="{ row }">
        <el-tag v-if="row.create_type === 1" effect="plain" type="primary" disable-transitions class="type-tag">
          系统自建
        </el-tag>
        <el-tag v-else-if="row.create_type === 2" effect="plain" type="warning" disable-transitions class="type-tag">
          企业微信
        </el-tag>
        <el-tag v-else type="info" effect="plain" disable-transitions class="type-tag"> 未知类型 </el-tag>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateBtnItems(row)" @routeEvent="operateEvent" :operateItem="row" :maxLength="3" />
      </template>
    </DataTable>

    <!-- 新增或删除模版 -->
    <el-card v-show="templateDialogDrawer">
      <WizardContainer
        :steps="templateSteps"
        :formData="templateFormData"
        :formRules="templateFormRules"
        @update:formData="updateTemplateFormData"
        @close="onClosedTemplate"
        @save="saveTemplate"
        ref="templateWizardRef"
      />
    </el-card>

    <!-- 新增分组 -->
    <el-dialog v-model="groupDialogVisible" :before-close="onClosedTemplateGroup" :title="'新增模版分组'" width="30%">
      <TemplateGroup ref="tgRef" @closed="onClosedTemplateGroup" />
      <template #footer>
        <el-button @click="onClosedTemplateGroup">取消</el-button>
        <el-button type="primary" @click="handlerCreateTemplateGroup">确认</el-button>
      </template>
    </el-dialog>

    <!-- 自动发现 -->
    <el-dialog v-model="templateDiscoverDialog" :fullscreen="true" :before-close="onClosedDiscover" :title="'自动发现'">
      <Discovery ref="discoveryRef" @closed="onClosedDiscover" />
    </el-dialog>

    <!-- 第三方流程绑定、如对接企业微信 OR 飞书 -->
    <el-dialog
      v-model="thirdpartyDialogVisible"
      :before-close="onClosedThirdParty"
      :title="'绑定第三方流程'"
      width="35%"
    >
      <thirdParty ref="thirdRef" @closed="onClosedThirdParty" />
      <template #footer>
        <el-button @click="onClosedThirdParty">取消</el-button>
        <el-button type="primary" @click="handlerCreateThirdParty">确认</el-button>
      </template>
    </el-dialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { h, nextTick, ref, watch, computed } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { template, createOrUpdateTemplateReq } from "@/api/template/types/template"
import {
  deleteTemplateApi,
  getTemplateGroupsByIdsApi,
  listTemplateApi,
  createTemplateApi,
  updateTemplateApi
} from "@/api/template"
import TemplateGroup from "./group/index.vue"
import thirdParty from "./thirdparty.vue"
import { ElMessageBox } from "element-plus"
import { ElMessage } from "element-plus"
import Discovery from "./discovery/index.vue"
import WizardContainer from "@/common/components/WizardContainer/index.vue"
import { COMMON_STEPS } from "@/common/constants/wizard-steps"
import { getFormRulesByStep } from "@/common/constants/form-rules"
import Info from "./info.vue"
import Designer from "./designer.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const templateDialogDrawer = ref<boolean>(false)
const templateDiscoverDialog = ref<boolean>(false)
const groupDialogVisible = ref<boolean>(false)
const thirdpartyDialogVisible = ref<boolean>(false)

// 表格列定义
const tableColumns = [
  { prop: "name", label: "名称", showOverflowTooltip: true },
  { prop: "group_id", label: "所属组", width: 120, slot: "groupName" },
  { prop: "create_type", label: "来源", width: 120, slot: "createType" },
  { prop: "desc", label: "描述", showOverflowTooltip: true }
]

// 选择处理
const handleSelectionChange = (selection: template[]) => {
  console.log("Selected templates:", selection)
}

// 操作按钮配置
const getOperateBtnItems = (row: template) => {
  const items = []

  if (row.create_type === 1) {
    items.push({
      name: "修改",
      code: "1",
      icon: "EditPen"
    })
  } else if (row.create_type === 2) {
    items.push({
      name: "流程",
      code: "2",
      icon: "Connection",
      type: "warning"
    })
  }

  items.push({
    name: "自动发现",
    code: "3",
    icon: "Search"
  })

  items.push({
    name: "删除",
    code: "4",
    icon: "Delete",
    type: "danger"
  })

  return items
}

// 操作事件处理
const operateEvent = (data: template, name: string) => {
  if (name === "修改") {
    handleUpdate(data)
  } else if (name === "流程") {
    handlerSync(data)
  } else if (name === "自动发现") {
    handleDiscover(data)
  } else if (name === "删除") {
    handleDelete(data)
  }
}

// 模板向导相关
const templateWizardRef = ref()
const templateSteps = [
  {
    ...COMMON_STEPS.INFO,
    title: "填写模板信息",
    component: Info
  },
  {
    ...COMMON_STEPS.DESIGN,
    title: "设计表单结构",
    description: "可视化表单设计",
    component: Designer
  }
]

const templateFormData = ref<createOrUpdateTemplateReq>({
  id: undefined,
  name: "",
  desc: "",
  rules: undefined,
  options: undefined,
  icon: "",
  group_id: undefined,
  workflow_id: undefined
})

const templateFormRules = computed(() => {
  return getFormRulesByStep("TEMPLATE_INFO", templateWizardRef.value?.currentStep || 0)
})

const tgRef = ref<InstanceType<typeof TemplateGroup>>()
const thirdRef = ref<InstanceType<typeof thirdParty>>()
const discoveryRef = ref<InstanceType<typeof Discovery>>()

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

      const uniqueIds = new Set<number>()
      data.templates.forEach((item) => {
        console.log(item)
        if (item.group_id) {
          uniqueIds.add(item.group_id)
        }
      })

      getTemplateGroupsData(Array.from(uniqueIds))
    })
    .catch(() => {
      templatesData.value = []
    })
    .finally(() => {})
}

const groupMaps = ref(new Map<number, string>())
const getTemplateGroupsData = (ids: number[]) => {
  getTemplateGroupsByIdsApi(ids)
    .then(({ data }) => {
      data.template_groups.forEach((node) => {
        groupMaps.value.set(node.id, node.name)
      })
    })
    .catch(() => {})
    .finally(() => {})
}

const formatGroup = (row: template) => {
  return groupMaps.value.get(row.group_id) || "未知组"
}

const onClosedThirdParty = () => {
  thirdRef.value?.resetForm()
  thirdpartyDialogVisible.value = false
}

const onClosedTemplateGroup = () => {
  tgRef.value?.resetForm()
  groupDialogVisible.value = false
}
const onClosedDiscover = () => {
  templateDiscoverDialog.value = false

  discoveryRef.value?.resetMap()
}

// 模板向导相关函数
const updateTemplateFormData = (data: createOrUpdateTemplateReq) => {
  templateFormData.value = { ...templateFormData.value, ...data }
}

const saveTemplate = async () => {
  try {
    if (templateFormData.value.id) {
      await updateTemplateApi(templateFormData.value)
      ElMessage.success("模板更新成功")
    } else {
      await createTemplateApi(templateFormData.value)
      ElMessage.success("模板创建成功")
    }
    // 保存成功后关闭页面并刷新列表
    onClosedTemplate()
    listTemplatesData()
  } catch (error) {
    ElMessage.error("操作失败")
  }
}

const onClosedTemplate = () => {
  templateWizardRef.value?.setStep(0)
  templateFormData.value = {
    id: undefined,
    name: "",
    desc: "",
    rules: undefined,
    options: undefined,
    icon: "",
    group_id: undefined,
    workflow_id: undefined
  }
  templateDialogDrawer.value = false
}

const handlerCreateTemplateGroup = () => {
  tgRef.value?.handlerCreate()
}

const handleDiscover = (row: template) => {
  templateDiscoverDialog.value = true

  nextTick(() => {
    discoveryRef.value?.setForm(row)
  })
}

const handleUpdate = (row: template) => {
  templateDialogDrawer.value = true

  nextTick(() => {
    templateWizardRef.value?.setStep(0)
    templateFormData.value = { ...templateFormData.value, ...row }
  })
}
const handleCreateTemplate = () => {
  templateDialogDrawer.value = true
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
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}

/* 类型标签样式 */
.type-tag {
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

  &.el-tag--warning {
    color: #d97706;
    background: #fef3c7;
    border-color: #fde68a;
  }

  &.el-tag--info {
    color: #6b7280;
    background: #f9fafb;
    border-color: #e5e7eb;
  }
}
</style>
