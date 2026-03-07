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
          { id: 'existing', label: '现有群通知' },
          { id: 'create', label: '规则自动建群' }
        ]"
        :key="m.id"
        class="mode-switch-item"
        :class="{ active: propertyForm.mode === m.id }"
        @click="selectMode(m.id as 'existing' | 'create')"
      >
        {{ m.label }}
      </div>
    </div>

    <div class="main-form-content">
      <FormSection title="基础配置" theme-color="slate">
        <template #icon
          ><el-icon><ChatLineRound /></el-icon
        ></template>
        <el-form-item prop="name" class="compact-form-item">
          <el-input v-model="propertyForm.name" placeholder="请输入节点名称" class="hero-stage-input" />
        </el-form-item>
      </FormSection>

      <transition name="pane-slide" mode="out-in">
        <!-- 现有群配置 -->
        <div v-if="propertyForm.mode === 'existing'" key="existing">
          <FormSection title="群组分发目标" theme-color="blue">
            <template #icon
              ><el-icon><Menu /></el-icon
            ></template>
            <div class="pill-stack">
              <div v-for="(group, index) in propertyForm.chat_groups" :key="index" class="id-pill-widget">
                <el-select v-model="group.channel" class="channel-sel">
                  <el-option label="飞书" value="feishu" />
                  <el-option label="钉钉" value="dingtalk" />
                  <el-option label="企微" value="wecom" />
                </el-select>
                <div class="divider-v" />
                <el-input v-model="group.chat_id" placeholder="填写 Chat ID" class="id-input-ghost" />
                <el-button
                  v-if="propertyForm.chat_groups.length > 1"
                  type="danger"
                  link
                  :icon="Delete"
                  @click="removeGroup(index)"
                />
              </div>
              <el-button type="primary" link :icon="Plus" class="dash-add-btn" @click="addGroup"
                >新增推送渠道</el-button
              >
            </div>
          </FormSection>
        </div>

        <!-- 自动建群 -->
        <div v-else key="create">
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
                  @click="masterSelectorVisible = true"
                >
                  <div class="item-tag" :class="rule.rule">{{ getRuleLabel(rule.rule) }}</div>
                  <div class="item-val">{{ getRuleContentPreview(rule) }}</div>
                  <el-button link :icon="Close" class="item-del" @click.stop="removeAssignee(index)" />
                </div>
              </div>
            </div>
          </FormSection>
        </div>
      </transition>

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
    </div>
  </el-form>

  <!-- 💎 抽离后的成员策略选择中心 -->
  <ChatReceiverSelector
    v-model:visible="masterSelectorVisible"
    :initial-assignees="propertyForm.assignees"
    :template-rules="templateRules"
    :get-template-field-options="getTemplateFieldOptions"
    :username-to-display-name="entitiesDisplayNames"
    @confirm="handleMasterSelectorConfirm"
    @update-user-names="handleUpdateUserNames"
  />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { FormInstance, FormRules } from "element-plus"
import {
  ChatLineRound,
  Plus,
  Delete,
  UserFilled,
  Menu,
  CirclePlus,
  Select,
  Check,
  Setting,
  ArrowRight,
  User,
  Close
} from "@element-plus/icons-vue"
import { FormSection } from "../../PropertySetting"
import ChatReceiverSelector from "./ChatReceiverSelector.vue"
import { listTeamsApi } from "@/api/alert/team"
import { useTemplateRules } from "@/common/composables/useTemplateRules"
import { receiverSelectorRegistry } from "./strategies"

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
  is_auto: ["ticket_data"]
})

const broadcastOptions = [
  { label: "工单原始数据", value: "ticket_data" },
  { label: "自动化链路信息", value: "auto_task" },
  { label: "交互反馈结果", value: "user_input" }
]

const formRef = ref<FormInstance | null>(null)
// teams 只针对创建群组时的下拉选择，不用作入群策略的展示映射
const teams = ref<any[]>([])
const entitiesDisplayNames = reactive<Record<string, string>>({})
const masterSelectorVisible = ref(false)

