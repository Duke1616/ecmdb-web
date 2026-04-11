<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="policy-logic-form">
    <!-- 1. 基础信息配置卡片 -->
    <div class="base-config-section">
      <div class="section-title">基础配置</div>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="策略名称" prop="name">
            <el-input v-model="formData.name" placeholder="例如: 财务只读权限" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="策略识别码 (Code)" prop="code">
            <el-input v-model="formData.code" placeholder="建议大驼峰，如 FinanceReadOnly" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="策略描述" prop="desc">
            <el-input v-model="formData.desc" placeholder="简述该策略的用途..." />
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 2. 权限语句编排区 -->
    <div class="statement-orchestrator-section">
      <div class="section-header">
        <span class="title">权限语句 (Statements)</span>
        <span class="subtitle">策略由一条或多条语句组成，每条语句定义了对特定资源的访问许可。</span>
      </div>

      <TransitionGroup name="stmt-list">
        <PolicyStatement
          v-for="(stmt, index) in formData.statement"
          :key="index"
          :stmt="stmt"
          :index="index"
          :permission-manifest="permissionManifest"
          @update:stmt="(val) => (formData.statement[index] = val)"
          @duplicate="duplicateStatement"
          @remove="removeStatement"
        />
      </TransitionGroup>

      <!-- 快捷添加栏 -->
      <div class="action-footer">
        <el-button class="add-btn-v4" @click="addStatement">
          <el-icon><Plus /></el-icon>
          添加新的权限语句
        </el-button>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue"
import { usePolicyForm } from "./composables/usePolicyForm"
import PolicyStatement from "./components/PolicyStatement.vue"

const props = defineProps<{ isEdit: boolean; id?: string }>()
const emit = defineEmits(["success"])

const {
  formRef,
  formData,
  formRules,
  permissionManifest,
  addStatement,
  removeStatement,
  duplicateStatement,
  submitForm,
  setForm
} = usePolicyForm(props, emit)

// 暴露给父组件调用
defineExpose({
  submit: submitForm,
  setForm,
  formData // 暴露数据以供父级可能的预览需求
})
</script>

<style lang="scss" scoped>
.policy-logic-form {
  padding: 0 4px;

  .base-config-section {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 24px;
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #333;
      margin-bottom: 16px;
      border-left: 3px solid #0070cc;
      padding-left: 10px;
    }
  }

  .statement-orchestrator-section {
    .section-header {
      margin-bottom: 16px;
      .title {
        font-size: 14px;
        font-weight: bold;
        color: #333;
        display: block;
      }
      .subtitle {
        font-size: 12px;
        color: #8c8c8c;
        margin-top: 4px;
        display: block;
      }
    }
  }

  .action-footer {
    padding: 20px 0;
    .add-btn-v4 {
      width: 100%;
      height: 48px;
      border: 1px dashed #dcdfe6;
      background: #fff;
      color: #666;
      font-size: 14px;
      &:hover {
        border-color: #0070cc;
        color: #0070cc;
        background: #f0f7ff;
      }
    }
  }
}

.stmt-list-enter-active,
.stmt-list-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.stmt-list-enter-from,
.stmt-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
