<template>
  <el-checkbox
    :model-value="selected"
    :label="act.code"
    class="pure-act-item"
    @change="(checked: string | number | boolean) => $emit('toggle', Boolean(checked))"
  >
    <div class="act-info">
      <div class="act-title-row">
        <span class="act-name">{{ act.name }}</span>

        <!-- 极致轻量微发光指示点 -->
        <el-tooltip
          v-if="act.has_menu"
          effect="dark"
          placement="top"
          popper-class="menu-tooltip-popper"
          :show-after="100"
        >
          <template #content>
            <div class="menu-tooltip-content">
              <div class="tooltip-header">
                <el-icon class="header-icon"><Compass /></el-icon>
                <span class="tooltip-title">关联前端菜单 URN</span>
              </div>
              <div class="tooltip-divider" />
              <ul class="tooltip-list">
                <li v-for="urn in act.menu_urns" :key="urn" class="tooltip-item">
                  <el-icon class="item-icon"><Document /></el-icon>
                  <div class="menu-desc">
                    <span v-if="menuDetailsMap[urn]" class="menu-title">
                      {{ menuDetailsMap[urn].meta?.title || menuDetailsMap[urn].name }}
                    </span>
                    <span class="urn-text" :class="{ 'is-subtext': menuDetailsMap[urn] }">
                      {{ urn }}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </template>

          <span class="menu-indicator">
            <el-icon class="menu-indicator-icon"><Compass /></el-icon>
          </span>
        </el-tooltip>
      </div>
      <span class="act-code">{{ act.code.split(":").pop() }}</span>
    </div>
  </el-checkbox>
</template>

<script setup lang="ts">
import { Compass, Document } from "@element-plus/icons-vue"
import type { ManifestAction } from "../../../composables/usePolicyData"

defineProps<{
  act: ManifestAction
  selected: boolean
  menuDetailsMap: Record<string, any>
}>()

defineEmits<{
  (e: "toggle", checked: boolean): void
}>()
</script>

<style lang="scss" scoped>
.pure-act-item {
  margin-right: 0 !important;
  height: auto;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color-light);
  }

  &.is-checked {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 1px 2px 0 rgba(0, 187, 153, 0.03);

    .act-info {
      .act-name {
        color: var(--el-color-primary);
      }
    }
  }

  :deep(.el-checkbox__label) {
    flex: 1;
    padding-left: 8px;
  }

  .act-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;

    .act-title-row {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }

    .act-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-regular);
      line-height: 1.25;
      transition: color 0.15s ease;
    }

    /* 极致微型微发光雷达点菜单指示图标 */
    .menu-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
      transition: all 0.2s ease;
      cursor: pointer;

      .menu-indicator-icon {
        font-size: 9px;
        transition: transform 0.25s ease;
      }

      &:hover {
        background: var(--el-color-primary-light-8);
        border-color: var(--el-color-primary-light-5);
        color: var(--el-color-primary-dark-2);
      }
    }

    .act-code {
      font-size: 10px;
      color: var(--el-text-color-placeholder);
      font-family: ui-monospace, monospace;
    }
  }
}

.pure-act-item:hover {
  .menu-indicator {
    .menu-indicator-icon {
      transform: rotate(45deg);
    }
  }
}
</style>
