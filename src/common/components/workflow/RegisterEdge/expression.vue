<template>
  <div class="filter-rule-builder">
    <!-- 顶部轻量工具条：不再堆砌大标题，与 FormDialog 标题自然呼应 -->
    <div class="builder-toolbar">
      <div class="toolbar-left">
        <div class="rule-status-pill">
          <span class="status-dot" />
          <span class="status-text">分支执行规则</span>
          <span class="rule-count-badge">{{ totalConditionCount }} 条条件</span>
        </div>
        <span class="toolbar-hint">满足任意条件组（OR）即流转；组内条件需全部满足（AND）</span>
      </div>

      <div class="toolbar-right">
        <!-- 精致胶囊切换：语义解释 vs SQL 表达式 -->
        <div class="view-mode-tabs">
          <button
            type="button"
            class="tab-btn"
            :class="{ active: !showChinese }"
            @click="showChinese = false"
          >
            SQL 表达式
          </button>
          <button
            type="button"
            class="tab-btn"
            :class="{ active: showChinese }"
            @click="showChinese = true"
          >
            中文语义
          </button>
        </div>
      </div>
    </div>

    <!-- 中间主体：流式规则列表 -->
    <div class="builder-scroll-canvas">
      <div class="groups-flow">
        <template v-for="(group, gIndex) in conditionGroups" :key="group.id">
          <!-- 条件组卡片：轻量平板化，去套娃感 -->
          <div class="group-panel">
            <!-- 组顶部栏 -->
            <div class="group-panel-header">
              <div class="group-meta">
                <span class="group-index">第 {{ gIndex + 1 }} 组条件</span>
                <span class="group-logic-label">（组内所有条件必须同时成立）</span>
              </div>
              <div class="group-ops">
                <el-button
                  v-if="conditionGroups.length > 1"
                  type="danger"
                  link
                  class="remove-group-btn"
                  @click="removeGroup(gIndex)"
                >
                  <el-icon><Delete /></el-icon>
                  <span>移除此组</span>
                </el-button>
              </div>
            </div>

            <!-- 组内条件流 -->
            <div class="group-panel-body">
              <VueDraggable
                v-model="group.items"
                :animation="180"
                handle=".row-drag"
                itemKey="id"
                class="rows-stack"
              >
                <div v-for="(item, iIndex) in group.items" :key="item.id" class="row-container">
                  <!-- 行间逻辑 AND 徽章 -->
                  <div v-if="iIndex > 0" class="row-divider">
                    <span class="divider-line" />
                    <span class="and-tag">且 (AND)</span>
                    <span class="divider-line" />
                  </div>

                  <!-- 核心自然语义条件行：去掉繁琐无用的字段/关系/期望值标签，自然平铺 -->
                  <div class="fluent-row">
                    <!-- 拖拽手柄 -->
                    <div class="row-drag" title="按住拖拽调整顺序">
                      <el-icon><Rank /></el-icon>
                    </div>

                    <!-- 1. 所属表单（多表单时显示） -->
                    <div v-if="templates.length > 1" class="fluent-col col-template">
                      <el-select
                        v-model="item.templateName"
                        placeholder="所属表单"
                        class="clean-select"
                        @change="() => handleTemplateChange(item)"
                      >
                        <el-option
                          v-for="tmpl in templates"
                          :key="tmpl.name"
                          :label="tmpl.name"
                          :value="tmpl.name"
                        />
                      </el-select>
                    </div>

                    <!-- 2. 目标字段 -->
                    <div class="fluent-col col-field">
                      <el-select
                        v-model="item.field"
                        placeholder="选择属性字段"
                        class="clean-select"
                        filterable
                        @change="() => handleFieldChange(item)"
                      >
                        <template #prefix>
                          <el-icon class="col-prefix-icon"><Files /></el-icon>
                        </template>
                        <el-option
                          v-for="field in getFieldsForTemplate(item.templateName)"
                          :key="field.field"
                          :label="field.title || field.field"
                          :value="field.field"
                        >
                          <div class="field-item">
                            <span class="f-name">{{ field.title || field.field }}</span>
                            <span class="f-code">{{ field.field }}</span>
                          </div>
                        </el-option>
                      </el-select>
                    </div>

                    <!-- 3. 操作符 -->
                    <div class="fluent-col col-operator">
                      <el-select
                        v-model="item.operator"
                        placeholder="条件关系"
                        class="clean-select"
                        @change="() => handleOperatorChange(item)"
                      >
                        <el-option
                          v-for="op in operatorOptions"
                          :key="op.value"
                          :label="op.label"
                          :value="op.value"
                        >
                          <div class="op-item">
                            <span class="op-badge">{{ op.symbol }}</span>
                            <span class="op-name">{{ op.desc }}</span>
                          </div>
                        </el-option>
                      </el-select>
                    </div>

                    <!-- 4. 期望值输入/选择 -->
                    <div class="fluent-col col-value">
                      <!-- 预设枚举下拉 -->
                      <template v-if="hasPredefinedOptions(item)">
                        <el-select
                          v-model="item.value"
                          :multiple="isMultipleOperator(item.operator)"
                          collapse-tags
                          collapse-tags-tooltip
                          placeholder="选择匹配目标值"
                          class="clean-select"
                        >
                          <el-option
                            v-for="opt in getOptionsForField(item)"
                            :key="opt.value"
                            :label="opt.label"
                            :value="opt.value"
                          />
                        </el-select>
                      </template>

                      <!-- 多选输入模式（in / not in，且非预设枚举） -->
                      <template v-else-if="isMultipleOperator(item.operator)">
                        <el-select
                          v-model="item.value"
                          multiple
                          filterable
                          allow-create
                          default-first-option
                          placeholder="输入目标值，按回车添加"
                          class="clean-select"
                        />
                      </template>

                      <!-- 普通文本/数字输入 -->
                      <template v-else>
                        <el-input
                          :model-value="Array.isArray(item.value) ? item.value.join(',') : String(item.value ?? '')"
                          placeholder="输入判定值（字符串/数值）"
                          clearable
                          class="clean-input"
                          @update:model-value="(val) => (item.value = val)"
                        />
                      </template>
                    </div>

                    <!-- 删除本行 -->
                    <div class="fluent-col col-action">
                      <button
                        type="button"
                        class="row-delete-btn"
                        title="删除该条件"
                        @click="removeCondition(group, iIndex)"
                      >
                        <el-icon><Close /></el-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </VueDraggable>

              <!-- 添加本组条件 -->
              <div class="group-bottom-actions">
                <button type="button" class="inline-add-row-btn" @click="addCondition(group)">
                  <el-icon><Plus /></el-icon>
                  <span>添加条件（AND）</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 条件组之间的 OR 分割连接 -->
          <div v-if="gIndex < conditionGroups.length - 1" class="groups-or-junction">
            <span class="junction-line" />
            <div class="junction-pill">
              <span class="or-symbol">OR</span>
              <span class="or-desc">或者满足以下组</span>
            </div>
            <span class="junction-line" />
          </div>
        </template>

        <!-- 添加新条件组 -->
        <div class="append-group-zone">
          <button type="button" class="append-group-btn" @click="addGroup">
            <el-icon><FolderAdd /></el-icon>
            <span>新增条件组（OR 分支）</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 底部极简精致的实时表达式预览卡片 -->
    <div class="builder-expression-footer">
      <div class="footer-status-tag">
        <el-icon><Operation /></el-icon>
        <span>实时逻辑</span>
      </div>

      <div class="footer-code-view">
        <template v-if="expression">
          <span v-if="showChinese" class="code-line cn">{{ chineseExpression }}</span>
          <span v-else class="code-line sql">{{ expression }}</span>
        </template>
        <span v-else class="code-empty">
          暂无过滤规则，该连线将无条件直接放行
        </span>
      </div>

      <div class="footer-tools" v-if="expression">
        <el-button type="primary" link size="small" class="copy-link" @click="copyExpression">
          <el-icon><CopyDocument /></el-icon>
          <span>复制</span>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue"
