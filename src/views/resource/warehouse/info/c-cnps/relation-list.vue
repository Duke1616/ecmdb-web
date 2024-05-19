<template>
  <div class="relation-button">
    <el-button type="primary" :icon="CirclePlus" @click="handlerDrawerVisible">新增关联</el-button>
    <el-button type="primary" :icon="CirclePlus" @click="handlerExpandAll">{{
      allPanelsExpanded ? "折叠所有" : "展开所有"
    }}</el-button>
  </div>
  <div>
    <el-collapse v-for="(item, index) in assetsData" :key="index" v-model="activeNames">
      <el-collapse-item :name="item.relation_name">
        <template #title>
          <span class="collapse-title">{{ displayMap.get(item.relation_name) }} ({{ item.total }})</span>
        </template>
        <el-table border :data="item.resources">
          <el-table-column prop="name" label="名称" align="left" />
          <el-table-column
            v-for="field in item.display_field"
            :key="field.id"
            :prop="`data.${field.field_uid}`"
            :label="field.field_name"
            align="left"
          />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handlerDeleteRealtion(scope.row)">
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
        <el-select v-model="relationName" placeholder="关联模型" style="width: 42%" @change="listResourceByModelUid">
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
        <el-input class="input-content" placeholder="请输入内容" />
        <el-button class="search-button" type="primary">搜索</el-button>
      </el-form-item>
    </el-form>
    <el-table border :data="resourcesData">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="name" label="名称" align="center" />
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
import { computed, onMounted, ref, watch, h, watchEffect } from "vue"
import {
  CreateResourceRelationApi,
  ListModelRelationApi,
  ListRelatedAssetsApi,
  ListRelationTypeApi,
  deleteResourceRelationApi
} from "@/api/relation"
import { type ModelRelation, type ListRelationTypeData, relatedAssetsData } from "@/api/relation/types/relation"
import { CirclePlus } from "@element-plus/icons-vue"
import { canBeRelatedResourceApi, listResourceByIdsApi } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
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
  // reverseDisplayLabel()
  drawerVisible.value = true
  listResourceByModelUid(firstRelationName.value)
}

// 新增关联 selected 信息
const relationName = ref<string>("")
const fieldName = ref<string>("名称")
const condition = ref<string>("包含")

// 计算出需要展示的字段
const dynamicDisplayColumns = ref<string>("")
const handleFieldName = (value: string) => {
  dynamicDisplayColumns.value = value
  console.log("dynamicDisplayColumns", dynamicDisplayColumns.value)
}
const visibleColumns = computed(() => {
  return attributeFiledsData.value.filter((item) => dynamicDisplayColumns.value.includes(item.field_uid))
})

const handleCondition = () => {}
const options = [
  {
    value: "包含",
    label: "包含"
  },
  {
    value: "等于",
    label: "等于"
  },
  {
    value: "不等于",
    label: "不等于"
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

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const listResourceByModelUid = (value: string) => {
  // 判断是否需要 filter 过滤条件
  // 创建关联时候需要传入的参数
  relationName.value = value
  canBeRelatedResourceApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10),
    relation_name: value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      const src: string = value.split("_")[0]
      // 判断当前数据是正向还是反向
      if (src === props.modelUid) {
        listAttributeFields(value.split("_")[2])
      } else {
        listAttributeFields(src)
      }
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
const listRelatedAssetsData = () => {
  ListRelatedAssetsApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10)
  })
    .then(({ data }) => {
      assetsData.value = data
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

// ** 根据 ids 获取资产信息*/
// const resourcesByIdsData = ref<Resource[]>([])
const listResourceByIds = async (modelUid: string, resourceIds: number[]) => {
  assetsData.value!.forEach(async (item) => {
    if (item.model_uid === modelUid) {
      await sortFields(modelUid)
      item.display_field = displayFileds.value
    }
  })

  listResourceByIdsApi(modelUid, resourceIds)
    .then(({ data }) => {
      assetsData.value!.forEach((item) => {
        if (item.model_uid === modelUid) {
          item.resources = data.resources
        }
      })
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

// ** 过滤展示字段，并排序 */
const displayFileds = ref<Attribute[]>([])
const sortFields = async (modelUid: string) => {
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
      listResourceByModelUid(relationName.value)
    })
  })
}

// 删除关联 deleteResourceRelationApi
const handlerDeleteRealtion = (row: Resource) => {
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
    deleteResourceRelationApi(row.id).then(() => {
      console.log(row)
      ElMessage.success("删除成功")
      deleteAssetResource(row.id)
    })
  })
}
const deleteAssetResource = (id: number) => {
  assetsData.value!.forEach((item) => {
    // 使用 filter 方法过滤掉指定 id 的资源
    item.resources = item.resources.filter((resource: any) => {
      return resource.id !== id
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

// const handleCollapseChange = (value: CollapseModelValue) => {
//   console.log("选择", value)
//   const activeName = Array.isArray(value) ? value[0] : value

//   console.log("选择", activeName)

//   const activeItem = assetsData.value!.find((item) => item.relation_name === activeName)
//   if (activeItem) {
//     listResourceByIds(activeItem.model_uid, activeItem.resource_ids)
//   }
// }

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
  listResourceByModelUid(relationName.value)
})

watchEffect((onInvalidate) => {
  // 处理折叠面板变化的逻辑
  const unwatch = watch(activeNames, (newActiveNames, oldActiveNames) => {
    // 找到新增的激活面板
    const newActiveName = newActiveNames.find((name) => !oldActiveNames.includes(name))
    if (newActiveName) {
      const activeItem = assetsData.value!.find((item) => item.relation_name === newActiveName)
      if (activeItem) {
        listResourceByIds(activeItem.model_uid, activeItem.resource_ids)
      }
    }
  })

  // 在下一次运行副作用之前调用
  onInvalidate(() => {
    unwatch()
  })
})
</script>

<style scoped>
.relation-button {
  margin-bottom: 12px;
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
