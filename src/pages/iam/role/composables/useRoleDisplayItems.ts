import { computed, type Ref } from "vue"
import type { Role } from "@/api/iam/role/type"
import type { StatusItem } from "@/common/components/Governance/StatusStrip.vue"

/**
 * 角色详情页面展示数据计算逻辑
 * 参照 User 模块的设计，解耦业务逻辑与视图项映射
 */
export function useRoleDisplayItems(role: Ref<Role | undefined>, memberTotal: Ref<number>, policyTotal: Ref<number>) {
  const statusItems = computed<StatusItem[]>(() => {
    if (!role.value) return []
    const items: StatusItem[] = [
      {
        label: "资产属性",
        value: role.value.type === 1 ? "系统内置" : "业务自定义",
        dot: true,
        type: role.value.type === 1 ? "info" : "success"
      },
      {
        label: "安全治理深度",
        value: "L2 (内联+托管)",
        dot: true,
        type: "success"
      },
      {
        label: "当前绑定用户",
        value: `${memberTotal.value} 位`,
        type: "info"
      }
    ]

    // 仅当策略数大于 0 时才展示该项，保持界面简洁有效
    if (policyTotal.value > 0) {
      items.push({
        label: "关联策略总数",
        value: `${policyTotal.value} 条`,
        type: "info"
      })
    }

    return items
  })

  const infoItems = computed(() => {
    if (!role.value) return []
    return [
      { label: "角色显示名称", value: role.value.name },
      { label: "唯一识别码 (CODE)", value: role.value.code, mono: true, copyable: true },
      {
        label: "资产来源标识",
        value: role.value.type === 1 ? "系统角色" : "自定义角色"
      },
      {
        label: "核心职责描述",
        value: role.value.desc || "该主体暂无详细的业务职责描述说明",
        full: true,
        desc: true
      }
    ]
  })

  return { statusItems, infoItems }
}
