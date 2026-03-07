<template>
  <FormDialog
    v-model="dialogVisible"
    title="配置/管理入群接收者策略"
    width="960px"
    top="5vh"
    @confirm="handleConfirm"
    @cancel="dialogVisible = false"
    class="chat-receiver-selector-dialog"
  >
    <div class="selector-container">
      <div class="selector-layout">
        <!-- 1. 左栏: 动态选择区 -->
        <div class="pane-pick">
          <div class="pick-header">
            <span>选择可用规则</span>
            <div class="type-segmented">
              <div
                v-for="tab in tabs"
                :key="tab.id"
                class="seg-item"
                :class="{ active: currentTab === tab.id }"
                @click="currentTab = tab.id"
              >
                <el-icon><component :is="tab.icon" /></el-icon>
                <span>{{ tab.label }}</span>
              </div>
            </div>
          </div>

          <div class="pick-content">
            <!-- 预设逻辑 -->
            <SystemTab v-if="currentTab === 'system'" :active-rules="getSystemRuleKeys()" @toggle="toggleSystemRule" />

            <!-- 人员选择 -->
            <div class="user-embed-wrapper" v-else-if="currentTab === 'user'">
              <UserSelector
                ref="userPicker"
                :default-checked-keys="getUserKeys()"
                :hidePreview="true"
                @change="onUserSelected"
              />
            </div>

            <!-- 团队选择 -->
            <OptionsTab
              v-else-if="currentTab === 'team'"
              :fetch-method="getFetchMethod('team')"
              :selected-ids="getTeamKeys()"
              label-key="name"
              :icon="OfficeBuilding"
              @toggle="toggleTeam"
              @loaded="handleLoadedItems"
            />

            <!-- 值班选择 -->
            <OptionsTab
              v-else-if="currentTab === 'on_call'"
              :fetch-method="getFetchMethod('on_call')"
              :selected-ids="getRotaKeys()"
              label-key="name"
              :icon="Clock"
              @toggle="toggleRota"
              @loaded="handleLoadedItems"
            />

            <!-- 部门选择 -->
            <TreeTab
              v-else-if="currentTab === 'department'"
              :selected-ids="getDepartmentKeys()"
              @update-ids="setDepartmentKeys"
              @loaded="handleLoadedItems"
            />

            <!-- 模板提取 -->
            <TemplateTab
              v-else-if="currentTab === 'template'"
              :template-rules="templateRules"
              :get-template-field-options="getTemplateFieldOptions"
              @add="addTemplateRuleFromTab"
            />
          </div>
        </div>

        <!-- 2. 右栏: 结果面板 -->
        <div class="pane-result">
          <div class="result-header">
            <span>已选加群逻辑项</span>
            <div class="result-badge">{{ tempAssignees.length }}</div>
          </div>
          <div class="result-body">
            <div v-if="tempAssignees.length === 0" class="empty-placeholder">
              <el-icon><Files /></el-icon>
              <p>暂无入群接收者</p>
              <span>请从左栏点击添加策略项</span>
            </div>
            <div v-for="(rule, idx) in tempAssignees" :key="idx" class="strategy-token">
              <div class="token-main">
                <span class="token-cat">{{ getRuleLabel(rule.rule) }}</span>
                <span class="token-val">{{ getRuleContentPreview(rule) }}</span>
              </div>
              <button class="token-close" @click="removeRule(idx)">
                <el-icon><Close /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, PropType } from "vue"
import { Setting, User, OfficeBuilding, Document, Files, Close, Clock } from "@element-plus/icons-vue"
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import UserSelector from "../user/UserSelector.vue"
import SystemTab from "./tabs/SystemTab.vue"
import OptionsTab from "./tabs/OptionsTab.vue"
import TemplateTab from "./tabs/TemplateTab.vue"
import TreeTab from "./tabs/TreeTab.vue"
import { receiverSelectorRegistry } from "./strategies"

const props = defineProps({
  visible: Boolean,
  initialAssignees: { type: Array, default: () => [] },
  templateRules: { type: Array, default: () => [] },
  getTemplateFieldOptions: {
    type: Function as PropType<(id: number) => Map<string, string>>,
    default: () => new Map()
  },
  usernameToDisplayName: { type: Object, default: () => ({}) },
  modes: {
    type: Array,
    default: () => ["system", "user", "team", "department", "on_call", "template"]
  }
})

const emit = defineEmits(["update:visible", "confirm", "update-user-names"])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
})

const tempAssignees = ref<any[]>([])

const allTabs = [
  { id: "system", label: "规则", icon: Setting },
  { id: "user", label: "用户", icon: User },
  { id: "team", label: "团队", icon: OfficeBuilding },
  { id: "department", label: "部门", icon: OfficeBuilding },
  { id: "on_call", label: "值班", icon: Clock },
  { id: "template", label: "模板", icon: Document }
]

const tabs = computed(() => {
  return allTabs.filter((t) => (props.modes as string[]).includes(t.id))
})

const currentTab = ref(tabs.value[0]?.id || "system")

const ruleOptions = [
  { label: "指定名单", value: "appoint" },
  { label: "工单创建人", value: "founder" },
  { label: "模板变量", value: "template" },
  { label: "部门领导", value: "leaders" },
  { label: "分管领导", value: "main_leader" },
  { label: "值班人员", value: "on_call" },
  { label: "关联团队", value: "team" }
]

watch(
  () => props.visible,
  (val) => {
    if (val) {
      tempAssignees.value = JSON.parse(JSON.stringify(props.initialAssignees))
      if (tabs.value.length > 0) {
        currentTab.value = tabs.value[0].id
      }
    }
  }
)

