<template>
  <FormDialog
    v-model="visible"
    :title="code ? '治理角色资产' : '初始化角色定义'"
    :header-icon="Lock"
    width="640px"
    :confirm-loading="saving"
    @confirm="submit"
    @cancel="visible = false"
  >
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
                <el-input
                  v-model="formData.name"
                  :disabled="isSystemRole"
                  placeholder="例如: 财务分析师"
                  class="gov-input"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标识码" prop="code">
                <el-input
                  v-model="formData.code"
                  :disabled="!!code || isSystemRole"
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
              :disabled="isSystemRole"
              :rows="3"
              placeholder="描述该角色承担的具体业务职责..."
              class="gov-input gov-textarea"
            />
          </el-form-item>
        </div>

        <!-- 角色属性展示 (只读) -->
        <div v-if="code" class="setting-control-card info">
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
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { Lock } from "@element-plus/icons-vue"
import { pick } from "lodash-es"
import { createRoleApi, updateRoleApi, roleDetailApi } from "@/api/iam/role"
import type { UpdateRoleReq } from "@/api/iam/role/type"
import { FormDialog } from "@@/components/Dialogs"

// NOTE: 该组件为纯 UI 弹窗控制器，使用 defineModel 进行开放/折叠的状态双向绑定
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  code?: string
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)

// 定义角色表单关心的核心字段 (包含更新所需的 ID)
const ROLE_FORM_FIELDS = ["id", "name", "code", "desc", "type"]

const getInitialData = () => ({
  id: 0,
  name: "",
  code: "",
  desc: "",
  type: 2
})

const formData = reactive(getInitialData())

// 判定是否为系统预设角色
const isSystemRole = computed(() => formData.type === 1)

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [
    { required: true, message: "请输入角色标识码", trigger: "blur" },
    { pattern: /^[a-z0-9_]+$/, message: "仅支持小写字母、数字 and 下划线", trigger: "blur" }
  ]
})

const loadDetail = async () => {
  if (!props.code) return
  try {
    const { data } = await roleDetailApi(props.code)
    // 使用 lodash 精准拣选字段
    Object.assign(formData, pick(data, ROLE_FORM_FIELDS))
  } catch (error) {
    console.error("加载角色详情失败:", error)
  }
}

watch(visible, async (val) => {
  if (val) {
    if (props.code) {
      await loadDetail()
    } else {
      Object.assign(formData, getInitialData())
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  }
})

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  saving.value = true
  try {
    if (props.code) {
      // 核心修复：通过类型断言解决 lodash.pick 返回 Partial 类型导致的兼容性问题
      const updatePayload = {
        ...pick(formData, ROLE_FORM_FIELDS)
      } as UpdateRoleReq

      await updateRoleApi(updatePayload)
    } else {
      await createRoleApi({ ...formData })
    }

    visible.value = false
    emit("success")
  } finally {
    saving.value = false
  }
}
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
  margin-bottom: 8px;
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
  margin-top: 4px;

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
  margin-bottom: 12px;
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
