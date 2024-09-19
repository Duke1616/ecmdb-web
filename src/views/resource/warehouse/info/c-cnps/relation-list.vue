<template>
  <div class="toolbar-wrapper">
    <div>
      <el-button type="primary" :icon="CirclePlus" @click="handlerDrawerVisible">新增关联</el-button>
      <el-button type="primary" :icon="CirclePlus" @click="handlerExpandAll">{{
        allPanelsExpanded ? "折叠所有" : "展开所有"
      }}</el-button>
    </div>
    <div>
      <el-tooltip content="刷新当前页">
        <el-button type="primary" :icon="RefreshRight" circle @click="listRelatedAssetsData" />
      </el-tooltip>
    </div>
  </div>
  <div>
    <el-collapse v-for="(item, index) in assetsData" :key="index" v-model="activeNames">
      <el-collapse-item :name="item.relation_name">
        <template #title>
          <span class="collapse-title">{{ displayMap.get(item.relation_name) }} ({{ item.total }})</span>
        </template>
        <el-table border :data="item.resources">
          <el-table-column
            v-for="field in item.display_field"
            :key="field.id"
            :prop="`data.${field.field_uid}`"
            :label="field.field_name"
            align="center"
          >
            <template #default="scope">
              <template v-if="field.secure">
                <el-button
                  v-if="!secureDisplay.get(scope.row.id)"
                  type="primary"
                  size="small"
                  @click="handleSecureClick(scope.row, field)"
                >
                  查看
                </el-button>
                <div v-if="secureDisplay.get(scope.row.id)">
                  {{ scope.row.data[field.field_uid] }}
                </div>
              </template>
              <template v-else-if="field.link">
                <el-button type="text" @click="openNewPage(scope.row.data[field.field_uid])">
                  {{ scope.row.data[field.field_uid] }}
                </el-button>
              </template>
              <template v-else>
                {{ scope.row.data[field.field_uid] }}
              </template>
            </template>
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button
                type="primary"
                text
                bg
                size="small"
                @click="handlerDeleteRealtion(item.relation_name, scope.row)"
              >
                取消关联
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-collapse-item>
    </el-collapse>
  </div>

  <el-drawer class="drawer-container" v-model="drawerVisible" title="新增关联" size="40%">
    <el-form>
      <el-form-item label="关联列表">
        <el-select v-model="relationName" placeholder="关联模型" style="width: 42%" @change="handlerChangeRelationList">
          <el-option
            v-for="item in modelRelationData"
            :key="item.id"
            :label="displayMap.get(item.relation_name)"
            :value="item.relation_name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="条件筛选" class="form-item-content">
        <el-select v-model="fieldName" class="field-name" placeholder="字段名称" @change="handleFieldName">
          <el-option
            v-for="item in attributeFiledsData"
            :key="item.id"
            :label="item.field_name"
            :value="item.field_uid"
          />
        </el-select>
        <el-select v-model="condition" class="condition" placeholder="条件" @change="handleCondition">
          <el-option v-for="item in options" :key="item.label" :label="item.label" :value="item.value" />
        </el-select>
        <el-input class="input-content" clearable v-model="inputSearch" placeholder="请输入搜索内容" />
        <el-button class="search-button" type="primary" @click="handlerFilterSearchClick()">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table border :data="resourcesData">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column
        v-for="item in visibleColumns"
        :key="item.id"
        :prop="`data.${item.field_uid}`"
        :label="item.field_name"
        align="center"
      />
      <el-table-column fixed="right" label="操作" width="150" align="center">
        <template #default="scope">
          <el-button type="primary" text bg size="small" @click="handlerCreateRealtion(scope.row)">关联</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pager-wrapper">
      <el-pagination
        background
        :layout="paginationData.layout"
        :page-sizes="paginationData.pageSizes"
        :total="paginationData.total"
        :page-size="paginationData.pageSize"
        :currentPage="paginationData.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref, watch } from "vue"
