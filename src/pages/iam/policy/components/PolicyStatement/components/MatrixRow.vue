<template>
  <div class="grp-row" :class="getGrpRowClass(grp.name)">
    <!-- 左侧：目录分类 Header，采用层级缩进与极细引导线，宽度 160px -->
    <div
      class="grp-header"
      :class="[getGrpHeaderClass(grp.name), { 'is-header-active': getGrpState(grp).all || getGrpState(grp).some }]"
      :style="{ paddingLeft: `${14 + (getGrpDepth(grp.name) - 1) * 20}px` }"
    >
      <!-- 渲染极细的垂直层级引导线，不使用折角连线 -->
      <template v-if="getGrpDepth(grp.name) > 1">
        <div
          v-for="d in getGrpDepth(grp.name) - 1"
          :key="d"
          class="tree-scope-track"
          :style="{ left: `${20 + (d - 1) * 20}px` }"
        />
      </template>

      <!-- 最左侧激活指示条 -->
      <div class="depth-indicator-bar" />

      <el-checkbox
        :model-value="getGrpState(grp).all"
        :indeterminate="getGrpState(grp).some"
        size="small"
        @change="(val: string | number | boolean) => toggleGrp(grp, Boolean(val))"
      >
        <div class="grp-name-wrapper">
          <template v-if="getGrpDepth(grp.name) > 1">
            <!-- 子分类：正常字重，略微淡化字色，保证清晰的从属关系 -->
            <span class="child-name">
              {{ getGrpNameParts(grp.name)[getGrpNameParts(grp.name).length - 1] }}
            </span>
          </template>
          <template v-else>
            <!-- 一级分类：加粗，高亮显示 -->
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
  return `row-depth-${depth} row-depth-${depth > 3 ? "n" : depth}`
}
</script>

<style lang="scss" scoped>
.grp-row {
  display: flex;
  background: var(--el-bg-color);
  align-items: stretch;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:last-child {
    border-bottom: none;
  }

  /* 整行 Hover 视觉效果提升 */
  &:hover {
    background-color: var(--el-fill-color-extra-light);

    .grp-header {
      background-color: var(--el-fill-color-extra-light);
    }
  }

  .grp-header {
    width: 160px; /* 宽度调回至 160px，紧凑实用 */
    padding: 12px 10px;
    background: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-extra-light); /* 极其淡雅的竖向虚隔线 */
    flex-shrink: 0;
    display: flex;
    align-items: center; /* 居中对齐 */
    position: relative;
    box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    :deep(.el-checkbox) {
      width: 100%;
      display: flex;
      align-items: center; /* 居中对齐 */
      margin-right: 0;
    }

    :deep(.el-checkbox__label) {
      flex: 1;
      padding-left: 8px;
      line-height: 1.4;
      white-space: normal;
      word-break: break-all;
      display: block;
    }
  }

  /* 极细的垂直层级引导线轨 (Scope Track) */
  .tree-scope-track {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--el-border-color-lighter);
    pointer-events: none;
    transition: background-color 0.2s;
  }

  /* 最左侧指示条 */
  .depth-indicator-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: transparent;
    border-radius: 0;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.depth-1 {
    background: var(--el-bg-color);
    .depth-indicator-bar {
      background-color: transparent;
    }
  }

  /* 激活态表现：极其柔和的选中背景与主题色联动高亮 */
  .grp-header.is-header-active {
    background: var(--el-color-primary-light-9) !important;
    border-right-color: var(--el-color-primary-light-8);

    .depth-indicator-bar {
      background-color: var(--el-color-primary) !important;
    }

    .tree-scope-track {
      background-color: var(--el-color-primary-light-5) !important;
    }

    .main-name {
      color: var(--el-color-primary) !important;
    }

    .child-name {
      color: var(--el-color-primary) !important;
    }
  }

  .grp-name-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    line-height: 1.25;
  }

  .child-name {
    font-size: 12px;
    font-weight: 400; /* 子级正常字重 */
    color: var(--el-text-color-regular);
  }

  .main-name {
    font-size: 12px;
    font-weight: 700; /* 一级粗体 */
    color: var(--el-text-color-primary);
  }

  .grp-actions-grid {
    flex: 1;
    padding: 12px 18px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 8px 12px;
    background: var(--el-bg-color);
    align-items: center;
    transition: background-color 0.2s ease;
  }
}
</style>
