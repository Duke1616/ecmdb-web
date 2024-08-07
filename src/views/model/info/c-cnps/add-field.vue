<template>
  <!-- 新增属性 -->
  <el-drawer v-model="drawerVisible" title="编辑字段" @closed="onClosed" size="30%">
    <el-form :model="formData" :rules="fieldRules" size="large" label-width="auto" ref="formRef">
      <el-form-item label="唯一标识" prop="field_uid">
        <el-input v-model="formData.field_uid" />
      </el-form-item>
      <el-form-item label="字段名称" prop="field_name">
        <el-input v-model="formData.field_name" />
      </el-form-item>
      <el-form-item label="字段类型" prop="field_type">
        <el-select v-model="formData.field_type" placeholder="请输入源-目标约束">
          <el-option v-for="item in mapping" :key="item.label" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-card class="add-field-card">
        <template #header>
          <span class="card-header-title">字段设置</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="12" style="padding-left: 0 !important">
            <el-form-item label="是否必填" prop="required">
              <el-switch v-model="formData.required" />
            </el-form-item>
          </el-col>
          <el-col :span="12" style="padding-left: 0 !important">
            <el-form-item label="加密属性" prop="secure">
              <el-switch v-model="formData.secure" />
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="formData.field_type == 'list'">
          <h5 style="margin-top: 0px">列表值</h5>
          <VueDraggable
            v-model="list"
            :animation="150"
            itemKey="id"
            ghostClass="ghost"
            chosenClass="chosen"
            handle=".handle"
            class="flex flex-col gap-4 p-0 rounded"
          >
            <div v-for="(item, index) in list" :key="item.id" class="flex flex-col gap-4 p-0 rounded">
              <div class="add-field-item">
                <div class="add-field-input">
                  <el-icon name="sort" class="handle cursor-move"><Grid /></el-icon>
                  <input type="text" v-model="item.name" @change="changeText(index)" required />
                </div>
                <div>
                  <el-icon v-if="list.length > 1" @click="removeList(index)"><Minus /></el-icon>
                  <el-icon @click="handlerAdd"><Plus /></el-icon>
                </div>
              </div>
            </div>
          </VueDraggable>
        </template>
      </el-card>
      <el-form-item>
        <el-button type="primary" @click="handlerAddAttribute()"> 保存 </el-button>
        <el-button @click="onClosed()">取消</el-button>
      </el-form-item>
    </el-form>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { CreateAttributeApi } from "@/api/attribute"
import { type createAttributeReq } from "@/api/attribute/types/attribute"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { v4 as uuidv4 } from "uuid"

// 接收父组建传递
interface Props {
  modelUid: string
  addAttrDrawerVisible: boolean
  groupId: number | undefined
}

const drawerVisible = ref(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "attributes-updated"])
const onClosed = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  list.value = cloneDeep([
    {
      name: "",
      id: uuidv4
    }
  ])
  emits("close", false)
}

const mapping = [
  {
    value: "string",
    label: "字符串"
  },
  {
    value: "list",
    label: "列表"
  }
]

const list = ref([
  {
    name: "",
    id: uuidv4
  }
])

function removeList(index: number) {
  list.value.splice(index, 1)
  formData.value.option = list.value.map((item) => item.name).filter((name) => name)
}

function handlerAdd() {
  list.value.push({
    name: "",
    id: uuidv4
  })
}

const changeText = (index: number) => {
  if (!Array.isArray(formData.value.option)) {
    formData.value.option = []
  }
  formData.value.option.push(list.value[index].name)
}

const DEFAULT_FORM_DATA: createAttributeReq = {
  model_uid: props.modelUid,
  group_id: 0,
  field_uid: "",
  field_name: "",
  field_type: "string",
  required: false,
  secure: false,
  option: ""
}

const formData = ref<createAttributeReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const fieldRules: FormRules = {
  field_uid: [
    { required: true, message: "必须输入字段唯一标识", trigger: "blur" },
    { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
  ],
  field_name: [{ required: true, message: "必须输入字段名称", trigger: "blur" }]
}

const handlerAddAttribute = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateAttributeApi(formData.value).then(() => {
      ElMessage.success("操作成功")
      drawerVisible.value = false
      emits("attributes-updated")
    })
  })
}

watch(
  () => props.addAttrDrawerVisible,
  (val: boolean) => {
    drawerVisible.value = val
  },
  { immediate: true }
)

watch(
  () => props.groupId,
  (newGroupId) => {
    if (newGroupId !== undefined) {
      formData.value.group_id = newGroupId
    }
  },
  { immediate: true }
)
</script>

<style>
.add-field-card {
  background-color: #f3f8ff;
  margin-bottom: 30px;
  .el-card__body {
    padding: 10px;
  }
  .el-card__header {
    padding: 10px;
  }
}

.card-header-title {
  font-weight: bold;
  color: #333;
  font-size: 13px;
}

.add-field-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  height: 30px;
  border-radius: 0.25rem;
  gap: 5px;
}

.el-icon {
  margin-right: 8px;
}

.text-right {
  padding-left: 15px;
}
.add-field-item input[type="text"] {
  width: 240px;
}
</style>
