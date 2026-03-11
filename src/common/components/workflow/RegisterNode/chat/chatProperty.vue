<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status === '2'"
    class="property-form"
  >
    <!-- 1. 顶部模式切换 -->
    <FormSection title="执行模式" tooltip="选择使用现有群组还是根据规则自动创建临时群组" theme-color="slate">
      <template #icon
        ><el-icon><Operation /></el-icon
      ></template>
      <div class="mode-grid">
        <div
          v-for="m in [
            { id: 'existing', label: '现有群通知', desc: '发送至已建群', icon: 'ChatDotRound' },
            { id: 'create', label: '动态建群', desc: '自动创建新群', icon: 'CirclePlus' }
          ]"
          :key="m.id"
          class="mode-card"
          :class="{ active: propertyForm.mode === m.id }"
          @click="selectMode(m.id as 'existing' | 'create')"
        >
          <div class="mode-card-icon">
            <el-icon v-if="m.icon === 'ChatDotRound'"><ChatDotRound /></el-icon>
            <el-icon v-else><CirclePlus /></el-icon>
          </div>
          <div class="mode-card-content">
            <div class="mode-label">{{ m.label }}</div>
            <div class="mode-desc">{{ m.desc }}</div>
          </div>
          <el-icon class="mode-check"><CircleCheckFilled /></el-icon>
        </div>
      </div>
    </FormSection>

    <!-- 2. 基础配置 -->
    <FormSection title="基础配置" tooltip="设置节点的显示名称及通知卡片的标题" theme-color="slate">
      <template #icon
        ><el-icon><Document /></el-icon
      ></template>
      <div class="settings-stack">
        <el-form-item label="节点名称" prop="name" class="form-item">
          <el-input v-model="propertyForm.name" placeholder="请输入节点名称" class="modern-input" />
        </el-form-item>
        <el-form-item prop="title" class="form-item">
          <VariableInput
            v-model="propertyForm.title"
            label="卡片标题规则"
            placeholder="默认：{{creator}}发起的{{template}}执行结果"
            :variables="[
              { key: 'ticket_id', label: '工单ID' },
              { key: 'template', label: '模板名' },
              { key: 'creator', label: '发起人' },
              { key: 'field.xxx', label: '字段' }
            ]"
          />
        </el-form-item>
      </div>
    </FormSection>

    <!-- 3. 模式特定配置 -->
    <FormSection
      v-if="propertyForm.mode === 'existing'"
      title="群组配置"
      tooltip="选择需要发送通知的目标群组（基于所属团队）"
      theme-color="blue"
    >
      <template #icon
        ><el-icon><Menu /></el-icon
      ></template>
      <!-- NOTE: 使用简化后的 GroupSelector 直连 ID 数组 -->
      <GroupSelector v-model="propertyForm.chat_group_ids" :teams="teams" />
    </FormSection>

    <FormSection v-else title="建群规则" tooltip="定义新群组的名称生成规则与通知渠道" theme-color="blue">
      <template #icon
        ><el-icon><CirclePlus /></el-icon
      ></template>
      <div class="settings-stack">
        <el-form-item class="form-item" prop="create.name">
          <VariableInput
            v-model="propertyForm.create.name"
            label="群组名称规则"
            placeholder="默认：【ECMDB】- {{template}}"
            :variables="[
              { key: 'ticket_id', label: '工单ID' },
              { key: 'template', label: '模板名' },
              { key: 'creator', label: '发起人' },
              { key: 'field.xxx', label: '字段' }
            ]"
          />
        </el-form-item>
        <el-form-item label="通知渠道" class="form-item">
          <el-select v-model="propertyForm.create.channel" class="modern-select">
            <el-option label="飞书卡片" :value="CHANNEL_TYPES.LARK_CARD">📱 飞书卡片</el-option>
            <el-option label="企业微信" :value="CHANNEL_TYPES.WECHAT">💬 企业微信</el-option>
            <el-option label="邮件" :value="CHANNEL_TYPES.EMAIL">📧 邮件</el-option>
          </el-select>
        </el-form-item>
      </div>
    </FormSection>

    <!-- 4. 成员策略配置 -->
    <FormSection
      title="成员策略"
      :tooltip="propertyForm.mode === 'existing' ? '配置通知发送时需要拉入群组的成员' : '配置创建群后需要拉入的成员'"
      theme-color="purple"
    >
      <template #icon
        ><el-icon><UserFilled /></el-icon
      ></template>
      <div class="strategy-workbench">
        <div class="user-input-wrapper">
          <el-input
            :value="propertyForm.assignees.length ? `已配置 ${propertyForm.assignees.length} 条策略` : ''"
            placeholder="尚未配置成员逻辑"
            class="modern-input with-action"
            readonly
          />
          <el-button @click="masterSelectorVisible = true" class="action-btn" :icon="Setting"> 配置逻辑 </el-button>
        </div>

        <div class="strategy-shelf scroll-slim" v-if="propertyForm.assignees.length > 0">
          <div
            v-for="(rule, index) in propertyForm.assignees"
            :key="`${rule.rule}-${rule.values?.join(',')}`"
            class="shelf-item"
            @click="openSelectorWithTab(rule.rule)"
          >
            <div class="item-tag" :class="rule.rule">{{ getRuleShortLabel(rule.rule) }}</div>
            <div class="item-val">{{ getRuleContentPreview(rule) }}</div>
            <el-button link :icon="Close" class="item-del" @click.stop="removeAssignee(index)" />
          </div>
        </div>
      </div>
    </FormSection>

    <!-- 5. 广播选项 -->
    <FormSection title="广播选项" tooltip="设置发送卡片中包含的业务数据模块" theme-color="green">
      <template #icon
        ><el-icon><ChatLineSquare /></el-icon
      ></template>
      <div class="switch-stack">
        <div
          v-for="opt in BROADCAST_OPTIONS"
          :key="opt.value"
          class="compact-switch-card"
          :class="{ active: propertyForm.is_auto.includes(opt.value) }"
          @click="toggleBroadcast(opt.value)"
        >
          <div class="switch-label">
            <el-icon class="opt-icon"
              ><CircleCheckFilled v-if="propertyForm.is_auto.includes(opt.value)" /><CircleCheck v-else
            /></el-icon>
            <span>{{ opt.label }}</span>
          </div>
        </div>
      </div>
    </FormSection>
  </el-form>

  <ReceiverSelector
    v-model:visible="masterSelectorVisible"
    title="配置成员逻辑"
    result-panel-title="已选策略"
    :initial-assignees="propertyForm.assignees"
    :initial-tab="selectedRuleTab"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="entitiesDisplayNames"
    :workflow-id="props.id"
    @confirm="handleMasterSelectorConfirm"
    @update-user-names="handleUpdateUserNames"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue"