import {
  Rank,
  Close,
  Plus,
  Delete,
  FolderAdd,
  Operation,
  CopyDocument,
  Files
} from "@element-plus/icons-vue"
import { VueDraggable } from "vue-draggable-plus"
import { copyToClipboard } from "@@/utils/clipboard"
import type { template } from "@/api/ticket/template/types/template.js"

interface Props {
  expression: string
  templates: template[]
}

const props = defineProps<Props>()
const emit = defineEmits(["update:expression"])

// ── 类型定义 ─────────────────────────────────────────────────────────────
interface ConditionItem {
  id: string
  templateName: string
  field: string
  operator: string
  value: string | string[]
}

interface ConditionGroup {
  id: string
  items: ConditionItem[]
}

interface FieldOption {
  field: string
  title: string
  options?: Array<{ label: string; value: string | number }>
}

// ── 状态定义 ─────────────────────────────────────────────────────────────
const conditionGroups = ref<ConditionGroup[]>([])
const showChinese = ref(false)

const totalConditionCount = computed(() => {
  return conditionGroups.value.reduce((acc, g) => acc + g.items.filter((i) => i.field).length, 0)
})

// 常用枚举预设
const PRESET_OPTIONS_MAP = new Map<string, Array<{ label: string; value: string }>>([
  [
    "cluster_name",
    [
      { label: "集群A", value: "cluster_a" },
      { label: "集群B", value: "cluster_b" }
    ]
  ],
  [
    "status",
    [
      { label: "运行中 (running)", value: "running" },
      { label: "已停止 (stopped)", value: "stopped" }
    ]
  ],
  [
    "env",
    [
      { label: "生产环境 (prod)", value: "prod" },
      { label: "预发环境 (stage)", value: "stage" },
      { label: "测试环境 (test)", value: "test" },
      { label: "开发环境 (dev)", value: "dev" }
    ]
  ]
])

