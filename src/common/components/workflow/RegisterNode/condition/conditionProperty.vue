<template>
  <div class="condition-property-dialog">
    <!-- 弹窗头部 -->
    <div class="dialog-header">
      <div class="header-icon">
        <div class="icon-circle">
          <SvgIcon name="condition" icon-class="condition" />
        </div>
      </div>
      <div class="header-content">
        <h3 class="header-title">条件节点配置</h3>
        <p class="header-subtitle">配置工作流分支条件节点的属性</p>
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
            <span class="title-icon">📝</span>
            <span>基本信息</span>
          </div>

          <el-form-item label="节点名称" prop="name" class="form-item">
            <el-input
              v-model="propertyForm.name"
              placeholder="请输入条件节点名称"
              class="modern-input"
              :disabled="flowDetail.status == '2'"
            />
            <div class="form-help">条件节点名称用于标识分支判断点，建议使用描述性名称</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">⚙️</span>
            <span>条件配置</span>
          </div>

          <div class="condition-tips">
            <div class="tip-item">
              <div class="tip-icon">🔗</div>
              <div class="tip-content">
                <h4 class="tip-title">连线设置</h4>
                <p class="tip-desc">通过连线设置不同的分支条件，支持多个出口路径</p>
              </div>
            </div>
          </div>
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

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(() => {
  propertyForm.name = props.nodeData?.properties.name
})
</script>
<style scoped lang="scss">
.condition-property-dialog {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  max-width: 480px;
  width: 100%;
}

.dialog-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 20px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  .icon-circle {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);

    :deep(.svg-icon) {
      width: 20px;
      height: 20px;
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

  &:last-child {
    margin-bottom: 0;
  }
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

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
}

.modern-input {
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
      border-color: #f59e0b;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
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
  border-left: 3px solid #f59e0b;
}

.condition-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: #fde68a;
    border-color: #f59e0b;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  }

  .tip-icon {
    font-size: 20px;
    color: #d97706;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .tip-content {
    flex: 1;

    .tip-title {
      margin: 0 0 6px 0;
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
    }

    .tip-desc {
      margin: 0;
      font-size: 12px;
      color: #a16207;
      line-height: 1.4;
    }
  }
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
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-color: #f59e0b;

  &:hover {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    border-color: #d97706;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
}
</style>
