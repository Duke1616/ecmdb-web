import { defineStore } from "pinia"
import { type Models } from "@/api/model/types/model"
import { ListModelsByGroupApi } from "@/api/model"
import { ref } from "vue"

export const useModelStore = defineStore(
  "model",
  () => {
    const modelsData = ref<Models[]>([])

    /** 获取模型信息 */
    const ListModelsByGroup = async () => {
      const { data } = await ListModelsByGroupApi()
      modelsData.value = data.mgs

      return { data }
    }

    return { modelsData, ListModelsByGroup }
  },
  {
    persist: true
  }
)