// 操作符配置
const operatorOptions = [
  { label: "等于 (=)", value: "=", symbol: "==", desc: "等于指定值" },
  { label: "不等于 (!=)", value: "!=", symbol: "!=", desc: "不等于指定值" },
  { label: "大于 (>)", value: ">", symbol: ">", desc: "数值大于" },
  { label: "小于 (<)", value: "<", symbol: "<", desc: "数值小于" },
  { label: "包含于 (IN)", value: "in", symbol: "IN", desc: "在列表中" },
  { label: "不包含于 (NIN)", value: "not in", symbol: "NIN", desc: "不在列表中" }
]

const isMultipleOperator = (op: string) => op === "in" || op === "not in"

// ── 模板与字段工具 ────────────────────────────────────────────────────────
const templatesMap = computed(() => {
  const map = new Map<string, template>()
  props.templates.forEach((t) => map.set(t.name, t))
  return map
})

/** 获取模板下的字段列表 */
const getFieldsForTemplate = (templateName: string): FieldOption[] => {
  const tmpl = templatesMap.value.get(templateName) || props.templates[0]
  if (!tmpl || !tmpl.rules) return []

  const result: FieldOption[] = []
  if (Array.isArray(tmpl.rules)) {
    for (const r of tmpl.rules) {
      if (!r || !r.field) continue
      const opts = r.options || r.props?.options
      result.push({
        field: String(r.field),
        title: r.title || r.name || String(r.field),
        options: Array.isArray(opts) ? opts : undefined
      })
    }
  } else if (typeof tmpl.rules === "object") {
    for (const [key, val] of Object.entries(tmpl.rules)) {
      result.push({
        field: String(val),
        title: key
      })
    }
  }
  return result
}

const hasPredefinedOptions = (item: ConditionItem): boolean => {
  if (!item.field) return false
  if (PRESET_OPTIONS_MAP.has(item.field)) return true
  const fields = getFieldsForTemplate(item.templateName)
  const target = fields.find((f) => f.field === item.field)
  return !!(target?.options && target.options.length > 0)
}

const getOptionsForField = (item: ConditionItem): Array<{ label: string; value: string | number }> => {
  if (!item.field) return []
  if (PRESET_OPTIONS_MAP.has(item.field)) {
    return PRESET_OPTIONS_MAP.get(item.field)!
  }
  const fields = getFieldsForTemplate(item.templateName)
  const target = fields.find((f) => f.field === item.field)
  return target?.options || []
}

// ── 交互事件 ──────────────────────────────────────────────────────────────
const createUniqueId = () => Math.random().toString(36).substring(2, 9)

