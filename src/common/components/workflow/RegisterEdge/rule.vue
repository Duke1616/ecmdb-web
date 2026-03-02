<template>
  <div class="rule-refiner">
    <!-- 顶部状态栏 -->
    <div class="refiner-status">
      <div class="status-left">
        <div class="blink-dot" />
        <span class="status-text">规则配置模式</span>
      </div>
    </div>

    <!-- 逻辑管道 -->
    <div class="refiner-pipeline">
      <!-- Section: Input Source -->
      <div class="pipeline-node source">
        <div class="node-meta">数据源</div>
        <div class="node-content">
          <div class="compact-form">
            <div class="form-row">
              <span class="label">目标模板</span>
              <el-select
                v-model="formData.leftValue"
                placeholder="选择模板"
                class="distilled-select"
                @change="handleChangeLeftValue"
              >
                <el-option
                  v-for="(item, index) in props.templates"
                  :key="index"
                  :label="item.name"
                  :value="item.name"
                />
              </el-select>
            </div>
            <div class="form-row">
              <span class="label">左值字段</span>
              <el-select
                v-model="formData.leftValueData"
                :disabled="!formData.leftValue"
                placeholder="属性字段"
                class="distilled-select"
              >
                <template v-if="Array.isArray(getOptionsForLeftValue())">
                  <el-option
                    v-for="(rule, index) in getOptionsForLeftValue()"
                    :key="index"
                    :label="rule.title || rule.name"
                    :value="String(rule.field)"
                  />
                </template>
                <template v-else>
                  <el-option
                    v-for="(val, key) in getOptionsForLeftValue()"
                    :key="key"
                    :label="key"
                    :value="String(val)"
                  />
                </template>
              </el-select>
            </div>
          </div>
        </div>
      </div>

      <!-- Section: Operation -->
      <div class="pipeline-connector">
        <el-icon class="conn-icon"><ArrowRight /></el-icon>
      </div>

      <div class="pipeline-node logic">
        <div class="node-meta">判定谓词</div>
        <div class="operator-grid">
          <div
            v-for="op in operatorOptions"
            :key="op.value"
            class="op-tile"
            :class="{ selected: formData.operator === op.value }"
            @click="selectOperator(op.value)"
          >
            <span class="op-sym">{{ op.symbol }}</span>
            <span class="op-lab">{{ op.label }}</span>
          </div>
        </div>
      </div>

      <div class="pipeline-connector">
        <el-icon class="conn-icon"><ArrowRight /></el-icon>
      </div>

      <!-- Section: Target Value -->
      <div class="pipeline-node target">
        <div class="node-meta">预期值</div>
        <div class="node-content">
          <div class="compact-form">
            <div class="form-row">
              <span class="label">数值模型</span>
              <el-select v-model="formData.rightValue" disabled class="distilled-select">
                <el-option label="动态预留" value="reserve" />
              </el-select>
            </div>
            <div class="form-row">
              <span class="label">右值参考</span>
              <template v-if="isFieldInMap">
                <el-select
                  v-model="formData.rightValueData"
                  :multiple="isMultiple"
                  placeholder="选择预设..."
                  class="distilled-select"
                >
                  <el-option
                    v-for="item in selectOptionsMap.get(formData.leftValueData) || []"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </template>
              <template v-else>
                <el-input v-model="rightValueDataComputed" placeholder="手动输入" class="distilled-input" />
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部预览栏：极简显示 -->
    <div class="refiner-preview">
      <div class="preview-bar">
        <div class="preview-label">
          <el-icon><Monitor /></el-icon>
          <span>逻辑预览</span>
        </div>
        <div class="preview-value">
          <code v-if="formData.leftValueData || formData.operator || formData.rightValueData">
            {{ getExpressionPreview() }}
          </code>
          <span v-else class="placeholder">Awaiting configuration logic...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue"
import { ArrowRight, Monitor } from "@element-plus/icons-vue"
import { template } from "@/api/template/types/template"

interface Props {
  templates: template[]
}

const props = defineProps<Props>()

const formData = reactive({
  leftValue: "",
  leftValueData: "",
  operator: "=",
  rightValue: "reserve",
  rightValueData: "" as string | string[]
})

const operatorOptions = [
  { label: "等于", value: "=", symbol: "==" },
  { label: "不等于", value: "!=", symbol: "!=" },
  { label: "大于", value: ">", symbol: ">" },
  { label: "小于", value: "<", symbol: "<" },
  { label: "包含", value: "in", symbol: "IN" },
  { label: "不包含", value: "not in", symbol: "NIN" }
]

const selectOptionsMap = new Map([
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
      { label: "运行中", value: "running" },
      { label: "停止", value: "stopped" }
    ]
  ]
])

const isFieldInMap = computed(() => {
  return selectOptionsMap.has(formData.leftValueData)
})

const templatesMap = computed(() => {
  const map = new Map<string, template>()
  props.templates.forEach((t) => map.set(t.name, t))
  return map
})

const isMultiple = computed(() => {
  return formData.operator === "in" || formData.operator === "not in"
})

const rightValueDataComputed = computed({
  get: () => {
    return Array.isArray(formData.rightValueData) ? formData.rightValueData.join(",") : formData.rightValueData
  },
  set: (val: string) => {
    formData.rightValueData = isMultiple.value ? val.split(",") : val
  }
})

