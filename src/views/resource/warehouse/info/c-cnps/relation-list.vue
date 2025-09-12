<template>
  <!-- 头部区域 -->
  <ManagerHeader
    title="关联管理"
    subtitle="管理资源之间的关联关系"
    add-button-text="新增关联"
    @add="handlerDrawerVisible"
    @refresh="listRelatedAssetsData"
  >
    <template #actions>
      <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerDrawerVisible">
        新增关联
      </el-button>
      <el-tooltip content="刷新数据">
        <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="listRelatedAssetsData" />
      </el-tooltip>
    </template>
  </ManagerHeader>
  <!-- 关联列表内容 - 左右布局 -->
  <div class="relation-layout">
    <!-- 左侧关联类型列表 -->
    <div class="relation-sidebar">
      <div class="sidebar-header">
        <h3>关联类型</h3>
      </div>
      <div class="relation-list">
        <div v-if="assetsData && assetsData.length > 0">
          <div
            v-for="(item, index) in assetsData"
            :key="index"
            class="relation-item"
            :class="{ active: activeRelationName === item.relation_name }"
            @click="selectRelation(item.relation_name)"
          >
            <div class="relation-info">
              <span class="relation-name">{{ displayMap.get(item.relation_name) }}</span>
            </div>
            <div class="relation-right">
              <span class="relation-count">{{ item.total }}</span>
              <el-icon class="relation-arrow">
                <ArrowRight />
              </el-icon>
            </div>
          </div>
        </div>
        <div v-else class="empty-relation">
          <el-empty description="暂无关联类型" :image-size="80">
            <template #image>
              <el-icon size="60" color="#c0c4cc">
                <Connection />
              </el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 右侧资源表格 -->
    <div class="relation-main">
      <div v-if="activeRelationName" class="table-container">
        <div class="table-header">
          <h3>{{ displayMap.get(activeRelationName) }}</h3>
          <div class="header-right">
            <span class="resource-count">共 {{ getActiveRelationData()?.total || 0 }} 个资源</span>
          </div>
        </div>
        <DataTable
          :data="getActiveRelationData()?.resources || []"
          :columns="getResourceTableColumns()"
          :actions="getResourceTableActions()"
          :table-props="{ border: true }"
          @action="handleResourceTableAction"
        >
          <!-- 安全字段和链接字段插槽 -->
          <template
            v-for="field in attributeFieldsData
              .filter((f) => f.display === true)
              .sort((a, b) => (a.index || 100) - (b.index || 100))"
            :key="`field-${field.id}`"
            #[field.field_uid]="{ row }"
          >
            <template v-if="field.secure">
              <el-button
                v-if="!secureDisplay.get(row.id)"
                type="primary"
                size="small"
                @click="handleSecureClick(row, field)"
              >
                查看
              </el-button>
              <div v-if="secureDisplay.get(row.id)">
                {{ row.data[field.field_uid] }}
              </div>
            </template>
            <template v-else-if="field.link">
              <el-button type="text" @click="openNewPage(row.data[field.field_uid])">
                {{ row.data[field.field_uid] }}
              </el-button>
            </template>
            <template v-else>
              {{ parseFieldValue(field, row.data[field.field_uid]) }}
            </template>
          </template>
        </DataTable>
      </div>
      <div v-else class="empty-state">
        <el-empty description="请选择关联类型查看资源" :image-size="100">
          <template #image>
            <el-icon size="80" color="#c0c4cc">
              <ArrowRight />
            </el-icon>
          </template>
        </el-empty>
      </div>
    </div>
  </div>

  <!-- 新增关联抽屉 -->
  <Drawer
    v-model="drawerVisible"
    title="新增关联"
    subtitle="选择关联类型并添加资源关联"
    :header-icon="Link"
    size="35%"
    :show-footer="false"
    class="drawer-container"
  >
    <AddRelationDrawer
      :model-relation-data="modelRelationData"
      :relation-type-data="relationTypeData"
      :display-map="displayMap"
      :resource-id="resourceId"
      :model-uid="modelUid"
      :related-resource-ids="getRelatedResourceIds"
      @relation-created="handleRelationCreated"
    />
  </Drawer>
</template>