import {
  CreateResourceRelationApi,
  ListModelRelationApi,
  ListRelatedAssetsApi,
  ListRelationTypeApi,
  deleteResourceRelationApi
} from "@/api/relation"
import { type ModelRelation, type ListRelationTypeData, relatedAssetsData } from "@/api/relation/types/relation"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { canBeRelatedFilterResourceApi, findSecureData, listResourceByIdsApi } from "@/api/resource"
import { canBeRelationFilterReq, type Resource } from "@/api/resource/types/resource"
import { usePagination } from "@/hooks/usePagination"
import { Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { ElMessage, ElMessageBox } from "element-plus"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
interface Props {
  modelUid: string
  resourceId: string
}
const props = defineProps<Props>()
const drawerVisible = ref<boolean>(false)

// ** 新建抽屉，第一次打开，初始化数据 */
const firstRelationName = ref<string>("")
const handlerDrawerVisible = () => {
  drawerVisible.value = true
  canBeRelatedFilterResource(firstRelationName.value)
}

// 新增关联 selected 信息
const relationName = ref<string>("")
const fieldName = ref<string>("name")
const condition = ref<string>("contains")
const inputSearch = ref<string>("")

// 计算出需要展示的字段
const dynamicDisplayColumns = ref<string>("")
const handleFieldName = (value: string) => {
  dynamicDisplayColumns.value = value
}

const visibleColumns = computed(() => {
  return attributeFiledsData.value.filter((item) => dynamicDisplayColumns.value.includes(item.field_uid))
})

const handleCondition = () => {}
const options = [
  {
    label: "包含",
    value: "contains"
  },
  {
    label: "等于",
    value: "equal"
  },
  {
    label: "不等于",
    value: "not_equal"
  }
]

// ** 获取模型关联类型 */
const relationTypeData = ref<ListRelationTypeData[]>([])
const getRealtionTypeData = () => {
  ListRelationTypeApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      relationTypeData.value = data.relation_types
      console.log("关联关系", relationTypeData.value)
    })
    .catch(() => {
      relationTypeData.value = []
    })
    .finally(() => {})
}

// 跳转外部
const openNewPage = (url: string) => {
  window.open(url, "_blank")
}

// ** 获取模型关联列表 */
const modelRelationData = ref<ModelRelation[]>([])
const listModelRelationData = () => {
  ListModelRelationApi({
    offset: 0,
    limit: 100,
    model_uid: props.modelUid
  })
    .then(({ data }) => {
      modelRelationData.value = data.model_relations
      console.log("模型数据", modelRelationData.value)
      getRealtionTypeData()
    })
    .catch((error) => {
      modelRelationData.value = []
      console.log("cache", error)
    })
    .finally(() => {})
}

// 转换关联名称前端进行展示、并后端获取字段信息
const displayMap: Map<string, string> = new Map<string, string>()
const reverseDisplayLabel = () => {
  // 检查 modelRelationData 是否为空
  if (!modelRelationData.value || modelRelationData.value.length === 0) {
    console.log("modelRelationData 为空，不执行 reverseDisplayLabel")
    return // 模型关联数据为空，不执行后续操作
  }

  firstRelationName.value = modelRelationData.value[0].relation_name
  modelRelationData.value.forEach((model) => {
    const relationInfo = relationTypeData.value.find((item) => model.relation_type_uid.toLowerCase().includes(item.uid))
    console.log("查询关联的类型信息", model.relation_name, relationInfo)
    const src: string = model.relation_name.split("_")[0]
    // 判断当前数据是正向还是反向
    if (src === props.modelUid) {
      model.display_label = relationInfo!.target_describe + "-" + model.target_model_uid
      relationName.value = model.display_label
      displayMap.set(model.relation_name, model.display_label)
    } else {
      model.display_label = relationInfo!.source_describe + "-" + model.source_model_uid
      relationName.value = model.display_label
      displayMap.set(model.relation_name, model.display_label)
    }
  })
}

const handlerChangeRelationList = (value: string) => {
  fieldName.value = "name"
  inputSearch.value = ""
  isFilter.value = false
  canBeRelatedFilterResource(value)
}

