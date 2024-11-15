<template>
  <div v-for="(rule, ruleIndex) in rotaRuleData" :key="ruleIndex">
    <div v-for="(group, groupIndex) in rule.rota_groups" :key="groupIndex" class="rota-group-card">
      <div class="rota-group-header">
        <div class="group-name">
          {{ group.name }}
        </div>
        <div class="members-count">{{ group.members.length }} members</div>
      </div>

      <div class="group-members">
        <div v-for="(memberId, memberIndex) in group.members" :key="memberIndex" class="member-item">
          {{ memberId }}
        </div>
      </div>

      <div class="group-actions">
        <el-button @click="detailRule(rule, ruleIndex)" type="primary">详情</el-button>
        <el-button @click="deleteRule(ruleIndex)" type="danger">删除</el-button>
      </div>
    </div>
    <el-dialog v-model="dialogVisible" title="修改规则" :before-close="onClosed" width="400">
      <Rule ref="ruleRef" @closed="onClosed" />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="onClosed">取消</el-button>
          <el-button type="primary" @click="replaceRule"> 修改 </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { updateShifSchedulingRuleApi } from "@/api/rota"
import { rotaRule } from "@/api/rota/types/rota"
import { ref } from "vue"
import Rule from "./rule.vue"

const dialogVisible = ref<boolean>(false)
const ruleRef = ref<InstanceType<typeof Rule>>()

const onClosed = () => {
  dialogVisible.value = false
  ruleRef.value?.resetForm()
}

const rotaId = ref<number>(0)
const ruleIndex = ref<number>(0)
const rotaRuleData = ref<rotaRule[]>([])
const setRules = (id: number, rules: rotaRule[]) => {
  rotaId.value = id
  rotaRuleData.value = rules
}

const resetRule = () => {
  rotaRuleData.value = []
}

// 查看详情
const detailRule = (rule: rotaRule, index: number) => {
  ruleIndex.value = index
  dialogVisible.value = true
}

const deleteRule = (ruleIndex: number) => {
  if (window.confirm("Are you sure you want to delete this rule?")) {
    rotaRuleData.value.splice(ruleIndex, 1)

    updateShifSchedulingRule()
  }
}

const replaceRule = () => {
  const rota = ruleRef.value?.getFrom()
  const rule = rota?.value.rota_rule

  if (rule !== undefined) {
    rotaRuleData.value[ruleIndex.value] = rule
  }

  updateShifSchedulingRule()
}

const updateShifSchedulingRule = () => {
  updateShifSchedulingRuleApi({
    id: rotaId.value,
    rota_rules: rotaRuleData.value
  })
    .then(() => {})
    .catch(() => {})
    .finally(() => {})
}

defineExpose({ setRules, resetRule })
</script>

<style scoped>
/* Card containing the group */
.rota-group-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  /* padding: 16px; */
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

/* Header section containing the group name and members count */
.rota-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-name {
  font-size: 18px;
  font-weight: bold;
  color: #2d3748; /* Darker gray */
}

.members-count {
  font-size: 14px;
  color: #a0aec0; /* Light gray */
}

/* Member items */
.group-members {
  margin-top: 8px;
}

.member-item {
  display: inline-block;
  padding: 6px 12px;
  font-size: 14px;
  color: #4a5568; /* Dark gray */
  background-color: #edf2f7; /* Light gray */
  border-radius: 16px;
  margin-right: 8px;
  margin-bottom: 8px;
}

/* Button actions */
.group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  .el-button {
    font-size: 12px; /* Smaller font size for buttons */
    padding: 6px 12px; /* Reduce padding for smaller buttons */
    height: auto;
  }

  .el-button--primary,
  .el-button--danger {
    min-width: 80px;
    padding: 4px 8px;
  }
}
</style>