const createDefaultItem = (templateName?: string): ConditionItem => {
  const tmplName = templateName || (props.templates[0]?.name ?? "")
  const fields = getFieldsForTemplate(tmplName)
  const defaultField = fields[0]?.field ?? ""
  return {
    id: createUniqueId(),
    templateName: tmplName,
    field: defaultField,
    operator: "=",
    value: ""
  }
}

const handleTemplateChange = (item: ConditionItem) => {
  const fields = getFieldsForTemplate(item.templateName)
  item.field = fields[0]?.field ?? ""
  item.value = isMultipleOperator(item.operator) ? [] : ""
}

const handleFieldChange = (item: ConditionItem) => {
  item.value = isMultipleOperator(item.operator) ? [] : ""
}

const handleOperatorChange = (item: ConditionItem) => {
  if (isMultipleOperator(item.operator)) {
    if (!Array.isArray(item.value)) {
      item.value = item.value ? [String(item.value)] : []
    }
  } else {
    if (Array.isArray(item.value)) {
      item.value = item.value[0] || ""
    }
  }
}

const addCondition = (group: ConditionGroup) => {
  group.items.push(createDefaultItem(group.items[0]?.templateName))
}

const removeCondition = (group: ConditionGroup, index: number) => {
  group.items.splice(index, 1)
  if (group.items.length === 0) {
    group.items.push(createDefaultItem())
  }
}

const addGroup = () => {
  conditionGroups.value.push({
    id: createUniqueId(),
    items: [createDefaultItem()]
  })
}

const removeGroup = (index: number) => {
  conditionGroups.value.splice(index, 1)
}

// ── 表达式解析与生成 ──────────────────────────────────────────────────────
const parseSingleCondition = (str: string): ConditionItem => {
  const ops = ["not in", "in", "!=", "=", ">", "<"]
  let foundOp = "="
  let leftRaw = ""
  let rightRaw = ""

  for (const op of ops) {
    const separator = ` ${op} `
    if (str.includes(separator)) {
      foundOp = op
      const parts = str.split(separator)
      leftRaw = parts[0].trim()
      rightRaw = parts.slice(1).join(separator).trim()
      break
    }
  }

  let field = leftRaw.startsWith("$") ? leftRaw.substring(1) : leftRaw

  let templateName = ""
  for (const t of props.templates) {
    const fields = getFieldsForTemplate(t.name)
    if (fields.some((f) => f.field === field)) {
      templateName = t.name
      break
    }
  }
  if (!templateName && props.templates.length > 0) {
    templateName = props.templates[0].name
  }

  let value: string | string[] = ""
  if (foundOp === "in" || foundOp === "not in") {
    let cleanRight = rightRaw
    if (cleanRight.startsWith("(") && cleanRight.endsWith(")")) {
      cleanRight = cleanRight.substring(1, cleanRight.length - 1)
    }
    const matches = cleanRight.match(/'([^']*)'/g)
    if (matches) {
      value = matches.map((m) => m.replace(/^'|'$/g, ""))
    } else {
      value = cleanRight ? cleanRight.split(",").map((s) => s.trim().replace(/^'|'$/g, "")) : []
    }
  } else {
    value = rightRaw.replace(/^'|'$/g, "")
  }

  return {
    id: createUniqueId(),
    templateName,
    field,
    operator: foundOp,
    value
  }
}

const initData = () => {
  if (props.expression && props.expression.trim()) {
    const rawGroups = props.expression.split(" || ")
    conditionGroups.value = rawGroups
      .map((gStr) => {
        let processed = gStr.trim()
        if (processed.startsWith("(") && processed.endsWith(")")) {
          processed = processed.substring(1, processed.length - 1).trim()
        }
        const conditionStrings = processed
          .split(" && ")
          .map((s) => s.trim())
          .filter(Boolean)
        return {
          id: createUniqueId(),
          items: conditionStrings.map(parseSingleCondition)
        }
      })
      .filter((g) => g.items.length > 0)
  }

  if (conditionGroups.value.length === 0) {
    conditionGroups.value = [
      {
        id: createUniqueId(),
        items: [createDefaultItem()]
      }
    ]
  }
}

