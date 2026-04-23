<script setup lang="ts">
import { useRouter } from "vue-router"

interface Props {
  /** 主标题（标识码/姓名） */
  title: string
  /** 副标题（类型/其它辅助信息） */
  subTitle?: string
  /** 跳转路由名 */
  linkTo?: any
  /** 居中对齐 */
  centered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  centered: false
})

const router = useRouter()

const handleNavigate = () => {
  if (props.linkTo) {
    router.push(props.linkTo)
  }
}
</script>

<template>
  <div class="asset-identity-cell" :class="{ 'is-link': !!linkTo, 'is-centered': centered }" @click="handleNavigate">
    <div class="meta-info">
      <div class="main-title-wrap">
        <span v-if="!linkTo" class="main-title">{{ title }}</span>
        <el-link v-else :underline="false" class="main-link">{{ title }}</el-link>
      </div>

      <div v-if="subTitle" class="sub-label">
        <span>{{ subTitle }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 全局治理蓝标准色 (Governance Blue)
$governance-blue: #3b82f6;

.asset-identity-cell {
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;

  &.is-centered {
    justify-content: center;
    .meta-info {
      align-items: center;
      text-align: center;
    }
  }

  &.is-link {
    cursor: pointer;

    &:hover .main-title,
    &:hover .main-link {
      color: $governance-blue !important;
    }
  }

  .meta-info {
    display: flex;
    flex-direction: column;
    gap: 0px;
    min-width: 0;
    line-height: 1.2;

    .main-title-wrap {
      .main-title,
      .main-link {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        letter-spacing: -0.01em;
        transition: color 0.15s ease;
        margin-bottom: 2px;
        text-decoration: none !important;
      }

      .main-link {
        display: block;
        :deep(.el-link__inner) {
          font-size: 13px;
          font-weight: 600;
          color: inherit;
        }
      }
    }

    .sub-label {
      font-size: 11px;
      font-weight: 500;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, "Cascadia Code", Menlo, monospace;
      letter-spacing: 0.01em;
    }
  }
}
</style>
