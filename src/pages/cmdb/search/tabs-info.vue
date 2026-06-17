<template>
  <PageContainer class="search-result-page">
    <ManagerHeader
      title="搜索结果"
      :subtitle="`找到 ${getTotalResults()} 条相关数据`"
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="false"
      @back="goBack"
    >
      <template #actions>
        <div class="search-header-actions">
          <el-input
            v-model="inputSearch"
            placeholder="搜索资源..."
            clearable
            class="search-header-input"
            @keyup.enter="search"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" class="search-header-button" :icon="Search" @click="search">搜索</el-button>
        </div>
      </template>
    </ManagerHeader>

    <div v-if="searchResourcesData.length === 0" class="no-results">
      <el-empty description="暂无搜索结果" />
    </div>

    <div v-else class="search-results-container">
      <CustomTabs
        :tabs="tabs"
        :default-active="activeName || (tabs.length > 0 ? tabs[0].name : '')"
        :no-margin="false"
        @tab-change="handleTabClick"
        class="search-tabs"
      >
        <template #default>
          <DataTable
            v-if="currentTabData && currentTabData.data && currentTabData.data.length > 0"
            :data="getPaginatedData(currentTabData.data)"
            :columns="getTableColumns(currentTabData.model_uid)"
            :loading="false"
            :show-pagination="true"
            :total="currentTabData.data.length"
            :page-size="paginationData.pageSize"
            :current-page="paginationData.currentPage"
            :page-sizes="paginationData.pageSizes"
            :pagination-layout="paginationData.layout"
            :table-props="{ stripe: true, border: true }"
            :actions="tableActions"
            action-column-width="96"
            action-column-fixed="right"
            @action="handleTableAction"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          >
            <template
              v-for="field in displayFileds.get(currentTabData?.model_uid) || []"
              :key="field.field_uid"
              #[`${field.field_uid}`]="{ row }"
            >
              <div class="search-table-cell">
                <SecureFieldView
                  v-if="field.secure"
                  :content="row[field.field_uid]"
                  :is-displaying="!!row[`${field.field_uid}_secure_display`]"
                  :copy-only="true"
                  @view-click="handleSecureClick(row, field)"
                  @display-change="(isDisplaying: boolean) => handleSecureDisplayChange(row, field, isDisplaying)"
                  @copy="(content: string) => handleCopySecureContent(content, row.id)"
                />

                <ResourceTableFileUpload
                  v-else-if="field.field_type === 'file'"
                  :model-value="Array.isArray(row[field.field_uid]) ? row[field.field_uid] : []"
                  :field-uid="field.field_uid"
                  :row="normalizeResourceRow(row)"
                  :limit="5"
                  disabled
                  @preview="handlePreview"
                />

                <span
                  v-else-if="field.field_type === 'string' || field.field_type === 'list'"
                  class="field-content"
                  :style="{ color: textColor(row[field.field_uid]) }"
                >
                  {{ row[field.field_uid] }}
                </span>

                <span v-else class="field-content">{{ row[field.field_uid] || "-" }}</span>
              </div>
            </template>
          </DataTable>
        </template>
      </CustomTabs>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue"
import { Search, View } from "@element-plus/icons-vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"
import ResourceTableFileUpload from "@/pages/cmdb/resource/components/ResourceTableFileUpload.vue"
import { globalSearchData } from "@/api/resource/types/resource"
import { findSecureData, globalSearchApi } from "@/api/resource"
import { useRoute } from "vue-router"
import { Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { useSearchStore } from "@/pinia/stores/search"
import { useModelStore } from "@/pinia/stores/model"
import { useRouter } from "vue-router"
import { usePagination } from "@/common/composables/usePagination"
import { ElMessage, UploadUserFile } from "element-plus"
import type { Action, Column } from "@/common/components/DataTable/types"

const router = useRouter()
const route = useRoute()
const modelStore = useModelStore()
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const inputSearch = ref<string>(route.query.text as string)
let oldSearch = route.query.text as string

const search = () => {
  if (inputSearch.value.trim() === "") {
    ElMessage.error("搜索内容不成为空")
    return
  }

  if (oldSearch === inputSearch.value) {
    return
  }

  useSearchStore().addHistorySearch(inputSearch.value.trim())
  if (inputSearch.value.trim() !== "") {
    router.push({
      path: "/cmdb/dashboard/search",
      query: { text: inputSearch.value }
    })
    listGlobalSearchData(inputSearch.value)
  }
  oldSearch = inputSearch.value
}

const goBack = () => {
  router.push({
    path: "/cmdb/dashboard"
  })
}

// 分页处理方法
// 获取分页数据
const getPaginatedData = (data: any[]) => {
  if (!data || data.length === 0) return []

  const start = (paginationData.currentPage - 1) * paginationData.pageSize
  const end = start + paginationData.pageSize
  return data.slice(start, end)
}

// 获取当前选中的 tab 数据
const currentTabData = computed(() => {
  return searchResourcesData.value.find((tab) => tab.model_uid === activeName.value)
})

const activeName = ref("")
const tableActions: Action[] = [
  {
    key: "detail",
    label: "详情",
    type: "primary",
    icon: View,
    plain: false
  }
]

// 计算 tabs 数据
const tabs = computed(() => {
  return searchResourcesData.value.map((tab) => ({
    name: tab.model_uid,
    label: `${modelStore.getModelName(tab.model_uid)} (${tab.total})`
  }))
})

const handleTabClick = (tabName: string) => {
  activeName.value = tabName
  sortFields(tabName)
}

// 获取总结果数
const getTotalResults = () => {
  return searchResourcesData.value.reduce((total, tab) => total + tab.total, 0)
}

// 获取表格列配置
const getTableColumns = (modelUid: string): Column[] => {
  const fields = displayFileds.value.get(modelUid) || []
  const columns: Column[] = [
    {
      prop: "id",
      label: "ID",
      width: 80,
      align: "center"
    },
    ...fields.map((field) => ({
      prop: field.field_uid,
      label: field.field_name,
      align: "center" as const,
      minWidth: 120,
      slot: field.field_uid
    }))
  ]
  return columns
}

const textColor = (fieldValue: string) => {
  // 为空处理否则会报错
  if (fieldValue === undefined) {
    return ""
  }

  if (fieldValue.includes(inputSearch.value)) {
    return "red"
  } else {
    return ""
  }
}

// ** 获取资产列表 */
const searchResourcesData = ref<globalSearchData[]>([])
const listGlobalSearchData = (text: string) => {
  globalSearchApi(text)
    .then(async ({ data }) => {
      searchResourcesData.value = data
      if (searchResourcesData.value.length > 0) {
        activeName.value = searchResourcesData.value[0].model_uid
        await sortFields(activeName.value)
      }

      modelStore.getByModelUids(searchResourcesData.value.map((item) => item.model_uid))
    })
    .catch(() => {
      searchResourcesData.value = []
    })
    .finally(() => {})
}

// ** 过滤展示字段，并排序 */
const displayFileds = ref<Map<string, Attribute[]>>(new Map())
const serachHistory = ref<Map<string, string>>(new Map())
const sortFields = async (modelUid: string) => {
  if (displayFileds.value.has(modelUid)) {
    return
  }

  if (serachHistory.value.get(modelUid) === inputSearch.value) {
    return
  }

  // 处理不存在前端列表，但是匹配项存在的情况
  let hightShowFields: Attribute[] = []
  const matchingItem = searchResourcesData.value.find((item) => item.model_uid === modelUid)
  if (matchingItem && matchingItem.data.length > 0) {
    hightShowFields = matchingItem.data.reduce((acc, obj) => {
      Object.keys(obj).forEach((key) => {
        if (obj[key] === inputSearch.value) {
          acc.push({
            field_uid: key,
            field_name: key,
            display: true,
            model_uid: matchingItem.model_uid
          })
        }
      })
      return acc
    }, [])
  }

  // 获取展示字段
  await listAttributeFields(modelUid)
  const filteredFields = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })

  // 数据组合
  hightShowFields.forEach((field) => {
    const exists = filteredFields.some((existingField) => existingField.field_uid === field.field_uid)

    if (!exists) {
      filteredFields.push(field)
    }
  })
  serachHistory.value.set(modelUid, inputSearch.value)
  displayFileds.value.set(modelUid, filteredFields)
}

