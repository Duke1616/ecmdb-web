<template>
  <el-card shadow="never">
    <div class="toolbar-wrapper">
      <div>
        <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
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
        <el-table-column prop="id" label="ID" align="center" />
        <el-table-column prop="field" label="字段名称" align="center">
          <template #default="{ row }">
            {{ fieldMap.get(row.field) || "未知执行器" }}
          </template>
        </el-table-column>
        <el-table-column prop="value" label="字段值" align="center" />
        <el-table-column prop="runner_name" label="执行器名称" align="center">
          <template #default="{ row }">
            {{ runnerMap.get(row.runner_id) || "未知执行器" }}
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
  <el-dialog v-model="dialogVisible" :before-close="onClosed" width="30%">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="field" label="请选择字段">
        <el-select v-model="formData.field" placeholder="请选择模版字段">
          <el-option v-for="[field, title] in Array.from(fieldMap)" :key="field" :label="title" :value="field" />
        </el-select>
      </el-form-item>
      <el-form-item prop="value" label="输入匹配值">
        <el-input v-model="formData.value" placeholder="请输入匹配值" />
      </el-form-item>
      <el-form-item prop="runner_id" label="执行器名称">
        <el-select v-model="formData.runner_id" placeholder="请选择执行器">
          <el-option v-for="[id, name] in Array.from(runnerMap)" :key="id" :label="name" :value="id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClosed">取消</el-button>
      <el-button type="primary" @click="handlerSubmitDiscovery">确认</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { createOrUpdateDiscoveryReq, discovery } from "@/api/discovery/types/discovery"
import { usePagination } from "@/hooks/usePagination"
import { h, nextTick, ref, watch } from "vue"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import {
  createDiscoveryApi,
  deleteDiscoveryApi,
  listDiscoveriesByTemplateIdApi,
  updateDiscoveryApi
} from "@/api/discovery"
import { template } from "@/api/template/types/template"
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { runner } from "@/api/runner/types/runner"
import { listRunnerByIdsApi, listRunnerByWorkflowIdApi } from "@/api/runner"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 模版数据
const templateData = ref<template>()
const dialogVisible = ref<boolean>(false)

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

const DEFAULT_FORM_DATA: createOrUpdateDiscoveryReq = {
  template_id: templateData.value?.id || 0,
  runner_id: 0,
  field: "",
  value: ""
}

const formData = ref<createOrUpdateDiscoveryReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  runner_id: [{ required: true, message: "必须输入执行器", trigger: "blur" }],
  field: [{ required: true, message: "必须输入字段名称", trigger: "blur" }],
  value: [{ required: true, message: "必须输入匹配值", trigger: "blur" }]
}

const handlerCreate = () => {
  dialogVisible.value = true

  //查询关联的 Runner 列表
  nextTick(() => {
    listRunnerByWorkflowId()
  })
}

const runnerMap = ref<Map<number, string>>(new Map())
const listRunnerByWorkflowId = () => {
  if (!templateData.value) return
  runnerMap.value.clear()
  listRunnerByWorkflowIdApi(templateData.value.workflow_id)
    .then(({ data }) => {
      const newMap = new Map<number, string>()
      data.runners.forEach((item: runner) => {
        newMap.set(item.id, item.name)
      })
      runnerMap.value = newMap
    })
    .catch(() => {})
}

const handlerSubmitDiscovery = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    // 补充 TemplateId 信息
    formData.value.template_id = templateData.value?.id || 0
    const api = formData.value.id === undefined ? createDiscoveryApi : updateDiscoveryApi
    api(formData.value)
      .then(() => {
        onClosed()

        console.log("保存成功")
        ElMessage.success("保存成功")

        // 重新获取数据
        listDiscoveriesData()
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const onClosed = () => {
  dialogVisible.value = false

  // 重置表单
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()
}

const fieldMap = new Map<string, string>()
const setForm = (row: template) => {
  templateData.value = row

  // 处理模版规则
  processRules(row.rules, fieldMap)

  // 空值清空，不展示
  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })

  // 获取模版自动发现数据
  listDiscoveriesData()
}

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

const handlerUpdate = (row: discovery) => {
  formData.value = cloneDeep(row)
  dialogVisible.value = true

  //查询关联的 Runner 列表
  nextTick(() => {
    listRunnerByWorkflowId()
  })
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

defineExpose({
  setForm
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
