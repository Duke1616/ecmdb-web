import { onMounted, ref } from "vue"
import { listTemplateGroupApi } from "@/api/ticket/template"
import type { templateGroup } from "@/api/ticket/template/types/template"

export function useTemplateOptions() {
  const templateGroupsData = ref<templateGroup[]>([])

  const listTemplateGroups = async () => {
    try {
      const { data } = await listTemplateGroupApi({
        offset: 0,
        limit: 100
      })
      templateGroupsData.value = data.template_groups
    } catch {
      templateGroupsData.value = []
    }
  }

  onMounted(() => {
    listTemplateGroups()
  })

  return {
    templateGroupsData,
    listTemplateGroups
  }
}
