import { ref, onMounted, reactive } from "vue"
import { listAuthorizationsApi } from "@/api/iam/permission"
import { type Authorization, type AuthorizationQueryReq } from "@/api/iam/permission/type"
import { ElMessage } from "element-plus"

export function useAuthorizeList() {
  const loading = ref(false)
  const authorizations = ref<Authorization[]>([])
  const total = ref(0)

  const query = reactive<AuthorizationQueryReq>({
    offset: 0,
    limit: 10,
    keyword: "",
    sub_type: undefined,
    obj_type: undefined
  })

  const currentPage = ref(1)
  const pageSize = ref(10)

  const fetchList = async () => {
    loading.value = true
    try {
      const { data } = await listAuthorizationsApi({
        ...query,
        offset: (currentPage.value - 1) * pageSize.value,
        limit: pageSize.value
      })
      authorizations.value = data.authorizations
      total.value = data.total
    } catch (err) {
      ElMessage.error("获取授权列表失败")
    } finally {
      loading.value = false
    }
  }

  const handleRefresh = () => {
    currentPage.value = 1
    fetchList()
  }

  const handleSizeChange = (val: number) => {
    pageSize.value = val
    fetchList()
  }

  const handleCurrentChange = (val: number) => {
    currentPage.value = val
    fetchList()
  }

  onMounted(() => {
    fetchList()
  })

  return {
    loading,
    authorizations,
    total,
    query,
    currentPage,
    pageSize,
    handleRefresh,
    handleSizeChange,
    handleCurrentChange
  }
}
