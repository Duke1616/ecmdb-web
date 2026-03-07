<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status === '2'"
    class="property-form-root"
  >
    <!-- 1. 顶部模式切换 -->
    <div class="mode-switch-wrapper">
      <div
        v-for="m in [
          { id: 'existing', label: '现有群通知', desc: '使用已绑定的群聊', icon: 'ChatDotRound' },
          { id: 'create', label: '规则自动建群', desc: '根据规则动态创建群', icon: 'CirclePlus' }
        ]"
        :key="m.id"
        class="mode-switch-item"
        :class="{ active: propertyForm.mode === m.id }"
        @click="selectMode(m.id as 'existing' | 'create')"
      >
        <div class="mode-card__icon">
          <el-icon v-if="m.icon === 'ChatDotRound'"><ChatDotRound /></el-icon>
          <el-icon v-else><CirclePlus /></el-icon>
        </div>
        <div class="mode-card__body">
          <span class="mode-card__title">{{ m.label }}</span>
          <span class="mode-card__desc">{{ m.desc }}</span>
        </div>
        <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
      </div>
    </div>

    <FormSection title="基础配置" theme-color="slate">
      <template #icon
        ><el-icon><ChatLineRound /></el-icon
      ></template>
      <el-form-item prop="name" class="compact-form-item">
        <el-input v-model="propertyForm.name" placeholder="请输入节点名称" class="hero-stage-input" />
      </el-form-item>
    </FormSection>

    <!-- 现有群配置 -->
    <FormSection v-if="propertyForm.mode === 'existing'" title="群组配置" theme-color="blue">
      <template #icon
        ><el-icon><Menu /></el-icon
      ></template>

      <!-- 群组来源选择 - Tab 风格 -->
      <div class="source-tabs-container">
        <div
          v-for="source in [
            { id: 'team', label: '从团队获取' },
            { id: 'manual', label: '手动填写' }
          ]"
          :key="source.id"
          class="source-tab-item"
          :class="{ active: groupSource === source.id }"
          @click="groupSource = source.id as 'team' | 'manual'"
        >
          {{ source.label }}
        </div>
      </div>

      <!-- 从团队获取群组 -->
      <template v-if="groupSource === 'team'">
        <div class="team-group-selector">
          <!-- 左侧：团队列表 -->
          <div class="team-list-panel">
            <div class="panel-header">团队列表</div>
            <div class="team-list">
              <div
                v-for="team in teams"
                :key="team.id"
                class="team-item"
                :class="{ active: selectedTeamId === team.id, 'has-selected': getSelectedCountInTeam(team.id) > 0 }"
                @click="selectedTeamId = team.id"
              >
                <div class="team-info">
                  <div class="team-name">{{ team.name }}</div>
                  <div class="team-count">{{ team.chat_groups?.length || 0 }} 个群组</div>
                </div>
                <div v-if="getSelectedCountInTeam(team.id) > 0" class="selected-badge">
                  {{ getSelectedCountInTeam(team.id) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：群组列表 -->
          <div class="group-list-panel">
            <div class="panel-header">
              {{ selectedTeamId ? teams.find((t) => t.id === selectedTeamId)?.name : "请选择团队" }}
            </div>
            <div v-if="selectedTeamId" class="group-list">
              <div
                v-for="group in currentTeamGroups"
                :key="group.id"
                class="group-item"
                :class="{ selected: selectedChatGroupIds.includes(group.id) }"
                @click="toggleGroupSelection(group.id)"
              >
                <div class="group-checkbox">
                  <el-icon v-if="selectedChatGroupIds.includes(group.id)"><Check /></el-icon>
                </div>
                <div class="group-info">
                  <div class="group-name">{{ group.name }}</div>
                  <div class="group-channel">{{ getChannelLabel(group.channel) }}</div>
                </div>
              </div>
              <div v-if="currentTeamGroups.length === 0" class="empty-hint">该团队暂无关联群组</div>
            </div>
            <div v-else class="empty-hint">请从左侧选择团队</div>
          </div>
        </div>
      </template>

      <!-- 手动填写群组 -->
      <template v-if="groupSource === 'manual'">
        <div class="manual-groups-container">
          <div v-for="(group, idx) in manualChatGroups" :key="idx" class="manual-group-item">
            <el-select v-model="group.channel" placeholder="渠道" class="channel-sel">
              <el-option label="飞书卡片" :value="CHANNEL_TYPES.LARK_CARD" />
              <el-option label="企业微信" :value="CHANNEL_TYPES.WECHAT" />
              <el-option label="邮件" :value="CHANNEL_TYPES.EMAIL" />
            </el-select>
            <el-input v-model="group.name" placeholder="群组名称" class="group-name-input" />
            <el-input v-model="group.chat_id" placeholder="群聊 ID" class="group-id-input" />
            <el-button
              v-if="manualChatGroups.length > 1"
              link
              :icon="Close"
              class="remove-btn"
              @click="removeManualGroup(idx)"
            />
          </div>
        </div>
        <el-button type="primary" plain size="small" class="add-group-btn" @click="addManualGroup">
          <el-icon><CirclePlus /></el-icon>
          <span>添加群组</span>
        </el-button>
      </template>
    </FormSection>

    <!-- 自动建群 -->
    <template v-if="propertyForm.mode === 'create'">
      <FormSection title="归属团队管理" theme-color="blue">
        <template #icon
          ><el-icon><CirclePlus /></el-icon
        ></template>
        <el-form-item prop="team_id" class="compact-form-item">
          <el-select v-model="propertyForm.team_id" placeholder="选择维护团队" class="hero-stage-select" filterable>
            <el-option v-for="team in teams" :key="team.id" :label="team.name" :value="team.id" />
          </el-select>
        </el-form-item>
      </FormSection>

      <FormSection title="入群成员策略" theme-color="purple">
        <template #icon
          ><el-icon><UserFilled /></el-icon
        ></template>
        <div class="strategy-workbench">
          <el-button type="primary" class="config-trigger-btn" @click="masterSelectorVisible = true">
            <el-icon><Setting /></el-icon>
            <span>配置入群成员逻辑</span>
            <el-icon class="arr-icon"><ArrowRight /></el-icon>
          </el-button>

          <div class="strategy-shelf">
            <div v-if="propertyForm.assignees.length === 0" class="shelf-empty">
              <el-icon><User /></el-icon>
              <span>未配置策略，仅包含创建人</span>
            </div>
            <div
              v-for="(rule, index) in propertyForm.assignees"
              :key="index"
              class="shelf-item"
              @click="openSelectorWithTab(rule.rule)"
            >
              <div class="item-tag" :class="rule.rule">{{ getRuleLabel(rule.rule) }}</div>
              <div class="item-val">{{ getRuleContentPreview(rule) }}</div>
              <el-button link :icon="Close" class="item-del" @click.stop="removeAssignee(index)" />
            </div>
          </div>
        </div>
      </FormSection>
    </template>

    <FormSection title="卡片广播内容" theme-color="green">
      <template #icon
        ><el-icon><Select /></el-icon
      ></template>
      <div class="broadcast-matrix">
        <div
          v-for="opt in broadcastOptions"
          :key="opt.value"
          class="matrix-card"
          :class="{ active: propertyForm.is_auto.includes(opt.value) }"
          @click="toggleBroadcast(opt.value)"
        >
          <div class="matrix-check">
            <el-icon><Check /></el-icon>
          </div>
          <span>{{ opt.label }}</span>
        </div>
      </div>
    </FormSection>
  </el-form>

  <!-- 💎 抽离后的成员策略选择中心 -->
  <ReceiverSelector
    v-model:visible="masterSelectorVisible"
    title="配置/管理入群接收者策略"
    result-panel-title="已选加群逻辑项"
    empty-text="暂无入群接收者"
    :initial-assignees="propertyForm.assignees"
    :initial-tab="selectedRuleTab"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="entitiesDisplayNames"
    @confirm="handleMasterSelectorConfirm"
    @update-user-names="handleUpdateUserNames"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from "vue"
import { FormInstance, FormRules } from "element-plus"
import {
  ChatLineRound,
  UserFilled,
  Menu,
  CirclePlus,
  Select,
  Check,
  Setting,
  ArrowRight,
  User,
  Close,
  CircleCheckFilled,
  ChatDotRound
} from "@element-plus/icons-vue"
import { FormSection } from "../../PropertySetting"
import ReceiverSelector from "@/common/components/ReceiverSelector/index.vue"
import { listTeamsApi } from "@/api/alert/team"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { receiverSelectorRegistry } from "@/common/components/ReceiverSelector/strategies"
import { CHANNEL_TYPES } from "@/api/alert/template/types"

const props = defineProps({
  nodeData: Object,
  lf: Object,
  id: Number,
  flowDetail: { type: Object, default: () => ({}) }
})

const emits = defineEmits(["closed"])
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

const propertyForm = reactive({
  name: "",
  mode: "existing" as "existing" | "create",
  team_id: undefined as number | undefined,
  chat_groups: [{ channel: "feishu", chat_id: "" }],
  assignees: [] as any[],
  is_auto: ["auto_task"]
})

const broadcastOptions = [
  { label: "自动化任务返回信息", value: "auto_task" },
  { label: "用户工单提交信息", value: "ticket_data" },
  { label: "用户节点表单提交信息", value: "user_input" }
]

const formRef = ref<FormInstance | null>(null)
const teams = ref<any[]>([])
const entitiesDisplayNames = reactive<Record<string, string>>({})
const masterSelectorVisible = ref(false)
const selectedRuleTab = ref("")
const selectedChatGroupIds = ref<number[]>([])
const groupSource = ref<"team" | "manual">("team")
const selectedTeamId = ref<number | undefined>(undefined)
const manualChatGroups = ref<Array<{ channel: string; chat_id: string; name: string }>>([
  { channel: CHANNEL_TYPES.LARK_CARD, chat_id: "", name: "" }
])

// 获取当前选中团队的群组
const currentTeamGroups = computed(() => {
  if (!selectedTeamId.value) return []
  const team = teams.value.find((t) => t.id === selectedTeamId.value)
  return team?.chat_groups || []
})

// 获取所有已选中的群组（用于更新 propertyForm）
const allSelectedGroups = computed(() => {
  const groups: any[] = []
  teams.value.forEach((team) => {
    if (team.chat_groups) {
      team.chat_groups.forEach((group: any) => {
        if (selectedChatGroupIds.value.includes(group.id)) {
          groups.push(group)
        }
      })
    }
  })
  return groups
})

// 获取渠道标签
const getChannelLabel = (channel: string) => {
  const channelMap: Record<string, string> = {
    [CHANNEL_TYPES.LARK_CARD]: "飞书卡片",
    [CHANNEL_TYPES.WECHAT]: "企业微信",
    [CHANNEL_TYPES.EMAIL]: "邮件"
  }
  return channelMap[channel] || channel
}

const ruleOptions = [
  { label: "指定人员", value: "appoint" },
  { label: "工单创建人", value: "founder" },
  { label: "字段模板提取", value: "template" },
  { label: "部门负责人", value: "leaders" },
  { label: "岗位分管领导", value: "main_leader" },
  { label: "实时值班人员", value: "on_call" },
  { label: "关联业务团队", value: "team" },
  { label: "部门", value: "department" }
]

// rule 到 tab 的映射
const ruleToTabMap: Record<string, string> = {
  appoint: "user",
  founder: "system",
  template: "template",
  leaders: "system",
  main_leader: "system",
  on_call: "on_call",
  team: "team",
  department: "department"
}

// 获取某个团队中已选中的群组数量
const getSelectedCountInTeam = (teamId: number) => {
  const team = teams.value.find((t) => t.id === teamId)
  if (!team?.chat_groups) return 0
  return team.chat_groups.filter((g: any) => selectedChatGroupIds.value.includes(g.id)).length
}

const formRules = computed<FormRules>(() => {
  const rules: FormRules = {
    name: [{ required: true, message: "请输入节点名称", trigger: "blur" }]
  }

  // 只有在"规则自动建群"模式下才需要验证 team_id
  if (propertyForm.mode === "create") {
    rules.team_id = [{ required: true, message: "请选择管理团队", trigger: "change" }]
  }

  return rules
})

onMounted(async () => {
  if (props.nodeData?.properties) {
    const p = props.nodeData.properties
    propertyForm.name = p.name || "群通知"
    propertyForm.mode = p.mode || "existing"
    propertyForm.team_id = p.team_id
    propertyForm.chat_groups = p.chat_groups?.length
      ? JSON.parse(JSON.stringify(p.chat_groups))
      : [{ channel: "feishu", chat_id: "" }]
    propertyForm.assignees = p.assignees?.length ? JSON.parse(JSON.stringify(p.assignees)) : []
    propertyForm.is_auto = p.is_auto || ["auto_task"]

    // 初始化时通过统一的策略注册表解析显示名称
    if (propertyForm.assignees.length > 0) {
      resolveNamesForAssignees(propertyForm.assignees)
    }
  }

  // 维护群组依然需要可选的团队列表 (按需加载前 1000 个供下拉)
  try {
    const { data } = await listTeamsApi({ offset: 0, limit: 1000 })
    teams.value = data.teams
  } catch (e) {
    console.error(e)
  }

  if (props.id !== undefined) await fetchTemplates(props.id)
})

const selectMode = (m: "existing" | "create") => (propertyForm.mode = m)
const removeAssignee = (i: number) => propertyForm.assignees.splice(i, 1)

// 切换群组选择
const toggleGroupSelection = (groupId: number) => {
  const index = selectedChatGroupIds.value.indexOf(groupId)
  if (index > -1) {
    selectedChatGroupIds.value.splice(index, 1)
  } else {
    selectedChatGroupIds.value.push(groupId)
  }
}

// 根据选中的群组ID更新 chat_groups
const updateChatGroupsFromSelection = () => {
  propertyForm.chat_groups = allSelectedGroups.value.map((g: any) => ({
    channel: g.channel,
    chat_id: g.chat_id,
    id: g.id,
    name: g.name
  }))
}

// 添加手动群组
const addManualGroup = () => {
  manualChatGroups.value.push({ channel: CHANNEL_TYPES.LARK_CARD, chat_id: "", name: "" })
}

// 移除手动群组
const removeManualGroup = (index: number) => {
  manualChatGroups.value.splice(index, 1)
}

// 打开选择器并跳转到对应的 tab
const openSelectorWithTab = (ruleType: string) => {
  selectedRuleTab.value = ruleToTabMap[ruleType] || ""
  masterSelectorVisible.value = true
}

// 监听选中的群组ID变化
watch(selectedChatGroupIds, () => {
  updateChatGroupsFromSelection()
})

// 监听手动群组变化
watch(
  manualChatGroups,
  (newGroups) => {
    if (groupSource.value === "manual") {
      propertyForm.chat_groups = newGroups.map((g) => ({
        channel: g.channel,
        chat_id: g.chat_id,
        name: g.name
      }))
    }
  },
  { deep: true }
)

// 监听群组来源变化
watch(groupSource, (newSource) => {
  if (newSource === "manual") {
    propertyForm.chat_groups = manualChatGroups.value.map((g) => ({
      channel: g.channel,
      chat_id: g.chat_id,
      name: g.name
    }))
  } else {
    updateChatGroupsFromSelection()
  }
})

const handleMasterSelectorConfirm = (finalAssignees: any[]) => {
  propertyForm.assignees = finalAssignees
  resolveNamesForAssignees(finalAssignees)
}

const handleUpdateUserNames = (map: Record<string, string>) => {
  Object.assign(entitiesDisplayNames, map)
}

const resolveNamesForAssignees = async (assignees: any[]) => {
  // 通过 registry 调用实现好的策略
  for (const a of assignees) {
    const strategy = receiverSelectorRegistry.getStrategy(a.rule)
    if (strategy && strategy.resolveNames && a.values?.length) {
      const names = await strategy.resolveNames(a.values)
      Object.assign(entitiesDisplayNames, names)
    }
  }
}

const getRuleLabel = (r: string) => ruleOptions.find((o) => o.value === r)?.label || r
const getRuleContentPreview = (a: any) => {
  if (a.rule === "template")
    return `${templateRules.value.find((t) => t.id.toString() === a.values[0])?.name || "模板"} : ${a.values[1]}`

  if (["founder", "leaders", "main_leader"].includes(a.rule)) {
    return "动态计算逻辑"
  }

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
.property-form-root {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

.mode-switch-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;

  .mode-switch-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fafafa;
    position: relative;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f0f7ff;
    }

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

      .mode-card__icon .el-icon {
        color: #3b82f6;
      }

      .mode-card__title {
        color: #1d4ed8;
      }

      .mode-card__check {
        opacity: 1;
        color: #3b82f6;
      }
    }
  }

  .mode-card__icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
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

  .mode-card__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
    text-align: left;
  }

  .mode-card__title {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    line-height: 1.4;
    transition: color 0.2s ease;
  }

  .mode-card__desc {
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.4;
  }

  .mode-card__check {
    font-size: 18px;
    opacity: 0;
    transition: opacity 0.2s ease;
    flex-shrink: 0;
  }
}

