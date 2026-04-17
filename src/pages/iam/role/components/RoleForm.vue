<template>
  <div class="role-form-container">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="standard-form">
      <!-- 角色核心资产 -->
      <div class="form-chapter">
        <div class="chapter-title">
          <el-icon><Lock /></el-icon>
          <span>角色资产定义</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="formData.name" placeholder="例如: 财务分析师" class="gov-input" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标识码" prop="code">
              <el-input
                v-model="formData.code"
                :disabled="isEdit"
                placeholder="例如: financial_analyst"
                class="gov-input mono"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="职责描述说明" prop="desc">
          <el-input
            v-model="formData.desc"
            type="textarea"
            :rows="3"
            placeholder="描述该角色承担的具体业务职责..."
            class="gov-input gov-textarea"
          />
        </el-form-item>
      </div>

      <!-- 角色属性展示 (只读) -->
      <div v-if="isEdit" class="setting-control-card info">
        <div class="control-label">
          <span class="title">角色属性来源</span>
        </div>
        <div class="control-content">
          <el-tag :type="formData.type === 1 ? 'warning' : 'info'" effect="light" class="gov-tag">
            {{ formData.type === 1 ? "系统内置 (禁止修改标识)" : "业务自定义" }}
          </el-tag>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { Lock } from "@element-plus/icons-vue"
import { createRoleApi, updateRoleApi, roleDetailApi } from "@/api/iam/role"

const props = defineProps<{
  isEdit: boolean
  code?: string
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive({
  id: 0,
  name: "",
  code: "",
  desc: "",
  type: 2
})

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [
    { required: true, message: "请输入角色标识码", trigger: "blur" },
    { pattern: /^[a-z0-9_]+$/, message: "仅支持小写字母、数字和下划线", trigger: "blur" }
  ]
})

const loadDetail = async () => {
  if (!props.code) return
  // NOTE: 修正 API 方法名为 roleDetailApi
  const { data } = await roleDetailApi(props.code)
  Object.assign(formData, data)
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  if (props.isEdit) {
    await updateRoleApi(formData)
  } else {
    await createRoleApi(formData)
  }
  emit("success")
}

onMounted(() => {
  if (props.isEdit) loadDetail()
})

defineExpose({ submit })
</script>

<style lang="scss" scoped>
.role-form-container {
  padding: 8px 24px;
}

.standard-form {
  display: flex;
  flex-direction: column;
}

.form-chapter {
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }

  .chapter-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;
    .el-icon {
      color: #3b82f6;
      font-size: 16px;
    }
    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      margin-left: 12px;
    }
  }
}

.setting-control-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-top: 12px;

  .control-label {
    .title {
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
    }
  }
}

.gov-input {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    border-radius: 8px;
    transition: all 0.2s;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus,
    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
  }
  &.mono :deep(.el-input__inner) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px !important;
  line-height: 1.5;
}

.gov-tag {
  border-radius: 6px;
  font-weight: 600;
}
</style>
