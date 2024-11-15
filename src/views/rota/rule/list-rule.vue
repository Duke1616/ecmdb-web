<template>
  <el-collapse v-model="activeCollapse" accordion @change="handleCollapseChange">
    <el-collapse-item
      v-for="(rule, ruleIndex) in rotaRuleData"
      :key="ruleIndex"
      :title="`规则 ${ruleIndex + 1}`"
      :name="ruleIndex"
    >
      <div class="rota-group-card">
        <!-- 展示 rule 的所有详细信息 -->
        <Rule ref="ruleRefs" />

        <!-- 展示修改和删除按钮 -->
        <div class="group-actions">
          <el-button @click="replaceRule(ruleIndex)" type="primary" size="small">修改</el-button>
          <el-button @click="deleteRule(ruleIndex)" type="danger" size="small">删除</el-button>
        </div>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { updateShifSchedulingRuleApi } from "@/api/rota"
import { addRuleReq, rotaRule } from "@/api/rota/types/rota"
import { nextTick, ref } from "vue"
import Rule from "./rule.vue"

const ruleRefs = ref<InstanceType<typeof Rule>[]>([])
const activeCollapse = ref<number[]>([0])
const rotaId = ref<number>(0)
const rotaRuleData = ref<rotaRule[]>([])
const setRules = (id: number, rules: rotaRule[]) => {
  rotaId.value = id
  rotaRuleData.value = rules
}

const resetRule = () => {
  rotaRuleData.value = []
}

const deleteRule = (ruleIndex: number) => {
  if (window.confirm("Are you sure you want to delete this rule?")) {
    rotaRuleData.value.splice(ruleIndex, 1)

    updateShifSchedulingRule()
  }
}

const replaceRule = (ruleIndex: number) => {
  nextTick(() => {
    const ruleComponent = ruleRefs.value[ruleIndex]

    if (ruleComponent) {
      const rota = ruleComponent.getFrom()
      const rule = rota?.value.rota_rule
      console.log("rule", rule)
      if (rule !== undefined) {
        rotaRuleData.value[ruleIndex] = rule
      }

      updateShifSchedulingRule()
    }
  })
}

const handleCollapseChange = (active: number) => {
  const ruleComponent = ruleRefs.value[active]
  const rule = rotaRuleData.value[active]
  if (ruleComponent) {
    const ruleToUpdate: addRuleReq = {
      id: Number(rotaId),
      rota_rule: {
        ...rule
      }
    }

    ruleComponent.setFrom(ruleToUpdate)
  }
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
.rota-group-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  border-radius: 8px;
}
.group-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  .el-button {
    font-size: 12px;
    padding: 6px 12px;
    height: auto;
  }

  .el-button--primary,
  .el-button--danger {
    min-width: 80px;
    padding: 4px 8px;
  }
}
</style>
