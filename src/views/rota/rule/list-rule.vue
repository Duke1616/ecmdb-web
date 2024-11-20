<template>
  <el-collapse v-model="activeCollapse" accordion @change="handleCollapseChange">
    <el-collapse-item
      v-for="(rule, ruleIndex) in rotaRuleData"
      :key="ruleIndex"
      :title="`规则 ${ruleIndex + 1}`"
      :name="ruleIndex"
    >
      <div class="rota-group-card">
        <el-card class="custom-card">
          <!-- 展示 rule 的所有详细信息 -->
          <Rule ref="ruleRefs" />

          <!-- 展示修改和删除按钮 -->
          <div class="group-actions">
            <el-button @click="replaceRule(ruleIndex)" type="primary" size="small">修改</el-button>
            <el-button @click="deleteRule(ruleIndex)" type="danger" size="small">删除</el-button>
          </div>
        </el-card>
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<script setup lang="ts">
import { updateShifSchedulingRuleApi } from "@/api/rota"
import { addRuleReq, rotaRule } from "@/api/rota/types/rota"
import { h, nextTick, ref } from "vue"
import Rule from "./rule.vue"
import { ElMessage, ElMessageBox } from "element-plus"

const ruleRefs = ref<InstanceType<typeof Rule>[]>([])
const activeCollapse = ref<number[]>([])
const rotaId = ref<number>(0)
const rotaRuleData = ref<rotaRule[]>([])

const emits = defineEmits(["closed", "callback"])

const setRules = (id: number, rules: rotaRule[]) => {
  rotaId.value = id
  rotaRuleData.value = rules
}

const resetRule = () => {
  rotaRuleData.value = []
  activeCollapse.value = []
}

const deleteRule = (ruleIndex: number) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `规则 ${ruleIndex + 1}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    rotaRuleData.value.splice(ruleIndex, 1)

    // 重置
    activeCollapse.value = []
    deleteShifSchedulingRule()
  })
}

const replaceRule = (ruleIndex: number) => {
  nextTick(async () => {
    const ruleComponent = ruleRefs.value[ruleIndex]

    if (ruleComponent) {
      const rota = ruleComponent.getFrom()
      const rule = rota?.value.rota_rule
      if (rule !== undefined) {
        // 替换数据
        rotaRuleData.value[ruleIndex] = rule

        // 更新数据库
        updateShifSchedulingRule()
      }
    }
  })
}

const handleCollapseChange = (active: any) => {
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

const deleteShifSchedulingRule = () => {
  updateShifSchedulingRuleApi({
    id: rotaId.value,
    rota_rules: rotaRuleData.value
  })
    .then(() => {
      ElMessage.success("删除成功")

      if (rotaRuleData.value.length === 0) {
        emits("closed")
      }

      // 重新获取数据
      emits("callback")
    })
    .catch(() => {})
    .finally(() => {})
}

const updateShifSchedulingRule = () => {
  updateShifSchedulingRuleApi({
    id: rotaId.value,
    rota_rules: rotaRuleData.value
  })
    .then(() => {
      ElMessage.success("修改成功")

      if (rotaRuleData.value.length === 0) {
        emits("closed")
      }

      emits("callback")
    })
    .catch(() => {})
    .finally(() => {})
}

defineExpose({ setRules, resetRule })
</script>

<style scoped>
.custom-card {
  border: 1px solid #42b983; /* 自定义边框颜色 */
  border-radius: 8px; /* 可选：调整圆角 */
}

::v-deep(.el-card__body) {
  max-height: 420px;
  overflow: auto;
  scroll-behavior: smooth; /* 平滑滚动 */
}

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
