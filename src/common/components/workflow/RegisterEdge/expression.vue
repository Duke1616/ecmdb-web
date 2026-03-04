<template>
  <div class="expression-builder">
    <!-- 左侧：工作台 -->
    <div class="workbench">
      <div class="workbench-header">
        <div class="header-main">
          <div class="status-indicator" />
          <span class="title">逻辑工作台</span>
        </div>
        <div class="header-meta">配置工作流条件并集</div>
      </div>

      <div class="workbench-body">
        <div class="logic-group" v-for="(group, groupIndex) in conditionGroups" :key="groupIndex">
          <div class="group-inner">
            <div class="group-banner">
              <span class="banner-text">逻辑组 {{ String(groupIndex + 1).padStart(2, "0") }}</span>
              <el-button
                v-if="conditionGroups.length > 1"
                type="danger"
                link
                :icon="DeleteFilled"
                @click="removeConditionGroup(groupIndex)"
              >
                移除
              </el-button>
            </div>

            <div class="group-slots">
              <!-- Inline Config Area -->
              <div v-if="activeConfigGroup === groupIndex" class="inline-config-section">
                <div class="section-header">
                  <div class="title">
                    <el-icon><EditPen /></el-icon>
                    <span>配置判定逻辑</span>
                  </div>
                  <el-button link :icon="Close" @click="activeConfigGroup = -1" />
                </div>
                <div class="section-body">
                  <Rule ref="ruleRef" :templates="props.templates" />
                </div>
                <div class="section-footer">
                  <el-button size="small" @click="activeConfigGroup = -1">取消</el-button>
                  <el-button size="small" type="primary" class="indigo-btn" @click="submitForm(groupIndex)">
                    {{ editingConditionIndex === -1 ? "注入逻辑" : "保存修改" }}
                  </el-button>
                </div>
              </div>

              <div
                v-if="group.conditions.length < 1 && activeConfigGroup !== groupIndex"
                class="slot-placeholder"
                @click="activeConfigGroup = groupIndex"
              >
                <el-icon><Plus /></el-icon>
                <span>点击插入过滤原子...</span>
              </div>

              <VueDraggable
                v-model="group.conditions"
                :animation="250"
                group="rotaGroup"
                ghostClass="drag-ghost"
                chosenClass="drag-chosen"
                handle=".drag-handle"
                itemKey="id"
                class="atom-list"
              >
                <div v-for="(item, itemIndex) in group.conditions" :key="item" class="atom-item">
                  <div class="drag-handle">
                    <el-icon><Menu /></el-icon>
                  </div>
                  <div class="atom-content" @click="handleEditCondition(groupIndex, Number(itemIndex), item)">
                    <span v-if="showChinese" class="text-cn">{{ translateExpressionToChinese(item) }}</span>
                    <span v-else class="text-en">{{ item }}</span>
                  </div>
                  <div class="atom-delete" @click="removeAndToLeftList(Number(itemIndex), group)">
                    <el-icon><Close /></el-icon>
                  </div>
                </div>
              </VueDraggable>

              <div
                v-if="group.conditions.length > 0 && activeConfigGroup !== groupIndex"
                class="mini-add-atom"
                @click="activeConfigGroup = groupIndex"
              >
                <el-icon><Plus /></el-icon>
                <span>追加原子</span>
              </div>
            </div>
          </div>

          <div class="union-divider" v-if="groupIndex < conditionGroups.length - 1">
            <div class="line" />
            <div class="label">OR BRANCH</div>
            <div class="line" />
          </div>
        </div>

        <div class="add-group-action" @click="addConditionGroup">
          <el-icon><Fold /></el-icon>
          <span>扩展条件并集 (OR)</span>
        </div>
      </div>
    </div>

    <!-- 右侧：输出终端 -->
    <div class="terminal-panel">
      <div class="terminal-header">
        <div class="header-left">
          <el-icon><MonitorIcon /></el-icon>
          <span class="title">输出预览</span>
        </div>
        <div class="header-right">
          <el-switch
            v-model="showChinese"
            inline-prompt
            active-text="CN"
            inactive-text="EN"
            style="--el-switch-on-color: #3b82f6"
          />
        </div>
      </div>

      <div class="terminal-body">
        <div class="preview-tile">
          <div class="tile-bg">SQL</div>
          <div class="tile-content" :class="{ 'is-empty': !expression }">
            <div v-if="expression" class="sql-code">
              <code v-if="showChinese" class="cn-text">{{ getChineseExpression() }}</code>
              <code v-else class="en-text">{{ expression }}</code>
            </div>
            <div v-else class="empty-state">待生成逻辑...</div>
          </div>
          <div class="tile-footer">
            <el-button-group>
              <el-button type="primary" :icon="CopyDocument" link @click="copyExpression">复制</el-button>
              <el-button type="info" :icon="Download" link @click="exportExpression">导出</el-button>
            </el-button-group>
          </div>
        </div>

        <div class="metrics-row">
          <div class="metric-card">
            <span class="m-val">{{ conditionGroups.length }}</span>
            <span class="m-lab">组合量</span>
          </div>
          <div class="metric-card">
            <span class="m-val">{{ expression.length }}</span>
            <span class="m-lab">总字符</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, computed, nextTick } from "vue"