const buildExpressionString = (): string => {
  const validGroups = conditionGroups.value
    .map((group) => {
      return group.items
        .filter((item) => item.field && item.operator)
        .map((item) => {
          const left = `$${item.field}`
          const op = item.operator
          let right = ""
          if (op === "in" || op === "not in") {
            const arr = Array.isArray(item.value) ? item.value : item.value ? [item.value] : []
            right = `(${arr.map((v) => `'${v}'`).join(", ")})`
          } else {
            const v = Array.isArray(item.value) ? item.value[0] || "" : item.value ?? ""
            right = `'${v}'`
          }
          return `${left} ${op} ${right}`
        })
    })
    .filter((items) => items.length > 0)

  if (validGroups.length === 0) return ""

  return validGroups
    .map((items) => {
      if (items.length === 1) {
        return items[0]
      }
      return `(${items.join(" && ")})`
    })
    .join(" || ")
}

watch(
  conditionGroups,
  () => {
    const nextExp = buildExpressionString()
    if (nextExp !== props.expression) {
      emit("update:expression", nextExp)
    }
  },
  { deep: true }
)

watch(
  () => props.expression,
  (newVal) => {
    const currentBuilt = buildExpressionString()
    if (newVal !== currentBuilt) {
      initData()
    }
  }
)

const chineseExpression = computed(() => {
  if (!props.expression) return ""
  const opMap: Record<string, string> = {
    "=": "等于",
    "!=": "不等于",
    ">": "大于",
    "<": "小于",
    in: "包含于",
    "not in": "不包含于"
  }

  const groupDescs = conditionGroups.value
    .map((group) => {
      const itemDescs = group.items
        .filter((item) => item.field)
        .map((item) => {
          const fields = getFieldsForTemplate(item.templateName)
          const f = fields.find((x) => x.field === item.field)
          const fieldTitle = f ? f.title : item.field
          const opDesc = opMap[item.operator] || item.operator
          let valDesc = ""
          if (Array.isArray(item.value)) {
            valDesc = `[ ${item.value.join(", ")} ]`
          } else {
            valDesc = `'${item.value}'`
          }
          const tmplPrefix = props.templates.length > 1 && item.templateName ? `${item.templateName} · ` : ""
          return `【${tmplPrefix}${fieldTitle} ${opDesc} ${valDesc}】`
        })
      return itemDescs.join(" 并且 ")
    })
    .filter(Boolean)

  return groupDescs.join(" 或者 ")
})

const copyExpression = () => {
  copyToClipboard(props.expression, "表达式已复制到剪贴板")
}

onMounted(() => {
  initData()
})

defineExpose({
  getExpression: () => computed(() => props.expression)
})
</script>

<style lang="scss" scoped>
.filter-rule-builder {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
}

// ── 顶部工具栏 ────────────────────────────────────────────────────────────
.builder-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px 16px;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .rule-status-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 20px;

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3b82f6;
      }

      .status-text {
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
      }

      .rule-count-badge {
        font-size: 11px;
        color: #64748b;
        background: #edf2f7;
        padding: 1px 6px;
        border-radius: 10px;
      }
    }

    .toolbar-hint {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .toolbar-right {
    .view-mode-tabs {
      display: inline-flex;
      padding: 2px;
      background: #f1f5f9;
      border-radius: 8px;

      .tab-btn {
        border: none;
        background: transparent;
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        padding: 4px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        &:hover:not(.active) {
          color: #1e293b;
        }
      }
    }
  }
}

// ── 中间滚动区 ────────────────────────────────────────────────────────────
.builder-scroll-canvas {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 4px;
  }
}

.groups-flow {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

// ── 条件组卡片 ────────────────────────────────────────────────────────────
.group-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.03);
  transition: all 0.2s ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
  }

  .group-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;
    border-radius: 10px 10px 0 0;

    .group-meta {
      display: flex;
      align-items: center;
      gap: 8px;

      .group-index {
        font-size: 12px;
        font-weight: 700;
        color: #334155;
      }

      .group-logic-label {
        font-size: 11px;
        color: #94a3b8;
      }
    }

    .group-ops {
      .remove-group-btn {
        font-size: 12px;
        padding: 0;
        height: auto;
      }
    }
  }

  .group-panel-body {
    padding: 12px 14px;
  }
}

