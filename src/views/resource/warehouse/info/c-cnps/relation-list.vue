<template>
  <div>
    <el-button type="primary" :icon="CirclePlus" @click="handlerDrawerVisible">新增关联</el-button>
  </div>
  <div>
    <el-collapse accordion>
      <el-collapse-item title="反馈 Feedback">
        <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
        <div>页面反馈：操作后，通过页面元素的变化清晰地展现当前状态。</div>
      </el-collapse-item>
      <el-collapse-item title="反馈 Feedback">
        <div>控制反馈：通过界面样式和交互动效让用户可以清晰的感知自己的操作；</div>
        <div>页面反馈：操作后，通过页面元素的变化清晰地展现当前状态。</div>
      </el-collapse-item>
      <el-collapse-item title="效率 Efficiency">
        <div>简化流程：设计简洁直观的操作流程；</div>
        <div>清晰明确：语言表达清晰且表意明确，让用户快速理解进而作出决策；</div>
        <div>帮助用户识别：界面简单直白，让用户快速识别而非回忆，减少用户记忆负担。</div>
      </el-collapse-item>
      <el-collapse-item title="可控 Controllability">
        <div>用户决策：根据场景可给予用户操作建议或安全提示，但不能代替用户进行决策；</div>
        <div>结果可控：用户可以自由的进行操作，包括撤销、回退和终止当前操作等。</div>
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
            :label="item.display_label"
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
import { computed, onMounted, ref, watch, h } from "vue"
import { CreateResourceRelationApi, ListModelRelationApi, ListRelationTypeApi } from "@/api/relation"
import { type ModelRelation, type ListRelationTypeData } from "@/api/relation/types/relation"
import { CirclePlus } from "@element-plus/icons-vue"
import { canBeRelatedResourceApi } from "@/api/resource"
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
  reverseDisplayLabel()
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

// 转换关联名称前端进行展示、并后端获取字段信息
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
      listAttributeFields(model.target_model_uid)
    } else {
      model.display_label = relationInfo!.source_describe + "-" + model.source_model_uid
      relationName.value = model.display_label
      listAttributeFields(model.source_model_uid)
    }
  })
}

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const listResourceByModelUid = (value: string) => {
  // 判断是否需要 filter 过滤条件
  relationName.value = value
  canBeRelatedResourceApi({
    model_uid: props.modelUid,
    resource_id: parseInt(props.resourceId, 10),
    relation_name: value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      resourcesData.value = data.resources
      paginationData.total = data.total
    })
    .catch((error) => {
      console.log(error)
    })
    .finally(() => {})
}

// ** 获取资产字段信息 */
const attributeFiledsData = ref<Attribute[]>([])
const listAttributeFields = (modelUid: string) => {
  ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

const handlerCreateRealtion = (row: Resource) => {
  console.log("啦啦啦", relationName.value)
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

onMounted(() => {
  listModelRelationData()
})

// 观察 modelRelationData 和 relationTypeData 的变化
// watch([modelRelationData, relationTypeData], ([newModelRelations, newRelationTypes]) => {
//   if (newModelRelations.length > 0 && newRelationTypes.length > 0) {
//     reverseDisplayLabel()
//   }
// })

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], () => {
  listResourceByModelUid(relationName.value)
})
</script>

<style scoped>
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
</style>
