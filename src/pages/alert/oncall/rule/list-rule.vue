<template>
  <div class="rule-list-container">
    <!-- 规则列表 -->
    <div class="rule-list">
      <div v-if="oncallRuleData.length === 0" class="empty-state">
        <el-icon class="empty-icon"><DocumentRemove /></el-icon>
        <p class="empty-text">暂无规则</p>
        <p class="empty-hint">请先添加排班规则</p>
      </div>

      <div v-else class="rule-cards">
        <div
          v-for="(rule, ruleIndex) in oncallRuleData"
          :key="getRuleId(rule) || ruleIndex"
          class="rule-card"
          :class="{
            active: activeCollapse.includes(ruleIndex),
            'enabled-rule': rule.enabled,
            'single-rule': oncallRuleData.length === 1
          }"
        >
          <!-- 规则卡片头部 -->
          <div class="rule-card-header" @click="toggleRule(ruleIndex)">
            <div class="rule-info">
              <div class="rule-title">
                <el-icon class="rule-icon"><Setting /></el-icon>
                <span>规则 {{ ruleIndex + 1 }}</span>
                <el-tag v-if="rule.enabled" size="small" type="success" effect="plain">当前使用</el-tag>
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
              <Rule :ref="(el: any) => setRuleRef(el, ruleIndex)" />
            </div>

            <!-- 操作按钮 -->
            <div class="rule-actions-bottom">
              <AuthButton
                v-if="!rule.enabled && getRuleId(rule)"
                type="success"
                size="default"
                :icon="Check"
                class="action-btn"
                :capability="ALERT_CAPABILITIES.Oncall.Active"
                disable-mode
                @click="activeRule(ruleIndex)"
              >
                设为启用
              </AuthButton>
              <AuthButton
                type="primary"
                size="default"
                :icon="Edit"
                class="action-btn"
                :capability="ALERT_CAPABILITIES.Oncall.RuleEdit"
                disable-mode
                @click="replaceRule(ruleIndex)"
              >
                修改规则
              </AuthButton>
              <AuthButton
                type="danger"
                size="default"
                :icon="Delete"
                class="action-btn"
                :capability="ALERT_CAPABILITIES.Oncall.RuleEdit"
                disable-mode
                @click="deleteRule(ruleIndex)"
              >
                删除规则
              </AuthButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { activeShiftSchedulingRuleApi, updateShiftSchedulingRuleApi } from "@/api/alert/oncall"
import { AddRuleReq, OnCallRule } from "@/api/alert/oncall/types/oncall"
import { h, nextTick, ref } from "vue"
import Rule from "./rule.vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { DocumentRemove, Setting, ArrowDown, Edit, Delete, Check } from "@element-plus/icons-vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"

const ruleRefs = ref<InstanceType<typeof Rule>[]>([])
const activeCollapse = ref<number[]>([])
const rotaId = ref<number>(0)
const oncallRuleData = ref<OnCallRule[]>([])

const emits = defineEmits(["closed", "callback"])

// 设置规则组件引用
const setRuleRef = (el: any, index: number) => {
  if (el) {
    ruleRefs.value[index] = el
  }
}

const setRules = (id: number, rules: OnCallRule[]) => {
  rotaId.value = id
  oncallRuleData.value = rules.map(normalizeRule)

  // 如果只有一个规则，直接展开
  if (rules.length === 1) {
    activeCollapse.value = [0]
    nextTick(() => {
      handleCollapseChange(0)
    })
  }
}

const getRuleId = (rule?: OnCallRule) => rule?.id || rule?.rule_id || 0

const normalizeRule = (rule: OnCallRule): OnCallRule => {
  const ruleId = getRuleId(rule)
  return {
    ...rule,
    id: ruleId,
    rule_type: rule.rule_type || 1,
    enabled: Boolean(rule.enabled)
  }
}

const resetRule = () => {
  oncallRuleData.value = []
  activeCollapse.value = []
}

const deleteRule = (ruleIndex: number) => {
  const nextRules = oncallRuleData.value.filter((_, index) => index !== ruleIndex)
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
    deleteShiftSchedulingRule(nextRules)
  })
}

