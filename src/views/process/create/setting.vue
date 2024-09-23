<template>
  <div class="setting-container">
    <el-divider content-position="left">通知设置</el-divider>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item prop="name" label="是否启用">
          <el-switch
            v-model="localFormData.is_notify"
            width="45px"
            class="ml-2"
            inline-prompt
            :active-icon="Check"
            :inactive-icon="Close"
            @change="updateFormData"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item prop="name" label="通知渠道">
          <el-select v-model="localFormData.notify_method" @change="updateFormData" placeholder="请选择通知渠道">
            <el-option v-for="item in notifyMapping" :key="item.label" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
    <div class="setting-button">
      <el-button @click="previous">上一步</el-button>
      <el-button @click="save" type="primary">保存</el-button>
      <el-button @click="onClosed">取消</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { Check, Close } from "@element-plus/icons-vue"

const notifyMapping = [
  {
    value: 1,
    label: "飞书"
  }
]

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const localFormData = ref({ ...props.formData })
const emits = defineEmits(["previous", "save", "close", "update:formData"])
const save = () => {
  emits("save")
}

const previous = () => {
  emits("previous")
}

const onClosed = () => {
  emits("close")
}

const updateFormData = () => {
  emits("update:formData", localFormData.value)
}

/** 监听消息是否变更 */
watch(
  () => props.formData,
  (newFormData) => {
    localFormData.value = { ...newFormData }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.setting-button {
  margin-top: 12px;
}

.setting-container {
  margin-left: 50px;
}
</style>
