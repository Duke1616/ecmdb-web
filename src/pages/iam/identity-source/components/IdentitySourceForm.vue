<template>
  <div class="identity-source-form">
    <!-- 提供商选择: 采用横向卡片样式 (参考 TaskManager) -->
    <div class="mode-selector">
      <div
        v-for="p in providers"
        :key="p.id"
        class="mode-card"
        :class="{ 'is-active': selectedProvider === p.id }"
        @click="selectProvider(p.id)"
      >
        <div class="mode-card__icon">
          <img :src="p.icon" alt="icon" />
        </div>
        <div class="mode-card__body">
          <span class="mode-card__title">{{ p.name }}</span>
          <span class="mode-card__desc">{{ p.desc }}</span>
        </div>
        <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
      </div>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="governance-form">
      <!-- 基础信息 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><InfoFilled /></el-icon>
            <span>基础核心配置</span>
          </div>
        </div>

        <div class="basic-config-grid">
          <el-form-item label="身份源名称" prop="name" class="name-field">
            <el-input v-model="form.name" placeholder="例如：北京研发中心" />
          </el-form-item>
        </div>
      </div>

      <!-- 动态配置区块 -->
      <div v-if="form.type === IdentitySourceType.LDAP && form.ldap" class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Connection /></el-icon>
            <span>{{ selectedProvider === "ad" ? "域控协议配置" : "目录协议配置" }}</span>
          </div>
          <el-button
            v-if="selectedProvider === 'ad'"
            :loading="testing"
            size="small"
            class="section-test-btn"
            @click.stop="handleTestConnection"
          >
            <el-icon><Monitor /></el-icon>
            测试连接
          </el-button>
        </div>
        <LdapSection v-model="form.ldap" :is-ad="selectedProvider === 'ad'" />
      </div>

      <div v-if="form.type === IdentitySourceType.OIDC && form.oidc" class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon">
              <ChatLineRound v-if="selectedProvider === 'feishu'" />
              <Link v-else />
            </el-icon>
            <span>{{ selectedProvider === "feishu" ? "飞书单点登录配置" : "单点登录配置" }}</span>
          </div>
        </div>
        <OidcSection v-model="form.oidc" />
      </div>

      <div v-if="form.type === IdentitySourceType.LOCAL && form.local" class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Lock /></el-icon>
            <span>本地密码安全策略</span>
          </div>
        </div>
        <LocalSection v-model="form.local" />
      </div>

      <div v-if="form.type === IdentitySourceType.PASSKEY && form.passkey" class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Key /></el-icon>
            <span>通行密钥配置</span>
          </div>
        </div>
        <PasskeySection v-model="form.passkey" />
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import {
  InfoFilled,
  Monitor,
  CircleCheckFilled,
  Connection,
  ChatLineRound,
  Link,
  Lock,
  Key
} from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import adIcon from "../svg/Windows AD.svg"
import ldapIcon from "../svg/ldap.svg"
import feishuIcon from "../svg/feishu.svg"
import oidcIcon from "../svg/oidc.svg"
import passwordIcon from "../svg/pass.svg"
import passkeyIcon from "../svg/webauthn.svg"
import type { FormInstance, FormRules } from "element-plus"
import { saveIdentitySourceApi, testIdentitySourceApi } from "@/api/iam/identity-source"
import {
  type IdentitySourceVO,
  type SaveIdentitySourceReq,
  type LDAPVO,
  type OIDCVO,
  type LocalVO,
  type PasskeyVO,
  IdentitySourceType,
  OIDCProviderType
} from "@/api/iam/identity-source/type"

// 导入子区块组件
import LdapSection from "./sections/LdapSection.vue"
import OidcSection from "./sections/OidcSection.vue"
import LocalSection from "./sections/LocalSection.vue"
import PasskeySection from "./sections/PasskeySection.vue"

