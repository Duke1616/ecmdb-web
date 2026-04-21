<script setup lang="ts">
import { DocumentCopy } from "@element-plus/icons-vue"
import type { Policy } from "@/api/iam/policy/type"

defineProps<{
  policy?: Policy | null
}>()

const emit = defineEmits<{
  (e: "copy", text: string): void
}>()

const formatDate = (ts: number | undefined) => {
  if (!ts) return "-"
  const d = new Date(ts)
  return d.toLocaleString()
}
</script>

<template>
  <div class="policy-info-grid">
    <!-- 第一排：核心标识与元数据 -->
    <div class="info-row grid-4-cols">
      <div class="info-item">
        <label>策略名称</label>
        <span class="value">{{ policy?.name }}</span>
      </div>
      <div v-if="policy?.code" class="info-item">
        <label>策略识别码 (Code)</label>
        <div class="code-box" @click="emit('copy', policy.code)">
          <code>{{ policy.code }}</code>
          <el-icon class="copy-icon"><DocumentCopy /></el-icon>
        </div>
      </div>
      <div class="info-item">
        <label>关联主体数量</label>
        <span class="value">{{ policy?.assignment_count || 0 }}</span>
      </div>
      <div v-if="policy?.ctime" class="info-item">
        <label>创建时间</label>
        <span class="value time">{{ formatDate(policy.ctime) }}</span>
      </div>
    </div>

    <!-- 第二排：策略描述 -->
    <div v-if="policy?.desc" class="info-row">
      <div class="info-item full">
        <label>策略职能描述</label>
        <span class="value desc">{{ policy.desc }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.policy-info-grid {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .info-row {
    display: flex;
    gap: 32px;

    &.grid-4-cols {
      display: grid;
      grid-template-columns: 1.2fr 1.2fr 0.8fr 1.5fr;
      gap: 32px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.full {
        grid-column: span 3;
      }

      label {
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .value {
        font-size: 13.5px;
        color: #1e293b;
        font-weight: 500;
        &.desc {
          line-height: 1.6;
          color: #475569;
        }
        &.time {
          color: #64748b;
          font-family: ui-monospace, monospace;
        }
      }

      .code-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 4px 10px;
        border-radius: 6px;
        width: fit-content;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          .copy-icon {
            color: #6366f1;
          }
        }

        code {
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }

        .copy-icon {
          font-size: 14px;
          color: #94a3b8;
        }
      }
    }
  }
}
</style>
