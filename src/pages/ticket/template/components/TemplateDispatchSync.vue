<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" class="sync-form">
    <div class="sync-layout">
      <aside class="group-pane">
        <div class="group-header">
          <h2 class="group-title">模板分组</h2>
          <span class="total-count">{{ totalTemplateCount }} 个模板</span>
        </div>
        <el-scrollbar class="group-list">
          <div class="group-nav" v-loading="groupLoading">
            <button
              v-for="item in templateGroups"
              :key="item.id"
              class="group-item"
              :class="{ active: formData.template_group_id === item.id }"
              type="button"
              @click="selectTemplateGroup(item.id)"
            >
              <span class="group-icon">
                <AppIcon :name="item.icon || 'Folder'" class="group-custom-icon" />
              </span>
              <span class="group-info">
                <span class="group-name">{{ item.name }}</span>
                <span class="group-total">{{ item.total }} 个模板</span>
              </span>
            </button>
            <el-empty v-if="templateGroups.length === 0 && !groupLoading" description="暂无模板分组" :image-size="88" />
          </div>
        </el-scrollbar>
      </aside>

      <section class="template-pane">
        <div class="template-toolbar">
          <div>
            <h3>选择同步来源</h3>
            <p>{{ selectedGroupName }}</p>
          </div>
          <span class="template-count">{{ paginationData.total }} 个模板</span>
        </div>
        <el-form-item prop="sync_template_id" class="template-field">
          <DataTable
            :data="currentTemplates"
            :columns="templateColumns"
            :loading="templateLoading"
            :show-pagination="true"
            :total="paginationData.total"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            :page-sizes="paginationData.pageSizes"
            :pagination-layout="paginationData.layout"
            :table-props="templateTableProps"
            class="template-table"
            @size-change="onTemplateSizeChange"
            @current-change="onTemplateCurrentChange"
          >
            <template #name="{ row }">
              <div class="template-name-cell">
                <span>{{ row.name }}</span>
                <el-tag v-if="formData.sync_template_id === row.id" type="primary" effect="plain">已选择</el-tag>
              </div>
            </template>
            <template #desc="{ row }">
              <span class="template-desc-cell">{{ row.desc || "暂无描述" }}</span>
            </template>
            <template #select="{ row }">
              <el-button
                :type="formData.sync_template_id === row.id ? 'primary' : 'default'"
                size="small"
                class="select-template-btn"
                @click.stop="syncTemplate(row.id)"
              >
                选择
              </el-button>
            </template>
            <template #empty>
              <el-empty
                :description="formData.template_group_id ? '该模板分组暂无模板' : '请先选择模板分组'"
                :image-size="88"
              />
            </template>
          </DataTable>
        </el-form-item>
      </section>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { syncDispatchApi } from "@/api/ticket/dispatch"
import type { syncDispatchReq } from "@/api/ticket/dispatch/types/dispatch"
import { listTemplateApi, listTemplateGroupSummaryApi } from "@/api/ticket/template"
import type { template, templateGroupSummary } from "@/api/ticket/template/types/template"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { usePagination } from "@/common/composables/usePagination"
import DataTable from "@@/components/DataTable/index.vue"
import type { Column } from "@@/components/DataTable/types"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { computed, onMounted, ref, watch } from "vue"

const emits = defineEmits(["closed", "callback"])

// 接收父组件传递
interface Props {
  templateId: number | undefined
}

const props = defineProps<Props>()

const DEFAULT_FORM_DATA: syncDispatchReq = {
  template_id: undefined,
  sync_template_id: undefined,
  template_group_id: undefined
}

const formData = ref<syncDispatchReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination({
  pageSize: 10,
  pageSizes: [10, 20, 50],
  layout: "total, sizes, prev, pager, next"
})
const templateLoading = ref(false)
const groupLoading = ref(false)
const formRules: FormRules = {
  template_group_id: [{ required: true, message: "请选择模板分组", trigger: "change" }],
  sync_template_id: [{ required: true, message: "请选择模板", trigger: "change" }]
}

