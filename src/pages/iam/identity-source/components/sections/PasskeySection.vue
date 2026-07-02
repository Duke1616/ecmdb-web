<template>
  <div class="passkey-section">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="信赖方标识" :prop="`${pathPrefix}.rp_id`" required>
          <el-input
            :model-value="modelValue.rp_id"
            @update:model-value="update('rp_id', $event)"
            placeholder="例如：eiam.example.com"
          />
          <div class="item-tip">通行密钥作用域，通常为域名</div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="应用名称" :prop="`${pathPrefix}.rp_name`" required>
          <el-input
            :model-value="modelValue.rp_name"
            @update:model-value="update('rp_name', $event)"
            placeholder="例如：EIAM Governance"
          />
          <div class="item-tip">展示在用户认证提示框中</div>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="允许的源地址" :prop="`${pathPrefix}.rp_origins`" required>
      <el-select
        :model-value="modelValue.rp_origins"
        @update:model-value="update('rp_origins', $event)"
        multiple
        filterable
        allow-create
        default-first-option
        placeholder="请输入并回车，例如：https://eiam.example.com"
      >
        <el-option v-for="item in modelValue.rp_origins" :key="item" :label="item" :value="item" />
      </el-select>
      <div class="item-tip">必须包含协议和端口，且必须使用 HTTPS</div>
    </el-form-item>

    <div class="section-divider" />

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="验证要求" :prop="`${pathPrefix}.user_verification`">
          <el-select
            :model-value="modelValue.user_verification"
            @update:model-value="update('user_verification', $event)"
          >
            <el-option label="首选" value="preferred" />
            <el-option label="必需" value="required" />
            <el-option label="不要求" value="discouraged" />
          </el-select>
          <div class="item-tip">是否要求指纹/面部识别</div>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备证明" :prop="`${pathPrefix}.attestation_preference`">
          <el-select
            :model-value="modelValue.attestation_preference"
            @update:model-value="update('attestation_preference', $event)"
          >
            <el-option label="无" value="none" />
            <el-option label="间接" value="indirect" />
            <el-option label="直接" value="direct" />
          </el-select>
          <div class="item-tip">设备证明数据的获取级别</div>
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import type { PasskeyVO } from "@/api/iam/identity-source/type"

interface Props {
  modelValue: PasskeyVO
  pathPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  pathPrefix: "passkey"
})

const emit = defineEmits<{
  (e: "update:modelValue", value: PasskeyVO): void
}>()

const update = <K extends keyof PasskeyVO>(key: K, value: unknown) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value as PasskeyVO[K]
  })
}
</script>

<style lang="scss" scoped>
.passkey-section {
  .section-divider {
    height: 1px;
    background: linear-gradient(to right, #f1f5f9, transparent);
    margin: 20px 0;
  }

  .item-tip {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 4px;
  }
}

:deep(.el-select) {
  width: 100%;
}
</style>
