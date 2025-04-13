<template>
  <el-card shadow="never">
    <div class="toolbar-wrapper">
      <div>
        <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        <el-button type="primary" :icon="CirclePlus" @click="handlerSync">同步</el-button>
      </div>
      <div>
        <el-tooltip content="刷新当前页">
          <el-button type="primary" :icon="RefreshRight" circle @click="listDiscoveriesData" />
        </el-tooltip>
      </div>
    </div>
    <div class="table-wrapper">
      <el-table :data="discoveriesData">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="template_id" label="模版名称" align="center">
          <template #default>
            {{ templateData?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="field" label="字段名称" align="center">
          <template #default="{ row }">
            {{ fieldMap.get(row.field) }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="字段值" align="center" />
        <el-table-column prop="runner_name" label="执行器名称" align="center">
          <template #default="{ row }">
            {{ runnerMap.get(row.runner_id) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="200" align="center">
          <template #default="scope">
            <el-button type="primary" plain text bg size="small" @click="handlerUpdate(scope.row)">修改</el-button>
            <el-button type="danger" plain text bg size="small" @click="handlerDelete(scope.row)">删除</el-button>
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

  <!-- 自动发现 -->
  <el-dialog v-model="dialogVisible" title="自动发现" :before-close="onClosed" width="30%">
    <createEditForm
      ref="apiRef"
      :fields-map="fieldMap"
      :template-id="templateData?.id"
      :runner-map="runnerMap"
      @callback="listDiscoveriesData"
      @closed="onClosed"
    />
    <template #footer>
      <el-button @click="onClosed">取消</el-button>
      <el-button type="primary" @click="handlerSubmitDiscovery">确认</el-button>
    </template>
  </el-dialog>

  <!-- 同步其他 -->
  <el-dialog v-model="syncVisible" title="同步数据" :before-close="onSyncClosed" width="30%">
    <sync ref="syncRef" :template-id="templateData?.id" @callback="listDiscoveriesData" @closed="onSyncClosed" />
    <template #footer>
      <el-button @click="onSyncClosed">取消</el-button>
      <el-button type="primary" @click="handlerSubmiSync">全部同步</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { discovery } from "@/api/discovery/types/discovery"
import { usePagination } from "@/hooks/usePagination"
import { h, nextTick, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { deleteDiscoveryApi, listDiscoveriesByTemplateIdApi } from "@/api/discovery"
import { template } from "@/api/template/types/template"
import { ElMessage, ElMessageBox } from "element-plus"
import { runner } from "@/api/runner/types/runner"
import { listRunnerByIdsApi, listRunnerByWorkflowIdApi } from "@/api/runner"
import createEditForm from "./createEditForm.vue"
import sync from "./sync.vue"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const apiRef = ref<InstanceType<typeof createEditForm>>()
const syncRef = ref<InstanceType<typeof sync>>()
// 模版数据
const templateData = ref<template>()
const dialogVisible = ref<boolean>(false)
const syncVisible = ref<boolean>(false)

/** 查询模版列表 */
const discoveriesData = ref<discovery[]>([])
const listDiscoveriesData = () => {
  if (!templateData.value) return
  listDiscoveriesByTemplateIdApi({
    template_id: templateData.value.id,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(async ({ data }) => {
      paginationData.total = data.total
      discoveriesData.value = data.discoveries

      // 查看 Runner 是否存在 Map 中
      await supplementRunnerNames()
    })
    .catch(() => {
      discoveriesData.value = []
    })
    .finally(() => {})
}

// 补充缺失的 runner 名称
const supplementRunnerNames = async () => {
  // 收集所有不存在的 runner_id
  const missingRunnerIds = discoveriesData.value
    .filter((item) => !runnerMap.value.has(item.runner_id))
    .map((item) => item.runner_id)
    .filter((id, index, arr) => arr.indexOf(id) === index) // 去重

  if (missingRunnerIds.length === 0) return

  // 批量获取缺失的 runner 信息
  const { data } = await listRunnerByIdsApi(missingRunnerIds)

  // 更新 runnerMap
  const newMap = new Map(runnerMap.value)
  data.runners.forEach((runner: runner) => {
    newMap.set(runner.id, runner.name)
  })
  runnerMap.value = newMap
}

const onClosed = () => {
  dialogVisible.value = false
}

const handlerSubmitDiscovery = () => {
  apiRef.value?.submitForm()
}

const checkRunners = async (): Promise<boolean> => {
  try {
    await listRunnerByWorkflowId()
    // 确保异步操作完成后再检查大小
    return runnerMap.value.size > 0
  } catch (error) {
    return false
  }
}

const handlerCreate = async () => {
  if (!(await checkRunners())) {
    ElMessage.warning("请先添加执行器")
    return
  }

  dialogVisible.value = true
  nextTick(() => {
    apiRef.value?.resetForm()
  })
}

const handlerUpdate = async (row: discovery) => {
  if (runnerMap.value.size === 0) {
    ElMessage.warning("请先添加执行器")
    return
  }

  dialogVisible.value = true

  nextTick(() => {
    apiRef.value?.setForm(row)
  })
}

const handlerSync = () => {
  syncVisible.value = true
}
const handlerSubmiSync = () => {
  syncRef.value?.syncSubmit()
}

const onSyncClosed = () => {
  syncVisible.value = false
}

const handlerDelete = (row: discovery) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.id}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteDiscoveryApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listDiscoveriesData()
    })
  })
}

// 字段前端展示 id -> name
const runnerMap = ref<Map<number, string>>(new Map())
const listRunnerByWorkflowId = async () => {
  if (!templateData.value) return
  await listRunnerByWorkflowIdApi(templateData.value.workflow_id)
    .then(({ data }) => {
      // 创建现有 map 的副本
      const updatedMap = new Map(runnerMap.value)

      // 只添加新获取的 runner 中不存在的条目
      data.runners.forEach((item: runner) => {
        if (!updatedMap.has(item.id)) {
          updatedMap.set(item.id, item.name)
        }
      })

      runnerMap.value = updatedMap
    })
    .catch(() => {})
}

// 字段前端展示 field -> title
const fieldMap = new Map<string, string>()
const processRules = (rules: any[], fieldMap: Map<string, string>) => {
  rules.forEach((item: any) => {
    // 仅当不是 fcRow/col 且 field 存在时，才存入 map
    if (item.type !== "fcRow" && item.type !== "col" && item.field) {
      fieldMap.set(item.field, item.title)
    }

    // 无论当前项是否被跳过，都要递归处理其 children
    if (item.children && Array.isArray(item.children)) {
      processRules(item.children, fieldMap)
    }
  })
}

const setForm = (row: template) => {
  templateData.value = row

  // 处理模版规则
  processRules(row.rules, fieldMap)

  // 获取模版自动发现数据
  listDiscoveriesData()
}

const resetMap = () => {
  runnerMap.value = new Map()
  fieldMap.clear()
}

defineExpose({
  setForm,
  resetMap
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listDiscoveriesData, { immediate: true })
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
