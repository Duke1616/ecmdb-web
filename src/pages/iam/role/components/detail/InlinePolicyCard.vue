<script setup lang="ts">
import type { InlinePolicy } from "@/api/iam/role/type"
import { DocumentCopy } from "@element-plus/icons-vue"

defineProps<{
  policies: InlinePolicy[]
}>()
</script>

<template>
  <div class="inline-policies-container">
    <div v-for="policy in policies" :key="policy.code" class="policy-item-card">
      <div class="policy-header">
        <div class="left">
          <el-icon class="icon"><DocumentCopy /></el-icon>
          <span class="name">{{ policy.name }}</span>
          <code>{{ policy.code }}</code>
        </div>
      </div>

      <div class="statements-list">
        <div v-for="(st, idx) in policy.statement" :key="idx" class="statement-row">
          <div class="effect-tag" :class="st.effect.toLowerCase()">
            {{ st.effect }}
          </div>

          <div class="st-content">
            <div class="content-group">
              <div class="label">Actions:</div>
              <div class="tags">
                <el-tag v-for="act in st.action" :key="act" size="small" effect="light" class="st-tag blue">
                  {{ act }}
                </el-tag>
              </div>
            </div>

            <div class="content-group">
              <div class="label">Resources:</div>
              <div class="tags">
                <el-tag v-for="res in st.resource" :key="res" size="small" effect="light" class="st-tag gray">
                  {{ res }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-empty v-if="!policies?.length" description="暂无内联策略定义" :image-size="80" />
  </div>
</template>

<style lang="scss" scoped>
.inline-policies-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.policy-item-card {
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;

  .policy-header {
    background: #fbfcfd;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
      display: flex;
      align-items: center;
      gap: 10px;

      .icon {
        color: #64748b;
        font-size: 16px;
      }

      .name {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }

      code {
        font-size: 12px;
        color: #64748b;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
  }

  .statements-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.statement-row {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;

  .effect-tag {
    height: 24px;
    padding: 0 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    display: flex;
    align-items: center;

    &.allow {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
    }

    &.deny {
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }
  }

  .st-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .content-group {
      display: flex;
      gap: 8px;
      align-items: flex-start;

      .label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        width: 70px;
        padding-top: 4px;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
    }
  }
}

.st-tag {
  border: none;
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 11px;

  &.blue {
    background: #e0e7ff;
    color: #4338ca;
  }

  &.gray {
    background: #f1f5f9;
    color: #475569;
  }
}
</style>
