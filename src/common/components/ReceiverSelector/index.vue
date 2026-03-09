<template>
  <FormDialog
    v-model="dialogVisible"
    :title="title"
    width="900px"
    top="5vh"
    @confirm="handleConfirm"
    @cancel="dialogVisible = false"
    class="receiver-selector-dialog"
  >
    <div class="selector-container">
      <div class="selector-layout">
        <!-- 1. 左栏: 动态选择区 -->
        <div class="pane-pick">
          <div class="pick-header">
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
            <UserTab v-else-if="currentTab === 'user'" :selected-usernames="getUserKeys()" @change="onUserSelected" />

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
              :template-rules="consolidatedTemplateRules"
              :get-template-field-options="consolidatedGetTemplateFieldOptions"
              @add="addTemplateRuleFromTab"
            />
          </div>
        </div>

        <!-- 2. 右栏: 结果面板 -->
        <div class="pane-result">
          <div class="result-header">
            <span>{{ resultPanelTitle }}</span>
            <div class="result-badge">{{ assigneesManager.tempAssignees.value.length }}</div>
          </div>
          <div class="result-body">
            <div v-if="assigneesManager.tempAssignees.value.length === 0" class="empty-placeholder">
              <el-icon><Files /></el-icon>
              <p>{{ emptyText }}</p>
              <span>请从左栏点击添加策略项</span>
            </div>
            <div class="token-list">
              <div
                v-for="(rule, idx) in assigneesManager.tempAssignees.value"
                :key="`${rule.rule}-${idx}`"
                class="strategy-token"
              >
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
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, PropType, toRef } from "vue"
import { Setting, User, OfficeBuilding, Document, Files, Close, Clock } from "@element-plus/icons-vue"
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import SystemTab from "./tabs/SystemTab.vue"
import OptionsTab from "./tabs/OptionsTab.vue"
import TemplateTab from "./tabs/TemplateTab.vue"
import TreeTab from "./tabs/TreeTab.vue"
import UserTab from "./tabs/UserTab.vue"
import { receiverSelectorRegistry } from "./strategies"
import { useAssignees } from "./composables/useAssignees"
import { useTemplateRules } from "@/common/composables/useTemplateRules"

const {
  fetchTemplates,
  templateRules: internalTemplateRules,
  getTemplateFieldOptions: internalGetTemplateFieldOptions
} = useTemplateRules()

const props = defineProps({
  visible: Boolean,
  title: { type: String, default: "配置/管理接收者策略" },
  resultPanelTitle: { type: String, default: "已选逻辑项" },
  emptyText: { type: String, default: "暂无接收者" },
  initialAssignees: { type: Array, default: () => [] },
  initialTab: { type: String, default: "" },
  templateRules: { type: Array, default: () => [] },
  getTemplateFieldOptions: {
    type: Function as PropType<(id: number) => Map<string, string>>,
    default: () => new Map()
  },
  usernameToDisplayName: { type: Object, default: () => ({}) },
  workflowId: { type: Number, default: undefined },
  modes: {
    type: Array,
    default: () => ["system", "user", "team", "department", "on_call", "template"]
  },
  ruleOptions: {
    type: Array as PropType<Array<{ label: string; value: string }>>,
    default: () => [
      { label: "指定人员", value: "appoint" },
      { label: "工单创建人", value: "founder" },
      { label: "模板变量", value: "template" },
      { label: "部门领导", value: "leaders" },
      { label: "分管领导", value: "main_leader" },
      { label: "值班人员", value: "on_call" },
      { label: "关联团队", value: "team" },
      { label: "部门", value: "department" }
    ]
  }
})

const emit = defineEmits(["update:visible", "confirm", "update-user-names"])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
})

// 使用 composable 管理 assignees 状态
const assigneesManager = useAssignees(toRef(props, "initialAssignees"))

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

watch(
  () => props.visible,
  (val) => {
    if (val) {
      assigneesManager.init()
      if (tabs.value.length > 0) {
        // 如果有指定初始 tab 且该 tab 存在，则使用指定的 tab
        if (props.initialTab && tabs.value.some((t) => t.id === props.initialTab)) {
          currentTab.value = props.initialTab
        } else {
          currentTab.value = tabs.value[0].id
        }
      }
    }
  }
)

