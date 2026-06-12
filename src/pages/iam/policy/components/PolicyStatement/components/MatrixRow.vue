<template>
  <div class="grp-row">
    <!-- 第一列：一级大类分类列，采用垂直居中 -->
    <div class="main-group-col">
      <el-checkbox
        :model-value="getMainGrpState().all"
        :indeterminate="getMainGrpState().some"
        size="small"
        @change="(val) => toggleMainGrp(Boolean(val))"
      >
        <span class="main-name">{{ grp.name }}</span>
      </el-checkbox>
    </div>

    <!-- 右侧容器：渲染每一个 subGroup 的二级分类子行 -->
    <div class="sub-rows-container">
      <div v-for="(sub, idx) in grp.subGroups" :key="idx" class="sub-group-row">
        <!-- 第二列：子分类列（二级分类），只有当包含多个子行分类时才展示，仅有 1 个子类时直接隐藏让操作网格撑满 -->
        <div v-if="grp.subGroups.length > 1" class="sub-group-col">
          <el-checkbox
            :model-value="getSubGrpState(sub).all"
            :indeterminate="getSubGrpState(sub).some"
            size="small"
            @change="(val) => toggleSubGrp(sub, Boolean(val))"
          >
            <span class="sub-name">{{ sub.name || grp.name }}</span>
          </el-checkbox>
        </div>

        <!-- 第三列：操作权限项网格 -->
        <div class="grp-actions-grid">
          <ActionItem
            v-for="act in sub.actions"
            :key="act.code"
            :act="act"
            :selected="selectedActions.includes(act.code)"
            :menu-details-map="menuDetailsMap"
            @toggle="(checked) => $emit('toggleAction', act.code, checked)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ActionItem from "./ActionItem.vue"

// grp 为半展平后的一级分类，结构：
// { name: string, subGroups: { name: string, actions: [] }[], allActions: [] }
const props = defineProps<{
  grp: any
  selectedActions: string[]
  menuDetailsMap: Record<string, any>
}>()

const emit = defineEmits(["toggleAction", "updateActions"])

// 计算一级分类状态
const getMainGrpState = () => {
  const codes = props.grp.allActions.map((a: any) => a.code)
  const count = codes.filter((c: any) => props.selectedActions.includes(c)).length
  return {
    all: count === codes.length && codes.length > 0,
    some: count > 0 && count < codes.length
  }
}

// 切换一级分类下所有操作
const toggleMainGrp = (checked: boolean) => {
  const codes = props.grp.allActions.map((a: any) => a.code)
  const next = checked
    ? [...new Set([...props.selectedActions, ...codes])]
    : props.selectedActions.filter((c: any) => !codes.includes(c))
  emit("updateActions", next)
}

// 计算二级子分类状态
const getSubGrpState = (sub: any) => {
  const codes = sub.actions.map((a: any) => a.code)
  const count = codes.filter((c: any) => props.selectedActions.includes(c)).length
  return {
    all: count === codes.length && codes.length > 0,
    some: count > 0 && count < codes.length
  }
}

// 切换二级子分类下所有操作
const toggleSubGrp = (sub: any, checked: boolean) => {
  const codes = sub.actions.map((a: any) => a.code)
  const next = checked
    ? [...new Set([...props.selectedActions, ...codes])]
    : props.selectedActions.filter((c: any) => !codes.includes(c))
  emit("updateActions", next)
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

  &:hover {
    background-color: var(--el-fill-color-extra-light);

    .main-group-col {
      background-color: var(--el-fill-color-extra-light);
    }
  }

  /* 第一列：一级大类 */
  .main-group-col {
    width: 140px;
    padding: 12px 14px;
    background: var(--el-bg-color);
    border-right: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    position: relative;
    box-sizing: border-box;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    :deep(.el-checkbox) {
      width: 100%;
      display: flex;
      align-items: center;
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

    .main-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }
  }

  /* 右侧多行列表容器 */
  .sub-rows-container {
    flex: 1;
    display: flex;
    flex-direction: column;

    .sub-group-row {
      display: flex;
      align-items: stretch;
      border-bottom: 1px solid var(--el-border-color-extra-light);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: rgba(0, 187, 153, 0.01);
      }
    }

    /* 第二列：二级子类 */
    .sub-group-col {
      width: 150px;
      padding: 10px 12px;
      background: var(--el-bg-color);
      border-right: 1px solid var(--el-border-color-extra-light);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      box-sizing: border-box;
      transition: all 0.2s ease;

      :deep(.el-checkbox) {
        width: 100%;
        display: flex;
        align-items: center;
        margin-right: 0;
      }

      :deep(.el-checkbox__label) {
        flex: 1;
        padding-left: 6px;
        line-height: 1.4;
        white-space: normal;
        word-break: break-all;
        display: block;
      }

      .sub-name {
        font-size: 12px;
        font-weight: 500;
        color: var(--el-text-color-regular);
      }
    }

    /* 第三列：操作选项网格 */
    .grp-actions-grid {
      flex: 1;
      padding: 10px 16px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 6px 12px;
      background: var(--el-bg-color);
      align-items: center;
    }
  }
}
</style>
