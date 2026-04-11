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
        <!-- 效果 (Effect) -->
        <section class="config-row config-effect">
          <label class="row-label">授权效能</label>
          <div class="row-content">
            <el-radio-group
              :model-value="stmt.effect"
              @change="(val) => patchStmt({ effect: val as 'Allow' | 'Deny' })"
            >
              <el-radio label="Allow">允许 (Allow)</el-radio>
              <el-radio label="Deny">拒绝 (Deny)</el-radio>
            </el-radio-group>
          </div>
        </section>

        <!-- 抽取解耦出的三大组件核心 -->
        <ActionConfig :stmt="stmt" :permission-manifest="permissionManifest" @update:stmt="patchStmt" />

        <ResourceConfig :stmt="stmt" @update:stmt="patchStmt" />

        <ConditionConfig :stmt="stmt" @update:stmt="patchStmt" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { CopyDocument, Delete } from "@element-plus/icons-vue"

// 引入拆分后的业务拼图组件
import ActionConfig from "./PolicyStatement/sections/ActionConfig.vue"
import ResourceConfig from "./PolicyStatement/sections/ResourceConfig.vue"
import ConditionConfig from "./PolicyStatement/sections/ConditionConfig.vue"

import type { StatementVO, ManifestService } from "../types"

const props = defineProps<{
  stmt: StatementVO
  index: number
  permissionManifest: ManifestService[]
}>()

const emit = defineEmits(["duplicate", "remove", "update:stmt"])

const patchStmt = (patch: Partial<StatementVO>) => {
  emit("update:stmt", { ...props.stmt, ...patch })
}

// 获取操作模块名字供标题栏简单展示，避免页面失去响应式，通过 ActionConfig 的抽取，这是剩下的唯一复杂视图需求
const summaryText = computed(() => {
  const codes = props.stmt.action.map((a) => a.split(":")[0])
  const uniqueCodes = [...new Set(codes)].filter((c) => props.permissionManifest.some((s) => s.code === c))

  if (uniqueCodes.length === 0) return "权限条目配置"

  const first = props.permissionManifest.find((s) => s.code === uniqueCodes[0])
  const actionMode = props.stmt.action.some((a) => a.endsWith(":*")) ? "all" : "specific"
  const desc = actionMode === "all" ? "全部授权" : `${props.stmt.action.length} 个操作`

  return `${first?.name || "未知模块"} / ${desc}`
})
</script>

<style lang="scss" scoped>
.ali-policy-card {
  display: flex;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  margin-bottom: 24px;
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
    padding: 10px 16px;
    background: #fbfbfb;
    border-bottom: 1px solid #ebeef5;

    .idx-tag {
      font-weight: bold;
      color: #333;
      font-size: 13px;
      font-family: ui-monospace, mono;
    }

    .summary {
      font-size: 13px;
      color: #8c8c8c;
      font-weight: 500;
      margin-left: 10px;
    }

    .header-actions .el-button {
      font-size: 12px;
      color: #8c8c8c;
      &:hover {
        color: #0070cc;
      }
    }
  }

  .card-body {
    padding: 4px 0;
  }

  .config-effect {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;

    .row-label {
      width: 100px;
      flex-shrink: 0;
      font-size: 13px;
      color: #333;
    }

    .row-content {
      flex: 1;
    }
  }
}
</style>
