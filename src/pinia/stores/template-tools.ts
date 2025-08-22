import { defineStore } from "pinia"
import { ref } from "vue"
import store from "@/pinia"
import { findByTemplateIdsApi } from "@/api/template"

export const useTemplateToolsStore = defineStore("template-tools", () => {
  const templateMap = ref(new Map<number, string>())

  const setByTemplateIds = (members: number[]) => {
    // 查看是否为空
    if (!members || members.length === 0) return

    // 去重
    const uniqueMembers = Array.from(new Set(members))

    // 筛选出 userMap 中没有的用户 ID
    const missingMembers = uniqueMembers.filter((id) => !templateMap.value.has(id))

    // 如果所有用户都已存在，则不处理
    if (missingMembers.length === 0) return

    // 获取用户信息存储到 map 中
    findByTemplateIdsApi(missingMembers)
      .then((data) => {
        const newUsers = new Map(data.data.templates.map((t) => [t.id, t.name]))
        newUsers.forEach((name, id) => templateMap.value.set(id, name))
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  }

  const setToMap = (id: number, name: string) => {
    templateMap.value.set(id, name)
  }

  const getTemplateName = (id: number) => {
    return templateMap.value.get(id)
  }

  return { templateMap, setByTemplateIds, setToMap, getTemplateName }
})

/** 在 setup 外使用 */
export function useTemplateToolsStoreHook() {
  return useTemplateToolsStore(store)
}