// ** 获取资产字段信息 */
const attributeFiledsData = ref<Attribute[]>([])
const listAttributeFields = async (modelUid: string) => {
  await ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields
    })
    .catch((error) => {
      console.log("报错", error)
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

const handlerDetailClick = (row: any) => {
  console.log("搜索页面准备跳转到详情页面:", {
    name: "AssetDetail",
    query: { model_uid: row.model_uid, name: row.name, id: row.id }
  })

  router
    .push({
      name: "AssetDetail",
      query: { model_uid: row.model_uid, name: row.name, id: row.id }
    })
    .then(() => {
      console.log("搜索页面路由跳转成功")
    })
    .catch((error) => {
      console.error("搜索页面路由跳转失败:", error)
    })
}

const handleTableAction = (key: string, row: any) => {
  if (key === "detail") {
    handlerDetailClick(row)
  }
}

const handleSecureClick = (row: any, item: Attribute) => {
  findSecureData({
    id: row.id,
    field_uid: item.field_uid
  })
    .then((data) => {
      row[item.field_uid] = data.data
      // 在 copy-only 模式下不设置显示状态，避免显示内容区域
      // row[`${item.field_uid}_secure_display`] = true
    })
    .catch(() => {
      ElMessage.error("获取数据失败")
    })
}

const handleSecureDisplayChange = (row: any, item: Attribute, isDisplaying: boolean) => {
  row[`${item.field_uid}_secure_display`] = isDisplaying
}

const handleCopySecureContent = (content: string, rowId: number) => {
  // 复制逻辑已移到 SecureFieldView 组件内部
  console.log("Content copied:", content, "for row:", rowId)
}

const normalizeResourceRow = (row: any) => ({ ...row, data: row })

const handlePreview = (_uploadFile: UploadUserFile) => {}

onMounted(() => {
  listGlobalSearchData(inputSearch.value)
})
</script>

<style scoped lang="scss">
.search-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: min(520px, 42vw);
}

.search-header-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    height: 36px;
    border-radius: 8px;
    box-shadow: 0 0 0 1px #d8e0ea inset;
  }
}

.search-header-button {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  font-weight: 600;
}

.no-results {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-results-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.search-tabs {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 18px;
}

.search-result-page {
  :deep(.custom-tabs) {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  :deep(.tabs-header) {
    min-height: 36px;
    overflow-x: auto;
    background: #f8fafc;
  }

  :deep(.tab-item) {
    flex: 1;
    min-width: 0;
    min-height: 36px;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 700;
  }

  :deep(.tabs-content) {
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    margin: 0;
    padding: 12px;
  }

  :deep(.manager-content) {
    min-height: 0;
  }

  :deep(.content-card) {
    border-radius: 8px;
    box-shadow: none;
  }

  :deep(.action-buttons) {
    justify-content: center;
  }
}

.search-table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  width: 100%;
  text-align: center;
}

// 字段内容样式
.highlight-text {
  font-weight: 500;

  &:hover {
    background: #fff3cd;
    padding: 2px 4px;
    border-radius: 4px;
  }
}

.field-content {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #606266;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-files-tag {
  font-style: italic;
  opacity: 0.8;
}
</style>
