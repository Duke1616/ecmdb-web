import { defineStore } from "pinia"
import { type Models } from "@/api/model/types/model"
import { listModelsApi } from "@/api/model"
import { ref } from "vue"

export const useModelStore = defineStore(
  "model",
  () => {
    const ModelsData = ref<Models[]>([])

    /** 获取模型信息 */
    const ListModelsInGroup = async () => {
      const { data } = await listModelsApi()
      ModelsData.value = data.mgs

      return { data }
    }

    return { ModelsData, ListModelsInGroup }
  },
  {
    persist: true
  }
)
