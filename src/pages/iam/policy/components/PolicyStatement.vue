<template>
  <div class="ali-policy-card" :class="stmt.effect.toLowerCase()">
    <div class="side-indicator" />

    <div class="card-main">
      <header class="card-header">
        <div class="header-info">
          <span class="idx-tag">#{{ index + 1 }}</span>
          <span class="summary">{{ summaryText }}</span>
        </div>
        <div class="header-actions">
          <el-button link @click="$emit('duplicate', index)">
            <el-icon><CopyDocument /></el-icon> 复制
          </el-button>
          <el-button link @click="$emit('remove', index)">
            <el-icon><Delete /></el-icon> 移除
          </el-button>
        </div>
      </header>

      <main class="card-body">
        <!-- 授权效能 (单行直接展示) -->
        <SectionPanel label="授权效能" required no-arrow>
          <template #preview>
            <el-radio-group
              :model-value="stmt.effect"
              @change="(val) => patchStmt({ effect: val as 'Allow' | 'Deny' })"
            >
              <el-radio label="Allow">允许</el-radio>
              <el-radio label="Deny">拒绝</el-radio>
            </el-radio-group>
          </template>
        </SectionPanel>

        <!-- 授权操作 -->
        <ActionConfig
          :stmt="stmt"
          :permission-manifest="permissionManifest"
          label="授权操作"
          required
          @update:stmt="patchStmt"
        />

        <!-- 目标资源 -->
        <ResourceConfig :stmt="stmt" label="目标资源" required :disabled="isActionEmpty" @update:stmt="patchStmt" />

        <!-- 限制条件 -->
        <ConditionConfig :stmt="stmt" label="限制条件" :disabled="isActionEmpty" @update:stmt="patchStmt" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { CopyDocument, Delete } from "@element-plus/icons-vue"

// 引入拆分后的业务拼图组件与通用面板
import SectionPanel from "./PolicyStatement/sections/SectionPanel.vue"
import ActionConfig from "./PolicyStatement/sections/ActionConfig.vue"
import ResourceConfig from "./PolicyStatement/sections/ResourceConfig.vue"
import ConditionConfig from "./PolicyStatement/sections/ConditionConfig.vue"

import { type StatementVO, type ManifestService, getActionSummary } from "../composables/usePolicyData"

const props = defineProps<{
  stmt: StatementVO
  index: number
  permissionManifest: ManifestService[]
}>()

const emit = defineEmits(["duplicate", "remove", "update:stmt"])

const patchStmt = (patch: Partial<StatementVO>) => {
  emit("update:stmt", { ...props.stmt, ...patch })
}

// 只有当授权操作不为空时，才允许配置资源和条件
const isActionEmpty = computed(() => !props.stmt.action || props.stmt.action.length === 0)

// 获取标题栏摘要描述
const summaryText = computed(() => getActionSummary(props.stmt.action, props.permissionManifest))
</script>

<style lang="scss" scoped>
.ali-policy-card {
  display: flex;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  margin-bottom: 10px;
  position: relative;

  .side-indicator {
    width: 4px;
    flex-shrink: 0;
  }
  &.allow .side-indicator {
    background: #52c41a;
  }
  &.deny .side-indicator {
    background: #ff4d4f;
  }

  .card-main {
    flex: 1;
    min-width: 0;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;

    .idx-tag {
      font-weight: 700;
      color: #1e293b;
      font-size: 15px;
      font-family: ui-monospace, SFMono-Regular, mono;
    }

    .summary {
      font-size: 14px;
      color: #64748b;
      font-weight: 600;
      margin-left: 10px;
    }

    .header-actions .el-button {
      font-size: 13px;
      color: #64748b;
      &:hover {
        color: #409eff;
      }
    }
  }

  .card-body {
    padding: 0;
  }
}
</style>
