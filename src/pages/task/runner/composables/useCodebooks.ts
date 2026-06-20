import { ref, computed, watch } from "vue"
import { codebook } from "@/api/task/codebook/types/codebook"
import { listCodebookApi } from "@/api/task/codebook"
import type { Ref } from "vue"
import type { registerOrUpdateReq } from "@/api/task/runner/types/runner"

/**
 * 获取任务模版列表，并处理 codebook_secret 自动填充
 * @param formData 执行单元表单数据（响应式引用）
 */
export function useCodebooks(formData: Ref<registerOrUpdateReq>) {
  const codebooks = ref<codebook[]>([])
  const loading = ref(false)

  const fetchCodebooks = () => {
    loading.value = true
    listCodebookApi({ offset: 0, limit: 100 })
      .then(({ data }) => {
        codebooks.value = (data.codebooks || []).filter((item) => item.kind !== "DIRECTORY")
      })
      .catch(() => {
        codebooks.value = []
      })
      .finally(() => {
        loading.value = false
      })
  }

  /** 根据选中的 codebook_id 自动查找对应的 secret */
  const computedSecret = computed(() => {
    const matched = codebooks.value.find((item) => item.id === formData.value.codebook_id)
    return matched?.secret ?? ""
  })

  // NOTE: 选中模版后自动同步 secret，不需要用户手动填写
  watch(
    computedSecret,
    (val) => {
      formData.value.codebook_secret = val
    },
    { immediate: true }
  )

  return {
    codebooks,
    loading,
    fetchCodebooks
  }
}
