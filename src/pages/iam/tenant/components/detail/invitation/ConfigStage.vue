<template>
  <div class="config-stage">
    <!-- 审批模式选择器 (卡片式) -->
    <div class="form-section">
      <div class="field-label">
        <el-icon><Lock /></el-icon>
        <span>准入审批模式</span>
      </div>
      <div class="approval-selector">
        <!-- 自动通过 -->
        <div
          class="approval-option auto"
          :class="{ active: !modelValue.require_approval }"
          @click="updateForm('require_approval', false)"
        >
          <div class="option-icon">
            <el-icon><Promotion /></el-icon>
          </div>
          <div class="option-main">
            <div class="option-title">自动通过</div>
            <div class="option-desc">无需干预，即刻入驻</div>
          </div>
          <div class="option-check">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
        </div>

        <!-- 人工审核 -->
        <div
          class="approval-option manual"
          :class="{ active: modelValue.require_approval }"
          @click="updateForm('require_approval', true)"
        >
          <div class="option-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="option-main">
            <div class="option-title">人工审核</div>
            <div class="option-desc">管理员审批后入驻</div>
          </div>
          <div class="option-check">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 入驻人数 -->
    <div class="form-section">
      <div class="field-label">
        <el-icon><ScaleToOriginal /></el-icon>
        <span>单次最大入驻人数</span>
      </div>
      <div class="seg-group">
        <div
          v-for="opt in [
            { label: '1 人', value: 1 },
            { label: '5 人', value: 5 },
            { label: '10 人', value: 10 },
            { label: '不限', value: 0 }
          ]"
          :key="opt.value"
          class="seg-item"
          :class="{ active: modelValue.max_uses === opt.value }"
          @click="updateForm('max_uses', opt.value)"
        >
          {{ opt.label }}
        </div>
      </div>
    </div>

    <!-- 有效期限 -->
    <div class="form-section">
      <div class="field-label">
        <el-icon><Timer /></el-icon>
        <span>凭证有效期限</span>
      </div>
      <div class="seg-group">
        <div
          v-for="opt in [
            { label: '1 天', value: 1 },
            { label: '7 天', value: 7 },
            { label: '30 天', value: 30 },
            { label: '永久', value: 0 }
          ]"
          :key="opt.value"
          class="seg-item"
          :class="{ active: modelValue.expiry_days === opt.value }"
          @click="updateForm('expiry_days', opt.value)"
        >
          {{ opt.label }}
        </div>
      </div>
    </div>

    <!-- 角色权限 -->
    <div class="form-section no-margin">
      <div class="field-label">
        <el-icon><UserFilled /></el-icon>
        <span>预设角色权限</span>
      </div>
      <SearchSelector
        :model-value="modelValue.role_codes"
        :load-data="loadRoles"
        multiple
        id-field="code"
        item-name-field="name"
        item-description-field="desc"
        placeholder="点击选择成员入驻后绑定的角色"
        search-placeholder="搜索角色名称..."
        @update:model-value="updateForm('role_codes', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Promotion, CircleCheckFilled, ScaleToOriginal, Timer, UserFilled } from "@element-plus/icons-vue"
import SearchSelector from "@/common/components/SearchSelector/Base.vue"
import { listRolesApi } from "@/api/iam/role"

const props = defineProps<{
  modelValue: {
    max_uses: number
    expiry_days: number
    role_codes: string[]
    require_approval: boolean
  }
  tenantId?: number
}>()

const emit = defineEmits<{
  "update:modelValue": [val: any]
}>()

const updateForm = (key: string, value: any) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value
  })
}

const loadRoles = async (params: any) => {
  return await listRolesApi({
    ...params,
    tenant_id: props.tenantId
  })
}
</script>

<style lang="scss" scoped>
.config-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  .el-icon {
    color: #3b82f6;
    font-size: 15px;
  }
}

.seg-group {
  display: flex;
  gap: 8px;
}

.seg-item {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s ease;
  background: #fff;
  user-select: none;
  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #2563eb;
    font-weight: 700;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
  }
}

.approval-selector {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.approval-option {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    transform: translateY(-1px);
  }

  .option-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    font-size: 18px;
    background: #f1f5f9;
    color: #64748b;
  }

  .option-main {
    flex: 1;
    min-width: 0;
    .option-title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 2px;
    }
    .option-desc {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .option-check {
    opacity: 0;
    transform: scale(0.5);
    font-size: 18px;
    transition: all 0.2s ease;
  }

  /* 统一选中态：Primary Blue */
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
    .option-icon {
      background: #3b82f6;
      color: #ffffff;
    }
    .option-title {
      color: #1e40af;
    }
    .option-desc {
      color: #3b82f6;
    }
    .option-check {
      opacity: 1;
      transform: scale(1);
      color: #3b82f6;
    }
  }
}
</style>
