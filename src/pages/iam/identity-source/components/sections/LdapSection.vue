<template>
  <div class="ldap-section">
    <div class="section-header">
      <el-icon><Connection /></el-icon>
      <span>{{ isAD ? "域控连接配置" : "目录连接配置" }}</span>
    </div>

    <el-form-item label="服务器地址" :prop="`${pathPrefix}.url`" required>
      <el-input
        :model-value="modelValue.url"
        @update:model-value="update('url', $event)"
        placeholder="ldap://10.0.0.1:389"
      />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="搜索基准" :prop="`${pathPrefix}.base_dn`" required>
          <el-input
            :model-value="modelValue.base_dn"
            @update:model-value="update('base_dn', $event)"
            placeholder="dc=example,dc=com"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="管理员账号" :prop="`${pathPrefix}.bind_dn`" required>
          <el-input
            :model-value="modelValue.bind_dn"
            @update:model-value="update('bind_dn', $event)"
            placeholder="cn=admin,dc=example,dc=com"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="管理员密码" :prop="`${pathPrefix}.bind_password`" required>
      <el-input
        :model-value="modelValue.bind_password"
        @update:model-value="update('bind_password', $event)"
        type="password"
        show-password
      />
    </el-form-item>

    <div class="section-divider" />
    <div class="section-header sub"><span>属性映射与过滤</span></div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="用户名属性" :prop="`${pathPrefix}.username_attribute`">
          <el-input
            :model-value="modelValue.username_attribute"
            @update:model-value="update('username_attribute', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="邮箱属性" :prop="`${pathPrefix}.mail_attribute`">
          <el-input :model-value="modelValue.mail_attribute" @update:model-value="update('mail_attribute', $event)" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="显示名称属性" :prop="`${pathPrefix}.display_name_attribute`">
          <el-input
            :model-value="modelValue.display_name_attribute"
            @update:model-value="update('display_name_attribute', $event)"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="职位职称属性" :prop="`${pathPrefix}.title_attribute`">
          <el-input :model-value="modelValue.title_attribute" @update:model-value="update('title_attribute', $event)" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="登录过滤器" :prop="`${pathPrefix}.user_filter`">
      <el-input
        :model-value="modelValue.user_filter"
        @update:model-value="update('user_filter', $event)"
        type="textarea"
        :rows="2"
        placeholder="(&(objectClass=user)(sAMAccountName=?))"
      />
    </el-form-item>

    <el-form-item label="同步过滤器" :prop="`${pathPrefix}.sync_user_filter`">
      <el-input
        :model-value="modelValue.sync_user_filter"
        @update:model-value="update('sync_user_filter', $event)"
        type="textarea"
        :rows="2"
        placeholder="(&(objectClass=user)(memberOf=CN=IAM,OU=Groups,DC=example,DC=com))"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { Connection } from "@element-plus/icons-vue"
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
