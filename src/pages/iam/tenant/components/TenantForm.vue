<template>
  <div class="tenant-form-container">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="standard-form">
      <!-- 全局状态控制 (置顶) -->
      <div class="setting-control-card primary">
        <div class="control-label">
          <span class="title">租户运行状态</span>
          <el-tooltip content="停用租户将导致该租户下的所有用户无法登录，资产被冻结" placement="top">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
        <el-switch
          v-model="formData.status"
          :active-value="1"
          :inactive-value="2"
          inline-prompt
          active-text="正常"
          inactive-text="停用"
          class="gov-switch"
        />
      </div>

      <!-- 命名与身份 -->
      <div class="form-chapter">
        <div class="chapter-title">
          <el-icon><OfficeBuilding /></el-icon>
          <span>租户基础定义</span>
        </div>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="租户名称" prop="name">
              <el-input v-model="formData.name" placeholder="例如: 某某控股集团" class="gov-input" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="租户编码" prop="code">
              <el-input
                v-model="formData.code"
                :disabled="isEdit"
                placeholder="例如: ent_group_main"
                class="gov-input mono"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 认证配置 -->
      <div class="form-chapter">
        <div class="chapter-title">
          <el-icon><Connection /></el-icon>
          <span>身份认证配置</span>
        </div>
        <el-form-item label="身份域名标识" prop="domain">
          <el-input v-model="formData.domain" placeholder="例如: example.iam.com" class="gov-input mono" />
          <div class="item-tip">用于用户登录时的身份自动路由（如 user@{{ formData.domain || "domain" }}）</div>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { OfficeBuilding, Connection, InfoFilled } from "@element-plus/icons-vue"
import { createTenantApi, updateTenantApi, getTenantDetailApi } from "@/api/iam/tenant"

const props = defineProps<{
  isEdit: boolean
  id?: number
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const formData = reactive({
  name: "",
  code: "",
  domain: "",
  status: 1
})

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入租户显示名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入租户唯一标识", trigger: "blur" }],
  domain: [{ required: true, message: "请输入租户身份域名", trigger: "blur" }]
})

const loadDetail = async () => {
  if (!props.id) return
  const { data } = await getTenantDetailApi(props.id)
  Object.assign(formData, data)
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  if (props.isEdit && props.id) {
    await updateTenantApi({ id: props.id, ...formData })
  } else {
    await createTenantApi(formData)
  }
  emit("success")
}

onMounted(() => {
  if (props.isEdit) loadDetail()
})

defineExpose({ submit })
</script>

<style lang="scss" scoped>
.tenant-form-container {
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
    margin-bottom: 12px; // 从 16px 减小
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

.item-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
  padding-left: 4px;
}

.setting-control-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px; // 从 18x20 减小
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;

  &.primary {
    border: 1px solid #dbeafe;
    background: #f8faff;
    margin-bottom: 20px; // 调整
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 8px;
    .title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
    }
    .info-icon {
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
    }
  }
}

.gov-input {
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    border-radius: 8px;
    height: 38px;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1) !important;
    }
  }
  &.mono :deep(.el-input__inner) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }
}

.gov-switch {
  --el-switch-on-color: #10b981;
  --el-switch-off-color: #cbd5e1;
}

:deep(.el-form-item) {
  margin-bottom: 16px; // 统一控制 FormItem 下边距
}

:deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px !important;
  line-height: 1.5;
}
</style>
