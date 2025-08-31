<template>
  <div class="expression-container">
    <el-card class="condition-set-card">
      <!-- 标题 -->
      <template #header>
        <div class="card-header">
          <span>定义表达式</span>
        </div>
      </template>

      <!-- 滚动内容区域 -->
      <div class="scrollable-content">
        <!-- 条件组 -->
        <div class="condition-group" v-for="(group, groupIndex) in conditionGroups" :key="groupIndex">
          <div class="condition-title">
            条件组
            <el-icon
              v-if="conditionGroups.length > 1"
              class="icon delete-icon"
              @click="removeConditionGroup(groupIndex)"
            >
              <DeleteFilled />
            </el-icon>
          </div>
          <el-divider />

          <!-- 如果为空则展示 -->
          <div v-if="group.conditions.length < 1">
            <el-skeleton :rows="2" animated />
          </div>

          <div class="condition-item">
            <VueDraggable
              v-model="group.conditions"
              :animation="200"
              group="rotaGroup"
              ghostClass="ghost"
              chosenClass="chosen"
              handle=".handle"
              itemKey="id"
              class="flex flex-col gap-4 p-0 rounded"
            >
              <div
                v-for="(item, itemIndex) in group.conditions"
                :key="item"
                class="h-40px bg-gray-500/5 px-2 rounded flex items-center"
              >
                <div class="flex-1 flex">
                  <el-text truncated class="sort-text">
                    <span v-if="showChinese" class="chinese-text">
                      {{ translateExpressionToChinese(item) }}
                    </span>
                    <span v-else class="english-text">{{ item }}</span>
                  </el-text>
                </div>

                <div class="flex items-center space-x-2">
                  <el-icon @click="removeAndToLeftList(itemIndex, group)" class="cursor-pointer">
                    <Close />
                  </el-icon>
                  <el-icon name="sort" class="handle cursor-move">
                    <Grid />
                  </el-icon>
                </div>
              </div>
            </VueDraggable>
          </div>

          <!-- 添加条件按钮 -->
          <div class="centered-button">
            <div class="dashed-button medium-button" @click="addCondition(groupIndex)">添加条件</div>
          </div>

          <!-- 最后一个条件组显示添加条件组按钮 -->
          <div class="button-group" v-if="groupIndex === conditionGroups.length - 1">
            <!-- or的关系，如果是 and 可以直接在一个组中实现 -->
            <div class="dashed-button large-button" @click="addConditionGroup">添加条件组</div>
          </div>
        </div>
      </div>
    </el-card>
  </div>

  <el-card class="condition-result">
    <!-- 标题 -->
    <template #header>
      <div class="card-header">
        <span>结果</span>
        <div class="language-toggle">
          <el-button
            :type="showChinese ? 'primary' : 'default'"
            size="small"
            @click="showChinese = !showChinese"
            class="toggle-btn"
          >
            {{ showChinese ? "中文" : "英文" }}
          </el-button>
        </div>
      </div>
    </template>

    <div class="expression-display">
      <span v-if="showChinese" class="chinese-expression">{{ getChineseExpression() }}</span>
      <span v-else class="english-expression">{{ expresstion }}</span>
    </div>
  </el-card>

  <!-- 创建条件弹窗 -->
  <el-dialog v-model="dialogVisible" title="创建条件" width="600px">
    <Rule ref="ruleRef" :templates="props.templates" />
    <!-- 底部按钮 -->
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="submitForm">确认添加</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import Rule from "./rule.vue"
import { template } from "@/api/template/types/template"
import { VueDraggable } from "vue-draggable-plus"

// 定义模板规则的类型
interface TemplateRule {
  field?: string
  title?: string
  options?: Array<{
    value: string
    label: string
  }>
}

const ruleRef = ref<InstanceType<typeof Rule>>()
const expresstion = ref<string>("")
interface Props {
  templates: template[]
  expression: string
}

const props = defineProps<Props>()

const dialogVisible = ref<boolean>(false)
const showChinese = ref<boolean>(false) // 控制显示中文还是英文

