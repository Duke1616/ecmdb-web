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
          @update:model-value="handleChannelChange"
          placeholder="请选择渠道类型"
          style="width: 100%"
        >
          <el-option
            v-for="option in getChannelOptions()"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          >
            <div>
              <div>{{ option.label }}</div>
              <div style="font-size: 12px; color: #999">{{ option.description }}</div>
            </div>
          </el-option>
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
          :model-value="formData.version.desc"
          @update:model-value="
            (value) => emit('update:formData', { ...formData, version: { ...formData.version, desc: value } })
          "
          placeholder="版本备注（可选）"
        />
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { CreateTemplateReq, ChannelType } from "@/api/alert/template/types"
import type { FormRules } from "element-plus"
import { getChannelOptions } from "../config/channels"

interface Props {
  formData: CreateTemplateReq
  formRules: FormRules
}

interface Emits {
  (e: "update:formData", value: CreateTemplateReq): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 暴露表单引用
const formRef = ref()
defineExpose({ formRef })

// 处理渠道切换
const handleChannelChange = (newChannel: ChannelType) => {
  // 只更新表单数据，内容切换由父组件处理
  emit("update:formData", { ...props.formData, channel: newChannel })
}
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
