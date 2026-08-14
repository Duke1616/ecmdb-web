<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status == '2'"
    class="property-form"
  >
    <!-- 1. 基本信息 -->
    <FormSection title="基本信息" tooltip="设置节点的显示名称以区分流程环节" theme-color="slate">
      <template #icon
        ><el-icon><Document /></el-icon
      ></template>
      <el-form-item label="节点名称" prop="name" class="form-item">
        <el-input v-model="propertyForm.name" placeholder="请输入节点名称" class="modern-input" />
      </el-form-item>
    </FormSection>

    <!-- 2. 审批配置（工作台模式） -->
    <FormSection title="审批配置" tooltip="定义谁参与并有权限处理该环节的流程申请" theme-color="blue">
      <template #icon
        ><el-icon><UserFilled /></el-icon
      ></template>
      <ReceiverStrategyEditor
        :items="strategyPreviews"
        :summary="propertyForm.assignees.length ? `已配置 ${propertyForm.assignees.length} 条策略` : ''"
        placeholder="尚未配置审批策略"
        :disabled="flowDetail.status == '2'"
        @edit="openSelector"
        @remove="removeAssignee"
      />
    </FormSection>

    <!-- 3. 流程设置 -->
    <FormSection title="流程设置" tooltip="配置审批通过的逻辑（如会签）及抄送规则" theme-color="orange">
      <template #icon
        ><el-icon><Timer /></el-icon
      ></template>
      <div class="switch-cards">
        <div class="switch-card" v-for="opt in flowSettings" :key="opt.key">
          <div class="switch-card-label">
            <span>{{ opt.label }}</span>
            <el-tooltip :content="opt.tip" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch
            v-model="propertyForm[opt.key]"
            inline-prompt
            active-text="是"
            inactive-text="否"
            :disabled="flowDetail.status == '2'"
            :style="opt.style"
          />
        </div>
      </div>
    </FormSection>

    <!-- 4. 表单配置 -->
    <FormSection title="表单配置" tooltip="设置审批人在该环节需要处理或查看的业务字段" theme-color="green">
      <template #icon
        ><el-icon><Collection /></el-icon
      ></template>
      <FormList v-model="propertyForm.fields" :disabled="flowDetail.status == '2'" />
    </FormSection>
  </el-form>

  <!-- 接收者选择器主体 -->
  <ReceiverSelector
    v-model:visible="masterSelectorVisible"
    title="配置审批策略"
    result-panel-title="已选策略"
    :initial-assignees="propertyForm.assignees"
    :initial-tab="selectedTab"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="displayNames"
    :workflow-id="props.id"
    @confirm="handleConfirm"
    @update-user-names="updateDisplayNames"
  />
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue"
import { FormInstance, FormRules } from "element-plus"
import { UserFilled, QuestionFilled, Document, Timer, Collection } from "@element-plus/icons-vue"

// 组件与 Composable
import { FormSection } from "../../PropertySetting"
import FormList from "./FormList.vue"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import ReceiverStrategyEditor from "@/common/components/ReceiverStrategyEditor/index.vue"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { receiverSelectorRegistry } from "@/common/components/ReceiverSelector/strategies"
import type { Assignee } from "@/common/components/ReceiverSelector/composables/useAssignees"

// ── 常量配置 ────────────────────────────────────────────────────────────
const RULE_MAP: Record<string, { label: string; tab: string }> = {
  appoint: { label: "人员", tab: "user" },
  founder: { label: "创建人", tab: "system" },
  template: { label: "模板", tab: "template" },
  leaders: { label: "负责人", tab: "system" },
  main_leader: { label: "分管", tab: "system" },
  on_call: { label: "值班", tab: "on_call" },
  team: { label: "团队", tab: "team" },
  department: { label: "部门", tab: "department" }
}

const flowSettings = [
  {
    key: "is_cosigned",
    label: "是否会签",
    tip: "开启后需要所有参与者都同意才能通过",
    style: "--el-switch-on-color: #3b82f6"
  },
  { key: "is_cc", label: "仅抄送", tip: "开启后该节点仅用于通知，无需审批", style: "--el-switch-on-color: #10b981" }
] as const

// ── 类型定义 ────────────────────────────────────────────────────────────
interface UserPropertyForm {
  name: string
  assignees: Assignee[]
  is_cosigned: boolean
  is_cc: boolean
  fields: any[]
}

// ── 响应式状态 ──────────────────────────────────────────────────────────
const props = defineProps<{
  nodeData: any
  lf: any
  id?: number
  flowDetail: any
}>()

