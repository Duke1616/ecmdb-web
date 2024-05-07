<template>
  <el-card v-loading="loading" shadow="never">
    <div class="table-wrapper">
      <el-button type="primary" @click="innerDrawer = true"> 新建关联 </el-button>
      <el-table :data="tableData">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="username" label="唯一标识" align="center" />
        <el-table-column prop="email" label="关联类型" align="center" />
        <el-table-column prop="email" label="源模型" align="center" />
        <el-table-column prop="status" label="目标模型" align="center" />
        <el-table-column prop="phone" label="源-目标约束" align="center" />
        <el-table-column fixed="right" label="操作" width="150" align="center">
          <template #default="scope">
            <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>
  <el-drawer v-model="innerDrawer" title="编辑字段">
    <el-form :model="formData" size="large" label-width="auto" ref="formRef" label-position="top">
      <el-form-item label="源模型" prop="src_model">
        <el-select v-model="formData.src_model" placeholder="Select">
          <el-option-group v-for="group in options" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="目标模型" prop="dst_model">
        <el-select v-model="formData.dst_model" placeholder="Select">
          <el-option-group v-for="group in options" :key="group.label" :label="group.label">
            <el-option v-for="item in group.options" :key="item.value" :label="item.label" :value="item.value" />
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="关联类型" prop="relation_type">
        <el-input v-model="formData.relation_type" />
      </el-form-item>
      <el-form-item label="源-目标约束" prop="relation_vaildation">
        <el-input v-model="formData.relation_vaildation" />
      </el-form-item>
      <el-form-item label="关联描述" prop="description">
        <el-input v-model="formData.description" type="textarea" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm(ruleFormRef)"> 保存 </el-button>
        <el-button @click="resetForm()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref } from "vue"

const loading = ref<boolean>(false)
const formData = ref({
  src_model: "",
  dst_model: "",
  relation_type: "",
  relation_vaildation: "",
  description: ""
})

export interface GetTableData {
  createTime: string
  email: string
  id: string
  phone: string
  roles: string
  status: boolean
  username: string
}
const tableData = ref<GetTableData[]>([
  {
    id: "1",
    createTime: "1",
    email: "1",
    phone: "1",
    roles: "1",
    status: false,
    username: "1"
  }
])

const options = [
  {
    label: "Popular cities",
    options: [
      {
        value: "Shanghai",
        label: "Shanghai"
      },
      {
        value: "Beijing",
        label: "Beijing"
      }
    ]
  },
  {
    label: "City name",
    options: [
      {
        value: "Chengdu",
        label: "Chengdu"
      },
      {
        value: "Shenzhen",
        label: "Shenzhen"
      },
      {
        value: "Guangzhou",
        label: "Guangzhou"
      },
      {
        value: "Dalian",
        label: "Dalian"
      }
    ]
  }
]

const innerDrawer = ref(false)
</script>
