<template>
  <el-card class="basic-info-card">
    <template #header>
      <div class="card-header">
        <h3>基本信息</h3>
      </div>
    </template>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
      <el-form-item label="模板名称" prop="name">
        <el-input
          :model-value="formData.name"
          @update:model-value="(value) => emit('update:formData', { ...formData, name: value })"
          placeholder="请输入模板名称"
        />
      </el-form-item>
      <el-form-item label="渠道类型" prop="channel">
        <el-select
          :model-value="formData.channel"
          @update:model-value="(value) => emit('update:formData', { ...formData, channel: value })"
          placeholder="请选择渠道类型"
          style="width: 100%"
        >
          <el-option label="邮件" value="EMAIL" />
          <el-option label="企业微信" value="WECHAT" />
          <el-option label="飞书卡片" value="FEISHU_CARD" />
        </el-select>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          :model-value="formData.description"
          @update:model-value="(value) => emit('update:formData', { ...formData, description: value })"
          type="textarea"
          :rows="3"
          placeholder="请输入模板描述"
        />
      </el-form-item>

      <el-form-item label="版本名称" prop="version.name">
        <el-input
          :model-value="formData.version.name"
          @update:model-value="
            (value) => emit('update:formData', { ...formData, version: { ...formData.version, name: value } })
          "
          placeholder="请输入版本名称"
        />
      </el-form-item>
      <el-form-item label="版本备注">
        <el-input
          :model-value="formData.version.remark"
          @update:model-value="
            (value) => emit('update:formData', { ...formData, version: { ...formData.version, remark: value } })
          "
          placeholder="版本备注（可选）"
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { CreateTemplateReq } from "@/api/alert/template/types"
import type { FormRules } from "element-plus"

interface Props {
  formData: CreateTemplateReq
  formRules: FormRules
}

interface Emits {
  (e: "update:formData", value: CreateTemplateReq): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

// 暴露表单引用
const formRef = ref()
defineExpose({ formRef })
</script>

<style lang="scss" scoped>
.basic-info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}
</style>
