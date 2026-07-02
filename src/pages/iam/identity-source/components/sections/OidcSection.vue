<template>
  <div class="oidc-section">
    <div class="section-header">
      <el-icon>
        <ChatLineRound v-if="modelValue.provider_type === OIDCProviderType.FEISHU" />
        <Connection v-else />
      </el-icon>
      <span>{{ modelValue.provider_type === OIDCProviderType.FEISHU ? "飞书 OIDC" : "通用 OIDC" }} 配置</span>
    </div>

    <el-form-item label="客户端标识" :prop="`${pathPrefix}.client_id`" required>
      <el-input
        :model-value="modelValue.client_id"
        @update:model-value="update('client_id', $event)"
        placeholder="请输入客户端标识"
      />
    </el-form-item>

    <el-form-item label="客户端密钥" :prop="`${pathPrefix}.client_secret`" required>
      <el-input
        :model-value="modelValue.client_secret"
        @update:model-value="update('client_secret', $event)"
        type="password"
        show-password
      />
    </el-form-item>

    <el-form-item label="回调地址" :prop="`${pathPrefix}.redirect_uri`" required>
      <el-input
        :model-value="modelValue.redirect_uri"
        @update:model-value="update('redirect_uri', $event)"
        placeholder="https://eiam.example.com/callback"
      />
      <div class="item-tip">请在身份源控制台中配置此回调地址</div>
    </el-form-item>

    <!-- 飞书特有/非标准 OIDC 字段 -->
    <template v-if="modelValue.provider_type === OIDCProviderType.FEISHU">
      <el-form-item label="授权端点" :prop="`${pathPrefix}.auth_url`" required>
        <el-input
          :model-value="modelValue.auth_url"
          @update:model-value="update('auth_url', $event)"
          placeholder="https://passport.feishu.cn/suite/passport/oauth/authorize"
        />
      </el-form-item>
      <el-form-item label="令牌端点" :prop="`${pathPrefix}.token_url`" required>
        <el-input
          :model-value="modelValue.token_url"
          @update:model-value="update('token_url', $event)"
          placeholder="https://passport.feishu.cn/suite/passport/oauth/token"
        />
      </el-form-item>
    </template>

    <el-form-item v-else label="发行者地址" :prop="`${pathPrefix}.issuer`" required>
      <el-input
        :model-value="modelValue.issuer"
        @update:model-value="update('issuer', $event)"
        placeholder="https://accounts.google.com"
      />
    </el-form-item>

    <div class="section-divider" />

    <div class="status-card-mini">
      <div class="status-card-mini__info">
        <span class="label">自动开户</span>
        <el-tooltip
          content="开启后，首次登录成功的外部身份将自动创建本地账号；关闭则仅允许已绑定的用户登录"
          placement="top"
        >
          <el-icon class="help-icon"><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <el-switch
        :model-value="modelValue.jit_enabled"
        @update:model-value="update('jit_enabled', $event)"
        inline-prompt
        active-text="开"
        inactive-text="关"
      />
    </div>

    <div v-if="modelValue.jit_enabled">
      <div class="section-header sub"><span>属性映射</span></div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="用户名映射字段" :prop="`${pathPrefix}.mapping.username`">
            <el-input
              :model-value="modelValue.mapping.username"
              @update:model-value="updateMapping('username', $event)"
              placeholder="preferred_username / name"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱映射字段" :prop="`${pathPrefix}.mapping.email`">
            <el-input
              :model-value="modelValue.mapping.email"
              @update:model-value="updateMapping('email', $event)"
              placeholder="email"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatLineRound, Connection, QuestionFilled } from "@element-plus/icons-vue"
import { OIDCProviderType, type OIDCVO, type MappingVO } from "@/api/iam/identity-source/type"

interface Props {
  modelValue: OIDCVO
  pathPrefix?: string
}

const props = withDefaults(defineProps<Props>(), {
  pathPrefix: "oidc"
})

const emit = defineEmits<{
  (e: "update:modelValue", value: OIDCVO): void
}>()

const update = <K extends keyof OIDCVO>(key: K, value: unknown) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value as OIDCVO[K]
  })
}

const updateMapping = <K extends keyof MappingVO>(key: K, value: unknown) => {
  emit("update:modelValue", {
    ...props.modelValue,
    mapping: {
      ...props.modelValue.mapping,
      [key]: value as MappingVO[K]
    }
  })
}
</script>

<style lang="scss" scoped>
.status-card-mini {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 20px;

  &__info {
    display: flex;
    align-items: center;
    gap: 6px;

    .label {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .help-icon {
      font-size: 14px;
      color: #94a3b8;
      cursor: help;
    }
  }
}

.section-header {
  &.sub {
    margin-bottom: 12px;
    span {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}
</style>
