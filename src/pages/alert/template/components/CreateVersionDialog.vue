<template>
  <FormDialog
    v-model="visible"
    title="新增版本"
    subtitle="基于当前编辑器内容创建新版本"
    width="500px"
    header-icon="Document"
    confirm-text="创建版本"
    :confirm-loading="loading"
    @closed="handleClosed"
    @confirm="handleConfirm"
    @cancel="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" size="default">
      <el-form-item label="版本名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入版本名称" maxlength="50" show-word-limit />
      </el-form-item>

      <el-form-item label="版本备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入版本备注（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, nextTick } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "confirm", data: { name: string; remark: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const loading = ref(false)

// 移除不需要的变量

// 表单数据
const formData = reactive({
  name: "",
  remark: ""
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入版本名称", trigger: "blur" },
    { min: 1, max: 50, message: "版本名称长度在 1 到 50 个字符", trigger: "blur" }
  ],
  remark: [{ max: 200, message: "版本备注长度不能超过 200 个字符", trigger: "blur" }]
}

// 对话框显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

// 监听对话框打开，初始化表单数据
watch(visible, (newVisible) => {
  if (newVisible) {
    // 重置表单
    formData.name = ""
    formData.remark = ""

    // 清除验证
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
})

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 对话框关闭事件
const handleClosed = () => {
  // 重置表单
  formData.name = ""
  formData.remark = ""
  loading.value = false
}

// 确认创建
const handleConfirm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 发出确认事件
    emit("confirm", {
      name: formData.name,
      remark: formData.remark
    })

    ElMessage.success("版本创建成功")
    handleClose()
  } catch (error) {
    console.error("表单验证失败:", error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
// FormDialog 已经提供了完整的样式，这里不需要额外的样式
</style>
