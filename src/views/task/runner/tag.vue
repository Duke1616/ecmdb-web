<template>
  <el-dialog v-model="dialogVisible" title="新增标签" width="500" :before-close="handleClose">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="name" label="标签名">
        <el-input v-model="formData.name" placeholder="请输入标签名" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleCreate"> 新增 </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"

// 接收父组建传递
interface Props {
  dialogTagVisible?: boolean
  tags?: string[]
}

const props = defineProps<Props>()
const emits = defineEmits(["close", "add-tag", "del-tag"])

const dialogVisible = ref<boolean>(false)
interface tag {
  name: string
}

const DEFAULT_FORM_DATA: tag = {
  name: ""
}

const formData = ref<tag>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const validateUniqueKey = (rule: any, value: any, callback: any) => {
  const keys = props.tags?.map((name) => name)
  if (keys?.includes(value)) {
    callback(new Error("标签已存在"))
  }
  callback()
}
const formRules: FormRules = {
  name: [
    { required: true, message: "必须输入标签名", trigger: "blur" },
    { validator: validateUniqueKey, trigger: "blur" }
  ]
}

const handleClose = () => {
  dialogVisible.value = false
  emits("close")
}

const handleCreate = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    emits("add-tag", formData.value.name)
    dialogVisible.value = false
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
  })
}
watch(
  () => props.dialogTagVisible,
  (val) => {
    dialogVisible.value = val
  },
  { immediate: true }
)
</script>
