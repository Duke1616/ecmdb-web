<template>
  <Drawer
    v-model="visible"
    :title="isEdit ? '编辑告警规则' : '新增告警规则'"
    :subtitle="isEdit ? '调整告警规则的检测条件与通知范围' : '配置数据源、表达式和生效空间'"
    :header-icon="Bell"
    size="720px"
    direction="rtl"
    class="alert-rule-drawer"
    confirm-button-text="保存"
    :confirm-loading="saving"
    @confirm="handleSave"
    @cancel="handleCancel"
    @closed="handleClosed"
  >
    <div class="rule-drawer-body" v-loading="loading">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="rule-form">
        <section class="form-section is-first">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>基础信息</span>
            </div>
          </div>
          <div class="form-grid">
            <el-form-item label="规则名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入规则名称"
                size="large"
                class="premium-input"
                clearable
              />
            </el-form-item>
            <el-form-item label="规则组" prop="group_id">
              <el-select
                v-model="formData.group_id"
                placeholder="请选择规则组"
                size="large"
                class="premium-input"
                filterable
              >
                <el-option v-for="group in effectiveRuleGroups" :key="group.id" :label="group.name" :value="group.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="检测频率" prop="eval_interval">
              <el-select
                v-model="formData.eval_interval"
                placeholder="请选择检测频率"
                size="large"
                class="premium-input"
              >
                <el-option
                  v-for="option in EVAL_INTERVAL_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="告警级别" prop="level">
            <div class="level-selector">
              <div
                v-for="option in ALERT_LEVEL_OPTIONS"
                :key="option.value"
                class="level-card"
                :class="[`level-${option.value}`, { 'is-active': formData.level === option.value }]"
                @click="formData.level = option.value"
              >
                <div class="level-priority">{{ option.priority }}</div>
                <div class="level-body">
                  <span class="level-name">{{ option.label.replace(`${option.priority} `, "") }}</span>
                  <span class="level-desc">{{ option.description }}</span>
                </div>
                <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="工作空间" prop="workspace_ids">
            <el-select
              v-model="formData.workspace_ids"
              placeholder="请选择工作空间"
              size="large"
              class="premium-input"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
            >
              <el-option
                v-for="workspace in workspaces"
                :key="workspace.id"
                :label="workspace.name"
                :value="workspace.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="规则描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="2"
              placeholder="请输入规则描述"
              maxlength="500"
              class="premium-textarea"
              show-word-limit
            />
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Connection /></el-icon>
              <span>数据源配置</span>
            </div>
          </div>
          <el-form-item label="数据源类型" prop="datasource_type">
            <div class="mode-selector">
              <div
                v-for="item in datasourceTypeOptions"
                :key="item.value"
                class="mode-card"
                :class="{ 'is-active': formData.datasource_type === item.value }"
                @click="handleDatasourceTypeChange(item.value)"
              >
                <div class="mode-card__icon">
                  <img :src="item.icon" :alt="item.label" class="mode-card__logo" />
                </div>
                <div class="mode-card__body">
                  <span class="mode-card__title">{{ item.label }}</span>
                  <span class="mode-card__desc">{{ item.desc }}</span>
                </div>
                <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="数据源" prop="datasource_ids">
            <el-select
              v-model="formData.datasource_ids"
              placeholder="请选择数据源"
              size="large"
              class="premium-input"
              multiple
              clearable
              filterable
              collapse-tags
              collapse-tags-tooltip
            >
              <el-option
                v-for="datasource in datasources"
                :key="datasource.id"
                :label="datasource.name"
                :value="datasource.id"
              />
            </el-select>
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Document /></el-icon>
              <span>规则配置</span>
            </div>
          </div>
          <el-form-item label="PromQL 查询" prop="prom_ql">
            <el-input
              v-model="formData.prom_ql"
              type="textarea"
              :rows="5"
              placeholder="请输入 PromQL 查询语句"
              class="code-textarea premium-textarea"
            />
          </el-form-item>
          <el-form-item label="外部标签" prop="external_labels">
            <el-input
              v-model="externalLabelsInput"
              type="textarea"
              :rows="2"
              placeholder="格式: key1=value1,key2=value2"
              class="code-textarea premium-textarea"
              @blur="handleExternalLabelsChange"
            />
          </el-form-item>
        </section>

        <section class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Switch /></el-icon>
              <span>状态配置</span>
            </div>
          </div>
          <div class="status-row">
            <div>
              <strong>启用规则</strong>
              <span>关闭后规则将不会触发新的告警</span>
            </div>
            <el-switch v-model="formData.enabled" />
          </div>
        </section>
      </el-form>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Bell, CircleCheckFilled, Connection, Document, Setting, Switch } from "@element-plus/icons-vue"