import { ElMessage } from "element-plus"
import {
  CopyDocument,
  Download,
  DeleteFilled,
  Close,
  Plus,
  Fold,
  Menu,
  Monitor as MonitorIcon,
  EditPen
} from "@element-plus/icons-vue"
import Rule from "./rule.vue"
import { template } from "@/api/template/types/template"
import { VueDraggable } from "vue-draggable-plus"

interface Props {
  expression: string
  templates: template[]
}

const props = defineProps<Props>()
const emit = defineEmits(["update:expression"])

const conditionGroups = ref<any[]>([])
const showChinese = ref(false)
const ruleRef = ref()
const activeConfigGroup = ref<number>(-1) // 控制哪一组正在行内编辑
const editingConditionIndex = ref<number>(-1) // 正在编辑的原子在组内的索引

onMounted(() => {
  initData()
})

const initData = () => {
  if (props.expression) {
    const groups = props.expression.split(" || ")
    conditionGroups.value = groups.map((group) => {
      // 只有当组被成对的括号包裹时才剥离，例如 (A && B)
      // 防止误删 $env in ('val') 这种末尾自带括号的表达式
      let processedGroup = group.trim()
      if (processedGroup.startsWith("(") && processedGroup.endsWith(")")) {
        processedGroup = processedGroup.substring(1, processedGroup.length - 1)
      }
      return {
        conditions: processedGroup.split(" && ").filter((item) => item !== "")
      }
    })
  } else {
    conditionGroups.value = [{ conditions: [] }]
  }
}

watch(
  conditionGroups,
  () => {
    updateExpression()
  },
  { deep: true }
)

const updateExpression = () => {
  const groupExpressions = conditionGroups.value
    .filter((group) => group.conditions.length > 0)
    .map((group) => {
      if (group.conditions.length === 1) {
        return group.conditions[0]
      }
      return `(${group.conditions.join(" && ")})`
    })

  const newExpression = groupExpressions.join(" || ")
  emit("update:expression", newExpression)
}

const addConditionGroup = () => {
  conditionGroups.value.push({ conditions: [] })
  activeConfigGroup.value = conditionGroups.value.length - 1
  editingConditionIndex.value = -1
}

const handleEditCondition = async (groupIndex: number, itemIndex: number, expression: string) => {
  activeConfigGroup.value = groupIndex
  editingConditionIndex.value = itemIndex

  await nextTick()
  const ruleInstance = Array.isArray(ruleRef.value) ? ruleRef.value[0] : ruleRef.value
  if (ruleInstance) {
    ruleInstance.setExpression(expression)
  }
}

const removeConditionGroup = (index: number) => {
  conditionGroups.value.splice(index, 1)
  if (activeConfigGroup.value === index) activeConfigGroup.value = -1
}

const submitForm = (groupIndex: number) => {
  // NOTE: 在 v-for 中使用 ref 会被收集为数组
  const ruleInstance = Array.isArray(ruleRef.value) ? ruleRef.value[0] : ruleRef.value

  if (ruleInstance) {
    const condition = ruleInstance.getExpressionPreview()
    if (condition) {
      if (editingConditionIndex.value === -1) {
        conditionGroups.value[groupIndex].conditions.push(condition)
      } else {
        conditionGroups.value[groupIndex].conditions[editingConditionIndex.value] = condition
      }
      activeConfigGroup.value = -1
      editingConditionIndex.value = -1
    } else {
      ElMessage.warning("请完善条件配置")
    }
  }
}

const removeAndToLeftList = (itemIndex: number, group: any) => {
  group.conditions.splice(itemIndex, 1)
}

const copyExpression = () => {
  navigator.clipboard.writeText(props.expression)
  ElMessage.success("复制成功")
}

const exportExpression = () => {
  const blob = new Blob([props.expression], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "expression.sql"
  a.click()
  URL.revokeObjectURL(url)
}

const translateExpressionToChinese = (exp: string) => {
  const parts = exp.split(" ")
  if (parts.length < 3) return exp

  let left = parts[0]
  if (left.startsWith("$")) {
    left = left.substring(1)
  }
  const op = parts[1]
  const right = parts.slice(2).join(" ")

  const opMap: Record<string, string> = {
    "=": "等于",
    "!=": "不等于",
    ">": "大于",
    "<": "小于",
    in: "包含于",
    "not in": "不包含于"
  }

  let translatedLeft = left
  for (const template of props.templates) {
    if (template.rules) {
      if (Array.isArray(template.rules)) {
        const found = template.rules.find((r: any) => String(r.field) === left)
        if (found) {
          translatedLeft = `${template.name}.${found.title || found.name}`
          break
        }
      } else {
        for (const [key, value] of Object.entries(template.rules)) {
          if (value === left) {
            translatedLeft = `${template.name}.${key}`
            break
          }
        }
      }
    }
  }

  return `${translatedLeft} ${opMap[op] || op} ${right}`
}

const getChineseExpression = () => {
  if (!props.expression) return ""
  let chineseExp = props.expression

  chineseExp = chineseExp.replace(/ && /g, " 并且 ")
  chineseExp = chineseExp.replace(/ \|\| /g, " 或者 ")

  const atomRegex = /([$a-z0-9_.]+\s+[!=><|in|not in]+\s+[^&|()]+)/gi
  const atoms = props.expression.match(atomRegex) || []

  atoms.forEach((atom) => {
    chineseExp = chineseExp.replace(atom, translateExpressionToChinese(atom))
  })

  return chineseExp
}

const getExpression = () => {
  return computed(() => props.expression)
}

defineExpose({
  getExpression
})
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap");

.expression-builder {
  font-family: "Fira Sans", sans-serif;
  display: flex;
  height: 580px;
  gap: 24px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 20px;
  overflow: hidden;
}

// ── 工作台 ────────────────────────────────────────────────────────────
.workbench {
  flex: 5;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  min-width: 0;
}

.workbench-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f1f5f9;

  .header-main {
    display: flex;
    align-items: center;
    gap: 10px;

    .status-indicator {
      width: 7px;
      height: 7px;
      background: #3b82f6;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    }

    .title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.02em;
    }
  }

  .header-meta {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }
}

