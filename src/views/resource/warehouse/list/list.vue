<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="drawerVisible = true">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listAttributeFields" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="resourcesData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column fixed="left" prop="id" label="ID" align="center">
            <template #default="scope">
              <el-button type="text" size="small" @click="handleIdClick(scope.row)">{{ scope.row.id }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column
            v-for="item in displayFileds"
            :key="item.id"
            :prop="`data.${item.field_uid}`"
            :label="item.field_name"
            align="center"
          />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
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
      </div>
    </el-card>
    <!-- 新增 -->
    <el-drawer class="drawer-container" v-model="drawerVisible" title="新增资产" @closed="resetForm" size="30%">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-collapse v-model="activeNames">
          <el-collapse-item title="基础属性" name="1">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item prop="name" label="名称">
                  <el-input v-model="formData.name" placeholder="请输入资源名称" />
                </el-form-item>
              </el-col>
              <el-col v-for="(item, index) of attributeFiledsData" :key="index" :span="12" class="lightgreen-box">
                <el-form-item :prop="item.field_uid" :label="item.field_name">
                  <el-input v-model="formData.data[item.field_uid]" placeholder="请输入" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">确认</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch, h } from "vue"
import { useRoute } from "vue-router"
import { type Attribute } from "@/api/attribute/types/attribute"
import { ListAttributeFieldApi } from "@/api/attribute"
import { listResourceApi, createResourceApi, deleteResourceApi } from "@/api/resource"
import { type Resource, type CreateResourceReq } from "@/api/resource/types/resource"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { usePagination } from "@/hooks/usePagination"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import router from "@/router"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const route = useRoute()
const modelUid = route.query.uid as string
const attributeFiledsData = ref<Attribute[]>([])
const displayFileds = ref<Attribute[]>([])
const drawerVisible = ref<boolean>(false)
const activeNames = ref<string[]>(["0", "1"])

const DEFAULT_FORM_DATA: CreateResourceReq = {
  name: "",
  model_uid: modelUid,
  data: {}
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateResourceReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRules: FormRules<CreateResourceReq> = {
  name: [{ required: true, trigger: "blur", message: "请输入名称" }]
}

const handleIdClick = (resource: Resource) => {
  router.push({
    path: "/resource/info",
    query: { model_uid: modelUid, id: resource.id, name: resource.name }
  })
}

/** 新增关联类型 */
const handleCreate = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createResourceApi(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        drawerVisible.value = false
        listResourceByModelUid()
      })
      .finally(() => {})
  })
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// ** 获取资产字段信息 */
const listAttributeFields = () => {
  ListAttributeFieldApi(modelUid)
    .then(({ data }) => {
      attributeFiledsData.value = data.attribute_fields
      sortFields()
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {
      // ...
    })
}

// ** 过滤展示字段，并排序 */
const sortFields = () => {
  displayFileds.value = attributeFiledsData.value
    .filter((item) => item.display === true)
    .sort((a, b) => {
      const indexA = a.index ?? 100
      const indexB = b.index ?? 100
      return indexA - indexB
    })
}

// ** 获取资产列表 */
const resourcesData = ref<Resource[]>([])
const listResourceByModelUid = () => {
  listResourceApi({
    model_uid: modelUid,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      resourcesData.value = data.resources
      paginationData.total = data.total
    })
    .catch(() => {
      attributeFiledsData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: Resource) => {
  drawerVisible.value = false
  formData.value = cloneDeep(row)
}

const handleDelete = (row: Resource) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteResourceApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listResourceByModelUid()
    })
  })
}

onMounted(() => {
  listAttributeFields()
})

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listResourceByModelUid, { immediate: true })
</script>

<style lang="scss" scoped>
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
