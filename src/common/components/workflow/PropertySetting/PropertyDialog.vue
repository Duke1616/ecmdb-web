<template>
  <div>
    <el-drawer
      :wrapperClosable="false"
      v-model="showNodeAttribute"
      direction="rtl"
      append-to-body
      :show-close="false"
      :with-header="false"
      :close-on-click-modal="false"
      :size="drawerSize"
      @closed="closed"
    >
      <template #header>
        <div class="unit">{{ getLabelByValue(props.nodeData?.type, pixelOption, "value", "label") }}</div>
      </template>
      <div>
        <startProperty
          v-if="props.nodeData?.type === 'start'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <userProperty
          v-if="props.nodeData?.type === 'user'"
          :nodeData="nodeData"
          :id="props.id"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <conditionProperty
          v-if="props.nodeData?.type === 'condition'"
          :nodeData="nodeData"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <automationProperty
          v-if="props.nodeData?.type === 'automation'"
          :nodeData="nodeData"
          :id="props.id"
          :lf="lf"
          :flowDetail="flowDetail"
          @closed="closed"
        />
        <!-- 连线 -->
        <edge
          v-if="nodeData?.type === 'polyline'"
          :nodeData="nodeData"
          :lf="lf"
          :id="props.id"
          :flowDetail="flowDetail"
          @closed="closed"
        />
      </div>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { pixelOption } from "./options"
import startProperty from "../RegisterNode/start/startProperty.vue"
import userProperty from "../RegisterNode/user/userProperty.vue"
import conditionProperty from "../RegisterNode/condition/conditionProperty.vue"
import automationProperty from "../RegisterNode/automation/automationProperty.vue"
import edge from "../RegisterEdge/edge.vue"
const props = defineProps({
  //标题
  title: {
    type: String,
    default: ""
  },
  nodeData: Object,
  lf: Object,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  },
  id: Number
})
const emits = defineEmits(["closed"])

const showNodeAttribute = ref(true)

// 响应式抽屉宽度
const drawerSize = computed(() => {
  // 获取屏幕宽度
  const screenWidth = window.innerWidth

  if (screenWidth >= 1920) {
    // 4K 或超大屏幕
    return "600px"
  } else if (screenWidth >= 1440) {
    // 大屏幕
    return "500px"
  } else if (screenWidth >= 1024) {
    // 中等屏幕
    return "450px"
  } else {
    // 小屏幕
    return "400px"
  }
})

//弹窗关闭
const closed = () => {
  emits("closed", true)
}

const getLabelByValue = (value: any, arr: any[], typeValue: string | number, typeLabel: string | number) => {
  let label = ""
  arr.forEach((i) => {
    if (i[typeValue] == value) {
      label = i[typeLabel]
    }
  })
  return label
}

onMounted(() => {})
</script>
<style scoped lang="scss">
// 响应式抽屉样式优化
:deep(.el-drawer) {
  // 优化抽屉背景色，更协调
  background: #ffffff;

  // 大屏幕上的优化
  @media (min-width: 1440px) {
    .el-drawer__body {
      padding: 0;
    }
  }

  // 超大屏幕上的优化
  @media (min-width: 1920px) {
    .el-drawer__body {
      padding: 0;
    }
  }
}

// 抽屉内容区域优化
:deep(.el-drawer__body) {
  overflow-y: auto;
  overflow-x: hidden;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

// 抽屉内容卡片样式优化 - 移除边距，贴合边缘
:deep(.start-property-dialog),
:deep(.automation-property-dialog),
:deep(.user-property-dialog),
:deep(.condition-property-dialog),
:deep(.edge-property-dialog) {
  margin: 0 !important;
  border-radius: 0 !important;
  width: 100% !important;
  max-width: none !important;

  // 移除卡片阴影，让背景更统一
  box-shadow: none !important;

  // 确保内容区域完全贴合抽屉
  .dialog-content {
    padding: 20px 16px 16px !important;
  }

  // 大屏幕上的优化
  @media (min-width: 1440px) {
    .dialog-content {
      padding: 24px 20px 20px !important;
    }
  }

  @media (min-width: 1920px) {
    .dialog-content {
      padding: 28px 24px 24px !important;
    }
  }
}

// 响应式内容适配
@media (min-width: 1440px) {
  :deep(.start-property-dialog),
  :deep(.automation-property-dialog),
  :deep(.user-property-dialog),
  :deep(.condition-property-dialog),
  :deep(.edge-property-dialog) {
    max-width: none;
    width: 100%;
  }
}

@media (min-width: 1920px) {
  :deep(.start-property-dialog),
  :deep(.automation-property-dialog),
  :deep(.user-property-dialog),
  :deep(.condition-property-dialog),
  :deep(.edge-property-dialog) {
    max-width: none;
    width: 100%;
  }
}
</style>