interface Props {
  isEdit: boolean
  data?: IdentitySourceVO | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const testing = ref(false)
const selectedProvider = ref("ad")

const providers = [
  {
    id: "local",
    name: "静态密码",
    desc: "本地数据库校验",
    type: IdentitySourceType.LOCAL,
    icon: passwordIcon
  },
  {
    id: "ad",
    name: "Windows AD",
    desc: "集成域控身份体系",
    type: IdentitySourceType.LDAP,
    icon: adIcon
  },
  {
    id: "ldap",
    name: "LDAP",
    desc: "通用目录服务",
    type: IdentitySourceType.LDAP,
    icon: ldapIcon
  },
  {
    id: "feishu",
    name: "飞书 SSO",
    desc: "集成飞书企业身份",
    type: IdentitySourceType.OIDC,
    icon: feishuIcon
  },
  {
    id: "oidc",
    name: "OIDC",
    desc: "通用单点登录",
    type: IdentitySourceType.OIDC,
    icon: oidcIcon
  },
  {
    id: "passkey",
    name: "通行密钥",
    desc: "无密码登录",
    type: IdentitySourceType.PASSKEY,
    icon: passkeyIcon
  }
]

const defaultLdap = (isAD = false): LDAPVO => ({
  url: "",
  base_dn: "",
  bind_dn: "",
  bind_password: "",
  username_attribute: isAD ? "sAMAccountName" : "uid",
  mail_attribute: "mail",
  display_name_attribute: isAD ? "displayName" : "cn",
  title_attribute: "title",
  user_filter: isAD ? "(&(objectClass=user)(objectCategory=person))" : "(objectClass=inetOrgPerson)",
  sync_user_filter: ""
})

const defaultOidc = (provider: OIDCProviderType): OIDCVO => ({
  issuer: provider === OIDCProviderType.FEISHU ? "https://open.feishu.cn/open-apis/authen/v1" : "",
  client_id: "",
  client_secret: "",
  redirect_uri: window.location.origin + "/api/iam/user/oidc/callback",
  scopes: ["openid", "profile", "email"],
  user_info_url: provider === OIDCProviderType.FEISHU ? "https://open.feishu.cn/open-apis/authen/v1/user_info" : "",
  user_id_field: "sub",
  provider_type: provider,
  auth_url: provider === OIDCProviderType.FEISHU ? "https://passport.feishu.cn/suite/passport/oauth/authorize" : "",
  token_url: provider === OIDCProviderType.FEISHU ? "https://passport.feishu.cn/suite/passport/oauth/token" : "",
  jit_enabled: false,
  mapping: {
    username: provider === OIDCProviderType.FEISHU ? "name" : "preferred_username",
    email: "email"
  }
})

const defaultLocal = (): LocalVO => ({
  min_length: 8,
  require_digit: true,
  require_upper: false,
  require_lower: true,
  require_symbol: false,
  max_failed_attempts: 5,
  lockout_duration: 30
})

const defaultPasskey = (): PasskeyVO => ({
  rp_id: window.location.hostname,
  rp_name: "EIAM Governance",
  rp_origins: [window.location.origin],
  attestation_preference: "none",
  user_verification: "preferred"
})

const form = ref<SaveIdentitySourceReq>({
  name: "",
  type: IdentitySourceType.LDAP,
  enabled: true,
  ldap: defaultLdap(true)
})

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  "ldap.url": [{ required: true, message: "请输入服务器地址", trigger: "blur" }],
  "oidc.client_id": [{ required: true, message: "请输入客户端标识", trigger: "blur" }],
  "oidc.client_secret": [{ required: true, message: "请输入客户端密钥", trigger: "blur" }],
  "oidc.auth_url": [{ required: true, message: "请输入授权端点", trigger: "blur" }],
  "oidc.token_url": [{ required: true, message: "请输入令牌端点", trigger: "blur" }],
  "passkey.rp_id": [{ required: true, message: "请输入信赖方标识", trigger: "blur" }],
  "passkey.rp_name": [{ required: true, message: "请输入应用名称", trigger: "blur" }]
}

