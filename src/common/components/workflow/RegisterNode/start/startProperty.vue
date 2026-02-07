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
    <FormSection title="通知设置" icon="🔔">
      <el-form-item label="消息通知" prop="is_notify" class="form-item">
        <div class="toggle-container">
          <div class="toggle-switch" @click="toggleNotify" :class="{ disabled: flowDetail.status == '2' }">
            <div class="toggle-track" :class="{ active: propertyForm.is_notify }">
              <div class="toggle-thumb" :class="{ active: propertyForm.is_notify }">
                <span class="toggle-icon">{{ propertyForm.is_notify ? "✓" : "✕" }}</span>
              </div>
            </div>
            <span class="toggle-label">{{ propertyForm.is_notify ? "开启" : "关闭" }}</span>
          </div>
        </div>
      </el-form-item>
    </FormSection>
  </el-form>
</template>

<script setup lang="ts">
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
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
  is_notify: false
})

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {}

const toggleNotify = () => {
  if (props.flowDetail.status == "2") return
  propertyForm.is_notify = !propertyForm.is_notify
}

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    is_notify: propertyForm.is_notify
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      emits("closed")
    }
  })
}

onMounted(() => {
  propertyForm.is_notify = props.nodeData?.properties.is_notify ? props.nodeData.properties.is_notify : false
})

// 暴露方法给父组件
defineExpose({
  confirmFunc
})
</script>

<style scoped lang="scss">
.form-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
}

/* Toggle Switch Styles */
.toggle-container {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  padding: 12px 0;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    .toggle-track {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.toggle-track {
  width: 60px;
  height: 32px;
  background: #e2e8f0;
  border-radius: 16px;
  position: relative;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &.active {
    background: #10b981;
    border-color: #059669;
  }
}

.toggle-thumb {
  width: 24px;
  height: 24px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &.active {
    transform: translateX(28px);
    background: #ffffff;
  }
}

.toggle-icon {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  line-height: 1;
}

.toggle-thumb.active .toggle-icon {
  color: #10b981;
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  transition: color 0.3s ease;
}

.toggle-switch:hover:not(.disabled) .toggle-label {
  color: #10b981;
}

.form-help {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #10b981;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}
</style>