.workbench-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
  }
}

.logic-group {
  margin-bottom: 16px;
}

.group-inner {
  background: #fcfdfe;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
}

.group-banner {
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .banner-text {
    font-family: "Fira Code", monospace;
    font-size: 10px;
    font-weight: 800;
    color: #cbd5e1;
    letter-spacing: 0.1em;
  }
}

.group-slots {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// ── 行内配置区 ──────────────────────────────────────────────────────────
.inline-config-section {
  background: #ffffff;
  border: 1px solid #e0e7ff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.05);
  margin-bottom: 8px;

  .section-header {
    padding: 10px 16px;
    background: #f5f7ff;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 800;
      color: #6366f1;
    }
  }

  .section-body {
    padding: 16px;
  }

  .section-footer {
    padding: 10px 16px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    display: flex;
    justify-content: flex-end;
    gap: 8px;

    .indigo-btn {
      background: #6366f1;
      border: none;
      &:hover {
        background: #4f46e5;
      }
    }
  }
}

.slot-placeholder {
  height: 54px;
  border: 2px dashed #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  span {
    font-size: 12px;
    font-weight: 600;
  }
  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
    background: #eff6ff;
  }
}

.atom-item {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    transform: translateX(4px);
    border-color: #3b82f6;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  }

  .drag-handle {
    cursor: grab;
    color: #cbd5e1;
    margin-right: 12px;
  }

  .atom-content {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    .text-cn {
      color: #334155;
    }
    .text-en {
      color: #64748b;
      font-family: "Fira Code", monospace;
      font-size: 11px;
    }
  }

  .atom-delete {
    cursor: pointer;
    color: #cbd5e1;
    transition: color 0.2s;
    &:hover {
      color: #ef4444;
    }
  }
}

.mini-add-atom {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
  cursor: pointer;
  opacity: 0.6;
  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
}

.union-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0;
  .line {
    flex: 1;
    height: 1px;
    background: #f1f5f9;
  }
  .label {
    font-family: "Fira Code", monospace;
    font-size: 9px;
    font-weight: 800;
    color: #f59e0b;
  }
}

.add-group-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-style: solid;
    border-color: #3b82f6;
    background: #eff6ff;
    color: #3b82f6;
  }
}

// ── 终端面板 ────────────────────────────────────────────────────────────
.terminal-panel {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  border-radius: 16px;
  overflow: hidden;
}

.terminal-header {
  padding: 12px 20px;
  background: #1e293b;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #94a3b8;
    .title {
      font-family: "Fira Code", monospace;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
    }
  }
}

.terminal-body {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-tile {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  position: relative;

  .tile-bg {
    position: absolute;
    top: -5px;
    right: 5px;
    font-size: 32px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.02);
  }

  .tile-content {
    flex: 1;
    display: flex;
    &.is-empty {
      align-items: center;
      justify-content: center;
    }
    .sql-code {
      font-family: "Fira Code", monospace;
      font-size: 13px;
      line-height: 1.6;
      word-break: break-all;
      .cn-text {
        color: #facc15;
      }
      .en-text {
        color: #10b981;
      }
    }
    .empty-state {
      color: #475569;
      font-style: italic;
      font-size: 12px;
    }
  }

  .tile-footer {
    padding-top: 12px;
    border-top: 1px solid #334155;
    display: flex;
    justify-content: flex-end;
  }
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.metric-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 12px;
  text-align: center;
  .m-val {
    font-family: "Fira Code", monospace;
    font-size: 18px;
    font-weight: 800;
    color: #ffffff;
  }
  .m-val-sub {
    font-size: 11px;
    color: #64748b;
  }
  .m-lab {
    font-size: 9px;
    color: #64748b;
    text-transform: uppercase;
    margin-top: 2px;
  }
}

.drag-ghost {
  opacity: 0.5;
  background: #eff6ff;
}
.drag-chosen {
  border: 1px solid #3b82f6;
}
</style>
