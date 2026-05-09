<template>
  <div class="ldap-section">
    <el-form-item label="LDAP 服务地址" :prop="`${pathPrefix}.url`" required>
      <el-input
        :model-value="modelValue.url"
        @update:model-value="update('url', $event)"
        placeholder="ldap://hostname:389"
      />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="绑定账号" :prop="`${pathPrefix}.bind_dn`" required>
          <el-input
            :model-value="modelValue.bind_dn"
            @update:model-value="update('bind_dn', $event)"
            placeholder="cn=admin,dc=example,dc=com"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="绑定密码" :prop="`${pathPrefix}.bind_password`" required>
          <el-input
            :model-value="modelValue.bind_password"
            @update:model-value="update('bind_password', $event)"
            type="password"
            show-password
            placeholder="******"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="搜索基准" :prop="`${pathPrefix}.base_dn`" required>
      <el-input
        :model-value="modelValue.base_dn"
        @update:model-value="update('base_dn', $event)"
        placeholder="ou=users,dc=example,dc=com"
      />
    </el-form-item>

    <slot name="test-connectivity" />

    <div class="section-divider" />

    <div class="section-header">
      <el-icon><Rank /></el-icon>
      <span>属性映射</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-form-item label="账号属性" :prop="`${pathPrefix}.username_attribute`">
          <el-input
            :model-value="modelValue.username_attribute"
            @update:model-value="update('username_attribute', $event)"
            placeholder="sAMAccountName"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="邮箱属性" :prop="`${pathPrefix}.mail_attribute`">
          <el-input
            :model-value="modelValue.mail_attribute"
            @update:model-value="update('mail_attribute', $event)"
            placeholder="mail"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="显示名" :prop="`${pathPrefix}.display_name_attribute`">
          <el-input
            :model-value="modelValue.display_name_attribute"
            @update:model-value="update('display_name_attribute', $event)"
            placeholder="displayName"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <div class="section-header sub-header">
      <el-icon><Filter /></el-icon>
      <span>对象过滤</span>
    </div>

    <el-form-item label="用户对象过滤器" :prop="`${pathPrefix}.user_filter`">
      <el-input
        :model-value="modelValue.user_filter"
        @update:model-value="update('user_filter', $event)"
        type="textarea"
        :rows="1"
        placeholder="(objectClass=user)"
      />
    </el-form-item>

    <el-form-item label="同步范围过滤器 (可选)" :prop="`${pathPrefix}.sync_user_filter`">
      <el-input
        :model-value="modelValue.sync_user_filter"
        @update:model-value="update('sync_user_filter', $event)"
        type="textarea"
        :rows="1"
        placeholder="例如：(memberOf=...)"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { Rank, Filter } from "@element-plus/icons-vue"
import type { LDAPVO } from "@/api/iam/identity-source/type"

interface Props {
  modelValue: LDAPVO
  isAD?: boolean
  pathPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  isAD: false,
  pathPrefix: "ldap"
})

const emit = defineEmits<{
  (e: "update:modelValue", value: LDAPVO): void
}>()

const update = <K extends keyof LDAPVO>(key: K, value: unknown) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value as LDAPVO[K]
  })
}
</script>