const isFilter = ref<boolean>(false)
const handlerFilterSearchClick = () => {
  isFilter.value = true
  canBeRelatedFilterResource(relationName.value)
}

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const canBeRelatedFilterResource = async (value: string) => {
  relationName.value = value
  const requestOptions: canBeRelationFilterReq = {
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10),
    relation_name: value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  }

  if (inputSearch.value && isFilter.value === true) {
    requestOptions.filter_name = fieldName.value
    requestOptions.filter_condition = condition.value
    requestOptions.filter_input = inputSearch.value
  }

  canBeRelatedFilterResourceApi(requestOptions)
    .then(async ({ data }) => {
      // TODO 当关联成功，重新请求避免多次调用获取模型字段接口
      const src: string = value.split("_")[0]
      // 判断当前数据是正向还是反向
      if (src === props.modelUid) {
        await listAttributeFields(value.split("_")[2])
      } else {
        await listAttributeFields(src)
      }

      handleFieldName(fieldName.value)
      resourcesData.value = data.resources
      paginationData.total = data.total
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

/** 获取指定资产所关联的所有其他资产信息 */
const assetsData = ref<relatedAssetsData[]>()
const listRelatedAssetsData = async () => {
  await ListRelatedAssetsApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10)
  })
    .then(async ({ data }) => {
      console.log("old-assetsData", assetsData.value)
      const newAssetsData = data
      let changedAssets = []
      if (!assetsData.value) {
        // 如果 assetsData.value 为空，则直接将新数据赋值给它
        assetsData.value = data
        changedAssets = data
      } else {
        // 合并新数据到 assetsData
        const { mergedData, changedData } = mergeAndTrackChanges(assetsData.value, newAssetsData)
        assetsData.value = mergedData
        changedAssets = changedData
      }
      console.log("new-assetsData", assetsData.value)

      // 只更新变更的数据
      if (changedAssets.length > 0) {
        await updateActivePanelData(changedAssets)
      }
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

const mergeAndTrackChanges = (existingData: relatedAssetsData[], newData: relatedAssetsData[]) => {
  const mergedData: relatedAssetsData[] = []
  const changedData: relatedAssetsData[] = []

  // 创建一个集合，用于快速查找 newData 中是否存在某个 relation_name
  const newDataRelationNames = new Set(newData.map((item) => item.relation_name))

  // 遍历 existingData，将仍然存在于 newData 中的项加入 mergedData 中
  existingData.forEach((existingItem) => {
    const newItem = newData.find((item) => item.relation_name === existingItem.relation_name)
    if (newItem) {
      if (!isSame(existingItem.resource_ids, newItem.resource_ids)) {
        changedData.push(newItem)
      }
      mergedData.push({ ...existingItem, ...newItem })
    } else {
      // 如果 existingItem 不在 newData 中，则表示该项被删除，需要记录变更
      changedData.push({ ...existingItem })
    }
  })

  // 遍历 newData，添加新出现的项到 mergedData 中
  newData.forEach((newItem) => {
    if (!existingData.some((item) => item.relation_name === newItem.relation_name)) {
      mergedData.push(newItem)
      changedData.push(newItem)
    }
  })

  // 过滤 mergedData，删除那些不在 newData 中的项
  const filteredMergedData = mergedData.filter((item) => newDataRelationNames.has(item.relation_name))

  return { mergedData: filteredMergedData, changedData }
}

// 辅助函数，用于比较两个对象是否相同
const isSame = (a: number[], b: number[]) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

const updateActivePanelData = async (changedAssetsData: relatedAssetsData[]) => {
  console.log("activeNames", activeNames.value)
  const activeNamesToUpdate = activeNames.value.filter((activeName) =>
    changedAssetsData.some((newItem) => newItem.relation_name === activeName)
  )

  console.log("activeNamesToUpdate", activeNamesToUpdate)
  for (const activeName of activeNamesToUpdate) {
    const activeItem = changedAssetsData.find((item) => item.relation_name === activeName)
    if (activeItem) {
      await listResourceByIds(activeItem.model_uid, activeItem.resource_ids)
    }
  }
}

// ** 根据 ids 获取资产信息*/
// const resourcesByIdsData = ref<Resource[]>([])
const listResourceByIds = async (modelUid: string, resourceIds: number[]) => {
  // 先处理排序字段
  const displayFileds = await sortFields(modelUid)

  await listResourceByIdsApi(modelUid, resourceIds)
    .then(({ data }) => {
      assetsData.value!.forEach((item) => {
        if (item.model_uid === modelUid) {
          item.resources = data.resources
          item.display_field = displayFileds.value
        }
      })

      console.log(assetsData.value)
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

// ** 过滤展示字段，并排序 */
const sortFields = async (modelUid: string) => {
  const displayFileds = ref<Attribute[]>([])
  await listAttributeFields(modelUid)
  console.log("返回结果", attributeFiledsData.value)
  displayFileds.value = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })

  return displayFileds
}
// ** 获取资产字段信息 */
const attributeFiledsData = ref<Attribute[]>([])
const listAttributeFields = async (modelUid: string) => {
  console.log("modelUid-Attribute", modelUid)
  await ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields

      console.log("attribute result", attributeFiledsData.value)
    })
    .catch((error) => {
      console.log("报错", error)
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

// 新增关联关系
const handlerCreateRealtion = (row: Resource) => {
  ElMessageBox({
    title: "关联确认",
    message: h("p", null, [
      h("span", null, "正在关联数据名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认关联？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    const src = relationName.value.split("_")[0]
    let src_resource_id = parseInt(props.resourceId, 10)
    let dst_resource_id = row.id

    if (src === row.model_uid) {
      src_resource_id = row.id
      dst_resource_id = parseInt(props.resourceId, 10)
    }

    CreateResourceRelationApi({
      source_resource_id: src_resource_id,
      target_resource_id: dst_resource_id,
      relation_name: relationName.value
    }).then(() => {
      ElMessage.success("关联成功")
      canBeRelatedFilterResource(relationName.value)

      // 判断是否存在折叠面板是否打开，如果打开，则更新数据、或者手动写入数据
      listRelatedAssetsData()

      console.log("assetsData", assetsData.value)
    })
  })
}

// 删除关联 deleteResourceRelationApi
const handlerDeleteRealtion = (relationName: string, row: Resource) => {
  ElMessageBox({
    title: "取消关联",
    message: h("p", null, [
      h("span", null, "正在删除关联数据名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认取消？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteResourceRelationApi({
      resource_id: row.id,
      relation_name: relationName,
      model_uid: row.model_uid
    }).then(() => {
      console.log("删除信息", relationName, row)
      ElMessage.success("删除成功")
      // deleteAssetResource(row.id)
      listRelatedAssetsData()
    })
  })
}

// ** 打开折叠面板
const allPanelsExpanded = ref(false)
const activeNames = ref<string[]>([])
const handlerExpandAll = () => {
  if (allPanelsExpanded.value) {
    activeNames.value = []
  } else {
    activeNames.value = assetsData.value!.map((item) => item.relation_name)
  }
  allPanelsExpanded.value = !allPanelsExpanded.value
}

const secureDisplay = reactive(new Map())
const handleSecureClick = (row: Resource, item: Attribute) => {
  findSecureData({
    id: row.id,
    field_uid: item.field_uid
  }).then((data) => {
    row.data[item.field_uid] = data.data
    secureDisplay.set(row.id, true)
  })
}

onMounted(() => {
  listModelRelationData()
})

// 观察 modelRelationData 和 relationTypeData 的变化
watch([modelRelationData, relationTypeData], ([newModelRelations, newRelationTypes]) => {
  if (newModelRelations.length > 0 && newRelationTypes.length > 0) {
    reverseDisplayLabel()
    listRelatedAssetsData()
  }
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  canBeRelatedFilterResource(relationName.value)
})

// watchEffect((onInvalidate) => {
watch(
  () => activeNames.value,
  (newActiveNames, oldActiveNames) => {
    if (newActiveNames.length !== assetsData.value!.length) {
      allPanelsExpanded.value = false
    } else {
      allPanelsExpanded.value = true
    }
    if (allPanelsExpanded.value) {
      // 如果 allPanelsExpanded 为 true，则更新所有面板

      assetsData.value!.forEach((item) => {
        if (!oldActiveNames.includes(item.relation_name)) {
          listResourceByIds(item.model_uid, item.resource_ids)
        }
      })
    } else {
      allPanelsExpanded.value = false
      // 否则只处理新激活的面板
      const newlyActivated = newActiveNames.filter((name) => !oldActiveNames.includes(name))
      console.log("newlyActivated", newlyActivated)
      if (newlyActivated.length > 0) {
        const activeName = newlyActivated[0] // 只处理第一个新激活的面板
        console.log("当前点击的面板", activeName)

        const activeItem = assetsData.value!.find((item) => item.relation_name === activeName)
        if (activeItem) {
          listResourceByIds(activeItem.model_uid, activeItem.resource_ids)
        }
      }
    }
  }
)
</script>

<style scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 14px;
}

.form-item-content {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.field-name,
.condition,
.input-content,
.search-button {
  margin-right: 2%; /* 调整间距 */
}

.field-name,
.condition {
  width: 20%;
}

.input-content {
  width: 40%;
}

.search-button {
  width: 14%;
  margin-right: 0; /* 最后一个元素不需要右间距 */
}

:deep(.el-collapse-item__header) {
  text-align: left;
}

.collapse-title {
  flex: 1 0 90%;
  order: 1;
}

:deep(.el-collapse) {
  margin-bottom: 8px;
}

:deep(.el-collapse:last-child) {
  margin-bottom: 0;
}
</style>