<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref, watch, nextTick } from "vue"
import {
  ListModelRelationApi,
  ListRelatedAssetsApi,
  ListRelationTypeApi,
  deleteResourceRelationApi
} from "@/api/relation"
import { type ModelRelation, type ListRelationTypeData, relatedAssetsData } from "@/api/relation/types/relation"
import { CirclePlus, RefreshRight, ArrowRight, Connection, Link } from "@element-plus/icons-vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { Drawer } from "@/common/components/Dialogs"
import { findSecureData, listResourceByIdsApi } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
import { Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { useModelStore } from "@/pinia/stores/model"
import { ElMessage, ElMessageBox } from "element-plus"
import AddRelationDrawer from "./components/AddRelationDrawer.vue"

const modelStore = useModelStore()
interface Props {
  modelUid: string
  resourceId: string
}
const props = defineProps<Props>()
const drawerVisible = ref<boolean>(false)

// 处理关联创建成功
const handleRelationCreated = () => {
  // 不自动关闭抽屉，让用户主动关闭
  listRelatedAssetsData()
}

// 打开抽屉
const handlerDrawerVisible = () => {
  drawerVisible.value = true
}

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

      nextTick(() => {
        // 获取模型 UID 对应的名称，前端展示
        modelStore.getByModelUids([
          ...new Set(modelRelationData.value.flatMap((item) => [item.source_model_uid, item.target_model_uid]))
        ])

        getRealtionTypeData()
      })
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

  modelRelationData.value.forEach((model) => {
    const relationInfo = relationTypeData.value.find((item) => model.relation_type_uid.toLowerCase().includes(item.uid))
    console.log("查询关联的类型信息", model.relation_name, relationInfo)
    const src: string = model.relation_name.split("_")[0]
    // 判断当前数据是正向还是反向
    if (src === props.modelUid) {
      model.display_label = relationInfo!.target_describe + "-" + model.target_model_uid
      setDisplayMap(model)
    } else {
      model.display_label = relationInfo!.source_describe + "-" + model.source_model_uid
      setDisplayMap(model)
    }
  })
}

const setDisplayMap = (model: ModelRelation) => {
  if (!model.display_label) {
    return
  }

  const separatorIndex = model.display_label.indexOf("-")
  const prefix = separatorIndex !== -1 ? model.display_label.substring(0, separatorIndex) : model.display_label

  // 提取 '-' 后的内容
  const suffix = separatorIndex !== -1 ? model.display_label.substring(separatorIndex + 1) : ""

  // 处理 suffix，确保调用 getModelName 时不返回 undefined
  const resolvedSuffix = suffix ? modelStore.getModelName(suffix) || suffix : ""

  // 拼接最终的 display 值
  const display = resolvedSuffix ? `${prefix}-${resolvedSuffix}` : prefix
  displayMap.set(model.relation_name, display as string)
}

/** 获取指定资产所关联的所有其他资产信息 */
const assetsData = ref<relatedAssetsData[]>()
const listRelatedAssetsData = async () => {
  await ListRelatedAssetsApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10)
  })
    .then(async ({ data }) => {
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

      // 只更新变更的数据
      if (changedAssets.length > 0) {
        await updateActivePanelData(changedAssets)
      }

      // 如果没有选中的关联类型，自动选择第一个
      if (!activeRelationName.value && assetsData.value && assetsData.value.length > 0) {
        selectRelation(assetsData.value[0].relation_name)
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
  // 如果当前选中的关联类型在变更数据中，则更新其数据
  if (activeRelationName.value) {
    const activeItem = changedAssetsData.find((item) => item.relation_name === activeRelationName.value)
    if (activeItem) {
      await listResourceByIds(activeItem.model_uid, activeItem.resource_ids)
    }
  }
}

// ** 根据 ids 获取资产信息*/
// const resourcesByIdsData = ref<Resource[]>([])
const listResourceByIds = async (modelUid: string, resourceIds: number[]) => {
  // 先处理排序字段
  const displayFileds = await sortFields()

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
const sortFields = async () => {
  const displayFileds = ref<Attribute[]>([])
  // 这里需要根据实际需求实现字段排序逻辑
  // 暂时返回空数组，因为字段数据现在在子组件中管理
  return displayFileds
}

// ** 打开折叠面板
const activeRelationName = ref<string>("")

// 获取属性字段数据
const attributeFieldsData = ref<Attribute[]>([])
const listAttributeFields = async (modelUid: string) => {
  await ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFieldsData.value = data.attribute_fields
    })
    .catch((error) => {
      console.log("获取属性字段失败", error)
      attributeFieldsData.value = []
    })
}

// 选择关联类型
const selectRelation = (relationName: string) => {
  activeRelationName.value = relationName
  // 加载对应的资源数据
  const relationItem = assetsData.value?.find((item) => item.relation_name === relationName)
  if (relationItem) {
    // 获取属性字段数据
    listAttributeFields(relationItem.model_uid)
    // 加载资源数据
    listResourceByIds(relationItem.model_uid, relationItem.resource_ids)
  }
}

// 获取当前选中的关联数据
const getActiveRelationData = () => {
  return assetsData.value?.find((item) => item.relation_name === activeRelationName.value)
}

// 获取当前选中关联类型的已关联资源ID列表
const getRelatedResourceIds = computed(() => {
  const activeData = getActiveRelationData()
  if (!activeData?.resources) return []
  return activeData.resources.map((resource: any) => resource.id)
})

// 解析字段值，将 UID 转换为显示名称
const parseFieldValue = (field: any, value: any) => {
  if (!value) return "暂无数据"

  // 如果是安全字段或链接字段，直接返回原值
  if (field.secure || field.link) {
    return value
  }

  // 根据字段类型判断是否需要解析 UID
  switch (field.field_type) {
    case "relation":
    case "foreign_key":
      // 关联字段，尝试解析为模型名称
      return modelStore.getModelName(value) || value
    case "select":
    case "list":
      // 选择字段，如果 option 是数组，尝试匹配
      if (Array.isArray(field.option)) {
        const option = field.option.find((opt: any) => opt.value === value || opt.id === value)
        return option ? option.label || option.name || option.value : value
      }
      return value
    default:
      // 其他类型直接返回原值
      return value
  }
}

// 生成资源表格列配置
const getResourceTableColumns = () => {
  if (!attributeFieldsData.value || attributeFieldsData.value.length === 0) return []

  // 过滤出需要显示的字段
  const displayFields = attributeFieldsData.value
    .filter((field) => field.display === true)
    .sort((a, b) => (a.index || 100) - (b.index || 100))

  return displayFields.map((field: any) => ({
    prop: `data.${field.field_uid}`,
    label: field.field_name,
    align: "center" as const,
    slot: field.secure || field.link ? field.field_uid : undefined,
    showOverflowTooltip: true,
    formatter: (row: any) => {
      // 使用解析函数处理字段值
      return parseFieldValue(field, row.data[field.field_uid])
    }
  }))
}

// 生成资源表格操作配置
const getResourceTableActions = () => {
  return [
    {
      key: "delete",
      label: "取消关联",
      type: "primary" as const,
      plain: true,
      size: "small" as const
    }
  ]
}

// 删除关联
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
      listRelatedAssetsData()
    })
  })
}