const templateColumns: Column[] = [
  { prop: "name", label: "模板名称", slot: "name", minWidth: 180, align: "center", showOverflowTooltip: true },
  { prop: "desc", label: "描述", slot: "desc", minWidth: 220, align: "center", showOverflowTooltip: true },
  { prop: "select", label: "操作", slot: "select", width: 96, align: "center" }
]

const templateGroups = ref<templateGroupSummary[]>([])
const totalTemplateCount = computed(() => templateGroups.value.reduce((total, item) => total + (item.total || 0), 0))
const selectedGroupName = computed(() => {
  const group = templateGroups.value.find((item) => item.id === formData.value.template_group_id)
  return group?.name || "请先选择模板分组"
})
const templateTableProps = computed(() => ({
  highlightCurrentRow: true,
  rowClassName: getTemplateRowClassName,
  onRowClick: (row: template) => selectTemplate(row.id)
}))

const listTemplateGroups = async () => {
  groupLoading.value = true
  try {
    const { data } = await listTemplateGroupSummaryApi()
    templateGroups.value = data.template_groups || []
    if (!formData.value.template_group_id && templateGroups.value.length > 0) {
      formData.value.template_group_id = templateGroups.value[0].id
    }
  } catch {
    templateGroups.value = []
  } finally {
    groupLoading.value = false
  }
}

const selectTemplateGroup = (groupId: number) => {
  formData.value.template_group_id = groupId
  formRef.value?.clearValidate("template_group_id")
}

const selectTemplate = (templateId: number) => {
  formData.value.sync_template_id = templateId
  formRef.value?.clearValidate("sync_template_id")
}

const syncTemplate = async (templateId: number) => {
  selectTemplate(templateId)
  await syncSubmit()
}

const getTemplateRowClassName = ({ row }: { row: template }) =>
  row.id === formData.value.sync_template_id ? "is-selected-template-row" : ""

const syncSubmit = async () => {
  try {
    await formRef.value?.validate()
    if (!props.templateId) return
    formData.value.template_id = props.templateId

    await syncDispatchApi(formData.value)

    ElMessage.success("同步成功")
    onClosed()
    emits("callback")
  } catch (error) {
    // 表单验证错误已由Element Plus处理
    if (!(error instanceof Error)) {
      console.error("操作失败:", error)
    }
  }
}

const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  currentTemplates.value = []
  paginationData.currentPage = 1
  paginationData.total = 0
  formRef.value?.resetFields()

  emits("closed")
}

// 当前模板选项
const currentTemplates = ref<template[]>([])

const listTemplates = async () => {
  if (!formData.value.template_group_id) {
    currentTemplates.value = []
    paginationData.total = 0
    return
  }

  templateLoading.value = true
  try {
    const { data } = await listTemplateApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize,
      group_id: formData.value.template_group_id
    })
    currentTemplates.value = data.templates || []
    paginationData.total = data.total || 0
  } finally {
    templateLoading.value = false
  }
}

const onTemplateCurrentChange = (page: number) => {
  handleCurrentChange(page)
  listTemplates()
}

const onTemplateSizeChange = (size: number) => {
  handleSizeChange(size)
  paginationData.currentPage = 1
  listTemplates()
}

// 监听模板组变化，更新模板列表
watch(
  () => formData.value.template_group_id,
  async (newGroupId: number | undefined) => {
    if (!newGroupId) {
      currentTemplates.value = []
      formData.value.sync_template_id = undefined
      return
    }

    paginationData.currentPage = 1
    formData.value.sync_template_id = undefined
    await listTemplates()
  }
)

onMounted(() => {
  listTemplateGroups()
})

defineExpose({
  syncSubmit
})
</script>