// 简化的 getter 函数
const getSystemRuleKeys = () => assigneesManager.getSystemRuleKeys()
const getUserKeys = () => assigneesManager.getKeys("appoint")
const getTeamKeys = () => assigneesManager.getKeys("team")
const getRotaKeys = () => assigneesManager.getKeys("on_call")
const getDepartmentKeys = () => assigneesManager.getKeys("department")

// 简化的 toggle 函数
const toggleSystemRule = (r: string) => assigneesManager.toggleSystemRule(r)
const toggleTeam = (id: string) => assigneesManager.toggleValue("team", id)
const toggleRota = (id: string) => assigneesManager.toggleValue("on_call", id)
const setDepartmentKeys = (ids: string[]) => assigneesManager.setValues("department", ids)
const addTemplateRuleFromTab = (values: [string, string]) => assigneesManager.addRule("template", values)
const removeRule = (i: number) => assigneesManager.removeRule(i)

// 模板数据合并处理: 如果父组件没传，就用内部加载的
const consolidatedTemplateRules = computed(() => {
  return props.templateRules.length > 0 ? props.templateRules : internalTemplateRules.value
})

const consolidatedGetTemplateFieldOptions = (id: number) => {
  const result = internalGetTemplateFieldOptions(id)
  return result.size > 0 ? result : props.getTemplateFieldOptions(id)
}

// 切换到模板 Tab 时按需加载
watch(currentTab, (newTab) => {
  if (newTab === "template" && props.workflowId) {
    fetchTemplates(props.workflowId)
  }
})

// 用户选择处理
const onUserSelected = (users: any[]) => {
  const usernames = users.map((u) => u.username)
  assigneesManager.setValues("appoint", usernames)

  const nameMap: Record<string, string> = {}
  users.forEach((u) => {
    if (u.username) {
      nameMap[u.username] = u.display_name || u.username
    }
  })
  emit("update-user-names", nameMap)
}

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
  emit("confirm", JSON.parse(JSON.stringify(assigneesManager.tempAssignees.value)))
  dialogVisible.value = false
}

const getRuleLabel = (r: string) => props.ruleOptions.find((o) => o.value === r)?.label || r
const getRuleContentPreview = (a: any) => {
  if (a.rule === "template")
    return `${(consolidatedTemplateRules.value as any[]).find((t: any) => t.id.toString() === a.values[0])?.name || "模板"} : ${a.values[1]}`

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
  padding: 12px 16px;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
}
.type-segmented {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  .seg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    color: #64748b;
    background: transparent;
    border: 1px solid transparent;
    transition: all 0.2s;
    white-space: nowrap;
    &:hover {
      background: #f8fafc;
      color: #475569;
      border-color: #e2e8f0;
    }
    &.active {
      background: #eff6ff;
      color: #3b82f6;
      border-color: #3b82f6;
      .el-icon {
        color: #3b82f6;
      }
    }
    .el-icon {
      font-size: 14px;
      color: #94a3b8;
    }
  }
}
.pick-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
}

.pane-result {
  width: 380px;
  background: #fcfdfe;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.result-header {
  padding: 16px 20px;
  flex-shrink: 0;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span {
    font-weight: 700;
    font-size: 13px;
    color: #1e293b;
  }
  .result-badge {
    color: #3b82f6;
    background: #eff6ff;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
  }
}
.result-body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  position: relative;
}

.token-list {
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
  transition: all 0.2s;
  .token-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
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
      word-break: break-word;
      overflow-wrap: break-word;
    }
  }
  .token-close {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #dbeafe;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
      color: #ef4444;
      border-color: #fca5a5;
      transform: rotate(90deg);
    }
  }
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #cbd5e1;
  text-align: center;
  .el-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
  p {
    font-size: 14px;
    font-weight: 700;
    margin: 0 0 4px 0;
  }
  span {
    font-size: 12px;
  }
}
</style>