.source-tabs-container {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 16px;
  .source-tab-item {
    flex: 1;
    text-align: center;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    &:hover {
      color: #3b82f6;
      background: #f9fafb;
    }
    &.active {
      color: #3b82f6;
      font-weight: 600;
      border-bottom-color: #3b82f6;
    }
  }
}

.team-group-selector {
  display: flex;
  gap: 12px;
  height: 400px;
  margin-top: 12px;
}

.team-list-panel,
.group-list-panel {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.team-list-panel {
  width: 200px;
  flex-shrink: 0;
}

.group-list-panel {
  flex: 1;
}

.panel-header {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.team-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.team-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &:hover {
    background: #f3f4f6;
  }

  &.active {
    background: #eff6ff;
    border: 1px solid #3b82f6;
  }

  &.has-selected {
    background: #fef3c7;
    border: 1px solid #fbbf24;

    &.active {
      background: #eff6ff;
      border: 1px solid #3b82f6;
    }

    &:hover {
      background: #fef3c7;
    }
  }

  .team-info {
    flex: 1;
    min-width: 0;
  }

  .team-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .team-count {
    font-size: 11px;
    color: #9ca3af;
  }

  .selected-badge {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #3b82f6;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
}

.group-list-container {
  margin-top: 12px;
}

.group-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 12px;
  &:hover {
    border-color: #3b82f6;
    background: #f9fafb;
  }
  &.selected {
    border-color: #3b82f6;
    background: #eff6ff;
    .group-checkbox {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
  }
}

.group-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: transparent;
  transition: all 0.2s;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  .group-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
  }
  .group-channel {
    font-size: 12px;
    color: #6b7280;
  }
}

