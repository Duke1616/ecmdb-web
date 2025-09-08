<template>
  <div class="role-form-container">
    <div class="form-header">
      <div class="header-icon">
        <el-icon><UserFilled /></el-icon>
      </div>
      <div class="header-text">
        <h3>{{ isEdit ? "编辑角色" : "新增角色" }}</h3>
        <p>{{ isEdit ? "修改角色信息" : "创建新的角色" }}</p>
      </div>
    </div>

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

        <div class="form-row">
          <el-form-item prop="name" label="角色名称" class="form-item">
            <el-input
              v-model="formData.name"
              placeholder="请输入角色名称"
              clearable
              :prefix-icon="User"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="code" label="角色编码" class="form-item">
            <el-input
              v-model="formData.code"
              placeholder="请输入角色编码"
              clearable
              :prefix-icon="Key"
              class="form-input"
            />
          </el-form-item>
        </div>

        <el-form-item prop="desc" label="角色描述" class="form-item full-width">
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
            <div class="status-hint">
              <el-icon v-if="formData.status" class="status-icon enabled"><Check /></el-icon>
              <el-icon v-else class="status-icon disabled"><Close /></el-icon>
              <span>{{ formData.status ? "角色已启用，可以正常使用" : "角色已禁用，无法使用" }}</span>
            </div>
          </div>
        </el-form-item>
      </div>
    </el-form>

    <!-- 底部操作按钮 -->
    <div class="form-footer">
      <div class="footer-info">
        <el-icon class="info-icon"><InfoFilled /></el-icon>
        <span class="info-text">{{ isEdit ? "修改角色信息后点击保存" : "填写完整信息后点击保存" }}</span>
      </div>
      <div class="footer-actions">
        <el-button @click="handleCancel" class="cancel-btn" size="large">
          <el-icon><Close /></el-icon>
          取消
        </el-button>
        <el-button type="primary" @click="submitForm" class="confirm-btn" size="large">
          <el-icon><Check /></el-icon>
          {{ isEdit ? "更新角色" : "创建角色" }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { UserFilled, InfoFilled, Setting, User, Key, Check, Close } from "@element-plus/icons-vue"
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

const handleCancel = () => {
  emits("close")
}

defineExpose({
  submitForm,
  setFrom,
  resetForm
})
</script>

<style lang="scss" scoped>
.role-form-container {
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  max-height: 80vh;
  overflow-y: auto;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;

  .header-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .header-text {
    h3 {
      margin: 0 0 2px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.2;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #64748b;
      font-weight: 400;
    }
  }
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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .form-item {
      margin-bottom: 0;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
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

/* 底部操作按钮 */
.form-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .footer-info {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    flex: 1;

    .info-icon {
      font-size: 14px;
      color: #0ea5e9;
    }

    .info-text {
      font-size: 12px;
      color: #0369a1;
      font-weight: 500;
    }
  }

  .footer-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;

    .cancel-btn,
    .confirm-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.3s ease;
      min-width: 100px;
      justify-content: center;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .cancel-btn {
      background: white;
      color: #64748b;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

      &:hover {
        background: #f8fafc;
        border-color: #cbd5e1;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .confirm-btn {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      &:hover {
        background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .role-form-container {
    padding: 16px;
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

  .form-footer {
    flex-direction: column;
    gap: 16px;
    margin-top: 24px;
    padding-top: 16px;

    .footer-info {
      order: 2;
      text-align: center;
    }

    .footer-actions {
      order: 1;
      width: 100%;
      justify-content: center;

      .cancel-btn,
      .confirm-btn {
        flex: 1;
        min-width: auto;
        padding: 10px 20px;
      }
    }
  }
}
</style>
