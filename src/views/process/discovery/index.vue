<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      :title="`自动发现 - ${templateData?.name || '未选择模版'}`"
      subtitle="根据模版字段自行匹配执行器"
      @refresh="listDiscoveriesData"
      @back="handleBack"
    >
      <template #actions>
        <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        <el-button type="success" :icon="CirclePlus" @click="handlerSync">同步</el-button>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="discoveriesData"
      :columns="tableColumns"
      :pagination="paginationData"
      :loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <template #templateName>
        {{ templateData?.name }}
      </template>

      <template #fieldName="{ row }">
        {{ fieldMap.get(row.field) }}
      </template>

      <template #runnerName="{ row }">
        {{ runnerMap.get(row.runner_id) }}
      </template>

      <template #actions="{ row }">
        <OperateBtn
          :items="operateBtnItems"
          :operate-item="row"
          :max-length="3"
          @route-event="(data: any, action: string) => operateEvent(action, data)"
        />
      </template>
    </DataTable>

    <!-- 自动发现 -->
    <FormDialog
      v-model="dialogVisible"
      title="自动发现"
      width="30%"
      @confirm="handlerSubmitDiscovery"
      @cancel="onClosed"
    >
      <Form
        ref="apiRef"
        :fields-map="fieldMap"
        :template-id="templateData?.id"
        :runner-map="runnerMap"
        @callback="listDiscoveriesData"
        @closed="onClosed"
      />
    </FormDialog>

    <!-- 同步其他 -->
    <FormDialog v-model="syncVisible" title="同步数据" width="30%" @confirm="handlerSubmiSync" @cancel="onSyncClosed">
      <Sync ref="syncRef" :template-id="templateData?.id" @callback="listDiscoveriesData" @closed="onSyncClosed" />
    </FormDialog>
  </PageContainer>
</template>

<script setup lang="ts">
// ==================== 导入模块 ====================
import { discovery } from "@/api/discovery/types/discovery"
import { usePagination } from "@/common/composables/usePagination"
import { h, nextTick, ref, watch, onMounted } from "vue"
import { CirclePlus } from "@element-plus/icons-vue"
import { deleteDiscoveryApi, listDiscoveriesByTemplateIdApi } from "@/api/discovery"
import { template } from "@/api/template/types/template"
import { ElMessage, ElMessageBox } from "element-plus"
import { runner } from "@/api/runner/types/runner"
import { listRunnerByIdsApi, listRunnerByWorkflowIdApi } from "@/api/runner"
import { detailTemplateApi } from "@/api/template"
import { FormDialog } from "@@/components/Dialogs"
import DataTable from "@@/components/DataTable/index.vue"
import OperateBtn from "@@/components/OperateBtn/index.vue"
import PageContainer from "@@/components/PageContainer/index.vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import Form from "./form.vue"
import Sync from "./sync.vue"
import { useRoute, useRouter } from "vue-router"

// ==================== 路由和组合式函数 ====================
const route = useRoute()
const router = useRouter()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// ==================== 响应式数据 ====================
// 组件引用
const apiRef = ref<InstanceType<typeof Form>>()
const syncRef = ref<InstanceType<typeof Sync>>()

// 页面状态
const templateData = ref<template>()
const dialogVisible = ref<boolean>(false)
const syncVisible = ref<boolean>(false)
const loading = ref<boolean>(false)

// 数据映射
const runnerMap = ref<Map<number, string>>(new Map())
const fieldMap = new Map<string, string>()

// 表格数据
const discoveriesData = ref<discovery[]>([])

// ==================== 表格配置 ====================
const tableColumns = [
  { prop: "template_id", label: "模版名称", slot: "templateName", align: "center" as const },
  { prop: "field", label: "字段名称", slot: "fieldName", align: "center" as const },
  { prop: "value", label: "字段值", align: "center" as const },
  { prop: "runner_name", label: "执行器名称", slot: "runnerName", align: "center" as const }
]

const operateBtnItems = [
  { code: "edit", name: "修改", type: "primary" },
  { code: "delete", name: "删除", type: "danger" }
]

