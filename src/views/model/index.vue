<template>
  <div class="app-container">
    <div class="header">
      <div class="button">
        <el-button type="primary" :icon="CirclePlus" @click="handlerDialogModelCreate">新增模型</el-button>
        <el-button type="primary" :icon="CirclePlus" @click="handlerDialogModelGroupCreate">新建分组</el-button>
      </div>
      <div class="search">
        <div class="search-container">
          <el-input
            v-model="searchInput"
            style="width: 240px"
            placeholder="模型信息"
            :suffix-icon="Search"
            class="search-input"
            @input="search"
          />
          <el-radio-group v-model="modelStatus" label="size control" class="search-radio" @change="search">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="open">启用中</el-radio-button>
            <el-radio-button value="close">已停用</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>
    <div class="model-groups">
      <div v-for="group in filterData" :key="group.group_id" class="model-group">
        <h3>{{ group.group_name }}</h3>
        <div class="model-cards">
          <el-row :gutter="20">
            <el-col
              v-for="model in group.models"
              :key="model.id"
              :xs="24"
              :sm="12"
              :md="8"
              :lg="6"
              :xl="4"
              style="margin-bottom: 4px"
            >
              <el-card class="model-card" @click="handleModelClick(model)">
                <div class="model-content">
                  <div class="model-image">
                    <img :src="model.icon" class="model-icon" />
                  </div>
                  <div class="model-info">
                    <div class="model-name">{{ model.name }}</div>
                    <div class="model-unique-name">{{ model.uid }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
    <!-- 新增模型 -->
    <el-dialog v-model="dialogModelVisible" :title="'新增模型'" @closed="resetForm" width="30%">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="group_id" label="所属分组">
          <el-select v-model="formData.group_id" placeholder="请选择">
            <el-option
              v-for="item in ModelsData"
              :key="item.group_id"
              :label="item.group_name"
              :value="item.group_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogModelVisible = false">取消</el-button>
        <el-button type="primary" @click="handlerCreateModel" :loading="loading">确认</el-button>
      </template>
    </el-dialog>
    <!-- 新增分组 -->
    <el-dialog v-model="dialogModelGroupVisible" :title="'新增分组'" @closed="resetForm" width="30%">
      <el-form ref="formRef" :model="formModelGroupData" :rules="formRules" label-width="100px" label-position="left">
        <el-form-item prop="name" label="名称">
          <el-input v-model="formModelGroupData.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogModelGroupVisible = false">取消</el-button>
        <el-button type="primary" @click="handlerCreateModelGroup" :loading="loading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { CirclePlus, Search } from "@element-plus/icons-vue"
import { CreateModelApi, CreateModelGroupApi } from "@/api/model"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { type Models, type Model, type CreateModelReq, type CreateModelGroupReq } from "@/api/model/types/model"
import { usePagination } from "@/hooks/usePagination"
import { cloneDeep } from "lodash-es"
import { useRouter } from "vue-router"
import { useModelStore } from "@/store/modules/model"

const searchInput = ref("")
const modelStatus = ref<"all" | "open" | "close">("all")
const loading = ref<boolean>(false)
const { paginationData } = usePagination()
const router = useRouter()

const DEFAULT_FORM_DATA: CreateModelReq = {
  name: "",
  group_id: undefined,
  uid: ""
}

const DEFAULT_MODEL_GROUP_DATA: CreateModelGroupReq = {
  name: ""
}

const dialogModelVisible = ref<boolean>(false)
const dialogModelGroupVisible = ref<boolean>(false)
const formData = ref<CreateModelReq>(cloneDeep(DEFAULT_FORM_DATA))
const formModelGroupData = ref<CreateModelGroupReq>(cloneDeep(DEFAULT_MODEL_GROUP_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  group_id: [{ required: true, message: "必须输入所在组", trigger: "blur" }],
  uid: [
    { required: true, message: "必须输入唯一标识", trigger: "blur" },
    { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
  ],
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}

const handlerDialogModelCreate = () => {
  dialogModelVisible.value = true
}
const handlerDialogModelGroupCreate = () => {
  dialogModelGroupVisible.value = true
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// ** 创建模型分组 */
const handlerCreateModelGroup = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateModelGroupApi(formModelGroupData.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogModelGroupVisible.value = false
        getModelsData()
      })
      .finally(() => {
        dialogModelGroupVisible.value = false
      })
  })
}

// ** 创建模型 */
const handlerCreateModel = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateModelApi(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogModelVisible.value = false
        getModelsData()
      })
      .finally(() => {
        dialogModelVisible.value = false
      })
  })
}

const ModelsData = ref<Models[]>([])
const filterData = ref<Models[]>([])
// ** 获取数据 */
const getModelsData = () => {
  loading.value = true
  useModelStore()
    .ListModelsInGroup()
    .then(({ data }) => {
      ModelsData.value = data.mgs
      filterData.value = data.mgs
    })
    .catch(() => {
      ModelsData.value = []
    })
    .finally(() => {
      loading.value = false
    })
}

const handleModelClick = (model: Model) => {
  console.log(model)
  router.push({
    path: "/model/info",
    query: { uid: model.uid, name: model.name }
  })
}

const search = () => {
  filterData.value = ModelsData.value
  // 如果搜索关键词为空，不执行过滤
  if (!searchInput.value.trim()) {
    return
  }

  const foundModels: Models[] = []
  ModelsData.value.forEach((group) => {
    const matchingModels = group.models.filter((model) =>
      model.uid.toLowerCase().includes(searchInput.value.trim().toLowerCase())
    )
    if (matchingModels.length > 0) {
      // 构造一个虚拟的包含匹配模型的组数据
      foundModels.push({
        group_id: group.group_id,
        group_name: group.group_name,
        models: matchingModels
      })
    }
  })

  filterData.value = foundModels
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], getModelsData, { immediate: true })
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-container {
  display: flex;
  align-items: center;
}

.search-input {
  margin-right: 10px;
}

.search-radio {
  margin-left: 10px;
}

.model-content {
  display: flex;
  align-items: center;
  .model-image {
    width: 37px;
    height: 37px;
    margin-right: 20px;
  }
  .model-icon {
    width: 100%;
    height: 100%;
  }
  .model-name {
    font-weight: bold;
    font-size: 18px;
  }

  .model-unique-name {
    color: rgb(191, 199, 210);
    font-size: 16px;
  }
}
</style>