const emits = defineEmits(["closed"])
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

const formRef = ref<FormInstance | null>(null)
const masterSelectorVisible = ref(false)
const selectedTab = ref("")
const displayNames = reactive<Record<string, string>>({})

const propertyForm = reactive<UserPropertyForm>({
  name: "",
  assignees: [],
  is_cosigned: false,
  is_cc: false,
  fields: []
})

const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    { max: 50, message: "最大50字符" }
  ]
}

// ── 数据标准化逻辑 (Normalize) ──────────────────────────────────────────
const normalizeAssignees = (p: any): Assignee[] => {
  if (p.assignees?.length > 0) return JSON.parse(JSON.stringify(p.assignees))

  const rule = p.rule || "appoint"

  // 根据不同规则转换为统一的 Assignee 结构
  const strategyMap: Record<string, () => Assignee[]> = {
    template: () => [{ rule: "template", values: [String(p.template_id || 0), p.template_field || ""] }],
    founder: () => [{ rule: "founder", values: [] }],
    default: () => [{ rule, values: Array.isArray(p.approved) ? p.approved : [] }]
  }
  return (strategyMap[rule] || strategyMap.default)()
}

// ── 初始化 ─────────────────────────────────────────────────────────────
const init = async () => {
  const p = props.nodeData?.properties || {}

  Object.assign(propertyForm, {
    name: p.name || "",
    is_cosigned: !!p.is_cosigned,
    is_cc: !!p.is_cc,
    fields: p.fields || p.form || [],
    assignees: normalizeAssignees(p)
  })

  if (propertyForm.assignees.length > 0) {
    await resolveDisplayNames(propertyForm.assignees)
  }

  // NOTE: 只有当确实存在 'template' 类型的策略时才提前加载，否则等选择器打开时再加载
  const hasTemplateRule = propertyForm.assignees.some((a) => a.rule === "template")
  if (props.id !== undefined && hasTemplateRule) {
    await fetchTemplates(props.id)
  }
}

onMounted(init)

// ── 交互方法 ───────────────────────────────────────────────────────────
const openSelector = (ruleType?: string) => {
  selectedTab.value = ruleType ? RULE_MAP[ruleType]?.tab : ""
  masterSelectorVisible.value = true
}

const handleConfirm = (finalAssignees: Assignee[]) => {
  propertyForm.assignees = finalAssignees
  resolveDisplayNames(finalAssignees)
}

const updateDisplayNames = (map: Record<string, string>) => Object.assign(displayNames, map)

const resolveDisplayNames = async (assignees: Assignee[]) => {
  for (const a of assignees) {
    const strategy = receiverSelectorRegistry.getStrategy(a.rule)
    if (strategy?.resolveNames && a.values?.length) {
      const names = await strategy.resolveNames(a.values)
      updateDisplayNames(names)
    }
  }
}

const strategyPreviews = computed(() =>
  propertyForm.assignees.map((assignee, index) => ({
    key: `${assignee.rule}:${index}`,
    rule: assignee.rule,
    label: getRuleLabel(assignee.rule),
    text: getPreviewText(assignee)
  }))
)

const removeAssignee = (key: string) => {
  const index = strategyPreviews.value.findIndex((item) => item.key === key)
  if (index >= 0) propertyForm.assignees.splice(index, 1)
}

const getRuleLabel = (rule: string) => RULE_MAP[rule]?.label || rule
const getPreviewText = (a: Assignee) => {
  if (a.rule === "template") {
    const tName = templateRules.value.find((t) => t.id.toString() === a.values[0])?.name || "模板"
    return `${tName} : ${a.values[1]}`
  }
  if (["founder", "leaders", "main_leader"].includes(a.rule)) return "系统动态计算"
  return a.values.map((v) => displayNames[v] || v).join(", ")
}

// ── 节点属性持久化 ──────────────────────────────────────────────────────
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      props.lf?.setProperties(props.nodeData?.id, { ...propertyForm })
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

defineExpose({ confirmFunc })
</script>

<style scoped lang="scss">
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

.modern-input {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #fff !important;
    border-radius: 6px;
    border: 1px solid #cbd5e1 !important;
    box-shadow: none !important;
    padding: 2px 10px;
  }
}

.switch-cards {
  display: flex;
  gap: 12px;
  .switch-card {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    .switch-card-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
    }
  }
}

.help-icon {
  color: #94a3b8;
  cursor: help;
}

.scroll-slim {
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
}
</style>
