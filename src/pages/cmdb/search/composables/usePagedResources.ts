import { computed, ref } from "vue"
import { ElMessage } from "element-plus"
import { View } from "@element-plus/icons-vue"
import type { Action, Column } from "@/common/components/DataTable/types"
import { usePagination } from "@/common/composables/usePagination"
import type { Attribute } from "@/api/cmdb/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/cmdb/attribute"
import { findSecureData, searchPagedResourcesApi } from "@/api/cmdb/resource"
import type { IResolvedFieldItem } from "../types"

/**
 * 阶段二：靶向单租户单模型真物理分页资产检索与动态展示列计算
 */
export function usePagedResources() {
  const resourceLoading = ref(false)
  const resourceRows = ref<any[]>([])
  const currentModelUid = ref("")
  const currentSearchKeyword = ref("")
  const currentTenantId = ref<number | undefined>(undefined)

  const { paginationData, handleCurrentChange, handleSizeChange } = usePagination({
    pageSize: 20,
    pageSizes: [10, 20, 50, 100]
  })

  // 模型元数据缓存 (cacheKey: `${tenantId}_${modelUid}`)
  const allModelAttributesCache = ref<Map<string, Attribute[]>>(new Map())
  const displayModelAttributesCache = ref<Map<string, Attribute[]>>(new Map())

  const getModelCacheKey = (tenantId: number | undefined, modelUid: string) => `${tenantId || 0}_${modelUid}`

  /** 当前选中模型的全量元数据属性 */
  const currentModelAllAttributes = computed<Attribute[]>(() => {
    if (!currentModelUid.value) return []
    const cacheKey = getModelCacheKey(currentTenantId.value, currentModelUid.value)
    return allModelAttributesCache.value.get(cacheKey) || []
  })

  /** 当前选中的模型基础展示字段（后端统一计算下沉） */
  const currentBaseDisplayFields = computed<Attribute[]>(() => {
    if (!currentModelUid.value) return []
    const cacheKey = getModelCacheKey(currentTenantId.value, currentModelUid.value)
    return displayModelAttributesCache.value.get(cacheKey) || []
  })

  /** 扫描当前页资产数据中包含当前搜索关键词的字段 UID */
  const matchedFieldUids = computed<string[]>(() => {
    const keyword = currentSearchKeyword.value.trim().toLowerCase()
    if (!keyword || resourceRows.value.length === 0) return []

    const matchedKeys = new Set<string>()
    resourceRows.value.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key === "id" || key === "name" || key === "model_uid" || key.endsWith("_secure_display")) return
        const val = row[key]
        if (val !== undefined && val !== null && String(val).toLowerCase().includes(keyword)) {
          matchedKeys.add(key)
        }
      })
    })
    return Array.from(matchedKeys)
  })

  /** 最终融合的展示字段列表：命中搜索词的字段置顶优先，基础展示列随后 */
  const finalDisplayFields = computed<IResolvedFieldItem[]>(() => {
    const allAttrMap = new Map(currentModelAllAttributes.value.map((attr) => [attr.field_uid, attr]))
    const baseFields = currentBaseDisplayFields.value
    const matchedKeys = matchedFieldUids.value
    const fieldMap = new Map<string, IResolvedFieldItem>()

    // 1. 优先放入命中了搜索词的字段（置顶展示）
    matchedKeys.forEach((key) => {
      const attr = allAttrMap.get(key)
      fieldMap.set(key, {
        field_uid: key,
        field_name: attr?.field_name || key,
        field_type: attr?.field_type || "string",
        secure: attr?.secure,
        isMatched: true
      })
    })

    // 2. 依次追加后端下沉的默认展示列
    baseFields.forEach((attr) => {
      if (!fieldMap.has(attr.field_uid)) {
        fieldMap.set(attr.field_uid, {
          field_uid: attr.field_uid,
          field_name: attr.field_name,
          field_type: attr.field_type,
          secure: attr.secure,
          isMatched: false
        })
      }
    })

    // 限制展示属性列数量不超过 10 列，保持视口适度
    return Array.from(fieldMap.values()).slice(0, 10)
  })

  /** 表格列配置：常驻【资产 ID】与【资产名称】列，后接动态属性列 */
  const tableColumns = computed<Column[]>(() => {
    const cols: Column[] = [
      {
        prop: "id",
        label: "资产 ID",
        width: 90,
        align: "center"
      },
      {
        prop: "name",
        label: "资产名称",
        minWidth: 160,
        align: "center",
        slot: "name"
      }
    ]

    finalDisplayFields.value.forEach((field) => {
      cols.push({
        prop: field.field_uid,
        label: field.isMatched ? `${field.field_name} (匹配)` : field.field_name,
        align: "center",
        minWidth: 140,
        slot: field.field_uid
      })
    })

    return cols
  })

  /** 表格右侧常驻操作项 */
  const tableActions: Action[] = [
    {
      key: "detail",
      label: "详情",
      type: "primary",
      icon: View,
      plain: false
    }
  ]

  /** 确保模型字段已获取并缓存 (支持多租户联合隔离缓存) */
  const ensureModelFields = async (modelUid: string, tenantId?: number) => {
    const cacheKey = getModelCacheKey(tenantId, modelUid)
    if (allModelAttributesCache.value.has(cacheKey)) return

    try {
      const { data } = await ListAttributeFieldApi(modelUid, tenantId)
      allModelAttributesCache.value.set(cacheKey, data.attribute_fields || [])
      displayModelAttributesCache.value.set(cacheKey, data.display_fields || [])
    } catch (err) {
      console.error(`获取模型 [${modelUid}] 属性元数据失败:`, err)
      allModelAttributesCache.value.set(cacheKey, [])
      displayModelAttributesCache.value.set(cacheKey, [])
    }
  }

  /**
   * 发起阶段二真物理分页检索
   */
  const fetchPagedResources = async (params: { modelUid: string; keyword: string; tenantId?: number }) => {
    const { modelUid, keyword, tenantId } = params
    if (!modelUid) {
      resourceRows.value = []
      paginationData.total = 0
      return
    }

    currentModelUid.value = modelUid
    currentSearchKeyword.value = keyword
    currentTenantId.value = tenantId
    resourceLoading.value = true

    const offset = (paginationData.currentPage - 1) * paginationData.pageSize
    const limit = paginationData.pageSize

    try {
      // 1. 确保属性定义元数据就绪
      await ensureModelFields(modelUid, tenantId)

      // 2. 发起后端物理索引分页请求
      const { data: respData } = await searchPagedResourcesApi(
        {
          model_uid: modelUid,
          text: keyword,
          offset,
          limit
        },
        tenantId
      )

      // 3. 展平行数据便于动态列直读
      const items = (respData?.resources || []).map((item) => ({
        id: item.id,
        name: item.name,
        model_uid: item.model_uid,
        ...item.data
      }))

      resourceRows.value = items
      paginationData.total = respData?.total || 0
    } catch (error) {
      console.error("阶段二资产分页拉取失败:", error)
      resourceRows.value = []
      paginationData.total = 0
    } finally {
      resourceLoading.value = false
    }
  }

  /**
   * 敏感字段解密获取
   */
  const handleSecureClick = async (row: any, fieldUid: string, tenantId?: number) => {
    try {
      const { data } = await findSecureData(
        {
          id: row.id,
          field_uid: fieldUid
        },
        tenantId
      )
      row[fieldUid] = data
    } catch (error) {
      ElMessage.error("获取敏感数据解密失败")
    }
  }

  /**
   * 敏感字段显示状态切换
   */
  const handleSecureDisplayChange = (row: any, fieldUid: string, isDisplaying: boolean) => {
    row[`${fieldUid}_secure_display`] = isDisplaying
  }

  /**
   * 判断文本是否命中当前搜索词
   */
  const isValueMatched = (val: any): boolean => {
    if (val === undefined || val === null) return false
    const str = String(val)
    return currentSearchKeyword.value !== "" && str.includes(currentSearchKeyword.value)
  }

  /** 清空资源数据 */
  const resetResources = () => {
    resourceRows.value = []
    paginationData.total = 0
    paginationData.currentPage = 1
    currentModelUid.value = ""
    currentSearchKeyword.value = ""
    currentTenantId.value = undefined
  }

  return {
    resourceLoading,
    resourceRows,
    currentModelUid,
    currentSearchKeyword,
    paginationData,
    finalDisplayFields,
    tableColumns,
    tableActions,
    handleCurrentChange,
    handleSizeChange,
    fetchPagedResources,
    handleSecureClick,
    handleSecureDisplayChange,
    isValueMatched,
    resetResources
  }
}