import { FormInstance, FormRules } from "element-plus"
import {
  UserFilled,
  Menu,
  CirclePlus,
  Setting,
  Close,
  CircleCheckFilled,
  ChatDotRound,
  Operation,
  Document,
  ChatLineSquare,
  CircleCheck
} from "@element-plus/icons-vue"
import { FormSection } from "../../PropertySetting"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import GroupSelector from "./components/GroupSelector.vue"
import VariableInput from "./components/VariableInput.vue"
import { listTeamsApi } from "@/api/alert/team"
import type { Team } from "@/api/alert/team/types"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { receiverSelectorRegistry } from "@/common/components/ReceiverSelector/strategies"
import { RULE_TO_TAB_MAP, RULE_SHORT_LABEL_MAP, BROADCAST_OPTIONS, validateChatGroupNameRule } from "./chat-utils"
import { CHANNEL_TYPES } from "@/api/alert/template/types"
import type { Assignee } from "@/common/components/ReceiverSelector/composables/useAssignees"

const props = defineProps({
  nodeData: Object,
  lf: Object,
  id: Number,
  flowDetail: { type: Object, default: () => ({}) }
})

const emits = defineEmits(["closed"])
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

interface ChatPropertyForm {
  name: string
  title: string
  mode: "existing" | "create"
  chat_group_ids: number[]
  create: {
    name: string
    channel: string
  }
  assignees: Assignee[]
  is_auto: string[]
}

