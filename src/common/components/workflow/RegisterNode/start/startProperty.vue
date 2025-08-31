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
            <el-select
              v-model="propertyForm.is_notify"
              placeholder="选择是否开启消息通知"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in is_notify"
                :key="item.label"
                :label="item.label"
                :value="item.value"
                class="modern-option"
              />
            </el-select>
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

const is_notify = [
  {
    value: true,
    label: "开启"
  },
  {
    value: false,
    label: "关闭"
  }
]

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

onMounted(() => {
  propertyForm.is_notify = props.nodeData?.properties.is_notify ?? true
})
</script>

<style scoped lang="scss">
.start-property-dialog {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.dialog-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  .icon-circle {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);

    :deep(.svg-icon) {
      width: 24px;
      height: 24px;
      color: white;
    }
  }
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 3px 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.header-subtitle {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

.dialog-content {
  padding: 20px 16px 16px;
}

.form-section {
  margin-bottom: 20px;
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

.modern-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 16px;
    height: 48px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }

    &.is-focus {
      border-color: #10b981;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-option {
  :deep(.el-select-dropdown__item) {
    padding: 12px 16px;
    font-size: 14px;

    &.selected {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    &:hover {
      background: #f1f5f9;
    }
  }
}

.form-help {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #10b981;
}

.dialog-footer {
  padding: 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
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
