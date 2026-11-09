<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="isReadonly"
    class="property-form gateway-property-form"
  >
    <!-- 节点基础属性 -->
    <FormSection title="基本信息" tooltip="设置该网关在流程图中的显示名称" theme-color="slate">
      <template #icon>
        <el-icon><Document /></el-icon>
      </template>
      <el-form-item label="节点名称" prop="name" class="form-item">
        <el-input
          v-model="propertyForm.name"
          placeholder="请输入网关节点名称"
          class="modern-input"
          :disabled="isReadonly"
          clearable
        />
      </el-form-item>
    </FormSection>

    <!-- 网关类型快速转换 -->
    <FormSection
      title="网关类型"
      tooltip="点击可直接将当前网关无缝替换为其他类型，所有已连接的前后连线与坐标位置将完整保留"
      theme-color="blue"
    >
      <template #icon>
        <el-icon><Switch /></el-icon>
      </template>

      <div class="gateway-switch-grid" :class="{ 'is-three-col': displayGatewayTypes.length === 3 }">
        <div
          v-for="item in displayGatewayTypes"
          :key="item.type"
          class="gateway-type-card"
          :class="[
            `theme-${item.themeColor}`,
            {
              active: currentGatewayType === item.type,
              disabled: isReadonly
            }
          ]"
          @click="handleSelectGatewayType(item.type)"
        >
          <div class="card-header">
            <div class="gateway-icon-wrapper">
              <svg :viewBox="item.viewBox" class="gateway-svg-icon">
                <path
                  v-for="(p, pIdx) in item.paths"
                  :key="pIdx"
                  :d="p.d"
                  :transform="p.transform"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div class="card-titles">
              <div class="type-name">
                {{ item.name }}
                <span v-if="currentGatewayType === item.type" class="active-badge">当前</span>
              </div>
              <div class="type-subtitle">{{ item.subTitle }}</div>
            </div>
          </div>
          <div class="card-description font-body">
            {{ item.description }}
          </div>
        </div>
      </div>
    </FormSection>

    <!-- 路由分支说明 -->
    <FormSection
      title="分支连线说明"
      :tooltip="currentConfig?.routeRule || '网关路由流转规则'"
      :theme-color="currentConfig?.themeColor || 'orange'"
    >
      <template #icon>
        <el-icon><Operation /></el-icon>
      </template>
      <div class="condition-tips">
        <div class="tip-item">
          <el-icon class="tip-icon"><Link /></el-icon>
          <div class="tip-content">
            <h4 class="tip-title">{{ currentConfig?.name }} · 流转机制</h4>
            <p class="tip-desc">{{ currentConfig?.routeRule }}</p>
          </div>
        </div>
      </div>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import { Document, Operation, Link, Switch } from "@element-plus/icons-vue"
import { FormSection } from "../../PropertySetting"
import { GATEWAY_TYPE_LIST, getGatewayTypeConfig, type GatewayType } from "./constants"

interface Props {
  nodeData?: any
  lf?: any
  flowDetail?: {
    status?: string | number
    [key: string]: any
  }
  id?: number
  onChangeType?: (newType: string) => void
  engineType?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodeData: () => ({}),
  lf: null,
  flowDetail: () => ({}),
  engineType: "flowx"
})

const emits = defineEmits<{
  (e: "closed"): void
  (e: "changeType", newType: string): void
}>()

// 根据工作流引擎过滤网关选项（FlowX 遵循 BPMN 2.0，不展示传统条件网关）
const displayGatewayTypes = computed(() => {
  if (props.engineType === "flowx") {
    return GATEWAY_TYPE_LIST.filter((item) => item.type !== "selective")
  }
  return GATEWAY_TYPE_LIST
})

const formRef = ref<FormInstance | null>(null)
const propertyForm = reactive({
  name: ""
})

const formRules: FormRules = {
  name: [
    { required: true, message: "网关名称不能为空", trigger: "blur" },
    { max: 50, message: "最多 50 个字符", trigger: "blur" }
  ]
}

const isReadonly = computed(() => props.flowDetail?.status === "2" || props.flowDetail?.status === 2)

const currentGatewayType = computed<GatewayType>(() => {
  return (props.nodeData?.type as GatewayType) || "condition"
})

const currentConfig = computed(() => getGatewayTypeConfig(currentGatewayType.value))

// 初始化并同步节点名称
const syncFormNameFromNode = () => {
  const node = props.nodeData
  if (!node) return

  let textValue = ""
  if (typeof node.text === "object" && node.text !== null) {
    textValue = node.text.value || ""
  } else if (typeof node.text === "string") {
    textValue = node.text
  }

  propertyForm.name = node.properties?.name || textValue || currentConfig.value?.name || ""
}

watch(
  () => [props.nodeData?.id, props.nodeData?.type],
  () => {
    syncFormNameFromNode()
  },
  { immediate: true }
)

/**
 * 切换网关类型
 * @param targetType 目标网关类型
 */
const handleSelectGatewayType = (targetType: GatewayType) => {
  if (isReadonly.value) return
  if (targetType === currentGatewayType.value) return

  const oldConfig = currentConfig.value
  const newConfig = getGatewayTypeConfig(targetType)
  const nodeId = props.nodeData?.id

  if (!nodeId || !props.lf) {
    ElMessage.warning("无法获取当前节点实例")
    return
  }

  // 1. 如果当前名称属于默认名称，联动更新为目标网关默认名称
  const isDefaultName =
    !propertyForm.name ||
    propertyForm.name === oldConfig?.name ||
    propertyForm.name === oldConfig?.name.replace("网关", "") ||
    propertyForm.name === "网关"

  if (isDefaultName && newConfig?.name) {
    propertyForm.name = newConfig.name
  }

  // 2. 优先调用外部传递的类型切换函数或派发事件
  if (typeof props.onChangeType === "function") {
    props.onChangeType(targetType)
  } else {
    emits("changeType", targetType)
  }
}

