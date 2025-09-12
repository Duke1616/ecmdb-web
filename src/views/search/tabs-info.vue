<template>
  <PageContainer>
    <ManagerHeader
      title="搜索结果"
      :subtitle="`找到 ${getTotalResults()} 条相关数据`"
      :show-back-button="true"
      :show-add-button="false"
      :show-refresh-button="false"
      @back="goBack"
    >
      <template #actions>
        <div class="elegant-search-container">
          <div class="search-card">
            <div class="search-input-group">
              <el-icon class="search-icon"><Search /></el-icon>
              <el-input
                v-model="inputSearch"
                placeholder="搜索资源..."
                size="large"
                clearable
                @keyup.enter="search"
                class="elegant-search-input"
              />
              <el-button type="primary" @click="search" class="elegant-search-button" :icon="Search" size="large">
                搜索
              </el-button>
            </div>
          </div>
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
            :table-props="{
              stripe: false,
              border: true,
              'header-cell-style': { background: '#F6F6F6', height: '10px', 'text-align': 'center' }
            }"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            >"
            <!-- 自定义列内容插槽 -->
            <template
              v-for="field in displayFileds.get(currentTabData?.model_uid) || []"
              :key="field.field_uid"
              #[`${field.field_uid}`]="{ row }"
            >
              <div v-if="field.secure">
                <!-- 安全字段优先处理 -->
                <el-button
                  v-if="!secureDisplay.get(row.id)"
                  type="primary"
                  size="small"
                  plain
                  :icon="View"
                  @click="handleSecureClick(row, field)"
                  class="secure-button"
                >
                  查看
                </el-button>
                <div v-if="secureDisplay.get(row.id)" class="secure-content">
                  {{ row[field.field_uid] }}
                </div>
              </div>

              <div v-else-if="field.field_type === 'file'">
                <!-- 文件类型字段 -->
                <div class="upload-container">
                  <el-popover
                    v-if="row[field.field_uid] !== undefined && row[field.field_uid].length > 0"
                    width="300px"
                    trigger="click"
                    placement="top"
                  >
                    <div class="upload-container">
                      <el-upload
                        v-model:file-list="row[field.field_uid]"
                        class="upload-file"
                        action="#"
                        multiple
                        show-file-list
                        :limit="5"
                        :disabled="true"
                        :on-exceed="handleExceed"
                        :on-preview="handlePreview"
                      />
                    </div>
                    <template #reference>
                      <el-button type="primary" size="small" plain :icon="Download" class="download-button">
                        下载 ({{ row[field.field_uid]?.length || 0 }})
                      </el-button>
                    </template>
                  </el-popover>
                  <el-tag v-else type="info" size="small" class="no-files-tag"> 暂无文件 </el-tag>
                </div>
              </div>

              <div v-else-if="field.field_type === 'string' || field.field_type === 'list'">
                <!-- 判断只有是文字类型的才会进行展示颜色检索 -->
                <span :style="{ color: textColor(row[field.field_uid]) }">
                  {{ row[field.field_uid] }}
                </span>
              </div>

              <div v-else>
                <!-- 其他类型字段 -->
                <span class="field-content">
                  {{ row[field.field_uid] }}
                </span>
              </div>
            </template>

            <!-- 操作列插槽 -->
            <template #actions="{ row }">
              <el-button type="primary" text size="small" @click="handlerDetailClick(row)">
                <el-icon><View /></el-icon>
                详情
              </el-button>
            </template>
          </DataTable>
        </template>
      </CustomTabs>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
import { h, onMounted, reactive, ref, computed } from "vue"
import { Search, View, Download } from "@element-plus/icons-vue"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { globalSearchData } from "@/api/resource/types/resource"
import { findSecureData, globalSearchApi } from "@/api/resource"
import { useRoute } from "vue-router"
import { Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { useSearchStore } from "@/pinia/stores/search"
import { useModelStore } from "@/pinia/stores/model"
import { useRouter } from "vue-router"
import { usePagination } from "@/common/composables/usePagination"
import { ElMessage, ElMessageBox, UploadProps } from "element-plus"
import { getMinioPresignedUrl } from "@/api/tools"
import { decodedUrlPath, getLocalMinioUrl } from "@/common/utils/url"

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
const getTableColumns = (modelUid: string) => {
  const fields = displayFileds.value.get(modelUid) || []
  const columns = [
    {
      prop: "id",
      label: "ID",
      width: 80,
      align: "center" as const
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
  router.push({
    path: "/cmdb/resource/info",
    query: { model_uid: row.model_uid, name: row.name, id: row.id }
  })
}

const secureDisplay = reactive(new Map())
const handleSecureClick = (row: any, item: Attribute) => {
  findSecureData({
    id: row.id,
    field_uid: item.field_uid
  })
    .then((data) => {
      row[item.field_uid] = data.data
      secureDisplay.set(row.id, true)
    })
    .catch(() => {
      ElMessage.error("获取数据失败")
    })
}

const handleExceed: UploadProps["onExceed"] = (files) => {
  ElMessage.warning(`限制最多上传 ${files.length} 个文件`)
}

// 下载文件
const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  ElMessageBox({
    title: "下载确认",
    message: h("p", null, [
      h("span", null, "正在下载文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认下载？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    if (uploadFile?.url === undefined) {
      return
    }

    getMinioPresignedUrl(decodedUrlPath(uploadFile.url)).then((res: any) => {
      window.location.href = getLocalMinioUrl(res.data)
    })
  })
}

onMounted(() => {
  listGlobalSearchData(inputSearch.value)
})
</script>

<style scoped lang="scss">
.elegant-search-container {
  display: flex;
  align-items: center;
  justify-content: center;

  .search-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    padding: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .search-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 8px;

      .search-icon {
        color: #64748b;
        font-size: 18px;
        margin-left: 6px;
        transition: color 0.3s ease;
      }

      .elegant-search-input {
        flex: 1;
        min-width: 240px;

        :deep(.el-input__wrapper) {
          border: none;
          box-shadow: none;
          background: transparent;
          padding: 0;
          border-radius: 0;

          &:hover,
          &.is-focus {
            box-shadow: none;
            border: none;
          }

          .el-input__inner {
            font-size: 14px;
            color: #1e293b;
            font-weight: 500;

            &::placeholder {
              color: #94a3b8;
              font-weight: 400;
            }
          }
        }
      }

      .elegant-search-button {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border: none;
        border-radius: 10px;
        padding: 10px 20px;
        font-weight: 600;
        font-size: 13px;
        color: white;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
          background: linear-gradient(135deg, #5b5bd6 0%, #7c3aed 100%);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
      }
    }
  }
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
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin-bottom: 18px;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  color: #606266;
}

.secure-content {
  color: #67c23a;
  font-weight: 500;
}

.download-button {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
  }
}

.no-files-tag {
  font-style: italic;
  opacity: 0.8;
}

.upload-container {
  :deep(.el-upload) {
    display: none;
  }

  :deep(.el-upload-list__item) {
    transition: none !important;
  }
}

.file-preview {
  :deep(.el-upload) {
    display: none;
  }

  :deep(.el-upload-list__item) {
    transition: none !important;
  }
}
</style>
