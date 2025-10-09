<template>
  <el-form ref="formRef" :model="modelValue" :rules="formRules" label-position="top" label-width="100px">
    <el-form-item label="渠道类型" prop="channel">
      <el-select
        v-model="modelValue.channel"
        placeholder="请选择渠道类型"
        style="width: 100%"
        :disabled="channelOptions.length === 0"
        @change="handleChannelChange"
      >
        <el-option
          v-for="channel in channelOptions"
          :key="channel.value"
          :label="channel.label"
          :value="channel.value"
        />
      </el-select>
      <div v-if="channelOptions.length === 0" class="no-channels-tip">
        <el-alert
          title="所有渠道类型都已添加"
          description="无法继续添加新条目，请删除现有条目后再试"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
    </el-form-item>
    <el-form-item label="模板" prop="template_id">
      <el-select
        v-model="modelValue.template_id"
        placeholder="请选择模板"
        style="width: 100%"
        filterable
        :loading="templatesLoading"
        :disabled="!modelValue.channel"
      >
        <el-option
          v-for="template in availableTemplates"
          :key="template.id"
          :label="template.name"
          :value="template.id"
        >
          <div class="template-option">
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.description }}</div>
          </div>
        </el-option>
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import type { AddItemReq } from "@/api/alert/template_set/types"
import type { ChannelTemplate } from "@/api/alert/template/types"
import { getChannelOptions } from "../../template/config/channels"
import { FORM_RULES } from "../config/constants"

interface Props {
  availableTemplates: ChannelTemplate[]
  templatesLoading: boolean
  existingChannels: string[] // 已存在的渠道类型
}

interface Emits {
  (e: "channel-change", channel: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 使用 defineModel 简化双向绑定
const modelValue = defineModel<AddItemReq>({ required: true })

// 表单引用
const formRef = ref<FormInstance>()

// 渠道选项 - 过滤掉已存在的渠道
const channelOptions = computed(() => {
  const allOptions = getChannelOptions()
  return allOptions.filter((option) => !props.existingChannels.includes(option.value))
})

// 表单验证规则
const formRules: FormRules = FORM_RULES.item

// 渠道变化处理
const handleChannelChange = (channel: string) => {
  modelValue.value.template_id = undefined // 重置模板选择
  emit("channel-change", channel)
}

// 暴露验证方法
const validate = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

// 重置表单
const resetFields = () => {
  formRef.value?.resetFields()
}

// 暴露方法给父组件
defineExpose({
  validate,
  resetFields
})
</script>

<style lang="scss" scoped>
// 模板选项样式
.template-option {
  .template-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .template-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
}

// 无可用渠道提示
.no-channels-tip {
  margin-top: 12px;
}
</style>