/**
 * 保存属性并更新节点名称
 */
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      const nodeId = props.nodeData?.id
      if (nodeId && props.lf) {
        props.lf.setProperties(nodeId, {
          name: propertyForm.name
        })
        props.lf.updateText(nodeId, propertyForm.name)
      }
      emits("closed")
    }
  })
}

defineExpose({
  confirmFunc
})
</script>

<style scoped lang="scss">
.gateway-property-form {
  padding-bottom: 24px;
}

.form-item {
  margin-bottom: 0 !important;

  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}

.gateway-switch-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;

  &.is-three-col {
    grid-template-columns: repeat(3, 1fr);

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

.gateway-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 10px 12px;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;

  &:hover:not(.disabled) {
    border-color: #94a3b8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.active {
    border-color: #2563eb;
    background: #f8faff;
    box-shadow: 0 0 0 1px #2563eb;

    .type-name {
      color: #1d4ed8;
      font-weight: 600;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .gateway-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #f1f5f9;
    border-radius: 6px;
    color: #475569;
    flex-shrink: 0;
    transition: all 0.2s;

    .gateway-svg-icon {
      width: 20px;
      height: 20px;
    }
  }

  .card-titles {
    flex: 1;
    min-width: 0;

    .type-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    .active-badge {
      font-size: 10px;
      padding: 1px 5px;
      background: #dbeafe;
      color: #1e40af;
      border-radius: 4px;
      font-weight: 600;
    }

    .type-subtitle {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }
  }

  .card-description {
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;
  }

  // 主题配色变体
  &.theme-orange.active {
    border-color: #ea580c;
    background: #fff7ed;
    box-shadow: 0 0 0 1px #ea580c;
    .gateway-icon-wrapper {
      background: #ffedd5;
      color: #c2410c;
    }
    .type-name {
      color: #c2410c;
    }
    .active-badge {
      background: #fed7aa;
      color: #9a3412;
    }
  }

  &.theme-blue.active {
    border-color: #2563eb;
    background: #eff6ff;
    box-shadow: 0 0 0 1px #2563eb;
    .gateway-icon-wrapper {
      background: #dbeafe;
      color: #1d4ed8;
    }
    .type-name {
      color: #1d4ed8;
    }
    .active-badge {
      background: #bfdbfe;
      color: #1e40af;
    }
  }

  &.theme-green.active {
    border-color: #16a34a;
    background: #f0fdf4;
    box-shadow: 0 0 0 1px #16a34a;
    .gateway-icon-wrapper {
      background: #dcfce7;
      color: #15803d;
    }
    .type-name {
      color: #15803d;
    }
    .active-badge {
      background: #bbf7d0;
      color: #166534;
    }
  }

  &.theme-purple.active {
    border-color: #9333ea;
    background: #faf5ff;
    box-shadow: 0 0 0 1px #9333ea;
    .gateway-icon-wrapper {
      background: #f3e8ff;
      color: #7e22ce;
    }
    .type-name {
      color: #7e22ce;
    }
    .active-badge {
      background: #e9d5ff;
      color: #6b21a8;
    }
  }
}

.condition-tips {
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 14px;
  border: 1px dashed #cbd5e1;

  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    .tip-icon {
      font-size: 18px;
      color: #3b82f6;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .tip-content {
      .tip-title {
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 4px 0;
      }

      .tip-desc {
        font-size: 12px;
        color: #64748b;
        line-height: 1.5;
        margin: 0;
      }
    }
  }
}

html.dark {
  .gateway-type-card {
    background: #1e293b;
    border-color: #334155;

    &:hover:not(.disabled) {
      border-color: #64748b;
    }

    .gateway-icon-wrapper {
      background: #0f172a;
      color: #94a3b8;
    }

    .card-titles .type-name {
      color: #f1f5f9;
    }

    .card-titles .type-subtitle,
    .card-description {
      color: #94a3b8;
    }

    &.theme-orange.active {
      background: #431407;
      border-color: #f97316;
      box-shadow: 0 0 0 1px #f97316;
      .gateway-icon-wrapper {
        background: #7c2d12;
        color: #fdba74;
      }
      .type-name {
        color: #fed7aa;
      }
    }

    &.theme-blue.active {
      background: #172554;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px #3b82f6;
      .gateway-icon-wrapper {
        background: #1e3a8a;
        color: #93c5fd;
      }
      .type-name {
        color: #bfdbfe;
      }
    }

    &.theme-green.active {
      background: #052e16;
      border-color: #22c55e;
      box-shadow: 0 0 0 1px #22c55e;
      .gateway-icon-wrapper {
        background: #14532d;
        color: #86efac;
      }
      .type-name {
        color: #bbf7d0;
      }
    }

    &.theme-purple.active {
      background: #3b0764;
      border-color: #a855f7;
      box-shadow: 0 0 0 1px #a855f7;
      .gateway-icon-wrapper {
        background: #581c87;
        color: #d8b4fe;
      }
      .type-name {
        color: #e9d5ff;
      }
    }
  }

  .condition-tips {
    background: #1e293b;
    border-color: #334155;

    .tip-content .tip-title {
      color: #f1f5f9;
    }

    .tip-content .tip-desc {
      color: #94a3b8;
    }
  }
}
</style>