const propertyForm = reactive<ChatPropertyForm>({
  name: "",
  title: "",
  mode: "existing",
  chat_group_ids: [],
  create: {
    name: "",
    channel: CHANNEL_TYPES.LARK_CARD
  },
  assignees: [],
  is_auto: ["auto_task"]
})

const formRef = ref<FormInstance | null>(null)
const teams = ref<Team[]>([])
const entitiesDisplayNames = reactive<Record<string, string>>({})
const masterSelectorVisible = ref(false)
const selectedRuleTab = ref("")

const formRules = computed<FormRules>(() => ({
  name: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
  title: [
    {
      validator: (rule: any, value: string, callback: any) => {
        const error = validateChatGroupNameRule(value)
        if (error) return callback(new Error(error))
        callback()
      },
      trigger: "change"
    }
  ],
  "create.name": [
    {
      validator: (rule: any, value: string, callback: any) => {
        const error = validateChatGroupNameRule(value)
        if (error) return callback(new Error(error))
        callback()
      },
      trigger: "change"
    }
  ]
}))

onMounted(async () => {
  if (props.nodeData?.properties) {
    const p = props.nodeData.properties
    propertyForm.name = p.name || "群通知"
    propertyForm.title = p.title || ""
    propertyForm.mode = p.mode || "existing"
    propertyForm.chat_group_ids = p.chat_group_ids || []
    if (p.create) {
      propertyForm.create = { ...p.create }
    }
    propertyForm.assignees = p.assignees ? JSON.parse(JSON.stringify(p.assignees)) : []
    propertyForm.is_auto = p.is_auto || ["auto_task"]

    if (propertyForm.assignees.length > 0) {
      resolveNamesForAssignees(propertyForm.assignees)
    }
  }

  try {
    const { data } = await listTeamsApi({ offset: 0, limit: 1000 })
    teams.value = data.teams
  } catch (e) {
    console.error(e)
  }

  // NOTE: 只有当确实存在 'template' 类型的策略时才提前加载，否则等选择器打开时再加载
  const hasTemplateRule = propertyForm.assignees.some((a) => a.rule === "template")
  if (props.id !== undefined && hasTemplateRule) {
    await fetchTemplates(props.id)
  }
})

const selectMode = (m: "existing" | "create") => (propertyForm.mode = m)

// --- 接收内容显示优化 ---
const getRuleShortLabel = (r: string) => RULE_SHORT_LABEL_MAP[r] || r.slice(0, 2)

const removeAssignee = (i: number) => propertyForm.assignees.splice(i, 1)

const openSelectorWithTab = (ruleType: string) => {
  selectedRuleTab.value = RULE_TO_TAB_MAP[ruleType] || ""
  masterSelectorVisible.value = true
}

const handleMasterSelectorConfirm = (finalAssignees: any[]) => {
  propertyForm.assignees = finalAssignees
  resolveNamesForAssignees(finalAssignees)
}

const handleUpdateUserNames = (map: Record<string, string>) => {
  Object.assign(entitiesDisplayNames, map)
}

const resolveNamesForAssignees = async (assignees: any[]) => {
  for (const a of assignees) {
    const strategy = receiverSelectorRegistry.getStrategy(a.rule)
    if (strategy && strategy.resolveNames && a.values?.length) {
      const names = await strategy.resolveNames(a.values)
      Object.assign(entitiesDisplayNames, names)
    }
  }
}

const getRuleContentPreview = (a: any) => {
  if (a.rule === "template")
    return `${templateRules.value.find((t) => t.id.toString() === a.values[0])?.name || "模板"} : ${a.values[1]}`
  if (["founder", "leaders", "main_leader"].includes(a.rule)) return "系统动态逻辑"
  return a.values.map((v: string) => entitiesDisplayNames[v] || v).join(", ")
}

const toggleBroadcast = (v: string) => {
  const i = propertyForm.is_auto.indexOf(v)
  if (i > -1) propertyForm.is_auto.splice(i, 1)
  else propertyForm.is_auto.push(v)
}