// 条件组数据结构
interface ConditionGroup {
  conditions: string[]
}

const handleClose = () => {
  dialogVisible.value = false
}

const conditionGroups = ref<ConditionGroup[]>([{ conditions: [] }])

const groupIndex = ref<number>()
const addCondition = (index: number) => {
  groupIndex.value = index
  conditionGroups.value[index].conditions.push()
  dialogVisible.value = true
}

const addConditionGroup = () => {
  conditionGroups.value.push({ conditions: [] })
  ElMessage.success("已添加条件组")
}

const removeConditionGroup = (groupIndex: number) => {
  if (conditionGroups.value.length > 1) {
    conditionGroups.value.splice(groupIndex, 1)
    ElMessage.success("已删除条件组")
  }
}

const removeAndToLeftList = (index: number, group: ConditionGroup) => {
  group.conditions.splice(index, 1)
}

const submitForm = () => {
  // 获取表单数据
  const form = ruleRef.value?.getForm()

  // 检查表单数据是否完整
  if (!form || !form.leftValueData || !form.operator || !form.rightValueData) {
    ElMessage.warning("请填写完整的表单数据")
    return
  }

  // 检查 groupIndex 是否有效
  if (groupIndex.value === undefined) {
    ElMessage.warning("未找到有效的条件组")
    return
  }

  // 关闭对话框
  dialogVisible.value = false

  // 构建 SQL 条件
  const left = `$${form.leftValueData}`
  let sqlCondition: string

  if (form.operator === "in" || form.operator === "not in") {
    // 处理数组值
    const values = Array.isArray(form.rightValueData)
      ? form.rightValueData
          .map((value) => {
            const numericValue = parseFloat(value)
            return !isNaN(numericValue) ? numericValue.toString() : `'${value}'`
          })
          .join(", ")
      : !isNaN(parseFloat(form.rightValueData))
        ? parseFloat(form.rightValueData).toString()
        : `'${form.rightValueData}'`

    sqlCondition = ` ${form.operator} (${values})`
  } else {
    // 处理单个值
    const numericValue = parseFloat(form.rightValueData as string)
    const rightValue = !isNaN(numericValue) ? numericValue.toString() : `'${form.rightValueData}'`
    sqlCondition = ` ${form.operator} ${rightValue}`
  }

  // 拼接完整的 SQL 条件
  const sql = `${left}${sqlCondition}`

  // 将 SQL 条件添加到对应的条件组
  conditionGroups.value[groupIndex.value].conditions.push(sql)

  // 重置表单
  ruleRef.value?.resetForm()

  // 提示用户
  ElMessage.success("条件添加成功")
}
// 解析父组件传递的 expression，生成 conditionGroups
const parseExpressionToConditionGroups = (expression: string) => {
  if (!expression) {
    conditionGroups.value = [{ conditions: [] }]
    return
  }

  // 按 "or" 分割条件组，但需要处理括号
  const groups: string[] = []
  let currentGroup = ""
  let parenthesesCount = 0

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i]

    if (char === "(") {
      parenthesesCount++
      currentGroup += char
    } else if (char === ")") {
      parenthesesCount--
      currentGroup += char
    } else if (char === "o" && expression.substring(i, i + 2).toLowerCase() === "or" && parenthesesCount === 0) {
      // 只有在括号外部的 "or" 才是真正的分隔符
      if (currentGroup.trim()) {
        groups.push(currentGroup.trim())
      }
      currentGroup = ""
      i++ // 跳过 'r'
    } else {
      currentGroup += char
    }
  }

  // 添加最后一个条件组
  if (currentGroup.trim()) {
    groups.push(currentGroup.trim())
  }

  // 将每个条件组按 "and" 分割为条件，处理括号
  conditionGroups.value = groups.map((group) => {
    // 移除外层括号
    let cleanGroup = group.trim()
    if (cleanGroup.startsWith("(") && cleanGroup.endsWith(")")) {
      cleanGroup = cleanGroup.slice(1, -1)
    }

    const conditions = cleanGroup.split(/\s+and\s+/i)
    return {
      conditions: conditions.filter((condition) => condition.trim() !== "") // 过滤空条件
    }
  })
}

