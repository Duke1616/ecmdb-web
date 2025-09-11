<template>
  <div class="role-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="role-form"
      label-position="left"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>

        <el-form-item prop="name" label="角色名称" class="form-item required">
          <el-input
            v-model="formData.name"
            placeholder="请输入角色名称"
            clearable
            :prefix-icon="User"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="code" label="角色编码" class="form-item required">
          <el-input
            v-model="formData.code"
            placeholder="请输入角色编码"
            clearable
            :prefix-icon="Key"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="desc" label="角色描述" class="form-item">
          <el-input
            v-model="formData.desc"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
            maxlength="200"
            show-word-limit
            class="form-textarea"
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>状态设置</span>
        </div>

        <el-form-item prop="status" label="角色状态" class="form-item full-width">
          <div class="status-container">
            <el-switch
              v-model="formData.status"
              size="large"
              :active-text="formData.status ? '启用' : '禁用'"
              :inactive-text="formData.status ? '启用' : '禁用'"
              class="status-switch"
            />
          </div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { InfoFilled, Setting, User, Key } from "@element-plus/icons-vue"
import { createOrUpdateRoleReq, role } from "@/api/role/types/role"
import { createRoleApi, updateRoleApi } from "@/api/role"

// 接收父组建传递
const emits = defineEmits(["close", "list-roles"])

const DEFAULT_FORM_DATA: createOrUpdateRoleReq = {
  name: "",
  code: "",
  desc: "",
  status: true
}

const formData = ref<createOrUpdateRoleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

// 计算属性
const isEdit = computed(() => formData.value.id !== undefined)

const formRules: FormRules = {
  name: [
    { required: true, message: "请输入角色名称", trigger: "blur" },
    { min: 2, max: 20, message: "角色名称长度在 2 到 20 个字符", trigger: "blur" }
  ],
  code: [
    { required: true, message: "请输入角色编码", trigger: "blur" },
    { min: 2, max: 20, message: "角色编码长度在 2 到 20 个字符", trigger: "blur" },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: "角色编码只能包含字母、数字、下划线和短横线", trigger: "blur" }
  ],
  desc: [{ max: 200, message: "角色描述不能超过 200 个字符", trigger: "blur" }]
}

const submitForm = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    const api = isEdit.value ? updateRoleApi : createRoleApi
    const { data } = await api(formData.value)

    if (data) {
      ElMessage.success(isEdit.value ? "角色更新成功" : "角色创建成功")
      emits("list-roles")
      emits("close")
    }
  } catch (error) {
    console.error("保存角色失败:", error)
    ElMessage.error(isEdit.value ? "角色更新失败" : "角色创建失败")
  }
}

const setFrom = (row: role) => {
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

<style lang="scss" scoped>
.role-form-container {
  padding: 0;
  background: transparent;
  max-height: 80vh;
  overflow-y: auto;
}

.role-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

      .el-icon {
        font-size: 14px;
        color: #3b82f6;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
    }

    .form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
        position: relative;
        display: flex;
        align-items: center;

        &::before {
          content: "";
          display: inline-block;
          width: 16px;
          flex-shrink: 0;
        }
      }

      &.required {
        :deep(.el-form-item__label) {
          &::before {
            content: "*";
            color: #ef4444;
            font-size: 14px;
            font-weight: 600;
            margin-right: 0;
            display: inline-block;
            width: 16px;
            text-align: center;
          }
        }
      }

      .form-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }

        :deep(.el-input__inner) {
          font-size: 13px;
          color: #374151;
        }

        :deep(.el-input__prefix) {
          color: #9ca3af;
        }
      }

      .form-textarea {
        :deep(.el-textarea__inner) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          font-size: 13px;
          color: #374151;
          resize: vertical;

          &:hover {
            border-color: #9ca3af;
          }

          &:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }
    }
  }
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .status-switch {
    :deep(.el-switch__label) {
      font-weight: 500;
      color: #374151;
    }
  }

  .status-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f8fafc;
    border-radius: 6px;
    border: 1px solid #e2e8f0;

    .status-icon {
      font-size: 14px;

      &.enabled {
        color: #22c55e;
      }

      &.disabled {
        color: #ef4444;
      }
    }

    span {
      font-size: 12px;
      color: #64748b;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .role-form-container {
    padding: 0;
  }

  .form-header {
    gap: 12px;
    margin-bottom: 24px;

    .header-icon {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .header-text {
      h3 {
        font-size: 18px;
      }

      p {
        font-size: 13px;
      }
    }
  }

  .role-form {
    .form-section {
      margin-bottom: 24px;

      .section-title {
        padding: 10px 12px;
        margin-bottom: 16px;

        span {
          font-size: 13px;
        }
      }
    }
  }
}
</style>