const getOptionsForLeftValue = () => {
  const template = templatesMap.value.get(formData.leftValue)
  if (!template || !template.rules) return []
  return template.rules
}

const handleChangeLeftValue = () => {
  formData.leftValueData = ""
  formData.rightValueData = isMultiple.value ? [] : ""
}

const selectOperator = (op: string) => {
  formData.operator = op
  if (op === "in" || op === "not in") {
    if (!Array.isArray(formData.rightValueData)) {
      formData.rightValueData = formData.rightValueData ? [formData.rightValueData as string] : []
    }
  } else {
    if (Array.isArray(formData.rightValueData)) {
      formData.rightValueData = formData.rightValueData[0] || ""
    }
  }
}

const getExpressionPreview = () => {
  if (!formData.leftValueData && !formData.operator && !formData.rightValueData) {
    return ""
  }
  const left = formData.leftValueData || "$left"
  const op = formData.operator
  let right = ""
  if (Array.isArray(formData.rightValueData)) {
    right = `(${formData.rightValueData.map((v) => `'${v}'`).join(", ")})`
  } else {
    right = formData.rightValueData ? `'${formData.rightValueData}'` : "'$right'"
  }
  return `${left} ${op} ${right}`
}

const setExpression = (expression: string) => {
  if (!expression) return

  // 1. 尝试解析操作符
  const ops = ["not in", "in", "!=", "=", ">", "<"]
  let foundOp = ""
  let parts: string[] = []

  for (const op of ops) {
    if (expression.includes(` ${op} `)) {
      foundOp = op
      parts = expression.split(` ${op} `)
      break
    }
  }

  if (!foundOp || parts.length < 2) return

  formData.operator = foundOp
  formData.leftValueData = parts[0].trim()

  const rightRaw = parts[1].trim()

  // 2. 解析右值
  if (foundOp === "in" || foundOp === "not in") {
    // 格式如 ('val1', 'val2')
    const matches = rightRaw.match(/'([^']+)'/g)
    if (matches) {
      formData.rightValueData = matches.map((m) => m.replace(/'/g, ""))
    }
  } else {
    // 格式如 'value'
    formData.rightValueData = rightRaw.replace(/'/g, "")
  }

  // 3. 反向推导左值所属模版 (基于 field 查找)
  for (const template of props.templates) {
    if (template.rules) {
      const isFound = Array.isArray(template.rules)
        ? template.rules.some((r: any) => r.field === formData.leftValueData)
        : Object.values(template.rules).includes(formData.leftValueData)

      if (isFound) {
        formData.leftValue = template.name
        break
      }
    }
  }
}

defineExpose({
  getExpressionPreview,
  setExpression
})
</script>

<style scoped lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap");

.rule-refiner {
  font-family: "Fira Sans", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 100%;
}

// ── 状态栏 ────────────────────────────────────────────────────────────
.refiner-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;

  .status-left {
    display: flex;
    align-items: center;
    gap: 8px;

    .blink-dot {
      width: 6px;
      height: 6px;
      background: #6366f1;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(99, 102, 241, 0.5);
      animation: pulse 2s infinite;
    }

    .status-text {
      font-family: "Fira Code", monospace;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

// ── 管道 ────────────────────────────────────────────────────────────
.refiner-pipeline {
  display: flex;
  align-items: center;
  gap: 0;
}

.pipeline-node {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;

  .node-meta {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-left: 14px;
  }

  &.logic {
    flex: 0 0 130px;
  }
}

.node-content {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
  transition: all 0.2s;

  &:hover {
    border-color: #e2e8f0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }
}

.compact-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
  }
}

// ── 运算符网格 ──────────────────────────────────────────────────────────
.operator-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
}

.op-tile {
  height: 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  .op-sym {
    font-family: "Fira Code", monospace;
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }
  .op-lab {
    font-size: 8px;
    color: #94a3b8;
    font-weight: 600;
    margin-top: -2px;
  }

  &:hover {
    background: #f1f5f9;
    transform: translateY(-1px);
  }

  &.selected {
    background: #6366f1;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    transform: translateY(-1px);

    .op-sym,
    .op-lab {
      color: #ffffff;
    }
  }
}

// ── 连接符 ────────────────────────────────────────────────────────────
.pipeline-connector {
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20px;

  .conn-icon {
    font-size: 18px;
    color: #cbd5e1;
    opacity: 0.8;
  }
}

// ── 实时预览吧 ──────────────────────────────────────────────────────────
.refiner-preview {
  margin-top: 4px;
}

.preview-bar {
  background: #ffffff;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 16px;

  .preview-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    background: #f8fafc;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;

    .el-icon {
      color: #6366f1;
    }
  }

  .preview-value {
    flex: 1;
    min-width: 0;

    code {
      font-family: "Fira Code", monospace;
      font-size: 13px;
      color: #10b981;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }

    .placeholder {
      font-size: 12px;
      color: #cbd5e1;
      font-style: italic;
    }
  }
}

// ── Element Overrides ───────────────────────────────────────────────
:deep(.distilled-select),
:deep(.distilled-input) {
  .el-input__wrapper {
    background: #fcfdfe !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: none !important;
    border-radius: 8px;
    padding: 2px 10px;

    &:hover {
      border-color: #e2e8f0 !important;
      background: #ffffff !important;
    }
    &.is-focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.05) !important;
    }
  }
}
</style>
