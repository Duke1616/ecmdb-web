import { computed, type Ref } from "vue"
import type { User } from "@/api/iam/user/type"
import type { StatusItem } from "@/common/components/Governance/StatusStrip.vue"

/**
 * 用户详情页面共享的展示数据计算逻辑
 * - statusItems: 状态条条目 (账号来源、控制台登录、MFA、风险等级)
 * - infoItems: 身份实证资料条目
 */
export function useUserDisplayItems(user: Ref<User | undefined>) {
  const statusItems = computed<StatusItem[]>(() => {
    if (!user.value) return []
    return [
      {
        label: "账号来源",
        value: user.value.source === "ldap" ? "LDAP 同步" : "本地账户",
        dot: true,
        type: "success"
      },
      {
        label: "控制台登录",
        value: user.value.console_login ? "已开启" : "未授权",
        dot: true,
        type: user.value.console_login ? "success" : "info"
      },
      {
        label: "MFA 状态",
        value: user.value.mfa_bound ? "已绑定" : "未绑定",
        dot: true,
        type: user.value.mfa_bound ? "success" : "warning"
      },
      {
        label: "风险等级",
        value: user.value.mfa_bound ? "L0 (安全)" : "L1 (低风险)",
        dot: true,
        type: user.value.mfa_bound ? "success" : "warning"
      }
    ]
  })

  const infoItems = computed(() => {
    if (!user.value) return []
    return [
      { label: "姓名/昵称", value: user.value.nickname || user.value.username },
      { label: "登录用户名", value: user.value.username, mono: true, copyable: true },
      { label: "当前职位/职能", value: user.value.job_title || "未定义职责" },
      {
        label: "核心职责描述",
        value: user.value.job_title ? `该主体主要负责 ${user.value.job_title} 相关治理职能` : "暂无详细职责说明",
        full: true,
        desc: true
      }
    ]
  })

  return { statusItems, infoItems }
}
