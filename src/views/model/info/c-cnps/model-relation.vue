<template>
  <div class="app-container">
    <el-card v-loading="loading" shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="drawerVisible = true">新建关联</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="modelRelationData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="relation_name" label="唯一标识" align="center" />
          <el-table-column prop="source_model_uid" label="源模型" align="center">
            <template #default="scope">
              {{ modelMap.get(scope.row.source_model_uid) }}
            </template>
          </el-table-column>
          <el-table-column prop="target_model_uid" label="目标模型" align="center">
            <template #default="scope">
              {{ modelMap.get(scope.row.target_model_uid) }}
            </template>
          </el-table-column>
          <el-table-column prop="relation_type_uid" label="关联类型" align="center" />
          <el-table-column prop="mapping" label="源->目标约束" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
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
    </el-card>
    <!-- 新增关联 -->
    <el-drawer v-model="drawerVisible" title="新建关联" @closed="resetForm">
      <el-form :model="formData" size="large" label-width="auto" ref="formRef" :rules="formRules" label-position="top">
        <el-form-item label="源模型" prop="source_model_uid">
          <el-select v-model="formData.source_model_uid" placeholder="请输入源模型">
            <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
              <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="目标模型" prop="target_model_uid">
          <el-select v-model="formData.target_model_uid" placeholder="请输入目标模型">
            <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
              <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="关联类型" prop="relation_type_uid">
          <el-select v-model="formData.relation_type_uid" placeholder="请输入关联类型">
            <el-option
              v-for="item in relationTypeData"
              :key="item.id"
              :label="`${item.name}(${item.uid})`"
              :value="item.uid"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="源-目标约束" prop="mapping">
          <el-select v-model="formData.mapping" placeholder="请输入源-目标约束">
            <el-option v-for="item in mapping" :key="item.label" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联描述" prop="description">
          <el-input v-model="formData.description" type="textarea" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlerÇreate()"> 保存 </el-button>
          <el-button @click="drawerVisible = false">取消</el-button>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import {
  ListRelationTypeApi,
  CreateModelRelationApi,
  ListModelRelationApi,
  DeleteModelRelationApi
} from "@/api/relation"
import {
  type ListRelationTypeData,
  type CreateModelRelationReq,
  type ModelRelation
} from "@/api/relation/types/relation"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { usePagination } from "@/hooks/usePagination"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const modelData = useModelStore().modelsData

const modelMap: Map<string, string> = new Map<string, string>()
const reverseMap = () => {
  modelData.forEach((mg) => {
    if (Array.isArray(mg.models)) {
      mg.models.forEach((m) => {
        modelMap.set(m.uid, m.name)
      })
    }
  })
}

// 接收父组建传递
interface Props {
  modelUid: string
}
const props = defineProps<Props>()

const loading = ref<boolean>(false)
const DEFAULT_MODEL_RELATION: CreateModelRelationReq = {
  source_model_uid: props.modelUid,
  target_model_uid: "",
  relation_type_uid: "",
  mapping: "",
  description: undefined
}

const drawerVisible = ref<boolean>(false)
const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateModelRelationReq>(cloneDeep(DEFAULT_MODEL_RELATION))
const formRules: FormRules<CreateModelRelationReq> = {
  source_model_uid: [{ required: true, trigger: "blur", message: "必须输入源模型" }],
  target_model_uid: [{ required: true, trigger: "blur", message: "必须输入目标模型" }],
  relation_type_uid: [{ required: true, trigger: "blur", message: "必须输入关联类型" }],
  mapping: [{ required: true, trigger: "blur", message: "必须输入关联映射关系" }]
}
/** 新增关联类型 */
const handlerÇreate = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateModelRelationApi(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        drawerVisible.value = false
        listModelRelationData()
      })
      .finally(() => {})
  })
}

const mapping = [
  {
    value: "1-1",
    label: "1-1"
  },
  {
    value: "1-N",
    label: "1-N"
  },
  {
    value: "N-N",
    label: "N-N"
  }
]

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_MODEL_RELATION)
}

/** 查询关联类型 */
const relationTypeData = ref<ListRelationTypeData[]>([])
const getRealtionTypeData = () => {
  ListRelationTypeApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      relationTypeData.value = data.relation_types
    })
    .catch(() => {
      relationTypeData.value = []
    })
    .finally(() => {})
}

onMounted(() => {
  getRealtionTypeData()
})

/** 查询关联类型 */
const modelRelationData = ref<ModelRelation[]>([])
const listModelRelationData = () => {
  ListModelRelationApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize,
    model_uid: props.modelUid
  })
    .then(({ data }) => {
      reverseMap()
      paginationData.total = data.total
      modelRelationData.value = data.model_relations

      console.log("relation", modelRelationData.value)
    })
    .catch((error) => {
      modelRelationData.value = []
      console.log("cache", error)
    })
    .finally(() => {})
}

const handleUpdate = (row: ModelRelation) => {
  drawerVisible.value = false
  formData.value = cloneDeep(row)
}

const handleDelete = (row: ModelRelation) => {
  ElMessageBox.confirm(`正在删除字段：${row.relation_name}，确认删除？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    DeleteModelRelationApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listModelRelationData()
    })
  })
}
/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listModelRelationData, { immediate: true })
</script>

<style lang="scss" scoped>
.app-container {
  padding: 0px;
}
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}
</style>
