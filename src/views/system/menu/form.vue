<template>
  <el-divider content-position="left">基础设置</el-divider>
  <el-form ref="formRef" :model="formData" :inline-message="true" :rules="formRules">
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
        <el-form-item label="上级目录" prop="tag">
          <el-tree-select
            v-model="formData.pid"
            :data="props.menuData"
            :render-after-expand="false"
            node-key="id"
            show-checkbox
            check-strictly
            check-on-click-node
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="showLableName(formData.type)" prop="name">
          <el-input v-model="formData.name" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="formData.type !== 3" label="菜单图标" prop="icon">
          <el-input v-model="formData.meta.icon" clearable />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-if="formData.type === 1">
      <el-col :span="12">
        <el-form-item label="目录组件" prop="path">
          <el-input v-model="formData.component" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="默认跳转" prop="redirect">
          <el-input v-model="formData.redirect" clearable />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item v-if="formData.type !== 3" label="路由地址" prop="path">
          <el-input v-model="formData.path" clearable />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item v-if="formData.type === 2" label="组件路径" prop="path">
          <el-input v-model="formData.Component_path" clearable />
        </el-form-item>
      </el-col>
    </el-row>
    <div class="divider">
      <el-divider content-position="left">功能设置</el-divider>
    </div>
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="菜单排序" prop="sort">
          <el-input v-model="formData.sort" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="菜单状态" prop="name">
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
    <el-form-item v-if="formData.type !== 3" label="高级选项" prop="name">
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
      <el-button text type="primary"> 添加接口</el-button>
    </div>
    <el-table
      :data="formData.endpoints"
      border
      :header-cell-style="{ background: '#F6F6F6', height: '10px', 'text-align': 'center' }"
    >
      <el-table-column prop="desc" label="接口介绍" align="center">
        <div>123</div>
      </el-table-column>
      <el-table-column prop="path" label="接口路径" align="center">
        <div>123</div>
      </el-table-column>
      <el-table-column prop="method" label="接口方法" align="center">
        <div>123</div>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="150" align="center">
        <template #default="scope">
          <el-button type="danger" text bg size="small" @click="handleDeleteEndpoint(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
</template>

<script lang="ts" setup>
import { createOrUpdateMenuReq, endpoint } from "@/api/menu/types/menu"
import { FormInstance, FormRules } from "element-plus"
import { ref } from "vue"
import { cloneDeep } from "lodash-es"

interface Props {
  menuData: any
}

const props = defineProps<Props>()

const checkedCities = ref([])
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
  id: undefined,
  pid: undefined,
  type: 1,
  redirect: "",
  name: "",
  path: "",
  status: 1,
  component: "",
  Component_path: "",
  sort: 0,
  meta: {
    title: "",
    hidden: false,
    affix: false,
    keepalive: false,
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

const handleCheckedCitiesChange = (value: string[]) => {
  metaOptions.value.forEach((option) => {
    if (option.label === "hidden" || option.label === "affix" || option.label === "keepalive") {
      formData.value.meta[option.label] = value.includes(option.label)
    }
  })

  console.log(formData.value.meta)
}

const handleDeleteEndpoint = (row: endpoint) => {
  console.log(row)
}

const formData = ref<createOrUpdateMenuReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  id: [{ required: true, message: "连线类型不能为空" }]
}

const getFormData = () => {
  return formData.value
}

defineExpose({
  getFormData
})
</script>

<style lang="scss" scoped>
.divider .el-divider__text {
  font-size: 20px; /* 您可以根据需要调整这个值 */
}
</style>
