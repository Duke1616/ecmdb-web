<script setup lang="ts">
import { ref, watch } from "vue"
import { Connection, Collection, ArrowRight } from "@element-plus/icons-vue"
import { FormDialog } from "@/common/components/Dialogs"

// NOTE: 该组件为纯 UI 弹窗组件，状态由父组件通过 useIdentityManage 统一管理
const visible = defineModel<boolean>({ default: false })

interface Props {
  form: {
    ldap: string
    wechat: string
    feishu: string
  }
  loading: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "confirm", data: Props["form"]): void
}>()

// 本地副本，避免直接修改 prop
const localForm = ref({ ...props.form })

// 深度监听 prop 变化并同步到本地副本
watch(
  () => props.form,
  (newVal) => {
    localForm.value = { ...newVal }
  },
  { deep: true }
)

const handleConfirm = () => {
  emit("confirm", { ...localForm.value })
}
</script>

<template>
  <FormDialog
    v-model="visible"
    title="治理外部身份账号"
    subtitle="在此统一配置或修正主体在各个外部系统中的唯一映射标识。"
    :header-icon="Connection"
    width="560px"
    confirm-text="保存更改"
    :confirm-loading="loading"
    @confirm="handleConfirm"
    @cancel="visible = false"
  >
    <div class="manage-form-content">
      <!-- AD / LDAP 区域 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Connection /></el-icon>
          <span>AD / LDAP 目录账号</span>
          <el-tag size="small" type="info" effect="plain" class="sync-tag">自动同步</el-tag>
        </div>
        <el-input v-model="localForm.ldap" placeholder="由目录服务自动同步，不可手动修改" disabled>
          <template #prefix>
            <span class="prefix-label">DN</span>
          </template>
        </el-input>
      </div>

      <!-- 企业微信区域 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Collection /></el-icon>
          <span>企业微信关联</span>
        </div>
        <el-input v-model="localForm.wechat" placeholder="未绑定 (示例: WeChat_UserID)" clearable>
          <template #prefix>
            <span class="prefix-label">ID</span>
          </template>
        </el-input>
      </div>

      <!-- 飞书区域 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><ArrowRight /></el-icon>
          <span>飞书账号关联</span>
        </div>
        <el-input v-model="localForm.feishu" placeholder="未绑定 (示例: Feishu_UserID)" clearable>
          <template #prefix>
            <span class="prefix-label">ID</span>
          </template>
        </el-input>
      </div>
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
.manage-form-content {
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 28px;

  .form-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      .el-icon {
        color: #64748b;
        font-size: 16px;
      }
      span {
        font-size: 13px;
        font-weight: 700;
        color: #475569;
      }
      .sync-tag {
        font-size: 10px;
        font-weight: normal;
        padding: 0 4px;
        height: 18px;
      }
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      height: 42px;
      background: #f8fafc;
      box-shadow: none;
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      padding-left: 0;

      &.is-focus {
        background: #ffffff;
        border-color: #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6;
      }
    }

    .prefix-label {
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
      background: #f1f5f9;
      padding: 0 12px;
      height: 42px;
      display: flex;
      align-items: center;
      border-right: 1px solid #e2e8f0;
      border-radius: 8px 0 0 8px;
      margin-right: 12px;
    }
  }
}
</style>
