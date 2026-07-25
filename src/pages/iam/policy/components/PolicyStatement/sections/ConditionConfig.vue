<template>
  <SectionPanel :label="label" :required="required" :disabled="disabled" no-arrow>
    <template #preview>
      <div class="condition-summary">
        <span class="summary-text">{{ formatCondition(stmt.condition) }}</span>
        <el-button link type="primary" :disabled="disabled" @click.stop="openDialog">
          {{ stmt.condition ? "修改" : "添加条件" }}
        </el-button>
      </div>
    </template>
  </SectionPanel>

  <FormDialog
    v-model="dialogVisible"
    title="配置生效条件"
    subtitle="仅当请求满足以下规则时，该权限语句才会生效"
    width="760px"
    :header-icon="Filter"
    confirm-text="应用条件"
    :show-footer="!complexCondition"
    :show-footer-info="false"
    @confirm="save"
    @cancel="dialogVisible = false"
  >
    <div v-if="complexCondition" class="complex-condition">
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="当前是高级表达式"
        description="该表达式超出简化编辑器范围，请在脚本编辑模式中修改。"
      />
      <code>{{ JSON.stringify(stmt.condition, null, 2) }}</code>
    </div>

    <div v-else class="condition-editor">
      <div class="editor-toolbar">
        <div class="toolbar-title">
          <strong>规则关系</strong>
          <span>设置多项规则之间的匹配方式</span>
        </div>
        <el-radio-group v-model="logic" size="small" :disabled="rules.length < 2">
          <el-radio-button value="all">全部条件</el-radio-button>
          <el-radio-button value="any">任一条件</el-radio-button>
        </el-radio-group>
      </div>

      <el-scrollbar v-if="rules.length" class="rule-scrollbar" max-height="min(45vh, 420px)">
        <div class="rule-list">
          <div v-for="(rule, index) in rules" :key="rule.id" class="rule-card">
            <div class="rule-index">{{ index + 1 }}</div>
            <div class="rule-fields">
              <div class="field-item key-field">
                <span class="field-label">属性</span>
                <el-select v-model="rule.key" class="key-select" @change="resetRule(rule)">
                  <el-option v-for="item in attributes" :key="item.key" :label="item.label" :value="item.key" />
                </el-select>
              </div>
              <div class="field-item operator-field">
                <span class="field-label">比较方式</span>
                <el-select v-model="rule.operator" class="operator-select">
                  <el-option
                    v-for="operator in attributeOf(rule.key).operators"
                    :key="operator"
                    :label="operatorLabels[operator] || operator"
                    :value="operator"
                  />
                </el-select>
              </div>
              <div class="field-item value-field">
                <span class="field-label">条件值</span>
                <el-date-picker
                  v-if="attributeOf(rule.key).kind === 'time'"
                  v-model="rule.value"
                  class="value-input"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ssZ"
                  placeholder="选择时间"
                />
                <el-input
                  v-else
                  v-model="rule.value"
                  class="value-input"
                  :placeholder="attributeOf(rule.key).placeholder"
                />
              </div>
            </div>
            <el-tooltip content="删除该规则" placement="top">
              <el-button class="delete-rule" text type="danger" :icon="Delete" @click="rules.splice(index, 1)" />
            </el-tooltip>
          </div>
        </div>
      </el-scrollbar>

      <div v-else class="empty-rules">
        <span>暂未设置条件</span>
        <small>不添加规则时，该权限语句始终生效</small>
      </div>
      <el-button class="add-rule" plain :icon="Plus" @click="addRule">添加规则</el-button>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Delete, Filter, Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { Condition, ConditionOperator, ConditionPredicate } from "@/api/iam/policy/type"
import { FormDialog } from "@/common/components/Dialogs"
import SectionPanel from "./SectionPanel.vue"
import type { StatementVO } from "../../../composables/usePolicyData"
import { formatCondition } from "../../../utils/condition"

interface AttributeOption {
  key: string
  label: string
  kind: "text" | "time"
  operators: ConditionOperator[]
  placeholder: string
}

interface RuleDraft {
  id: number
  key: string
  operator: ConditionOperator
  value: string
}

const props = defineProps<{ label: string; stmt: StatementVO; required?: boolean; disabled?: boolean }>()
const emit = defineEmits(["update:stmt"])

const attributes: AttributeOption[] = [
  {
    key: "principal:username",
    label: "登录用户名",
    kind: "text",
    operators: ["StringEquals", "StringNotEquals", "StringEqualsIgnoreCase"],
    placeholder: "输入用户名，多个值用逗号分隔"
  },
  {
    key: "environment:current_time",
    label: "当前时间",
    kind: "time",
    operators: ["DateLessThan", "DateGreaterThan"],
    placeholder: "选择时间"
  }
]

