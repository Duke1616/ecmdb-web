<template>
  <el-card class="condition-set-card">
    <!-- 标题 -->
    <template #header>
      <div class="card-header">
        <span>定义表达式</span>
      </div>
    </template>

    <!-- 条件组 -->
    <div class="condition-group" v-for="(group, groupIndex) in conditionGroups" :key="groupIndex">
      <div class="condition-title">
        条件组
        <el-icon v-if="conditionGroups.length > 1" class="icon delete-icon" @click="removeConditionGroup(groupIndex)">
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
              <el-text truncated class="sort-text">{{ item }}</el-text>
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
        <div class="dashed-button medium-button" @click="addCondition(groupIndex)">+ 添加条件</div>
      </div>

      <!-- 最后一个条件组显示添加条件组按钮 -->
      <div class="button-group" v-if="groupIndex === conditionGroups.length - 1">
        <!-- or的关系，如果是 and 可以直接在一个组中实现 -->
        <div class="dashed-button large-button" @click="addConditionGroup">+ 添加条件组</div>
      </div>
    </div>
  </el-card>

  <el-card class="condition-result">
    <!-- 标题 -->
    <template #header>
      <div class="card-header">
        <span>结果</span>
      </div>
    </template>

    <span>{{ expresstion }}</span>
  </el-card>

  <div>
    <el-dialog v-model="dialogVisible" title="创建条件" width="600px">
      <Rule ref="ruleRef" :templates="props.templates" />
      <!-- 底部按钮 -->
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="submitForm">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import Rule from "./rule.vue"
import { template } from "@/api/template/types/template"
import { VueDraggable } from "vue-draggable-plus"

const ruleRef = ref<InstanceType<typeof Rule>>()
const expresstion = ref<string>("")
interface Props {
  templates: template[]
  expression: string
}

const props = defineProps<Props>()

const dialogVisible = ref<boolean>(false)
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

  // 按 "or" 分割条件组
  const groups = expression.split(/\s+or\s+/i)

  // 将每个条件组按 "and" 分割为条件
  conditionGroups.value = groups.map((group) => {
    const conditions = group.split(/\s+and\s+/i)
    return {
      conditions: conditions.filter((condition) => condition.trim() !== "") // 过滤空条件
    }
  })
}

// 初始化时解析父组件的 expression
onMounted(() => {
  parseExpressionToConditionGroups(props.expression)
})

watch(
  conditionGroups,
  (newValue) => {
    // 生成 expression 表达式
    expresstion.value = newValue
      .map((group) => {
        return group.conditions.join(" and ")
      })
      .join(" or ")
  },
  { deep: true }
)

const getExpression = () => {
  return expresstion
}

defineExpose({
  getExpression
})
</script>

<style scoped>
/* 卡片样式 */
.condition-set-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

/* 标题样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  padding: 10px;
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

/* 居中按钮样式 */
.centered-button {
  display: flex;
  justify-content: center;
  margin: 20px 0;
}

/* 按钮分组样式 */
.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
}

/* 通用虚线按钮样式 */
.dashed-button {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  transition:
    border-color 0.3s,
    color 0.3s;
}

.dashed-button:hover {
  border-color: #409eff;
  color: #409eff;
}

/* 按钮尺寸控制 */
.small-button {
  width: 150px;
  height: 36px;
  line-height: 36px;
}

.medium-button {
  width: 60%;
  height: 36px;
  line-height: 36px;
}

.large-button {
  width: 100%;
  height: 36px;
  line-height: 36px;
}
.condition-result {
  margin-top: 10px;
}
</style>
