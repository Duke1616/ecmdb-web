import { computed, type Ref } from "vue"
import type { Group } from "@/api/iam/group/type"
import type { StatusItem } from "@/common/components/Governance/StatusStrip.vue"
import { formatTimestamp } from "@@/utils/day"

export function useGroupDisplayItems(group: Ref<Group | undefined>) {
  const statusItems = computed<StatusItem[]>(() => {
    if (!group.value) return []

    return [
      {
        label: "分组状态",
        value: "可用",
        dot: true,
        type: "success"
      },
      {
        label: "创建时间",
        value: formatTimestamp(group.value.ctime) || "-"
      }
    ]
  })

  const infoItems = computed(() => {
    if (!group.value) return []

    return [
      { label: "用户组名称", value: group.value.name },
      { label: "唯一识别码 (CODE)", value: group.value.code, mono: true, copyable: true },
      { label: "最后更新时间", value: formatTimestamp(group.value.utime) || "-" },
      {
        label: "分组说明",
        value: group.value.desc || "该用户组暂无业务边界或职责描述",
        full: true,
        desc: true
      }
    ]
  })

  return {
    statusItems,
    infoItems
  }
}