const operatorLabels: Partial<Record<ConditionOperator, string>> = {
  StringEquals: "等于",
  StringNotEquals: "不等于",
  StringEqualsIgnoreCase: "等于（忽略大小写）",
  DateLessThan: "早于",
  DateGreaterThan: "晚于"
}

const dialogVisible = ref(false)
const complexCondition = ref(false)
const logic = ref<"all" | "any">("all")
const rules = ref<RuleDraft[]>([])
let sequence = 0

const attributeOf = (key: string) => attributes.find((item) => item.key === key) || attributes[0]

const predicateToDraft = (predicate: ConditionPredicate): RuleDraft | null => {
  const attribute = attributes.find((item) => item.key === predicate.key)
  if (!attribute || !attribute.operators.includes(predicate.operator)) return null
  if (predicate.values.some((value) => value.type !== "literal")) return null
  return {
    id: ++sequence,
    key: predicate.key,
    operator: predicate.operator,
    value: predicate.values.map((value) => String(value.value)).join(", ")
  }
}

const openDialog = () => {
  rules.value = []
  logic.value = "all"
  complexCondition.value = false
  const condition = props.stmt.condition
  if (!condition) {
    dialogVisible.value = true
    return
  }

  let predicates: ConditionPredicate[] = []
  if (condition.predicate) predicates = [condition.predicate]
  else if (condition.all?.every((child) => !!child.predicate))
    predicates = condition.all.map((child) => child.predicate!)
  else if (condition.any?.every((child) => !!child.predicate)) {
    logic.value = "any"
    predicates = condition.any.map((child) => child.predicate!)
  } else complexCondition.value = true

  if (!complexCondition.value) {
    const drafts = predicates.map(predicateToDraft)
    if (drafts.some((draft) => !draft)) complexCondition.value = true
    else rules.value = drafts as RuleDraft[]
  }
  dialogVisible.value = true
}

const addRule = () => {
  const attribute = attributes[0]
  rules.value.push({ id: ++sequence, key: attribute.key, operator: attribute.operators[0], value: "" })
}

const resetRule = (rule: RuleDraft) => {
  const attribute = attributeOf(rule.key)
  rule.operator = attribute.operators[0]
  rule.value = ""
}

const save = () => {
  const predicates = rules.value.map((rule) => {
    const attribute = attributeOf(rule.key)
    const values = (attribute.kind === "text" ? rule.value.split(",") : [rule.value])
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => ({
        type: "literal" as const,
        value
      }))
    return { key: rule.key, operator: rule.operator, values }
  })

  if (predicates.some((predicate) => predicate.values.length === 0)) {
    ElMessage.warning("请填写完整的条件值")
    return
  }
  let condition: Condition | undefined
  if (predicates.length === 1) condition = { predicate: predicates[0] }
  else if (predicates.length > 1) condition = { [logic.value]: predicates.map((predicate) => ({ predicate })) }
  emit("update:stmt", { ...props.stmt, condition })
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.condition-summary {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #64748b;
  font-size: 13px;
  font-weight: 400;
}

.condition-editor,
.complex-condition {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 2px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2f7;
}

.toolbar-title {
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: #334155;
    font-size: 13px;
  }

  span {
    color: #94a3b8;
    font-size: 12px;
  }
}

.rule-scrollbar {
  width: 100%;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
}

.rule-card {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 34px;
  gap: 12px;
  align-items: start;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  }
}

.rule-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 25px;
  border-radius: 50%;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.rule-fields {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(130px, 0.9fr) minmax(120px, 0.8fr) minmax(200px, 1.4fr);
  gap: 12px;
}

.field-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.key-select,
.operator-select,
.value-input {
  width: 100%;
}

.empty-rules {
  min-height: 106px;
  padding: 24px;
  border: 1px dashed #dbe3ef;
  border-radius: 8px;
  background: #f8fafc;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  text-align: center;
  font-size: 13px;

  small {
    font-size: 12px;
    color: #b0bac8;
  }
}

.add-rule {
  width: 100%;
  height: 44px;
  border-style: dashed;
  color: #2563eb;
  font-weight: 600;

  &:hover,
  &:focus {
    border-color: #60a5fa;
    background: #eff6ff;
    color: #1d4ed8;
  }
}

.delete-rule {
  margin-top: 23px;
}

.complex-condition code {
  max-height: min(45vh, 420px);
  overflow: auto;
  padding: 14px;
  border-radius: 6px;
  background: #f8fafc;
  color: #475569;
  white-space: pre-wrap;
}

@media (max-width: 760px) {
  .rule-fields {
    grid-template-columns: 1fr;
  }

  .rule-index,
  .delete-rule {
    margin-top: 0;
  }
}
</style>