import type { FormInstance, FormRules } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { createRuleApi, getRuleApi, listRuleGroupsApi, updateRuleApi } from "@/api/alert/rule"
import { listDataSourceByTypeApi } from "@/api/alert/datasource"
import { listWorkspacesApi } from "@/api/alert/workspace"
import {
  ALERT_LEVEL_OPTIONS,
  EVAL_INTERVAL_OPTIONS,
  type CreateRuleReq,
  type Rule,
  type RuleGroup,
  type UpdateRuleReq
} from "@/api/alert/rule/types/rule"
import type { Datasource, DatasourceTypeEnum } from "@/api/alert/datasource/types/datasource"
import type { Workspace } from "@/api/alert/workspace/types"
import { getDatasourceTypeIcon } from "@/pages/alert/utils/datasourceMeta"

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    rule?: Rule | null
    ruleGroups?: RuleGroup[]
    defaultGroupId?: number
  }>(),
  {
    rule: null,
    ruleGroups: () => [],
    defaultGroupId: undefined
  }
)

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  success: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const isEdit = computed(() => Boolean(props.rule?.id))
const formRef = ref<FormInstance>()
const saving = ref(false)
const loading = ref(false)
const internalRuleGroups = ref<RuleGroup[]>([])
const datasources = ref<Datasource[]>([])
const workspaces = ref<Workspace[]>([])
const externalLabelsInput = ref("")

const effectiveRuleGroups = computed(() => (props.ruleGroups.length ? props.ruleGroups : internalRuleGroups.value))

const datasourceTypeOptions = [
  {
    label: "Prometheus",
    value: "PROMETHEUS" as DatasourceTypeEnum,
    icon: getDatasourceTypeIcon("PROMETHEUS"),
    desc: "指标查询与阈值检测"
  },
  {
    label: "VictoriaMetrics",
    value: "VICTORIA_METRICS" as DatasourceTypeEnum,
    icon: getDatasourceTypeIcon("VICTORIA_METRICS"),
    desc: "高性能指标查询"
  },
  {
    label: "Loki",
    value: "LOKI" as DatasourceTypeEnum,
    icon: getDatasourceTypeIcon("LOKI"),
    desc: "日志查询与内容检测"
  }
]

const createEmptyForm = (): CreateRuleReq & { id?: number } => ({
  name: "",
  group_id: props.defaultGroupId || 0,
  level: 1,
  description: "",
  datasource_type: "PROMETHEUS",
  datasource_ids: [],
  workspace_ids: [],
  prom_ql: "",
  eval_interval: 60,
  enabled: true,
  external_labels: {}
})

const formData = reactive<CreateRuleReq & { id?: number }>(createEmptyForm())