const ruleOptions = [
  { label: "人员白名单", value: "appoint" },
  { label: "工单创建人", value: "founder" },
  { label: "字段模板提取", value: "template" },
  { label: "部门负责人", value: "leaders" },
  { label: "岗位分管领导", value: "main_leader" },
  { label: "实时值班人员", value: "on_call" },
  { label: "关联业务团队", value: "team" }
]

const formRules: FormRules = {
  name: [{ required: true, message: "请输入节点名称", trigger: "blur" }],
  team_id: [{ required: true, message: "请选择管理团队", trigger: "change" }]
}

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
    propertyForm.is_auto = p.is_auto || ["ticket_data"]

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
const addGroup = () => propertyForm.chat_groups.push({ channel: "feishu", chat_id: "" })
const removeGroup = (i: number) => propertyForm.chat_groups.splice(i, 1)
const removeAssignee = (i: number) => propertyForm.assignees.splice(i, 1)

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
  padding: 16px;
  background: #f8fafc;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mode-switch-wrapper {
  display: flex;
  background: #eaeff4;
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 8px;
  .mode-switch-item {
    flex: 1;
    text-align: center;
    padding: 10px;
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
    cursor: pointer;
    border-radius: 10px;
    transition: all 0.25s;
    &:hover {
      color: #1e293b;
    }
    &.active {
      background: #fff;
      color: #3b82f6;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
    }
  }
}

.main-form-content {
  flex: 1;
  overflow-y: auto;
}

.hero-stage-input,
.hero-stage-select {
  width: 100%;
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    background: #fff;
    border-radius: 10px;
    height: 44px;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    &:hover {
      border-color: #3b82f6;
    }
  }
}

.pill-stack {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.id-pill-widget {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
  gap: 10px;
  .channel-sel {
    width: 90px;
    :deep(.el-select__wrapper) {
      background: transparent;
      border: none;
    }
  }
  .divider-v {
    width: 1px;
    height: 20px;
    background: #f1f5f9;
  }
  .id-input-ghost {
    flex: 1;
    :deep(.el-input__wrapper) {
      background: transparent;
      border: none;
    }
  }
}

.strategy-workbench {
  margin-top: 8px;
}
.config-trigger-btn {
  width: 100%;
  height: 50px;
  border-radius: 12px;
  font-weight: 800;
  border: 2.5px solid #3b82f6;
  background: #fff;
  color: #3b82f6;
  gap: 12px;
  margin-bottom: 16px;
  &:hover {
    background: #eff6ff;
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.15);
  }
  .arr-icon {
    margin-left: auto;
    font-size: 12px;
  }
}

.strategy-shelf {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.shelf-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid #f1f5f9;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px) scale(1.01);
    border-color: #3b82f6;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.04);
  }
  .item-tag {
    font-size: 10px;
    font-weight: 900;
    padding: 2px 8px;
    border-radius: 4px;
    background: #f8fafc;
    color: #94a3b8;
    text-transform: uppercase;
    &.appoint {
      background: #eff6ff;
      color: #3b82f6;
    }
    &.founder {
      background: #f0fdf4;
      color: #22c55e;
    }
  }
  .item-val {
    flex: 1;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.shelf-empty {
  padding: 30px;
  text-align: center;
  color: #cbd5e1;
  border: 1.5px dashed #e2e8f0;
  border-radius: 12px;
  font-size: 12px;
}

.broadcast-matrix {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.matrix-card {
  padding: 16px;
  background: #f8fafc;
  border: 1.5px solid #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.2s;
  .matrix-check {
    width: 22px;
    height: 22px;
    border: 2.5px solid #cbd5e1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: transparent;
  }
  span {
    font-size: 14px;
    font-weight: 700;
    color: #475569;
  }
  &:hover {
    border-color: #3b82f6;
    background: #fff;
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

.pane-slide-enter-active,
.pane-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.pane-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.pane-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