const replaceRule = (ruleIndex: number) => {
  nextTick(async () => {
    // 确保组件已经渲染
    await nextTick()

    const ruleComponent = ruleRefs.value[ruleIndex]

    if (ruleComponent) {
      const rota = ruleComponent.getFrom()
      const rule = rota?.value.oncall_rule
      if (rule !== undefined) {
        const originRule = oncallRuleData.value[ruleIndex]
        const originRuleId = getRuleId(originRule)
        oncallRuleData.value[ruleIndex] = {
          ...originRule,
          ...rule,
          id: originRuleId,
          rule_id: originRuleId,
          rule_type: originRule.rule_type || 1,
          enabled: originRule.enabled
        }

        // 更新数据库
        updateShiftSchedulingRule()
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
  const rule = oncallRuleData.value[active]

  if (ruleComponent && rule) {
    const ruleToUpdate: AddRuleReq = {
      id: Number(rotaId.value),
      oncall_rule: {
        ...rule
      }
    }

    ruleComponent.setFrom(ruleToUpdate)
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
    // 确保组件已经渲染
    nextTick(() => {
      handleCollapseChange(ruleIndex)
    })
  }
}

// 获取规则摘要
const getRuleSummary = (rule: OnCallRule) => {
  if (!rule) return "无信息"

  const groups = rule.oncall_groups?.length || 0
  const members = rule.oncall_groups?.reduce((total, group) => total + (group.members?.length || 0), 0) || 0

  return `${groups} 个组，${members} 人`
}

const activeRule = (ruleIndex: number) => {
  const rule = oncallRuleData.value[ruleIndex]
  const ruleId = getRuleId(rule)
  if (!ruleId) {
    ElMessage.error("规则 ID 为空，无法启用")
    return
  }

  activeShiftSchedulingRuleApi({
    id: rotaId.value,
    rule_id: ruleId
  })
    .then(() => {
      oncallRuleData.value = oncallRuleData.value.map((item) => ({
        ...item,
        enabled: getRuleId(item) === ruleId
      }))
      ElMessage.success("启用成功")
      emits("callback")
    })
    .catch(() => {
      ElMessage.error("启用失败，请稍后重试")
    })
}

const deleteShiftSchedulingRule = (rules: OnCallRule[]) => {
  updateShiftSchedulingRuleApi({
    id: rotaId.value,
    oncall_rules: rules.map(normalizeRule)
  })
    .then(() => {
      oncallRuleData.value = rules.map(normalizeRule)
      activeCollapse.value = []
      ElMessage.success("删除成功")

      if (oncallRuleData.value.length === 0) {
        emits("closed")
      }

      // 重新获取数据
      emits("callback")
    })
    .catch(() => {})
    .finally(() => {})
}

const updateShiftSchedulingRule = () => {
  updateShiftSchedulingRuleApi({
    id: rotaId.value,
    oncall_rules: oncallRuleData.value.map(normalizeRule)
  })
    .then(() => {
      ElMessage.success("修改成功")

      if (oncallRuleData.value.length === 0) {
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
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  overflow: hidden;
  margin: 0;
  padding: 2px;
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
    flex: 1;
    min-height: 100%;
  }
}

/* 规则卡片 */
.rule-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  &.active {
    flex: 1;
    min-height: 0;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
  }

  &:hover {
    border-color: #bfdbfe;
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
    padding: 14px 16px;
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
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;

        .rule-icon {
          color: #3b82f6;
          font-size: 16px;
        }

        .el-tag {
          margin-left: 4px;
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
    background: #ffffff;
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    .rule-details {
      flex: 1;
      min-height: 0;
      padding: 14px;
      overflow: hidden;

      :deep(.rule-form-container) {
        height: 100%;
        min-height: 0;
        max-height: none;
        overflow: hidden;
      }

      :deep(.rule-form) {
        overflow: visible;
        max-height: none;
      }
    }

    .rule-actions-bottom {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 12px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      flex-shrink: 0;

      .action-btn {
        font-size: 13px;
        padding: 8px 14px;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
          box-shadow: none;
        }
      }
    }
  }
}

.enabled-rule {
  border-color: var(--el-color-success-light-5);

  .rule-card-header {
    background: #f0fdf4;
  }

  .rule-icon {
    color: var(--el-color-success);
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
