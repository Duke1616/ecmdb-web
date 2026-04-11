<template>
  <div class="iam-matrix">
    <div v-for="svc in activeServices" :key="svc.code" class="svc-segment">
      <div class="segment-title">
        <el-icon><Monitor /></el-icon>
        <span>{{ svc.name }}</span>
        <div class="selection-info">
          已选 {{ getSelectedCount(svc) }} / {{ getSvcTotal(svc) }}
          <el-link type="primary" :underline="false" class="bulk-btn" @click="toggleSvc(svc, true)">全选</el-link>
          <el-link type="info" :underline="false" class="bulk-btn" @click="toggleSvc(svc, false)">清空</el-link>
        </div>
      </div>

      <div class="groups-container">
        <div v-for="grp in svc.entries" :key="grp.name" class="grp-row">
          <div class="grp-header">
            <el-checkbox
              :model-value="getGrpState(grp).all"
              :indeterminate="getGrpState(grp).some"
              size="small"
              @change="(val: any) => toggleGrp(grp, val)"
            >
              {{ grp.name }}
            </el-checkbox>
          </div>
          <div class="grp-actions-grid">
            <el-checkbox
              v-for="act in grp.actions"
              :key="act.code"
              :model-value="selectedActions.includes(act.code)"
              :label="act.code"
              class="pure-act-item"
              @change="(checked: any) => $emit('toggleAction', act.code, checked)"
            >
              <div class="act-info">
                <span class="act-name">{{ act.name }}</span>
                <span class="act-code">{{ act.code.split(":").pop() }}</span>
              </div>
            </el-checkbox>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor } from "@element-plus/icons-vue"
import type { ManifestService, ManifestGroup } from "../../types"

const props = defineProps<{
  activeServices: ManifestService[]
  selectedActions: string[]
}>()

const emit = defineEmits(["toggleAction", "updateActions"])

const getGrpCodes = (grp: ManifestGroup): string[] => grp.actions.map((a) => a.code)
const getSvcCodes = (svc: ManifestService): string[] =>
  svc.entries.reduce((acc, g) => [...acc, ...getGrpCodes(g)], [] as string[])

const getSelectedCount = (svc: ManifestService) => {
  const codes = getSvcCodes(svc)
  return codes.filter((c) => props.selectedActions.includes(c)).length
}

const getSvcTotal = (svc: ManifestService) => {
  return getSvcCodes(svc).length
}

const getGrpState = (grp: ManifestGroup) => {
  const codes = getGrpCodes(grp)
  const selectedCount = codes.filter((c) => props.selectedActions.includes(c)).length
  return {
    all: selectedCount === codes.length && codes.length > 0,
    some: selectedCount > 0 && selectedCount < codes.length
  }
}

const toggleGrp = (grp: ManifestGroup, checked: boolean) => {
  const codes = getGrpCodes(grp)
  let next = [...props.selectedActions]
  if (checked) {
    next = [...new Set([...next, ...codes])]
  } else {
    next = next.filter((c) => !codes.includes(c))
  }
  emit("updateActions", next)
}

const toggleSvc = (svc: ManifestService, checked: boolean) => {
  const codes = getSvcCodes(svc)
  let next = [...props.selectedActions]
  if (checked) {
    next = [...new Set([...next, ...codes])]
  } else {
    next = next.filter((c) => !codes.includes(c))
  }
  emit("updateActions", next)
}
</script>

<style lang="scss" scoped>
.iam-matrix {
  .svc-segment {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }

    .segment-title {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 8px;
      border-bottom: 2px solid #3b82f6;
      margin-bottom: 16px;
      font-weight: 700;
      font-size: 15px;
      color: #1e293b;

      .selection-info {
        margin-left: auto;
        font-size: 12px;
        font-weight: 400;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 12px;

        .bulk-btn {
          font-size: 12px;
        }
      }
    }
  }

  .groups-container {
    display: flex;
    flex-direction: column;
    gap: 1px;
    background: #e2e8f0;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .grp-row {
    display: flex;
    background: #fff;

    .grp-header {
      width: 160px;
      padding: 12px 16px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      flex-shrink: 0;

      :deep(.el-checkbox__label) {
        font-weight: 700;
        font-size: 13px;
        color: #475569;
      }
    }

    .grp-actions-grid {
      flex: 1;
      padding: 12px 20px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
    }
  }

  .pure-act-item {
    margin-right: 0 !important;
    height: auto;
    padding: 6px;
    border-radius: 4px;
    transition: background 0.15s;

    &:hover {
      background: #f1f5f9;
    }

    :deep(.el-checkbox__label) {
      flex: 1;
      padding-left: 10px;
    }

    .act-info {
      display: flex;
      flex-direction: column;
      gap: 1px;

      .act-name {
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        line-height: 1.2;
      }

      .act-code {
        font-size: 11px;
        color: #94a3b8;
        font-family: ui-monospace, monospace;
      }
    }
  }
}
</style>
