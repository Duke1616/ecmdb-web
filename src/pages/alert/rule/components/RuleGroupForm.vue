<template>
  <div class="rule-group-form">
    <el-form
      ref="formRef"
    label-position="top"
      :model="formData"
      :rules="formRules"

      label-width="100px"
      size="large"
    >
      <el-form-item label="规则组名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入规则组名称"
          clearable
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入规则组描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { RuleGroup, CreateRuleGroupReq } from '@/api/alert/rule/types/rule'

interface Props {
  editData?: RuleGroup | null
}

interface Emits {
  (e: 'success'): void
  (e: 'closed'): void
}

const props = withDefaults(defineProps<Props>(), {
  editData: null
})

const emits = defineEmits<Emits>()

const formRef = ref<FormInstance>()

// 表单数据
const formData = reactive<CreateRuleGroupReq>({
  name: '',
  description: ''
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入规则组名称', trigger: 'blur' },
    { min: 2, max: 50, message: '规则组名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过 200 个字符', trigger: 'blur' }
  ]
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.description = ''
  formRef.value?.clearValidate()
}

// 监听编辑数据变化
watch(() => props.editData, (newData) => {
  if (newData) {
    formData.name = newData.name
    formData.description = newData.description || ''
  } else {
    resetForm()
  }
}, { immediate: true })

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return false
  
  try {
    await formRef.value.validate()
    return true
  } catch (error) {
    return false
  }
}

// 获取表单数据
const getFormData = (): CreateRuleGroupReq => {
  return { ...formData }
}

// 设置表单数据
const setFormData = (data: RuleGroup) => {
  formData.name = data.name
  formData.description = data.description || ''
}

// 暴露方法给父组件
defineExpose({
  submitForm,
  getFormData,
  setFormData,
  resetForm
})
</script>

<style lang="scss" scoped>

</style>
