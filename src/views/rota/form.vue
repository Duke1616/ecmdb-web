<template>
  <div class="rule-form">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="name" label="值班名称">
        <el-input v-model="formData.name" placeholder="请输入值班名称" />
      </el-form-item>
      <el-form-item prop="owner" label="管理人员">
        <UserPicker v-model="formData.owner" placeholder="选择管理人员"  variant="simple" :default-to-current-user="false" />
      </el-form-item>
      <el-form-item prop="desc" label="值班描述">
        <el-input v-model="formData.desc" placeholder="请输入值班描述" />
      </el-form-item>
      <el-form-item prop="status" label="是否启用">
        <el-switch v-model="formData.enabled" size="default" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createOrUpdateRotaReq, rota } from "@/api/rota/types/rota"
import { createRotaApi, updateRotaApi } from "@/api/rota"
import UserPicker from "@/common/components/UserPicker/index.vue"

// 接收父组建传递
const emits = defineEmits(["closed", "callback"])

const onClosed = () => {
  emits("closed")
}
const DEFAULT_FORM_DATA: createOrUpdateRotaReq = {
  name: "",
  owner: "",
  desc: "",
  enabled: true
}

const formData = ref<createOrUpdateRotaReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须选择值班管理人员", trigger: "blur" }]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createRotaApi : updateRotaApi
    api(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
        emits("callback")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const setFrom = (row: rota) => {
  formData.value = cloneDeep(row)
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  submitForm,
  setFrom,
  resetForm
})
</script>

<style lang="scss">
// UserPicker 在排班表单中的全局样式适配
.rule-form .user-picker-container {
  .user-picker-input {
    background: #ffffff;
    padding: 6px 12px;
    min-height: 36px;
    height: 36px;
  }

  .selected-user {
    gap: 8px;
    justify-content: flex-start;
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    font-size: 11px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  // 多选模式样式适配
  .selected-users {
    gap: 4px;
    min-height: 18px;
  }

  .user-tag {
    padding: 1px 4px;
    border-radius: 10px;
    font-size: 10px;
    max-width: 100px;
    height: 20px;
    display: flex;
    align-items: center;

    .user-avatar {
      width: 14px;
      height: 14px;
      font-size: 8px;
      box-shadow: none;
    }

    .user-name {
      font-size: 10px;
      margin: 0 2px;
    }

    .remove-btn {
      width: 12px;
      height: 12px;
      margin-left: 2px;

      svg {
        width: 6px;
        height: 6px;
      }
    }
  }
}
</style>