// 动态字段映射存储
const fieldMappings = ref<Map<string, string>>(new Map())
const valueMappings = ref<Map<string, string>>(new Map())

// 操作符映射（这些是固定的）
const operatorMappings = new Map([
  ["and", "且"],
  ["or", "或"],
  ["=", "等于"],
  ["!=", "不等于"],
  [">", "大于"],
  ["<", "小于"],
  [">=", "大于等于"],
  ["<=", "小于等于"],
  ["in", "包含于"],
  ["not in", "不包含于"],
  ["like", "包含"],
  ["not like", "不包含"]
])

// 将英文表达式转换为中文显示
const translateExpressionToChinese = (expression: string): string => {
  if (!expression) return ""

  let chineseExpression = expression
  console.log("原始表达式:", expression)
  console.log("字段映射:", fieldMappings.value)
  console.log("值映射:", valueMappings.value)

  // 替换操作符
  operatorMappings.forEach((chinese, english) => {
    // 使用正则表达式确保完整单词匹配
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
    chineseExpression = chineseExpression.replace(regex, chinese)
  })

  // 替换字段名
  fieldMappings.value.forEach((chinese, english) => {
    // 使用更灵活的匹配，支持字段名在等号前的各种格式
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
    chineseExpression = chineseExpression.replace(regex, chinese)

    // 特殊处理：如果字段名以$开头，也尝试匹配不带$的版本
    if (english.startsWith("$")) {
      const fieldWithoutDollar = english.substring(1)
      const regexWithoutDollar = new RegExp(`\\b${fieldWithoutDollar.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
      chineseExpression = chineseExpression.replace(regexWithoutDollar, chinese)
    }
  })

  // 清理：移除所有剩余的$符号，让中文显示更自然
  chineseExpression = chineseExpression.replace(/\$/g, "")

  // 替换值
  valueMappings.value.forEach((chinese, english) => {
    const regex = new RegExp(`\\b${english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
    chineseExpression = chineseExpression.replace(regex, chinese)
  })

  // 处理括号
  chineseExpression = chineseExpression.replace(/\(/g, "（").replace(/\)/g, "）")

  console.log("转换后表达式:", chineseExpression)
  return chineseExpression
}

// 初始化时解析父组件的 expression
onMounted(() => {
  parseExpressionToConditionGroups(props.expression)

  // 根据模板数据动态设置字段映射
  if (props.templates && props.templates.length > 0) {
    const fieldMap: Record<string, string> = {}
    const valueMap: Record<string, string> = {}

    props.templates.forEach((template) => {
      if (template.rules) {
        template.rules.forEach((rule: TemplateRule) => {
          // 字段名映射：field -> title (中文显示时不包含$符号)
          if (rule.field && rule.title) {
            fieldMap[`$${rule.field}`] = rule.title
            fieldMap[rule.field] = rule.title // 也添加不带$的映射
          }

          // 值映射：options中的value -> label
          if (rule.options && Array.isArray(rule.options)) {
            rule.options.forEach((option: { value: string; label: string }) => {
              if (option.value && option.label) {
                valueMap[option.value] = option.label
              }
            })
          }
        })
      }
    })

    // 设置映射
    setFieldMappings(fieldMap)
    setValueMappings(valueMap)

    console.log("动态设置的字段映射:", fieldMap)
    console.log("动态设置的值映射:", valueMap)
    console.log("示例：service_env ->", fieldMap["service_env"])
    console.log("示例：$service_env ->", fieldMap["$service_env"])
  }

  console.log("组件挂载完成，映射已设置")
})

watch(
  conditionGroups,
  (newValue) => {
    // 生成 expression 表达式
    const validGroups = newValue.filter((group) => group.conditions.length > 0)

    // 只有当存在多个条件组（即存在OR关系）时，才需要用括号包裹AND条件
    if (validGroups.length > 1) {
      expresstion.value = validGroups
        .map((group) => {
          // 如果条件组中有多个条件，需要用括号包裹
          if (group.conditions.length > 1) {
            return `(${group.conditions.join(" and ")})`
          }
          // 如果只有一个条件，直接返回
          return group.conditions[0] || ""
        })
        .filter((group) => group.trim() !== "") // 过滤空的条件组
        .join(" or ")
    } else if (validGroups.length === 1) {
      // 只有一个条件组时，不需要括号，直接连接AND条件
      const group = validGroups[0]
      if (group.conditions.length > 1) {
        expresstion.value = group.conditions.join(" and ")
      } else {
        expresstion.value = group.conditions[0] || ""
      }
    } else {
      expresstion.value = ""
    }
  },
  { deep: true }
)

// 获取中文显示表达式
const getChineseExpression = () => {
  return translateExpressionToChinese(expresstion.value)
}

// 设置字段映射
const setFieldMappings = (mappings: Record<string, string>) => {
  fieldMappings.value.clear()
  Object.entries(mappings).forEach(([key, value]) => {
    fieldMappings.value.set(key, value)
  })
}

// 设置值映射
const setValueMappings = (mappings: Record<string, string>) => {
  valueMappings.value.clear()
  Object.entries(mappings).forEach(([key, value]) => {
    valueMappings.value.set(key, value)
  })
}

// 获取当前映射
const getFieldMappings = () => {
  return Object.fromEntries(fieldMappings.value)
}

const getValueMappings = () => {
  return Object.fromEntries(valueMappings.value)
}

const getExpression = () => {
  return expresstion
}

defineExpose({
  getExpression,
  getChineseExpression,
  setFieldMappings,
  setValueMappings,
  getFieldMappings,
  getValueMappings
})
</script>

<style scoped>
/* 表达式容器 */
.expression-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 卡片样式 */
.condition-set-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 滚动内容区域 */
.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  max-height: 300px;

  /* 自定义滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

/* 标题样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-toggle {
  .toggle-btn {
    font-size: 12px;
    padding: 4px 12px;
    height: 28px;
    border-radius: 6px;
  }
}

.expression-display {
  padding: 12px 0;

  .chinese-expression {
    color: #0891b2;
    font-weight: 500;
    line-height: 1.6;
  }

  .chinese-text {
    color: #0891b2;
    font-weight: 500;
  }

  .english-text {
    color: #1e293b;
    font-weight: 500;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }

  .english-expression {
    color: #1e293b;
    font-weight: 500;
    line-height: 1.6;
    font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  }
}

.icon {
  margin-left: 8px;
  cursor: pointer;
  font-size: 18px;
}

.delete-icon {
  cursor: pointer;
}

.condition-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.condition-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.condition-item {
  margin-bottom: 10px;
}

/* 按钮容器样式 */
.centered-button {
  display: flex;
  justify-content: center;
  margin: 24px 0;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

/* 现代化按钮样式 */
.dashed-button {
  position: relative;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;

  /* 悬停效果 */
  &:hover {
    border-color: #06b6d4;
    color: #0891b2;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.15);
  }

  /* 点击效果 */
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.2);
  }

  /* 添加图标样式 */
  &::before {
    content: "+";
    display: inline-block;
    margin-right: 6px;
    font-size: 16px;
    font-weight: 700;
    color: inherit;
    transition: transform 0.3s ease;
  }

  &:hover::before {
    transform: rotate(90deg);
  }
}

/* 按钮尺寸控制 */
.small-button {
  width: 140px;
  height: 40px;
  line-height: 36px;
  padding: 0 16px;
}

.medium-button {
  width: 65%;
  height: 44px;
  line-height: 40px;
  padding: 0 20px;
}

.large-button {
  width: 100%;
  height: 48px;
  line-height: 44px;
  padding: 0 24px;
}
.condition-result {
  margin-top: 10px;
}
</style>