// ── 组内条件行 ────────────────────────────────────────────────────────────
.rows-stack {
  display: flex;
  flex-direction: column;
}

.row-container {
  display: flex;
  flex-direction: column;
}

.row-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0;
  padding-left: 28px;

  .divider-line {
    flex: 1;
    height: 1px;
    background: #f1f5f9;
  }

  .and-tag {
    font-size: 10px;
    font-weight: 700;
    color: #059669;
    background: #ecfdf5;
    padding: 1px 8px;
    border-radius: 4px;
    letter-spacing: 0.5px;
  }
}

.fluent-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.15s ease;

  &:hover {
    background: #f8fafc;
  }

  .row-drag {
    cursor: grab;
    color: #cbd5e1;
    padding: 4px;
    display: flex;
    align-items: center;
    border-radius: 4px;

    &:hover {
      color: #3b82f6;
      background: #edf2f7;
    }
    &:active {
      cursor: grabbing;
    }
  }

  .fluent-col {
    &.col-template {
      width: 160px;
      flex-shrink: 0;
    }
    &.col-field {
      flex: 3;
      min-width: 170px;
    }
    &.col-operator {
      width: 130px;
      flex-shrink: 0;
    }
    &.col-value {
      flex: 4;
      min-width: 200px;
    }
    &.col-action {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
  }

  // 极简扁平控件输入框
  .clean-select,
  .clean-input {
    width: 100%;

    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      border-radius: 6px;
      background: #ffffff;
      box-shadow: 0 0 0 1px #e2e8f0 inset !important;
      padding: 1px 10px;
      height: 34px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 0 0 1px #94a3b8 inset !important;
      }
      &.is-focused {
        box-shadow: 0 0 0 1.5px #3b82f6 inset !important;
      }
    }
  }

  .col-prefix-icon {
    color: #94a3b8;
    margin-right: 4px;
  }

  .row-delete-btn {
    border: none;
    background: transparent;
    color: #cbd5e1;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    transition: all 0.2s ease;

    &:hover {
      color: #ef4444;
      background: #fee2e2;
    }
  }
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .f-name {
    font-weight: 600;
    color: #1e293b;
  }
  .f-code {
    font-size: 11px;
    color: #94a3b8;
    font-family: monospace;
  }
}

.op-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .op-badge {
    font-family: monospace;
    font-weight: 700;
    color: #2563eb;
    min-width: 20px;
  }
  .op-name {
    font-size: 12px;
    color: #475569;
  }
}

.group-bottom-actions {
  margin-top: 8px;
  padding-top: 6px;

  .inline-add-row-btn {
    border: none;
    background: transparent;
    color: #3b82f6;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #eff6ff;
      color: #1d4ed8;
    }
  }
}

// ── 组间 OR 节点 ──────────────────────────────────────────────────────────
.groups-or-junction {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 2px 0;

  .junction-line {
    flex: 1;
    height: 1px;
    background: #f1f5f9;
  }

  .junction-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;

    .or-symbol {
      font-size: 10px;
      font-weight: 800;
      color: #b45309;
    }
    .or-desc {
      font-size: 10px;
      color: #d97706;
      font-weight: 500;
    }
  }
}

// ── 新增条件组大按钮 ──────────────────────────────────────────────────────
.append-group-zone {
  margin-top: 4px;

  .append-group-btn {
    width: 100%;
    height: 38px;
    border: 1px dashed #cbd5e1;
    border-radius: 8px;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #3b82f6;
      color: #2563eb;
      background: #f8fafc;
    }
  }
}

// ── 底部实时预览栏 ────────────────────────────────────────────────────────
.builder-expression-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 8px;
  flex-shrink: 0;

  .footer-status-tag {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    flex-shrink: 0;

    .el-icon {
      color: #3b82f6;
    }
  }

  .footer-code-view {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;

    &::-webkit-scrollbar {
      height: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .code-line {
      font-size: 12px;
      font-weight: 600;

      &.cn {
        color: #0369a1;
      }
      &.sql {
        color: #059669;
        font-family: "Fira Code", monospace;
      }
    }

    .code-empty {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .footer-tools {
    flex-shrink: 0;

    .copy-link {
      font-size: 11px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
