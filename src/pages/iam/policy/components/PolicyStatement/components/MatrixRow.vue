<template>
  <div class="grp-row" :class="getGrpRowClass(grp.name)">
    <!-- 左侧：目录分类 Header，带有树连线和全选复选框，宽度缩窄至 140px -->
    <div class="grp-header" :class="getGrpHeaderClass(grp.name)">
      <!-- 树形连接线 -->
      <div v-if="getGrpDepth(grp.name) > 1" class="tree-indent-wrapper">
        <div
          v-for="i in getGrpDepth(grp.name) - 1"
          :key="i"
          class="tree-indent-col"
          :class="{ 'is-last': i === getGrpDepth(grp.name) - 1 }"
        >
          <div class="tree-line-vertical" />
          <div v-if="i === getGrpDepth(grp.name) - 1" class="tree-line-horizontal" />
        </div>
      </div>

      <el-checkbox
        :model-value="getGrpState(grp).all"
        :indeterminate="getGrpState(grp).some"
        size="small"
        @change="(val: string | number | boolean) => toggleGrp(grp, Boolean(val))"
      >
        <div class="grp-name-wrapper">
          <template v-if="getGrpDepth(grp.name) > 1">
            <!-- 微型直属父级路径，没有背景，仅文字展示，极省空间 -->
            <span class="parent-prefix">{{ getGrpNameParts(grp.name).slice(0, -1).join(" / ") }}</span>
            <span class="child-name">{{ getGrpNameParts(grp.name)[getGrpNameParts(grp.name).length - 1] }}</span>
          </template>
          <template v-else>
            <span class="main-name">{{ grp.name }}</span>
          </template>
        </div>
      </el-checkbox>
    </div>

    <!-- 右侧：该组下所有的具体操作权限项网格 -->
    <div class="grp-actions-grid">
      <ActionItem
        v-for="act in grp.actions"
        :key="act.code"
        :act="act"
        :selected="selectedActions.includes(act.code)"
        :menu-details-map="menuDetailsMap"
        @toggle="(checked) => $emit('toggleAction', act.code, checked)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ActionItem from "./ActionItem.vue"
import type { ManifestGroup } from "../../../composables/usePolicyData"

const props = defineProps<{
  grp: ManifestGroup
  selectedActions: string[]
  menuDetailsMap: Record<string, any>
}>()

const emit = defineEmits(["toggleAction", "updateActions"])

/** 获取分组下所有 code */
const getGrpCodes = (grp: ManifestGroup): string[] => grp.actions.map((a) => a.code)

const getGrpState = (grp: ManifestGroup) => {
  const codes = getGrpCodes(grp)
  const count = codes.filter((c) => props.selectedActions.includes(c)).length
  return {
    all: count === codes.length && codes.length > 0,
    some: count > 0 && count < codes.length
  }
}

const toggleGrp = (grp: ManifestGroup, checked: boolean) => {
  const codes = getGrpCodes(grp)
  const next = checked
    ? [...new Set([...props.selectedActions, ...codes])]
    : props.selectedActions.filter((c) => !codes.includes(c))
  emit("updateActions", next)
}

/** 解析目录层级名称 */
const getGrpNameParts = (name: string): string[] => {
  return name.split(" / ")
}

/** 获取层级深度 */
const getGrpDepth = (name: string): number => {
  return getGrpNameParts(name).length
}

/** 获取 Header 样式 Class */
const getGrpHeaderClass = (name: string): string => {
  const depth = getGrpDepth(name)
  return `depth-${depth} ${depth > 1 ? "has-parent" : ""}`
}

/** 获取 Row 样式 Class */
const getGrpRowClass = (name: string): string => {
  const depth = getGrpDepth(name)
  return `row-depth-${depth}`
}
</script>

<style lang="scss" scoped>
.grp-row {
  display: flex;
  background: #fff;
  align-items: stretch;

  .grp-header {
    width: 140px; /* 左侧宽度调窄，从 180px 缩为 140px */
    padding: 12px 10px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    position: relative;
    box-sizing: border-box;

    :deep(.el-checkbox) {
      width: 100%;
      display: flex;
      align-items: center;
      margin-right: 0;
    }

    :deep(.el-checkbox__label) {
      flex: 1;
      padding-left: 6px;
      line-height: 1.3;
      white-space: normal;
      word-break: break-all;
      display: block;
    }

    &::after {
      content: "";
      position: absolute;
      left: 0;
      top: 15%;
      bottom: 15%;
      width: 3px;
      border-radius: 0 4px 4px 0;
      background-color: transparent;
    }

    &.depth-1 {
      background: #f8fafc;
    }

    &.depth-2 {
      background: #fafcfd;
      &::after {
        background-color: #93c5fd;
      }
    }

    &.depth-3 {
      background: #f5fafd;
      &::after {
        background-color: #60a5fa;
      }
    }
  }

  /* 树形连接线在 Header 内部的排列 */
  .tree-indent-wrapper {
    display: flex;
    align-items: stretch;
    align-self: stretch;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .tree-indent-col {
    position: relative;
    width: 10px;
    height: 100%;
    flex-shrink: 0;
    display: flex;
    justify-content: center;

    .tree-line-vertical {
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #cbd5e1;
      transform: translateX(-50%);
    }

    .tree-line-horizontal {
      position: absolute;
      left: 50%;
      right: -5px;
      top: 50%;
      height: 1px;
      background-color: #cbd5e1;
      transform: translateY(-50%);
    }

    &.is-last {
      .tree-line-vertical {
        bottom: 50%;
      }
    }
  }

  .grp-name-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    line-height: 1.2;
  }

  .parent-prefix {
    font-size: 10px;
    color: #94a3b8;
    font-weight: 400;
    margin-bottom: 2px;
    white-space: nowrap;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .child-name {
    font-size: 11px;
    font-weight: 600;
    color: #334155;
  }

  .main-name {
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
  }

  .grp-actions-grid {
    flex: 1;
    padding: 12px 18px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 8px 12px;
    background: #ffffff;
    align-items: center;
  }
}
</style>