.manual-groups-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.manual-group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  .channel-sel {
    width: 90px;
    flex-shrink: 0;
  }
  .group-name-input {
    flex: 1;
    min-width: 0;
  }
  .group-id-input {
    flex: 1.5;
    min-width: 0;
  }
  .remove-btn {
    padding: 4px;
    font-size: 16px;
    color: #9ca3af;
    flex-shrink: 0;
    &:hover {
      color: #ef4444;
    }
  }
}

.add-group-btn {
  width: 100%;
  margin-top: 8px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
}

.hero-stage-input,
.hero-stage-select {
  width: 100%;
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background: #fff;
    border-radius: 6px;
    height: 36px;
    border: 1px solid #cbd5e1;
    box-shadow: none !important;
    padding: 2px 10px;
    &:hover {
      border-color: #94a3b8;
    }
    &.is-focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 1px #6366f1 !important;
    }
  }
}

.pill-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.id-pill-widget {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  gap: 8px;
  .channel-sel {
    width: 80px;
    :deep(.el-select__wrapper) {
      background: transparent;
      border: none;
      height: 28px;
      padding: 0 6px;
    }
  }
  .divider-v {
    width: 1px;
    height: 16px;
    background: #f1f5f9;
  }
  .id-input-ghost {
    flex: 1;
    :deep(.el-input__wrapper) {
      background: transparent;
      border: none;
      height: 28px;
      padding: 0 6px;
    }
  }
}

