<template>
  <div class="setting-container">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto" style="width: 1000px">
      <h4>基础设置</h4>
      <el-form-item prop="name" label="流程名称">
        <el-input v-model="formData.name" />
      </el-form-item>
      <h4>通知设置</h4>
      <el-form-item prop="name" label="流程名称">
        <el-input v-model="formData.name" />
      </el-form-item>
    </el-form>

    <div class="setting-button">
      <el-button @click="previous">上一步</el-button>
      <el-button @click="save" type="primary">保存</el-button>
      <el-button @click="onClosed">取消</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createSettingReq } from "@/api/workflow/types/workflow"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { FormInstance, FormRules } from "element-plus"

const emits = defineEmits(["previous", "save", "close"])
const save = () => {
  emits("save")
}

const previous = () => {
  emits("previous")
}

const onClosed = () => {
  emits("close")
}

const DEFAULT_FORM_DATA: createSettingReq = {
  name: ""
}
const formData = ref<createSettingReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}
</script>

<style lang="scss" scoped>
.setting-button {
  margin-top: 12px;
}

.setting-container {
  margin-left: 50px;
}
</style>