const formRules: FormRules = {
  name: [
    { required: true, message: "请输入规则名称", trigger: "blur" },
    { min: 2, max: 50, message: "规则名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  group_id: [{ required: true, message: "请选择规则组", trigger: "change" }],
  level: [{ required: true, message: "请选择告警级别", trigger: "change" }],
  workspace_ids: [{ required: true, message: "请选择工作空间", trigger: "change" }],
  datasource_type: [{ required: true, message: "请选择数据源类型", trigger: "change" }],
  datasource_ids: [{ required: true, message: "请选择数据源", trigger: "change" }],
  prom_ql: [{ required: true, message: "请输入 PromQL 查询语句", trigger: "blur" }],
  eval_interval: [{ required: true, message: "请选择检测频率", trigger: "change" }]
}

const resetForm = () => {
  Object.assign(formData, createEmptyForm())
  externalLabelsInput.value = ""
  formRef.value?.clearValidate()
}

const fillForm = (rule: Rule) => {
  Object.assign(formData, {
    id: rule.id,
    name: rule.name,
    group_id: rule.group_id,
    level: rule.level,
    description: rule.description || "",
    datasource_type: rule.datasource_type,
    datasource_ids: rule.datasource_ids || [],
    workspace_ids: rule.workspace_ids || [],
    prom_ql: rule.prom_ql,
    eval_interval: rule.eval_interval,
    enabled: rule.enabled,
    external_labels: rule.external_labels || {}
  })
  externalLabelsInput.value = Object.entries(formData.external_labels)
    .map(([key, value]) => `${key}=${value}`)
    .join(",")
}

const handleExternalLabelsChange = () => {
  if (!externalLabelsInput.value) {
    formData.external_labels = {}
    return
  }

  const labels: Record<string, string> = {}
  externalLabelsInput.value.split(",").forEach((pair) => {
    const [key, value] = pair.split("=").map((item) => item.trim())
    if (key && value) {
      labels[key] = value
    }
  })
  formData.external_labels = labels
}

const loadRuleGroups = async () => {
  if (props.ruleGroups.length) return
  const { data } = await listRuleGroupsApi({ limit: 1000 })
  internalRuleGroups.value = data.rule_groups
}

const loadWorkspaces = async () => {
  const { data } = await listWorkspacesApi({ offset: 0, limit: 0 })
  workspaces.value = data.workspaces
}

const loadDatasources = async (type: DatasourceTypeEnum) => {
  const { data } = await listDataSourceByTypeApi({ type })
  datasources.value = data
}

const handleDatasourceTypeChange = (type: DatasourceTypeEnum) => {
  if (formData.datasource_type === type) return
  formData.datasource_ids = []
  formData.datasource_type = type
  loadDatasources(type)
}

const loadInitialData = async () => {
  loading.value = true
  try {
    resetForm()
    await Promise.all([
      loadRuleGroups(),
      loadWorkspaces(),
      loadDatasources(formData.datasource_type as DatasourceTypeEnum)
    ])

    if (props.rule?.id) {
      const { data } = await getRuleApi(props.rule.id)
      fillForm(data)
      await loadDatasources(data.datasource_type as DatasourceTypeEnum)
    }
  } catch (error) {
    console.error("加载规则表单数据失败:", error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  handleExternalLabelsChange()

  try {
    await formRef.value.validate()
    saving.value = true

    if (isEdit.value) {
      await updateRuleApi(formData as UpdateRuleReq)
      ElMessage.success("规则更新成功")
    } else {
      await createRuleApi(formData)
      ElMessage.success("规则创建成功")
    }

    visible.value = false
    emit("success")
  } catch (error) {
    console.error(isEdit.value ? "规则更新失败:" : "规则创建失败:", error)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClosed = () => {
  resetForm()
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      loadInitialData()
    }
  }
)
</script>

<style lang="scss" scoped>
:deep(.alert-rule-drawer .drawer-content) {
  background: #ffffff;
  box-shadow: none;
}

.rule-drawer-body {
  min-height: 100%;
  padding: 12px 16px;
  background: #fdfdfe;
}

.rule-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;

  .title-left {
    display: flex;
    align-items: center;
  }

  .section-icon {
    margin-right: 6px;
    color: #3b82f6;
    font-size: 16px;
  }

  span {
    color: #374151;
    font-size: 14px;
    font-weight: 600;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  width: 100%;
}

.mode-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 76px;
  padding: 14px 16px;
  background: #fafafa;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: #f0f7ff;
    border-color: #93c5fd;
  }

  &.is-active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

    .mode-card__icon {
      background: #ffffff;
      border-color: #bfdbfe;
    }

    .mode-card__title {
      color: #1d4ed8;
    }

    .mode-card__check {
      color: #3b82f6;
      opacity: 1;
    }
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;

    .mode-card__logo {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  &__title {
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
  }

  &__desc {
    color: #9ca3af;
    font-size: 11px;
    line-height: 1.35;
  }

  &__check {
    flex-shrink: 0;
    font-size: 18px;
    opacity: 0;
  }
}

.level-selector {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.level-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 86px;
  padding: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: #93c5fd;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
  }

  &.is-active {
    background: #eff6ff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);

    .mode-card__check {
      opacity: 1;
    }
  }

  &.level-1,
  &.level-2 {
    .level-priority,
    .mode-card__check {
      color: #dc2626;
    }
  }

  &.level-3,
  &.level-4 {
    .level-priority,
    .mode-card__check {
      color: #d97706;
    }
  }

  &.level-5 {
    .level-priority,
    .mode-card__check {
      color: #2563eb;
    }
  }

  .mode-card__check {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 16px;
    opacity: 0;
  }
}

.level-priority {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 800;
  line-height: 1;
}

.level-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.level-name {
  color: #1f2937;
  font-size: 13px;
  font-weight: 700;
}

.level-desc {
  display: -webkit-box;
  overflow: hidden;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  strong {
    color: #1e293b;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.premium-input :deep(.el-input__wrapper),
.premium-input :deep(.el-select__wrapper) {
  padding: 0 14px;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: #9ca3af;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08) !important;
  }

  &.is-focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
  }
}

.premium-textarea :deep(.el-textarea__inner) {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;

  &:hover {
    border-color: #9ca3af;
  }

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12) !important;
  }
}

.code-textarea :deep(.el-textarea__inner) {
  font-family: "Fira Code", "Cascadia Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

@media (max-width: 720px) {
  .form-grid,
  .mode-selector {
    grid-template-columns: 1fr;
  }

  .level-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
