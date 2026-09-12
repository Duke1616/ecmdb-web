<template>
  <PageContainer class="global-search-page">
    <!-- 顶部统一管理头部 -->
    <ManagerHeader
      title="全局检索"
      :subtitle="headerSubtitle"
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="true"
      @back="handleGoBack"
      @refresh="handleRefresh"
    >
      <template #actions>
        <div class="search-header-actions">
          <el-input
            v-model="inputKeyword"
            placeholder="输入资产属性、名称或关键词检索..."
            clearable
            class="search-header-input"
            @keyup.enter="handleTriggerSearch"
          >
            <template #prefix>
              <el-icon class="search-input-icon"><Search /></el-icon>
            </template>
          </el-input>
          <el-button
            type="primary"
            class="search-header-button"
            :loading="structureLoading"
            :icon="Search"
            @click="handleTriggerSearch"
          >
            检索
          </el-button>
        </div>
      </template>
    </ManagerHeader>

    <!-- 主体区域：加载中 / 空结果 / 结果工作台 -->
    <div
      v-if="structureLoading"
      class="search-loading-container"
      v-loading="true"
      element-loading-text="正在全域聚合索引结构..."
    />

    <!-- 空结果引导 -->
    <SearchEmptyState v-else-if="isSearchResultEmpty" @reset="handleResetSearch" />

    <!-- 结果展示工作台 -->
    <div v-else class="search-workspace" :class="{ 'with-sidebar': showTenantSidebar }">
      <!-- 左侧多租户空间导航 -->
      <TenantSidebar
        v-if="showTenantSidebar"
        :tenants="filteredTenantList"
        :active-tenant-id="activeTenantId"
        :tenant-filter-type="tenantFilterType"
        :tenant-search-key="tenantSearchKey"
        :all-count="allTenantsTotalCount"
        :org-count="orgTenantsTotalCount"
        :personal-count="personalTenantsTotalCount"
        :has-organizations="!!adminStructure?.organizations?.length"
        :has-personals="!!adminStructure?.personals?.length"
        :get-display-name="getTenantDisplayName"
        @update:filter-type="(type: TenantFilterType) => (tenantFilterType = type)"
        @update:search-key="(key: string) => (tenantSearchKey = key)"
        @select="handleSelectTenant"
      />

      <!-- 右侧主资产展示区 -->
      <main class="results-main">
        <!-- 顶部模型 Tabs 胶囊栏 -->
        <ModelTabsBar
          :models="currentDisplayModels"
          :active-model-uid="activeModelUid"
          :get-display-name="getModelDisplayName"
          @select="handleSelectModel"
        />

        <!-- 模型资产物理分页表格 -->
        <ResourceTable
          :loading="resourceLoading"
          :rows="resourceRows"
          :columns="tableColumns"
          :display-fields="finalDisplayFields"
          :pagination="paginationData"
          :actions="tableActions"
          :is-value-matched="isValueMatched"
          @action="handleTableAction"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentPageChange"
          @secure-click="handleSecureClickProxy"
          @secure-display-change="handleSecureDisplayChange"
        />
      </main>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { Search } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { useSearchStore } from "@/pinia/stores/search"
import type { TenantFilterType } from "./types"
import { useSearchStructure } from "./composables/useSearchStructure"
import { usePagedResources } from "./composables/usePagedResources"
import TenantSidebar from "./components/TenantSidebar.vue"
import ModelTabsBar from "./components/ModelTabsBar.vue"
import ResourceTable from "./components/ResourceTable.vue"
import SearchEmptyState from "./components/SearchEmptyState.vue"

const router = useRouter()
const route = useRoute()
const searchStore = useSearchStore()

const inputKeyword = ref("")

// 阶段一：全域元数据结构与租户/模型导航状态
const {
  isSuperAdmin,
  structureLoading,
  currentSearchingKeyword,
  adminStructure,
  activeTenantId,
  activeModelUid,
  tenantFilterType,
  tenantSearchKey,
  filteredTenantList,
  allTenantsTotalCount,
  orgTenantsTotalCount,
  personalTenantsTotalCount,
  showTenantSidebar,
  currentDisplayModels,
  isSearchResultEmpty,
  headerSubtitle,
  getTenantDisplayName,
  getModelDisplayName,
  executeStructureSearch,
  selectTenant,
  selectModel,
  resetStructure
} = useSearchStructure()

// 阶段二：靶向单租户单模型真物理分页资产检索
const {
  resourceLoading,
  resourceRows,
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
} = usePagedResources()

