<template>
  <div class="system-grid">
    <div
      v-for="r in systemRules"
      :key="r.value"
      class="logic-card"
      :class="{ active: isRuleActive(r.value) }"
      @click="toggleRule(r.value)"
    >
      <div class="logic-check-orb">
        <el-icon><Check /></el-icon>
      </div>
      <div class="logic-info">
        <span class="l-name">{{ r.label }}</span>
        <span class="l-desc">{{ r.desc }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from "@element-plus/icons-vue"

// NOTE: 系统规则面板，用于选择内置逻辑规则
interface Props {
  activeRules: string[]
}

const props = withDefaults(defineProps<Props>(), {
  activeRules: () => []
})

const emits = defineEmits<{
  (e: "toggle", ruleValue: string): void
}>()

const systemRules = [
  { label: "工单创建人", value: "founder", desc: "提交工单并启动流程的用户" },
  { label: "部门负责人", value: "leaders", desc: "创建人所属部门的管理人员" }
]

const isRuleActive = (r: string) => props.activeRules.includes(r)

const toggleRule = (r: string) => {
  emits("toggle", r)
}
</script>

<style lang="scss" scoped>
.system-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.logic-card {
  padding: 18px;
  border-radius: 14px;
  border: 1.5px solid #f1f5f9;
  cursor: pointer;
  display: flex;
  gap: 16px;
  transition: all 0.25s;

  .logic-check-orb {
    width: 22px;
    height: 22px;
    border: 2.5px solid #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: transparent;
  }
  .l-name {
    display: block;
    font-size: 14px;
    font-weight: 800;
    color: #334155;
  }
  .l-desc {
    font-size: 11px;
    color: #94a3b8;
  }
  &:hover {
    border-color: #cbd5e1;
    transform: translateY(-2px);
  }
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    .logic-check-orb {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }
    .l-name {
      color: #1e3a8a;
    }
  }
}
</style>