// ==================== 模版数据处理 ====================
const processRules = (rules: any, fieldMap: Map<string, string>) => {
  let rulesArray: any[] = []

  if (typeof rules === "string") {
    try {
      rulesArray = JSON.parse(rules)
    } catch (error) {
      console.warn("解析 rules JSON 失败:", error)
      return
    }
  } else if (Array.isArray(rules)) {
    rulesArray = rules
  } else {
    console.warn("rules 不是有效的数组或字符串格式:", rules)
    return
  }

  rulesArray.forEach((item: any) => {
    if (item.type !== "fcRow" && item.type !== "col" && item.field) {
      fieldMap.set(item.field, item.title)
    }

    if (item.children && Array.isArray(item.children)) {
      processRules(item.children, fieldMap)
    }
  })
}

const setForm = (row: template) => {
  templateData.value = row
  processRules(row.rules, fieldMap)
  listDiscoveriesData()
}

// ==================== 执行器管理 ====================
const listRunnerByWorkflowId = async (): Promise<boolean> => {
  if (!templateData.value?.workflow_id) {
    return false
  }

  try {
    const { data } = await listRunnerByWorkflowIdApi(templateData.value.workflow_id)

    const updatedMap = new Map(runnerMap.value)

    if (data.runners && Array.isArray(data.runners)) {
      data.runners.forEach((item: runner) => {
        if (!updatedMap.has(item.id)) {
          updatedMap.set(item.id, item.name)
        }
      })
    }

    runnerMap.value = updatedMap
    return true
  } catch (error) {
    return false
  }
}

const supplementRunnerNames = async () => {
  const missingRunnerIds = discoveriesData.value
    .filter((item) => !runnerMap.value.has(item.runner_id))
    .map((item) => item.runner_id)
    .filter((id, index, arr) => arr.indexOf(id) === index)

  if (missingRunnerIds.length === 0) return

  try {
    const { data } = await listRunnerByIdsApi(missingRunnerIds)
    const newMap = new Map(runnerMap.value)
    data.runners.forEach((runner: runner) => {
      newMap.set(runner.id, runner.name)
    })
    runnerMap.value = newMap
  } catch (error) {
    // 静默处理错误
  }
}

const checkRunners = async (): Promise<boolean> => {
  try {
    if (!templateData.value?.workflow_id) {
      return false
    }

    const success = await listRunnerByWorkflowId()
    if (!success) {
      return false
    }

    return runnerMap.value.size > 0
  } catch (error) {
    return false
  }
}

// ==================== 数据查询 ====================
const listDiscoveriesData = async () => {
  if (!templateData.value) return

  loading.value = true
  try {
    const { data } = await listDiscoveriesByTemplateIdApi({
      template_id: templateData.value.id,
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    paginationData.total = data.total
    discoveriesData.value = data.discoveries
    await supplementRunnerNames()
  } catch (error) {
    discoveriesData.value = []
  } finally {
    loading.value = false
  }
}

// ==================== 事件处理 ====================
const handleBack = () => {
  router.go(-1)
}

const handlerCreate = async () => {
  if (!(await checkRunners())) {
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerUpdate = async (row: discovery) => {
  if (!(await checkRunners())) {
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.setForm(row)
  })
}

const handlerDelete = (row: discovery) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除 ID: "),
      h("i", { style: "color: red" }, `${row.id}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await deleteDiscoveryApi(row.id)
      ElMessage.success("删除成功")
      listDiscoveriesData()
    } catch (error) {
      // 错误由后端处理
    }
  })
}

const handlerSync = () => {
  syncVisible.value = true
}

const handlerSubmitDiscovery = () => {
  apiRef.value?.submitForm()
}

const handlerSubmiSync = () => {
  syncRef.value?.syncSubmit()
}

const operateEvent = (action: string, row: discovery) => {
  switch (action) {
    case "edit":
      handlerUpdate(row)
      break
    case "delete":
      handlerDelete(row)
      break
  }
}

// ==================== 对话框事件 ====================
const onClosed = () => {
  dialogVisible.value = false
}

const onSyncClosed = () => {
  syncVisible.value = false
}

// ==================== 页面初始化 ====================
const templateId = route.query.id as string

const fetchTemplateDetail = async (id: string) => {
  try {
    const res = await detailTemplateApi(parseInt(id))
    setForm(res.data)
  } catch (error) {
    console.error("获取模版详情失败:", error)
    ElMessage.error("获取模版详情失败")
    router.go(-1)
  }
}

onMounted(() => {
  if (templateId) {
    fetchTemplateDetail(templateId)
  } else {
    ElMessage.warning("未选择模版")
    router.go(-1)
  }
})

// ==================== 监听器 ====================
watch([() => paginationData.currentPage, () => paginationData.pageSize], listDiscoveriesData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>
