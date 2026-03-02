<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status == '2'"
    class="property-form"
  >
    <!-- 节点基础 -->
    <FormSection title="基本信息" tooltip="设置条件节点的显示名称" theme-color="slate">
      <template #icon>
        <el-icon><Document /></el-icon>
      </template>
      <el-form-item label="节点名称" prop="name" class="form-item">
        <el-input
          v-model="propertyForm.name"
          placeholder="请输入条件节点名称"
          class="modern-input"
          :disabled="flowDetail.status == '2'"
        />
      </el-form-item>
    </FormSection>

    <!-- 条件配置 -->
    <FormSection title="分支配置" tooltip="通过连接线设置不同的逻辑分支条件" theme-color="orange">
      <template #icon>
        <el-icon><Operation /></el-icon>
      </template>
      <div class="condition-tips">
        <div class="tip-item">
          <el-icon class="tip-icon"><Link /></el-icon>
          <div class="tip-content">
            <h4 class="tip-title">连线设置说明</h4>
            <p class="tip-desc">请点击流程图中的“连接线”来配置具体的跳转逻辑与过滤条件。</p>
          </div>
        </div>
      </div>
    </FormSection>
  </el-form>
</template>
<script setup lang="ts">
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { Document, Operation, Link } from "@element-plus/icons-vue"
import { FormSection } from "../../PropertySetting"

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const emits = defineEmits(["closed"])
const propertyForm = reactive({
  name: ""
})

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ]
}

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

onMounted(() => {
  propertyForm.name = props.nodeData?.properties.name
})

// 暴露方法给父组件
defineExpose({
  confirmFunc
})
</script>
<style scoped lang="scss">
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

// ── 通用控件 ────────────────────────────────────────────────────────────
.modern-input {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #ffffff !important;
    border-radius: 6px;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    padding: 2px 10px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #94a3b8 !important;
    }

    &.is-focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 1px #6366f1 !important;
    }
  }
}

.form-item {
  margin-bottom: 0px;
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}

// ── 分支配置提示 ────────────────────────────────────────────────────────
.condition-tips {
  margin-top: 4px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  transition: all 0.2s;

  .tip-icon {
    font-size: 16px;
    color: #d97706;
    margin-top: 2px;
  }

  .tip-content {
    .tip-title {
      margin: 0 0 4px 0;
      font-size: 13px;
      font-weight: 700;
      color: #92400e;
    }

    .tip-desc {
      margin: 0;
      font-size: 12px;
      color: #b45309;
      line-height: 1.5;
    }
  }
}
</style>
