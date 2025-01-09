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

      <div class="condition-item" v-for="(item, index) in group.conditions" :key="index">
        <el-skeleton :rows="2" animated />
      </div>

      <!-- 添加条件按钮 -->
      <div class="centered-button">
        <div class="dashed-button medium-button" @click="addCondition(groupIndex)">+ 添加条件</div>
      </div>

      <!-- 最后一个条件组显示添加条件组按钮 -->
      <div class="button-group" v-if="groupIndex === conditionGroups.length - 1">
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

    <span>123</span>
  </el-card>

  <div>
    <el-dialog v-model="dialogVisible" title="创建条件" width="600px">
      <Rule ref="ruleRef" :templates="props.templates" />
      <!-- 底部按钮 -->
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { ElMessage } from "element-plus"
import Rule from "./rule.vue"
import { template } from "@/api/template/types/template"

const ruleRef = ref<InstanceType<typeof Rule>>()

interface Props {
  templates: template[]
}

const props = defineProps<Props>()

// 提交表单方法
const submitForm = () => {
  const form = ruleRef.value?.getForm()
  console.log(form)
}

const dialogVisible = ref<boolean>(false)
// 条件组数据结构
interface ConditionGroup {
  conditions: string[]
}

const conditionGroups = ref<ConditionGroup[]>([{ conditions: [] }])

const addCondition = (groupIndex: number) => {
  conditionGroups.value[groupIndex].conditions.push()
  dialogVisible.value = true
  // ElMessage.success("已添加条件")
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
