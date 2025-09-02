<template>
  <div class="start-property-dialog">
    <!-- 弹窗头部 -->
    <div class="dialog-header">
      <div class="header-icon">
        <div class="icon-circle">
          <SvgIcon name="start" icon-class="start" />
        </div>
      </div>
      <div class="header-content">
        <h3 class="header-title">开始节点配置</h3>
        <p class="header-subtitle">配置工作流的起始节点属性</p>
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="propertyForm"
        :inline-message="true"
        :rules="formRules"
        label-position="top"
        :disabled="flowDetail.status == '2'"
        class="property-form"
      >
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">🔔</span>
            <span>通知设置</span>
          </div>

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
            <div class="form-help">
              {{ propertyForm.is_notify ? "开启后，工作流启动时会发送通知消息" : "关闭后，工作流启动时不会发送通知" }}
            </div>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <!-- 弹窗底部按钮 -->
    <div class="dialog-footer" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc" class="footer-btn footer-btn-cancel"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc" class="footer-btn footer-btn-confirm"> 确定 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import SvgIcon from "@@/components/SvgIcon/index.vue"

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
  is_notify: true,
  assignList: []
})

const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ],
  is_notify: [{ required: true, message: "不能为空" }],
  desc: [
    {
      max: 50,
      message: "最大50字符"
    }
  ]
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

//取消
const cancelFunc = () => {
  emits("closed")
}

//切换通知状态
const toggleNotify = () => {
  if (props.flowDetail.status == "2") return
  propertyForm.is_notify = !propertyForm.is_notify
}

onMounted(() => {
  propertyForm.is_notify = props.nodeData?.properties.is_notify ?? true
})
</script>

<style scoped lang="scss">
.start-property-dialog {
  background: transparent;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 520px;
  width: 100%;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px;
    z-index: -1;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 24px 28px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 24px 24px 0 0;
  position: relative;
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.header-icon {
  .icon-circle {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 12px;
      pointer-events: none;
    }

    :deep(.svg-icon) {
      width: 28px;
      height: 28px;
      color: white;
      position: relative;
      z-index: 1;
    }
  }
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  line-height: 1.4;
}

.dialog-content {
  padding: 20px 24px 16px;
  background: #ffffff;
  position: relative;
  z-index: 1;
  border-radius: 0 0 24px 24px;
}

.form-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  .title-icon {
    font-size: 16px;
  }
}

.form-item {
  margin-bottom: 16px;

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
}

/* 开关按钮样式 */
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
  transition: all 0.3s ease;

  &:hover:not(.disabled) {
    transform: translateY(-1px);
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;

  &.active {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
  }
}

.toggle-thumb {
  width: 28px;
  height: 28px;
  background: #ffffff;
  border-radius: 50%;
  position: absolute;
  top: 0px;
  left: 0px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    transform: translateX(28px);
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

.toggle-icon {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  transition: all 0.3s ease;

  .toggle-thumb.active & {
    color: #10b981;
  }
}

.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  transition: all 0.3s ease;
  min-width: 40px;
  text-align: center;

  .toggle-switch:hover:not(.disabled) & {
    color: #10b981;
  }
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

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    border-color: #047857;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
}
</style>
