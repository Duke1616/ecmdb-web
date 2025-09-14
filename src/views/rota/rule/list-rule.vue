<template>
  <div class="rule-list-container">
    <!-- 规则列表 -->
    <div class="rule-list">
      <div v-if="rotaRuleData.length === 0" class="empty-state">
        <el-icon class="empty-icon"><DocumentRemove /></el-icon>
        <p class="empty-text">暂无规则</p>
        <p class="empty-hint">请先添加排班规则</p>
      </div>

      <div v-else class="rule-cards">
        <div
          v-for="(rule, ruleIndex) in rotaRuleData"
          :key="ruleIndex"
          class="rule-card"
          :class="{
            active: activeCollapse.includes(ruleIndex),
            hidden: activeCollapse.length > 0 && !activeCollapse.includes(ruleIndex),
            'single-rule': rotaRuleData.length === 1
          }"
        >
          <!-- 规则卡片头部 -->
          <div class="rule-card-header" @click="toggleRule(ruleIndex)">
            <div class="rule-info">
              <div class="rule-title">
                <el-icon class="rule-icon"><Setting /></el-icon>
                <span>规则 {{ ruleIndex + 1 }}</span>
              </div>
              <div class="rule-summary">
                <el-tag size="small" type="info">{{ getRuleSummary(rule) }}</el-tag>
              </div>
            </div>
            <div class="rule-actions">
              <el-icon class="expand-icon" :class="{ expanded: activeCollapse.includes(ruleIndex) }">
                <ArrowDown />
              </el-icon>
            </div>
          </div>

          <!-- 规则详情内容 -->
          <div v-if="activeCollapse.includes(ruleIndex)" class="rule-card-content">
            <div class="rule-details">
              <Rule :ref="(el) => setRuleRef(el, ruleIndex)" />
            </div>

            <!-- 操作按钮 -->
            <div class="rule-actions-bottom">
              <el-button @click="replaceRule(ruleIndex)" type="primary" size="default" :icon="Edit" class="action-btn">
                修改规则
              </el-button>
              <el-button @click="deleteRule(ruleIndex)" type="danger" size="default" :icon="Delete" class="action-btn">
                删除规则
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { updateShifSchedulingRuleApi } from "@/api/rota"
import { addRuleReq, rotaRule } from "@/api/rota/types/rota"
import { h, nextTick, ref } from "vue"
import Rule from "./rule.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { DocumentRemove, Setting, ArrowDown, Edit, Delete } from "@element-plus/icons-vue"

const ruleRefs = ref<InstanceType<typeof Rule>[]>([])
const activeCollapse = ref<number[]>([])
const rotaId = ref<number>(0)
const rotaRuleData = ref<rotaRule[]>([])

const emits = defineEmits(["closed", "callback"])

// 设置规则组件引用
const setRuleRef = (el: any, index: number) => {
  if (el) {
    ruleRefs.value[index] = el
  }
}

const setRules = (id: number, rules: rotaRule[]) => {
  rotaId.value = id
  rotaRuleData.value = rules

  // 如果只有一个规则，直接展开
  if (rules.length === 1) {
    activeCollapse.value = [0]
    nextTick(() => {
      handleCollapseChange(0)
    })
  }
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
    // 确保组件已经渲染
    await nextTick()

    const ruleComponent = ruleRefs.value[ruleIndex]

    if (ruleComponent) {
      const rota = ruleComponent.getFrom()
      const rule = rota?.value.rota_rule
      if (rule !== undefined) {
        // 替换数据
        rotaRuleData.value[ruleIndex] = rule

        // 更新数据库
        updateShifSchedulingRule()
      } else {
        ElMessage.error("获取规则数据失败")
      }
    } else {
      ElMessage.error("规则组件未找到")
    }
  })
}

const handleCollapseChange = (active: any) => {
  const ruleComponent = ruleRefs.value[active]
  const rule = rotaRuleData.value[active]

  if (ruleComponent && rule) {
    const ruleToUpdate: addRuleReq = {
      id: Number(rotaId.value),
      rota_rule: {
        ...rule
      }
    }

    console.log("Setting rule data:", ruleToUpdate)
    ruleComponent.setFrom(ruleToUpdate)
  } else {
    console.error("Rule component or rule data not found:", { ruleComponent, rule, active })
  }
}

// 切换规则展开/收起
const toggleRule = (ruleIndex: number) => {
  const index = activeCollapse.value.indexOf(ruleIndex)
  if (index > -1) {
    activeCollapse.value.splice(index, 1)
  } else {
    activeCollapse.value = [ruleIndex] // 手风琴模式，只展开一个
  }

  // 触发数据加载
  if (activeCollapse.value.includes(ruleIndex)) {
    console.log("Toggling rule:", ruleIndex, "Data:", rotaRuleData.value[ruleIndex])
    // 确保组件已经渲染
    nextTick(() => {
      handleCollapseChange(ruleIndex)
    })
  }
}

// 获取规则摘要
const getRuleSummary = (rule: rotaRule) => {
  if (!rule) return "无信息"

  const groups = rule.rota_groups?.length || 0
  const members = rule.rota_groups?.reduce((total, group) => total + (group.members?.length || 0), 0) || 0

  return `${groups} 个组，${members} 人`
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

<style lang="scss" scoped>
.rule-list-container {
  height: 65vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* 规则列表 */
.rule-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    color: #64748b;

    .empty-icon {
      font-size: 48px;
      color: #cbd5e1;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 16px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 8px 0;
    }

    .empty-hint {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }
  }

  .rule-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
  }
}

/* 规则卡片 */
.rule-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition:
    all 0.3s ease,
    max-height 0.3s ease,
    opacity 0.3s ease,
    transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;

  &.active {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    flex: 1; // 只有展开时才自适应
  }

  &:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  &.hidden {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    margin: 0;
    padding: 0;
    transform: scaleY(0);
    transform-origin: top;
  }

  &.single-rule {
    // 单个规则时，头部可以稍微简化
    .rule-card-header {
      cursor: default;

      .rule-actions {
        .expand-icon {
          opacity: 0.5;
        }
      }
    }
  }

  .rule-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f8fafc;
    }

    .rule-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;

      .rule-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;

        .rule-icon {
          color: #3b82f6;
          font-size: 18px;
        }
      }

      .rule-summary {
        .el-tag {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
        }
      }
    }

    .rule-actions {
      .expand-icon {
        font-size: 16px;
        color: #64748b;
        transition: transform 0.3s ease;

        &.expanded {
          transform: rotate(180deg);
        }
      }
    }
  }

  .rule-card-content {
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    .rule-details {
      flex: 1;
      min-height: 0;
      overflow-y: auto;

      :deep(.rule-form-container) {
        height: auto;
        max-height: none;
        overflow: visible;
      }

      :deep(.rule-form) {
        overflow: visible;
        max-height: none;
      }
    }

    .rule-actions-bottom {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;

      .action-btn {
        font-size: 14px;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }
}

/* 滚动条样式 */
.rule-list::-webkit-scrollbar {
  width: 6px;
}

.rule-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.rule-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.rule-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