// 处理资源表格操作
const handleResourceTableAction = (key: string, row: any) => {
  if (key === "delete") {
    handlerDeleteRealtion(activeRelationName.value, row)
  }
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
    console.log("变化了么")
    reverseDisplayLabel()
    listRelatedAssetsData()
  }
})

// watchEffect((onInvalidate) => {
</script>

<style scoped>
/* 左右布局 */
.relation-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  min-height: 600px;
  margin-top: 16px;
}

/* 左侧关联类型列表 */
.relation-sidebar {
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 20px 24px;
    border-bottom: 1px solid #e4e7ed;
    background: #f5f7fa;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .relation-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;

    .relation-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      position: relative;

      &:hover {
        background: rgba(64, 158, 255, 0.05);
        border-left-color: #409eff;
      }

      &.active {
        background: #e6f7ff;
        border-left-color: #409eff;

        &::after {
          content: "";
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid #409eff;
          border-top: 6px solid transparent;
          border-bottom: 6px solid transparent;
        }

        .relation-name {
          color: #409eff;
          font-weight: 600;
        }

        .relation-arrow {
          color: #409eff;
        }
      }

      .relation-info {
        flex: 1;
        display: flex;
        align-items: center;

        .relation-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          transition: color 0.2s ease;
          line-height: 1.4;
        }
      }

      .relation-right {
        display: flex;
        align-items: center;
        gap: 8px;

        .relation-count {
          font-size: 12px;
          color: #606266;
          background: #e8f4fd;
          padding: 4px 8px;
          border-radius: 12px;
          white-space: nowrap;
          font-weight: 500;
          border: 1px solid #d1e7ff;
        }

        .relation-arrow {
          color: #c0c4cc;
          font-size: 12px;
          transition: color 0.2s ease;
        }
      }

      &:hover .relation-arrow {
        color: #409eff;
      }
    }

    .empty-relation {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      padding: 20px;
    }
  }
}

/* 右侧资源表格 */
.relation-main {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .table-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .table-header {
      padding: 16px 0;
      border-bottom: 1px solid #e4e7ed;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 16px;
      border-radius: 8px;
      padding: 16px 20px;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        flex: 1;
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }

      .resource-count {
        font-size: 14px;
        color: #606266;
        background: #e8f4fd;
        padding: 4px 12px;
        border-radius: 16px;
        white-space: nowrap;
        font-weight: 500;
        border: 1px solid #d1e7ff;
      }
    }

    .relation-table {
      flex: 1;
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafbfc;
    padding: 40px 20px;
  }
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