/** 执行单模型资产真物理分页加载 */
const loadPagedResources = () => {
  const targetTenantId = isSuperAdmin.value && activeTenantId.value ? activeTenantId.value : undefined
  return fetchPagedResources({
    modelUid: activeModelUid.value,
    keyword: currentSearchingKeyword.value,
    tenantId: targetTenantId
  })
}

/** 触发全域检索入口 */
const handleTriggerSearch = async () => {
  const keyword = inputKeyword.value.trim()
  if (!keyword) {
    ElMessage.warning("请输入检索内容")
    return
  }

  searchStore.addHistorySearch(keyword)
  router.replace({
    path: "/cmdb/dashboard/search",
    query: { text: keyword }
  })

  // 执行阶段一全域检索，完成后若有匹配模型则直接发起阶段二明细拉取
  const result = await executeStructureSearch(keyword)
  if (result?.modelUid) {
    paginationData.currentPage = 1
    await loadPagedResources()
  } else {
    resetResources()
  }
}

/** 切换选中租户 */
const handleSelectTenant = (tenantId: number) => {
  selectTenant(tenantId)
  paginationData.currentPage = 1
  loadPagedResources()
}

/** 切换选中模型 Tab */
const handleSelectModel = (modelUid: string) => {
  selectModel(modelUid)
  paginationData.currentPage = 1
  loadPagedResources()
}

/** 分页事件响应 */
const handleCurrentPageChange = (page: number) => {
  handleCurrentChange(page)
  loadPagedResources()
}

const handlePageSizeChange = (size: number) => {
  handleSizeChange(size)
  paginationData.currentPage = 1
  loadPagedResources()
}

/** 敏感字段查看解密代理 */
const handleSecureClickProxy = (row: any, fieldUid: string) => {
  const targetTenantId = isSuperAdmin.value && activeTenantId.value ? activeTenantId.value : undefined
  handleSecureClick(row, fieldUid, targetTenantId)
}

/** 查看资产详情 (携带 tenant_id 实现跨空间详情透明穿透) */
const handleTableAction = (key: string, row: any) => {
  if (key === "detail") {
    const targetTenantId = isSuperAdmin.value && activeTenantId.value ? activeTenantId.value : undefined
    router.push({
      name: "AssetDetail",
      query: {
        model_uid: row.model_uid,
        name: row.name,
        id: row.id,
        tenant_id: targetTenantId
      }
    })
  }
}

/** 返回上一页 */
const handleGoBack = () => {
  router.push({ path: "/cmdb/dashboard" })
}

/** 刷新检索 */
const handleRefresh = () => {
  if (currentSearchingKeyword.value) {
    handleTriggerSearch()
  }
}

/** 清空重置全部状态 */
const handleResetSearch = () => {
  inputKeyword.value = ""
  resetStructure()
  resetResources()
}

// 监听路由参数与挂载加载
onMounted(() => {
  const initialText = (route.query.text as string) || ""
  if (initialText) {
    inputKeyword.value = initialText
    handleTriggerSearch()
  }
})

watch(
  () => route.query.text,
  (newText) => {
    if (newText && typeof newText === "string" && newText !== currentSearchingKeyword.value) {
      inputKeyword.value = newText
      handleTriggerSearch()
    }
  }
)
</script>

<style scoped lang="scss">
.global-search-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

// 头部搜索输入框与按钮
.search-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: min(540px, 45vw);
}

.search-header-input {
  flex: 1;

  :deep(.el-input__wrapper) {
    height: 38px;
    border-radius: 8px;
    background-color: #ffffff;
    box-shadow: 0 0 0 1px #cbd5e1 inset;
    transition: all 0.2s ease;

    &.is-focus {
      box-shadow: 0 0 0 2px #3b82f6 inset;
    }
  }

  .search-input-icon {
    font-size: 16px;
    color: #94a3b8;
  }
}

.search-header-button {
  height: 38px;
  padding: 0 18px;
  border-radius: 8px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

// 加载中状态
.search-loading-container {
  flex: 1;
  min-height: 260px;
  border-radius: 12px;
  background: #ffffff;
  margin: 0;
}

// 结果工作台布局
.search-workspace {
  flex: 1;
  display: flex;
  min-height: 0;
  margin: 0;
  gap: 14px;
  overflow: hidden;

  &.with-sidebar {
    grid-template-columns: 280px 1fr;
  }
}

// 右侧主展示区
.results-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  gap: 10px;
}
</style>
