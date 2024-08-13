<template>
  <div>
    <el-divider content-position="left">基础设置</el-divider>
    <el-form ref="formRef" :model="formData" :inline-message="true" hide-required-asterisk :rules="formRules">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="菜单类型" prop="type">
            <el-radio-group v-model="formData.type" size="default" is-button>
              <el-radio-button
                v-for="item in typeOptions"
                :key="item.label"
                :name="item.name"
                :label="item.label"
                :disabled="item.disabled"
              >
                {{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上级目录" prop="pid">
            <el-tree-select
              v-model="formData.pid"
              :data="props.menuData"
              node-key="id"
              :render-after-expand="false"
              :expand-on-click-node="false"
              show-checkbox
              check-strictly
              check-on-click-node
              :props="defaultProps"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item :label="showLableName(formData.type)" prop="meta.title">
            <el-input v-model="formData.meta.title" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="formData.type !== 3" label="菜单图标" prop="meta.icon">
            <el-input v-model="formData.meta.icon" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="formData.type === 1">
        <el-col :span="12">
          <el-form-item label="菜单布局" prop="path">
            <el-input v-model="formData.component" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="默认跳转" prop="redirect">
            <el-input v-model="formData.redirect" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="formData.type !== 3">
        <el-col :span="12">
          <el-form-item label="路由地址" prop="path">
            <el-input v-model="formData.path" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="路由名称" prop="path">
            <el-input v-model="formData.name" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item v-if="formData.type === 2" label="组件路径" prop="path">
            <el-input v-model="formData.component" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="divider">
        <el-divider content-position="left">功能设置</el-divider>
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="菜单排序" prop="sort">
            <el-input-number v-model="formData.sort" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="菜单状态" prop="status">
            <el-radio-group v-model="formData.status" is-button>
              <el-radio-button
                v-for="item in statusOptions"
                :key="item.label"
                :name="item.name"
                :label="item.label"
                :disabled="item.disabled"
              >
                {{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item v-if="formData.type !== 3" label="高级选项" prop="meta">
        <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
          <el-checkbox
            v-for="option in metaOptions"
            :key="option.label"
            :label="option.label"
            :name="option.name"
            :disabled="option.disabled"
          >
            {{ option.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <div class="divider">
        <el-divider content-position="left"> 接口设置 </el-divider>
        <el-button text type="primary" @click="handleAddAPi"> 添加接口</el-button>
      </div>
      <el-table
        :data="formData.endpoints"
        border
        :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
      >
        <el-table-column prop="path" label="接口路径" align="center" />
        <el-table-column prop="method" label="接口方法" align="center" />
        <el-table-column prop="desc" label="接口介绍" align="center" />
        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button type="danger" text bg size="small" @click="handleDeleteEndpoint(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <div>
      <el-dialog v-model="dialogVisible" title="添加接口">
        <Api ref="apiRef" />
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlerAddApi">添加</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { createOrUpdateMenuReq, endpoint, menu } from "@/api/menu/types/menu"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { createMenuApi, updateMenuApi } from "@/api/menu"
import Api from "./api.vue"

const apiRef = ref<InstanceType<typeof Api>>()
const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const emits = defineEmits(["listMenusTreeData", "closed"])

interface Props {
  menuData: menu[]
}

const props = defineProps<Props>()

const statusOptions = ref([
  { label: 1, name: "开启", disabled: false },
  { label: 2, name: "停用", disabled: true }
])

const typeOptions = ref([
  { label: 1, name: "目录", disabled: false },
  { label: 2, name: "菜单", disabled: false },
  { label: 3, name: "按钮", disabled: false }
])

const metaOptions = ref([
  { label: "hidden", name: "隐藏菜单", disabled: false },
  { label: "affix", name: "页签固定", disabled: false },
  { label: "keepalive", name: "缓存路由", disabled: false }
])

const DEFAULT_FORM_DATA: createOrUpdateMenuReq = {
  type: 1,
  redirect: "",
  path: "",
  status: 1,
  name: "",
  component: "",
  sort: 0,
  meta: {
    title: "",
    is_hidden: false,
    is_affix: false,
    is_keepalive: false,
    icon: ""
  },
  endpoints: []
}

const showLableName = (type: number) => {
  if (type === 1) {
    return "目录名称"
  } else if (type === 2) {
    return "菜单名称"
  } else if (type === 3) {
    return "按钮名称"
  }
}

const checkedCities = ref<string[]>([])
const handleCheckedCitiesChange = (value: any) => {
  metaOptions.value.forEach((option) => {
    switch (option.label) {
      case "hidden":
        formData.value.meta.is_hidden = value.includes(option.label)
        break
      case "affix":
        formData.value.meta.is_affix = value.includes(option.label)
        break
      case "keepalive":
        formData.value.meta.is_keepalive = value.includes(option.label)
        break
    }
  })
}

const handleDeleteEndpoint = (row: endpoint) => {
  formData.value.endpoints = formData.value.endpoints.filter((endpoint) => endpoint.id !== row.id)
}
const handlerAddApi = () => {
  const endpointAPi = apiRef.value?.getSelectionTableData()
  const uniqueEndpoints = endpointAPi.filter((newEndpoint: { id: number }) => {
    return !formData.value.endpoints.some((existingEndpoint) => existingEndpoint.id === newEndpoint.id)
  })

  formData.value.endpoints = formData.value.endpoints.concat(uniqueEndpoints)
  apiRef.value?.clearSelection()
  dialogVisible.value = false
}

const formData = ref<createOrUpdateMenuReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  title: [{ required: true, message: "名称不能为空" }]
}

const submitUpdateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    updateMenuApi(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        resetForm()
        emits("listMenusTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

const submitCreateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    createMenuApi(formData.value)
      .then((data) => {
        ElMessage.success("保存成功")
        resetForm()

        emits("closed", data.data)
        emits("listMenusTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

// 控制添加API接口的dialog
const dialogVisible = ref<boolean>(false)
const handleAddAPi = () => {
  dialogVisible.value = true
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// 设置菜单数据
const setMenuData = (form: menu) => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(form)
}

// 设置按钮类型
const setMenuType = (value: number) => {
  formData.value.type = value
}
// 设置上级目录
const setFromForPid = (pid: number | null) => {
  if (pid === null) {
    return
  }
  formData.value.pid = pid
}

// 初始化选中的高级选项
const setCheckedCities = (value: string[]) => {
  checkedCities.value = value
}

defineExpose({
  submitCreateForm,
  submitUpdateForm,
  resetForm,
  setMenuType,
  setMenuData,
  setFromForPid,
  setCheckedCities
})
</script>

<style lang="scss" scoped>
.divider .el-divider__text {
  font-size: 20px; /* 您可以根据需要调整这个值 */
}
</style>
