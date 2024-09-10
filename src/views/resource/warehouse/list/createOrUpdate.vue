<template>
  <div>
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
      <el-collapse v-model="activeNames">
        <el-collapse-item title="基础属性" name="1">
          <el-row :gutter="20">
            <!-- <el-col :span="12">
              <el-form-item prop="name" label="名称">
                <el-input v-model="formData.name" placeholder="请输入资源名称" />
              </el-form-item>
            </el-col> -->
            <el-col v-for="(item, index) of attributeFiledsData" :key="index" :span="12" class="lightgreen-box">
              <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name">
                <template v-if="item.field_type === 'string'">
                  <el-input v-model="formData.data[item.field_uid]" placeholder="请输入" />
                </template>
                <template v-if="item.field_type === 'list'">
                  <el-select v-model="formData.data[item.field_uid]" placeholder="请选择">
                    <el-option v-for="option in item.option" :key="option" :label="option" :value="option" />
                  </el-select>
                </template>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { createResourceApi, updateResourceApi } from "@/api/resource"
import { Resource, type CreateOrUpdateResourceReq } from "@/api/resource/types/resource"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { Attribute } from "@/api/attribute/types/attribute"

// 接收父组建传递
interface Props {
  modelUid: string
  attributeFiledsData: Attribute[]
}

const props = defineProps<Props>()
const emits = defineEmits(["list", "close"])
const activeNames = ref<string[]>(["0", "1"])
const DEFAULT_FORM_DATA: CreateOrUpdateResourceReq = {
  name: "",
  model_uid: props.modelUid,
  data: {}
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateOrUpdateResourceReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRules = computed<FormRules>(() => {
  const rules: FormRules = {}
  props.attributeFiledsData.forEach((field) => {
    const dataField = `data.${field.field_uid}`
    rules[dataField] = [
      {
        required: field.required,
        message: `请填写${field.field_name}`,
        trigger: "blur"
      }
    ].filter((rule) => rule.required)
  })
  return rules
})

/** 新增关联类型 */
const handleCreate = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createResourceApi : updateResourceApi
    api(formData.value)
      .then(() => {
        ElMessage.success("操作成功")
        onClosed()
        emits("list")
      })
      .finally(() => {})
  })
}

const setForm = (row: Resource) => {
  formData.value = cloneDeep(row)

  console.log(formData.value, "setForm")
}

defineExpose({
  handleCreate,
  setForm
})

const onClosed = () => {
  resetForm()
  emits("close", false)
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}
</script>
