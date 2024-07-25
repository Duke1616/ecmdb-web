<template>
  <el-card class="variables-card">
    <template #header>
      <div class="variables-header">
        <div>
          <span class="card-header-title">变量配置</span>
        </div>
        <div>
          <el-button type="primary" @click="handlerAddVaribale"> 新增变量 </el-button>
        </div>
      </div>
    </template>

    <el-table
      :data="props.varibales"
      border
      :header-cell-style="{ background: '#f3f8ff', height: '10px', 'text-align': 'center' }"
    >
      <el-table-column prop="key" label="名称" align="center" />
      <el-table-column prop="value" label="值" align="center" />
      <el-table-column fixed="right" label="操作" align="center">
        <template #default="scope">
          <el-button type="primary" text bg size="small" @click="handleDelVaribale(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-dialog v-model="dialogVisible" title="新增变量" width="500" :before-close="handleClose">
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleCreate"> 确定 </el-button>
      </div>
    </template>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="key" label="变量名">
        <el-input v-model="formData.key" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item prop="value" label="变量值">
        <el-input v-model="formData.value" placeholder="请输入" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { variables } from "@/api/runner/types/runner"
import { FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"

// 接收父组建传递
interface Props {
  dialogVariable?: boolean
  varibales?: variables[]
}

const DEFAULT_FORM_DATA: variables = {
  key: "",
  value: ""
}

const formData = ref<variables>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const validateUniqueKey = (rule: any, value: any, callback: any) => {
  const keys = props.varibales?.map((variable) => variable.key)
  if (keys?.includes(value)) {
    callback(new Error("变量 Key 已存在"))
  }
  callback()
}
const formRules: FormRules = {
  key: [
    { required: true, message: "必须输入名称", trigger: "blur" },
    { validator: validateUniqueKey, trigger: "blur" }
  ],
  value: [{ required: true, message: "必须输入值", trigger: "blur" }]
}

const dialogVisible = ref(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "add-varibale", "del-varibale"])

const handleClose = () => {
  dialogVisible.value = false
  emits("close")
}

const handlerAddVaribale = () => {
  dialogVisible.value = true
}
const handleDelVaribale = (row: variables) => {
  emits("del-varibale", row.key)
  dialogVisible.value = false
}

const handleCreate = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    emits("add-varibale", formData.value)
    dialogVisible.value = false
    formData.value = cloneDeep(DEFAULT_FORM_DATA)
  })
}
</script>

<style lang="scss" scoped>
.variables-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.variables-card {
  .el-card__body {
    padding: 0px;
  }
  .el-card__header {
    padding: 0px;
  }
}
</style>
