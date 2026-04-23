import { ref, computed, reactive, type Ref } from "vue"
import { ElMessageBox, ElMessage } from "element-plus"
import type { User, Identity } from "@/api/iam/user/type"
import { unbindIdentityApi, manageIdentitiesApi } from "@/api/iam/user"

/**
 * 身份源治理逻辑封装
 * @param user 用户信息响应式对象
 * @param emit 触发父组件刷新的函数
 */
export function useIdentityManage(user: Ref<User>, emit: (e: "refresh") => void) {
  const manageVisible = ref(false)
  const submitting = ref(false)
  const activeIndex = ref(0)

  const manageForm = reactive({
    ldap: "",
    wechat: "",
    feishu: ""
  })

  /**
   * 转换身份源名称
   */
  const getProviderName = (p: string) => {
    const nameMap: Record<string, string> = {
      ldap: "AD 账号",
      wechat: "企业微信",
      feishu: "飞书账号"
    }
    return nameMap[p.toLowerCase()] || p
  }

  /**
   * 动态获取身份源标识符
   */
  const getIdentityId = (item: Identity) => {
    const p = item.provider.toLowerCase()
    if (p === "ldap") return item.ldap_info?.dn
    if (p === "wechat") return item.wechat_info?.user_id
    if (p === "feishu") return item.feishu_info?.user_id || item.feishu_info?.open_id
    return ""
  }

  /**
   * 过滤有实际数据的身份源，并按固定顺序排序：AD > 飞书 > 微信
   */
  const filteredIdentities = computed(() => {
    const order: Record<string, number> = { ldap: 1, feishu: 2, wechat: 3 }
    return (user.value?.identities || [])
      .filter((id: Identity) => !!getIdentityId(id))
      .sort((a: Identity, b: Identity) => {
        const oa = order[a.provider.toLowerCase()] || 99
        const ob = order[b.provider.toLowerCase()] || 99
        return oa - ob
      })
  })

  /**
   * 当前选中的身份源
   */
  const activeIdentity = computed(() => {
    if (filteredIdentities.value.length === 0) return null
    return filteredIdentities.value[activeIndex.value] || filteredIdentities.value[0]
  })

  /**
   * 打开管理弹窗
   */
  const handleOpenManage = () => {
    manageForm.ldap = ""
    manageForm.wechat = ""
    manageForm.feishu = ""

    user.value?.identities?.forEach((id: Identity) => {
      const p = id.provider.toLowerCase()
      if (p === "ldap") manageForm.ldap = id.ldap_info?.dn || ""
      if (p === "wechat") manageForm.wechat = id.wechat_info?.user_id || ""
      if (p === "feishu") manageForm.feishu = id.feishu_info?.user_id || id.feishu_info?.open_id || ""
    })

    manageVisible.value = true
  }

  /**
   * 保存管理表单
   */
  const handleSaveManage = async (data: any) => {
    submitting.value = true
    try {
      // 同步本地状态
      Object.assign(manageForm, data)

      await manageIdentitiesApi({
        user_id: user.value.id,
        ldap_info: { dn: data.ldap },
        wechat_info: { user_id: data.wechat },
        feishu_info: { user_id: data.feishu, open_id: "" }
      })

      ElMessage.success("外部身份治理信息已更新")
      manageVisible.value = false
      emit("refresh")
    } catch (err) {
      console.error("Manage identities failed:", err)
    } finally {
      submitting.value = false
    }
  }

  /**
   * 解除绑定逻辑
   */
  const handleUnbind = () => {
    if (!activeIdentity.value) return
    const row = activeIdentity.value
    const providerName = getProviderName(row.provider)
    ElMessageBox.confirm(
      `确定要解除用户与 ${providerName} 的绑定关系吗？这可能导致该用户无法通过该渠道登录。`,
      "身份解绑警告",
      {
        confirmButtonText: "确定解绑",
        cancelButtonText: "取消",
        type: "warning",
        confirmButtonClass: "el-button--danger eiam-confirm-btn"
      }
    ).then(async () => {
      try {
        await unbindIdentityApi({
          user_id: user.value.id,
          provider: row.provider
        })
        ElMessage.success("已成功解除身份绑定")
        activeIndex.value = 0
        emit("refresh")
      } catch (err) {
        console.error("Unbind identity failed:", err)
      }
    })
  }

  return {
    manageVisible,
    submitting,
    activeIndex,
    manageForm,
    filteredIdentities,
    activeIdentity,
    getProviderName,
    getIdentityId,
    handleOpenManage,
    handleSaveManage,
    handleUnbind
  }
}
