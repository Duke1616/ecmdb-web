<template>
  <div class="iam-matrix">
    <div v-for="svc in filteredActiveServices" :key="svc.code" class="svc-segment">
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
        <MatrixRow
          v-for="grp in svc.entries"
          :key="grp.name"
          :grp="grp"
          :selected-actions="selectedActions"
          :menu-details-map="menuDetailsMap"
          @toggle-action="(code, checked) => $emit('toggleAction', code, checked)"
          @update-actions="(actions) => $emit('updateActions', actions)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from "vue"
import type { Ref } from "vue"
import { Monitor } from "@element-plus/icons-vue"
import MatrixRow from "./components/MatrixRow.vue"
import type { ManifestService, ManifestGroup } from "../../composables/usePolicyData"

const props = defineProps<{
  activeServices: ManifestService[]
  selectedActions: string[]
  searchQuery?: string
}>()

const emit = defineEmits(["toggleAction", "updateActions"])

const menuDetailsMap = inject<Ref<Record<string, any>>>("menuDetailsMap", ref({}))

/** 递归展平多级目录分组 */
const flattenGroups = (entries: ManifestGroup[]): ManifestGroup[] => {
  const result: ManifestGroup[] = []

  const traverse = (grp: ManifestGroup, parentNames: string[] = []) => {
    const currentNames = [...parentNames, grp.name]

    if (grp.actions && grp.actions.length > 0) {
      result.push({
        name: currentNames.join(" / "),
        actions: grp.actions
      })
    }

    if (grp.children && grp.children.length > 0) {
      grp.children.forEach((child) => traverse(child, currentNames))
    }
  }

  ;(entries || []).forEach((entry) => traverse(entry))
  return result
}

/** 过滤后的展示服务与操作项矩阵 */
const filteredActiveServices = computed(() => {
  const query = props.searchQuery?.toLowerCase().trim()

  // 1. 先将每个服务下的 entries 展平
  const flattenedServices = props.activeServices.map((svc) => ({
    ...svc,
    entries: flattenGroups(svc.entries)
  }))

  if (!query) return flattenedServices

  // 2. 对扁平化后的服务和条目进行常规搜索过滤
  return flattenedServices
    .map((svc) => {
      const filteredEntries = svc.entries
        .map((grp) => {
          const filteredActions = grp.actions.filter(
            (act) => act.name.toLowerCase().includes(query) || act.code.toLowerCase().includes(query)
          )
          return { ...grp, actions: filteredActions }
        })
        .filter((grp) => grp.actions.length > 0)

      return { ...svc, entries: filteredEntries }
    })
    .filter((svc) => svc.entries.length > 0)
})

/** 获取分组下所有 code */
const getGrpCodes = (grp: ManifestGroup): string[] => grp.actions.map((a) => a.code)

/** 获取服务下所有 code (递归支持多级 entries 展平) */
const getSvcCodes = (svc: ManifestService): string[] => flattenGroups(svc.entries).flatMap((g) => getGrpCodes(g))

const getSelectedCount = (svc: ManifestService) =>
  getSvcCodes(svc).filter((c) => props.selectedActions.includes(c)).length

const getSvcTotal = (svc: ManifestService) => getSvcCodes(svc).length

const toggleSvc = (svc: ManifestService, checked: boolean) => {
  const codes = getSvcCodes(svc)
  const next = checked
    ? [...new Set([...props.selectedActions, ...codes])]
    : props.selectedActions.filter((c) => !codes.includes(c))
  emit("updateActions", next)
}
</script>

<style lang="scss" scoped>
.iam-matrix {
  padding: 16px;

  .svc-segment {
    margin-bottom: 24px;
    &:last-child {
      margin-bottom: 0;
    }

    .segment-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--el-color-primary);
      margin-bottom: 12px;
      font-weight: 700;
      font-size: 14px;
      color: var(--el-text-color-primary);

      .el-icon {
        color: var(--el-color-primary);
        font-size: 15px;
      }

      .selection-info {
        margin-left: auto;
        font-size: 11px;
        font-weight: 400;
        color: var(--el-text-color-secondary);
        display: flex;
        align-items: center;
        gap: 12px;
        .bulk-btn {
          font-size: 11px;
        }
      }
    }
  }

  .groups-container {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--el-border-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.04);
  }
}
</style>

<style lang="scss">
.el-popper.menu-tooltip-popper {
  background: rgba(15, 23, 42, 0.95) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.4),
    0 8px 10px -6px rgba(0, 0, 0, 0.4) !important;
  border-radius: 8px !important;
  padding: 10px 14px !important;
  max-width: 360px;

  .el-popper__arrow::before {
    background: rgba(15, 23, 42, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
  }

  .menu-tooltip-content {
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--el-color-primary-light-3);

      .header-icon {
        font-size: 13px;
      }

      .tooltip-title {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    }

    .tooltip-divider {
      height: 1px;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 100%);
    }

    .tooltip-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 0;
      padding: 0;
      list-style-type: none;

      .tooltip-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        color: #e2e8f0;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .item-icon {
          font-size: 12px;
          color: var(--el-color-primary);
          margin-top: 2px;
        }

        .menu-desc {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;

          .menu-title {
            font-size: 11px;
            font-weight: 600;
            color: #f8fafc;
            line-height: 1.3;
          }

          .urn-text {
            font-size: 10px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            word-break: break-all;
            letter-spacing: 0.1px;
            color: #94a3b8;

            &.is-subtext {
              color: #64748b;
              font-size: 9px;
            }
          }
        }
      }
    }
  }
}
</style>
