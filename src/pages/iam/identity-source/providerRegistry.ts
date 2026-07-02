import {
  IdentitySourceType,
  OIDCProviderType,
  type IdentitySourceVO,
  type LDAPVO,
  type LocalVO,
  type OIDCVO,
  type PasskeyVO,
  type SaveIdentitySourceReq
} from "@/api/iam/identity-source/type"

import adIcon from "./svg/Windows AD.svg"
import ldapIcon from "./svg/ldap.svg"
import feishuIcon from "./svg/feishu.svg"
import oidcIcon from "./svg/oidc.svg"
import passwordIcon from "./svg/pass.svg"
import passkeyIcon from "./svg/webauthn.svg"

export type IdentityProviderId = "local" | "ad" | "ldap" | "feishu" | "oidc" | "passkey"

export interface IdentityProviderMeta {
  id: IdentityProviderId
  name: string
  desc: string
  type: IdentitySourceType
  icon: string
}

export const IDENTITY_SOURCE_PROVIDERS: IdentityProviderMeta[] = [
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

export const defaultLdap = (isAD = false): LDAPVO => ({
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

export const defaultOidc = (provider: OIDCProviderType): OIDCVO => ({
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

export const defaultLocal = (): LocalVO => ({
  min_length: 8,
  require_digit: true,
  require_upper: false,
  require_lower: true,
  require_symbol: false,
  max_failed_attempts: 5,
  lockout_duration: 30
})

export const defaultPasskey = (): PasskeyVO => ({
  rp_id: window.location.hostname,
  rp_name: "EIAM Governance",
  rp_origins: [window.location.origin],
  attestation_preference: "none",
  user_verification: "preferred"
})

export const getProviderConfig = (
  providerId: IdentityProviderId
): Pick<SaveIdentitySourceReq, "type" | "ldap" | "oidc" | "local" | "passkey"> => {
  if (providerId === "ad" || providerId === "ldap") {
    return {
      type: IdentitySourceType.LDAP,
      ldap: defaultLdap(providerId === "ad"),
      oidc: undefined,
      local: undefined,
      passkey: undefined
    }
  }

  if (providerId === "feishu" || providerId === "oidc") {
    return {
      type: IdentitySourceType.OIDC,
      ldap: undefined,
      oidc: defaultOidc(providerId === "feishu" ? OIDCProviderType.FEISHU : OIDCProviderType.GENERIC),
      local: undefined,
      passkey: undefined
    }
  }

  if (providerId === "local") {
    return {
      type: IdentitySourceType.LOCAL,
      ldap: undefined,
      oidc: undefined,
      local: defaultLocal(),
      passkey: undefined
    }
  }

  return {
    type: IdentitySourceType.PASSKEY,
    ldap: undefined,
    oidc: undefined,
    local: undefined,
    passkey: defaultPasskey()
  }
}

export const createDefaultIdentitySourceForm = (providerId: IdentityProviderId = "ad"): SaveIdentitySourceReq => ({
  name: "",
  enabled: true,
  ...getProviderConfig(providerId)
})

export const getProviderIdFromSource = (source: IdentitySourceVO | SaveIdentitySourceReq): IdentityProviderId => {
  if (source.type === IdentitySourceType.LDAP) {
    const looksLikeAD = source.ldap?.user_filter?.includes("objectCategory=person") || /ad|域/i.test(source.name)
    return looksLikeAD ? "ad" : "ldap"
  }
  if (source.type === IdentitySourceType.OIDC) {
    return source.oidc?.provider_type === OIDCProviderType.FEISHU ? "feishu" : "oidc"
  }
  if (source.type === IdentitySourceType.PASSKEY) return "passkey"
  return "local"
}

export const getProviderInfo = (source: IdentitySourceVO) => {
  const id = getProviderIdFromSource(source)
  const meta = IDENTITY_SOURCE_PROVIDERS.find((provider) => provider.id === id)
  return {
    label: meta?.name || "未知身份源",
    icon: meta?.icon || passwordIcon
  }
}