const confirmFunc = () => {
  formRef.value?.validate((v) => {
    if (v) {
      props.lf?.setProperties(props.nodeData?.id, { ...propertyForm })
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

defineExpose({ confirmFunc })
</script>

<style lang="scss" scoped>
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

// ── 统一风格控件 ──────────────────────────────────────────────────────
.modern-input,
.modern-select {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #ffffff !important;
    border-radius: 6px;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    padding: 2px 10px;
    transition: all 0.2s ease;
    &:hover {
      border-color: #94a3b8 !important;
    }
    &.is-focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 1px #6366f1 !important;
    }
  }
}

.form-item {
  margin-bottom: 12px;
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}

.settings-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ── 模式切换卡片 ──────────────────────────────────────────────────────
.mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.mode-card {
  display: flex;
  align-items: center;
  justify-content: flex-start; // 显式靠左
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  &:hover {
    border-color: #dbeafe;
    background: #f8fafc;
    transform: translateY(-1px);
  }
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    .mode-card-icon {
      background: #e0e7ff;
      .el-icon {
        color: #3b82f6;
      }
    }
    .mode-label {
      color: #1d4ed8;
    }
    .mode-check {
      opacity: 1;
      transform: scale(1);
    }
  }
}
.mode-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .el-icon {
    font-size: 18px;
    color: #6366f1;
    transition: color 0.2s ease;
  }
}
.mode-card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start; // 明确左对齐
  text-align: left; // 明确左对齐
  gap: 3px;
  flex: 1;
  min-width: 0;
}
.mode-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
  line-height: 1.2;
}
.mode-desc {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mode-check {
  font-size: 18px;
  color: #3b82f6;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  margin-left: auto; // 确保推到最右侧
}

// ── 策略工作台 ──────────────────────────────────────────────────────
.strategy-workbench {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-input-wrapper {
  display: flex;
  width: 100%;
  align-items: stretch;
  height: 40px;

  .modern-input.with-action {
    flex: 1;
    :deep(.el-input__wrapper) {
      border-right: none !important;
      border-radius: 8px 0 0 8px !important;
      height: 100%;
      background: #fff !important;
    }
  }

  .action-btn {
    height: 100%;
    border-radius: 0 8px 8px 0;
    border: 1px solid #cbd5e1;
    border-left: none;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
    padding: 0 16px;
    margin: 0;
    transition: all 0.2s;
    &:hover:not(:disabled) {
      background: #f1f5f9;
      color: #6366f1;
      border-color: #cbd5e1;
    }
  }
}

.strategy-shelf {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #fbfcfe;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
}
.shelf-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eef2f6;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    transform: translateY(-1px);
  }
  .item-tag {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #64748b;
    &.appoint {
      background: #eff6ff;
      color: #2563eb;
    }
    &.founder {
      background: #f0fdf4;
      color: #16a34a;
    }
    &.department {
      background: #fef2f2;
      color: #dc2626;
    }
    &.team {
      background: #fff7ed;
      color: #ea580c;
    }
    &.on_call {
      background: #faf5ff;
      color: #9333ea;
    }
    &.template {
      background: #f0f9ff;
      color: #0369a1;
    }
  }
  .item-val {
    flex: 1;
    font-size: 13px;
    color: #334155;
    font-weight: 600;
  }
  .item-del {
    font-size: 14px;
    color: #cbd5e1;
    transition: color 0.2s;
    &:hover {
      color: #ef4444;
    }
  }
}

// ── 广播选项 ────────────────────────────────────────────────────────
.switch-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.compact-switch-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #cbd5e1;
    background: #fcfdfe;
  }
  &.active {
    border-color: #10b981;
    background: #f0fdf4;
    .switch-label {
      color: #166534;
      .opt-icon {
        color: #10b981;
      }
    }
  }
  .switch-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 700;
    color: #475569;
    .opt-icon {
      font-size: 18px;
      color: #e2e8f0;
      transition: all 0.2s;
    }
  }
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