<style lang="scss" scoped>
.sync-form {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.sync-layout {
  display: flex;
  height: 100%;
  min-height: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.group-pane,
.template-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.group-pane {
  width: clamp(216px, 23vw, 248px);
  flex: 0 0 clamp(216px, 23vw, 248px);
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.template-pane {
  flex: 1;
  min-width: 0;
}

.group-header,
.template-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 49px;
  min-height: 49px;
  padding: 0 16px;
  box-sizing: border-box;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.group-title,
.template-toolbar h3 {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
}

.template-toolbar p {
  margin: 3px 0 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.total-count,
.template-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 22px;
  padding: 0 9px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.group-list {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.group-nav {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  box-sizing: border-box;
}

.group-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 58px;
  gap: 10px;
  padding: 9px 12px;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  transition: all 0.2s ease;

  &::before {
    position: absolute;
    left: -1px;
    width: 4px;
    height: 30px;
    content: "";
    background: transparent;
    border-radius: 0 999px 999px 0;
    transition: background 0.2s ease;
  }

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
  }

  &.active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: none;

    &::before {
      background: #0ea5e9;
    }

    .group-icon {
      color: #1d4ed8;
      background: #dbeafe;
    }

    .group-name {
      color: #0f172a;
      font-weight: 700;
    }

    .group-total {
      color: #0369a1;
    }
  }
}

.group-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 9px;
  transition: all 0.2s ease;
}

.group-custom-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
}

.group-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 3px;
}

.group-name {
  max-width: 100%;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-total {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.template-field {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  margin: 0;
}

.template-field :deep(.el-form-item__content) {
  width: 100%;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  line-height: normal;
}

.template-field :deep(.manager-content) {
  width: 100%;
  flex: 1;
  display: flex;
  min-height: 0;
  padding: 0;
}

.template-field :deep(.content-card) {
  width: 100%;
  flex: 1;
  min-height: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.template-field :deep(.data-table-container) {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}

.template-field :deep(.table-wrapper) {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.template-field :deep(.data-table) {
  width: 100%;
  flex: 1;
  cursor: pointer;
}

.template-field :deep(.data-table.el-table) {
  width: 100% !important;
}

.template-field :deep(.el-table__inner-wrapper),
.template-field :deep(.el-table__header-wrapper),
.template-field :deep(.el-table__body-wrapper),
.template-field :deep(.el-table__header),
.template-field :deep(.el-table__body) {
  width: 100% !important;
}

.template-field :deep(.data-table .el-table__body-wrapper) {
  flex: 1;
  overflow-y: auto;
}

.template-field :deep(.data-table .el-table__header th) {
  height: 44px;
}

.template-field :deep(.data-table .el-table__header th .cell) {
  min-height: 44px;
  padding: 10px 14px;
}

.template-field :deep(.data-table .el-table__body td) {
  height: 52px;
}

.template-field :deep(.data-table .el-table__body td .cell) {
  justify-content: center;
  min-height: 52px;
  padding: 10px 14px;
}

.template-field :deep(.data-table-cell-content.is-center) {
  justify-content: center;
  text-align: center;
}

.template-field :deep(.pagination-container) {
  margin-top: 0;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.template-field :deep(.is-selected-template-row) {
  --el-table-tr-bg-color: #eff6ff;
}

.template-field :deep(.is-selected-template-row td) {
  background-color: #eff6ff !important;
}

.template-name-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  text-align: center;

  span {
    overflow: hidden;
    color: #0f172a;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.template-desc-cell {
  display: block;
  width: 100%;
  color: #64748b;
  line-height: 1.4;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-template-btn {
  min-width: 56px;
  padding: 0 12px;
}

@media (max-width: 760px) {
  .sync-layout {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: none;
    overflow-y: auto;
  }

  .group-pane {
    width: 100%;
    flex: 0 0 210px;
    border-right: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .template-pane {
    flex: 0 0 auto;
    min-height: 420px;
  }

  .group-nav {
    flex-direction: row;
    min-height: auto;
    overflow-x: auto;
  }

  .group-item {
    flex: 0 0 176px;
  }
}
</style>