const getSystemRuleKeys = () => tempAssignees.value.map((a) => a.rule)

const toggleSystemRule = (r: string) => {
  const i = tempAssignees.value.findIndex((a) => a.rule === r)
  if (i > -1) tempAssignees.value.splice(i, 1)
  else tempAssignees.value.push({ rule: r, values: [] })
}

const getUserKeys = () => {
  const a = tempAssignees.value.find((x) => x.rule === "appoint")
  return a ? a.values : []
}
const onUserSelected = (users: any[]) => {
  const usernames = users.map((u) => u.name)
  const i = tempAssignees.value.findIndex((a) => a.rule === "appoint")
  if (i > -1) tempAssignees.value[i].values = usernames
  else tempAssignees.value.push({ rule: "appoint", values: usernames })

  const nameMap: Record<string, string> = {}
  users.forEach((u) => {
    if (u.username) {
      nameMap[u.username] = u.display_name
    }
  })
  emit("update-user-names", nameMap)
}

const getTeamKeys = () => {
  const a = tempAssignees.value.find((x) => x.rule === "team")
  return a ? a.values : []
}
const toggleTeam = (id: string) => {
  let a = tempAssignees.value.find((x) => x.rule === "team")
  if (!a) {
    a = { rule: "team", values: [] }
    tempAssignees.value.push(a)
  }
  const idx = a.values.indexOf(id)
  if (idx > -1) a.values.splice(idx, 1)
  else a.values.push(id)
  if (a.values.length === 0) tempAssignees.value = tempAssignees.value.filter((x) => x.rule !== "team")
}

const getRotaKeys = () => {
  const a = tempAssignees.value.find((x) => x.rule === "on_call")
  return a ? a.values : []
}
const toggleRota = (id: string) => {
  let a = tempAssignees.value.find((x) => x.rule === "on_call")
  if (!a) {
    a = { rule: "on_call", values: [] }
    tempAssignees.value.push(a)
  }
  const idx = a.values.indexOf(id)
  if (idx > -1) a.values.splice(idx, 1)
  else a.values.push(id)
  if (a.values.length === 0) tempAssignees.value = tempAssignees.value.filter((x) => x.rule !== "on_call")
}

const getDepartmentKeys = () => {
  const a = tempAssignees.value.find((x) => x.rule === "department")
  return a ? a.values : []
}
const setDepartmentKeys = (ids: string[]) => {
  let a = tempAssignees.value.find((x) => x.rule === "department")
  if (!a) {
    a = { rule: "department", values: [] }
    tempAssignees.value.push(a)
  }
  a.values = ids
  if (a.values.length === 0) tempAssignees.value = tempAssignees.value.filter((x) => x.rule !== "department")
}

const addTemplateRuleFromTab = (values: [string, string]) => {
  tempAssignees.value.push({ rule: "template", values: values })
}

const removeRule = (i: number) => tempAssignees.value.splice(i, 1)

const getFetchMethod = (type: string) => {
  return receiverSelectorRegistry.getStrategy(type)?.fetchList
}

const handleLoadedItems = (items: any[]) => {
  const map: Record<string, string> = {}
  items.forEach((item) => {
    map[String(item.id)] = item.name || item.path
  })
  emit("update-user-names", map)
}

const handleConfirm = () => {
  emit("confirm", JSON.parse(JSON.stringify(tempAssignees.value)))
  dialogVisible.value = false
}

const getRuleLabel = (r: string) => ruleOptions.find((o) => o.value === r)?.label || r
const getRuleContentPreview = (a: any) => {
  if (a.rule === "template")
    return `${(props.templateRules as any[]).find((t) => t.id.toString() === a.values[0])?.name || "模板"} : ${a.values[1]}`

  if (["founder", "leaders", "main_leader"].includes(a.rule)) {
    return "动态计算逻辑"
  }

  return a.values.map((v: string) => props.usernameToDisplayName[v] || v).join(", ")
}
</script>

<style lang="scss" scoped>
.selector-container {
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 60vh;
  margin: 0;
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
}
.selector-layout {
  flex: 1;
  display: flex;
  overflow: hidden; /* 锁定外层容器，只允许内部 Pane 滚动 */
  min-height: 0;
}

.pane-pick {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #f1f5f9;
  min-height: 0;
}
.pick-header {
  padding: 12px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    font-size: 13px;
    font-weight: 800;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }
}
.type-segmented {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
  .seg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    color: #94a3b8;
    transition: all 0.2s;
    &:hover {
      color: #475569;
    }
    &.active {
      background: #fff;
      color: #3b82f6;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
  }
}
.pick-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 24px;
}

.pane-result {
  width: 340px;
  background: #fcfdfe;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.result-header {
  padding: 16px 24px;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    font-weight: 800;
    color: #1e293b;
  }
  .result-badge {
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 900;
  }
}
.result-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-token {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  gap: 14px;
  .token-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    .token-cat {
      font-size: 10px;
      font-weight: 900;
      color: #3b82f6;
      text-transform: uppercase;
    }
    .token-val {
      font-size: 13px;
      font-weight: 700;
      color: #1e3a8a;
    }
  }
  .token-close {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #dbeafe;
    color: #94a3b8;
    cursor: pointer;
    &:hover {
      color: #ef4444;
      border-color: #fca5a5;
      transform: rotate(90deg);
    }
  }
}

.user-embed-wrapper {
  height: calc(100% + 28px);
  margin: -12px -24px;
  display: flex;
  flex-direction: column;
}
</style>
