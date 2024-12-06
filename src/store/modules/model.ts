import { defineStore } from "pinia"
import { type Models } from "@/api/model/types/model"
import { getByModelUidsApi, ListModelsByGroupApi } from "@/api/model"
import { ref } from "vue"

export const useModelStore = defineStore(
  "model",
  () => {
    const modelsData = ref<Models[]>([])
    const modelMap = ref(new Map<string, string>())

    /** 获取模型信息 */
    const ListModelsByGroup = async () => {
      const { data } = await ListModelsByGroupApi()
      modelsData.value = data.mgs

      return { data }
    }

    const getByModelUids = (uids: string[]) => {
      if (!uids || uids.length === 0) return
      const uniqueUids = Array.from(new Set(uids))
      const missingUids = uniqueUids.filter((uid) => !modelMap.value.has(uid))
      if (missingUids.length === 0) return

      getByModelUidsApi(uids)
        .then(({ data }) => {
          const newModels = new Map(data.models.map((model) => [model.uid, model.name]))

          newModels.forEach((name, uid) => modelMap.value.set(uid, name))
        })
        .catch((error) => {
          console.log("catch", error)
        })
        .finally(() => {})
    }

    const getModelName = (uid: string) => {
      return modelMap.value.get(uid)
    }

    return { modelsData, ListModelsByGroup, getByModelUids, getModelName }
  },
  {
    persist: true
  }
)