.strategy-workbench {
  margin-top: 6px;
}
.config-trigger-btn {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  border: 2px solid #3b82f6;
  background: #fff;
  color: #3b82f6;
  gap: 8px;
  margin-bottom: 12px;
  &:hover {
    background: #eff6ff;
    box-shadow: 0 3px 10px rgba(59, 130, 246, 0.12);
  }
  .arr-icon {
    margin-left: auto;
    font-size: 12px;
  }
}

.strategy-shelf {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.shelf-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 6px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  .item-tag {
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    background: #f1f5f9;
    color: #64748b;
    white-space: nowrap;
    &.appoint {
      background: #dbeafe;
      color: #2563eb;
    }
    &.founder {
      background: #dcfce7;
      color: #16a34a;
    }
    &.template {
      background: #fef3c7;
      color: #d97706;
    }
    &.leaders,
    &.main_leader {
      background: #e0e7ff;
      color: #6366f1;
    }
    &.on_call {
      background: #fce7f3;
      color: #db2777;
    }
    &.team {
      background: #ddd6fe;
      color: #7c3aed;
    }
    &.department {
      background: #fed7aa;
      color: #ea580c;
    }
  }
  .item-val {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #334155;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item-del {
    padding: 0;
    font-size: 16px;
    color: #cbd5e1;
    transition: color 0.2s;
    &:hover {
      color: #ef4444;
    }
  }
}
.shelf-empty {
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border: 1.5px dashed #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  .el-icon {
    font-size: 24px;
    color: #cbd5e1;
  }
}

.broadcast-matrix {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.matrix-card {
  padding: 12px 14px;
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  .matrix-check {
    width: 18px;
    height: 18px;
    border: 2px solid #cbd5e1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: transparent;
  }
  span {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }
  &:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    .matrix-check {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
    span {
      color: #1e3a8a;
    }
  }
}

.empty-hint {
  padding: 12px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px dashed #e2e8f0;
}

.compact-form-item {
  margin-bottom: 0;
  :deep(.el-form-item__label) {
    display: none;
  }
}
</style>