const selectProvider = (pid: string) => {
  if (props.isEdit) return
  selectedProvider.value = pid
  const p = providers.find((i) => i.id === pid)
  if (!p) return

  form.value.type = p.type as IdentitySourceType
  if (p.type === IdentitySourceType.LDAP) {
    form.value.ldap = defaultLdap(pid === "ad")
    form.value.oidc = undefined
    form.value.local = undefined
  } else if (p.type === IdentitySourceType.OIDC) {
    form.value.oidc = defaultOidc(pid === "feishu" ? OIDCProviderType.FEISHU : OIDCProviderType.GENERIC)
    form.value.ldap = undefined
    form.value.local = undefined
  } else if (p.type === IdentitySourceType.LOCAL) {
    form.value.local = defaultLocal()
    form.value.ldap = undefined
    form.value.oidc = undefined
    form.value.passkey = undefined
  } else if (p.type === IdentitySourceType.PASSKEY) {
    form.value.passkey = defaultPasskey()
    form.value.ldap = undefined
    form.value.oidc = undefined
    form.value.local = undefined
  }
}

const initForm = () => {
  if (props.isEdit && props.data) {
    form.value = JSON.parse(JSON.stringify(props.data))
    const { type } = form.value
    if (type === IdentitySourceType.LDAP) {
      selectedProvider.value = form.value.ldap?.user_filter?.includes("objectCategory=person") ? "ad" : "ldap"
    } else if (type === IdentitySourceType.OIDC) {
      selectedProvider.value = form.value.oidc?.provider_type === OIDCProviderType.FEISHU ? "feishu" : "oidc"
    } else if (type === IdentitySourceType.PASSKEY) {
      selectedProvider.value = "passkey"
    } else if (type === IdentitySourceType.LOCAL) {
      selectedProvider.value = "local"
    }
  }
}

const handleTestConnection = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    testing.value = true
    await testIdentitySourceApi(form.value)
    ElMessage.success("连接测试成功")
  } catch (error: any) {
    ElMessage.error(`测试失败: ${error.message || "请检查配置"}`)
  } finally {
    testing.value = false
  }
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  try {
    await saveIdentitySourceApi(form.value)
    ElMessage.success(props.isEdit ? "更新成功" : "集成成功")
    emit("success")
  } catch (error) {
    console.error("保存身份源配置失败:", error)
  }
}

defineExpose({ submit })
onMounted(initForm)
watch(() => props.data, initForm)
</script>

<style lang="scss" scoped>
.identity-source-form {
  padding: 8px 18px 16px;
  background: #ffffff;
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 10px;
  width: 100%;
  margin-bottom: 14px;

  .mode-card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 70px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
    position: relative;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f8fbff;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 6px 14px rgba(59, 130, 246, 0.08);

      .mode-card__icon {
        background: #ffffff;
        border-color: #bfdbfe;
      }

      .mode-card__title {
        color: #1d4ed8;
      }

      .mode-card__check {
        opacity: 1;
        transform: scale(1);
      }
    }

    &__icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;

      img {
        width: 23px;
        height: 23px;
        object-fit: contain;
      }
    }

    &__body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
      text-align: left;
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      line-height: 1.2;
    }

    &__desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__check {
      position: absolute;
      top: 7px;
      right: 7px;
      font-size: 15px;
      opacity: 0;
      color: #3b82f6;
      transform: scale(0.8);
      transition: all 0.2s ease;
    }
  }
}

.governance-form {
  .form-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      justify-content: space-between;

      .title-left {
        display: flex;
        align-items: center;
      }

      .section-icon {
        margin-right: 6px;
        font-size: 16px;
        color: #3b82f6;
      }

      span {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }

      .section-test-btn {
        height: 28px;
        padding: 0 10px;
        background: #ffffff;
        border: 1px solid #bfdbfe;
        color: #2563eb;
        font-size: 12px;
        font-weight: 600;
        border-radius: 5px;

        &:hover {
          background: #eff6ff;
          border-color: #3b82f6;
        }
      }
    }

    .basic-config-grid {
      display: block;
    }

    .name-field {
      margin-bottom: 0;
    }

    :deep(.section-header) {
      display: none; // 隐藏旧的子组件内部 header
    }

    :deep(.section-divider) {
      height: 1px;
      background: linear-gradient(to right, #f1f5f9, transparent);
      margin: 24px 0;
    }

    :deep(.item-tip) {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
  padding-bottom: 4px !important;
  font-size: 13px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  background: #fff;
  height: 36px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px #cbd5e1 inset;
  }
  &.is-focus {
    box-shadow: 0 0 0 1px #3b82f6 inset !important;
  }
}

@media (max-width: 980px) {
  .mode-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
