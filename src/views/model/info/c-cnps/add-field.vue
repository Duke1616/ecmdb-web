<template>
  <!-- 新增属性 -->
  <el-drawer v-model="drawerVisible" title="编辑字段" @closed="onClosed">
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
      <el-card style="background-color: #f3f8ff">
        <h5>字段设置</h5>
        <template v-if="formData.field_type == 'list'">
          <VueDraggable
            v-model="list"
            :animation="150"
            handle=".handle"
            class="flex flex-col gap-2 p-4 w-300px bg-gray-500/5 rounded"
          >
            <div
              v-for="item in list"
              :key="item.id"
              class="h-50px bg-gray-500/5 rounded flex items-center justify-between px-4"
            >
              <IconSort class="handle cursor-move" />
              <input type="text" v-model="item.name" />
              <iconClose class="cursor-pointer" />
            </div>
          </VueDraggable>
        </template>
      </el-card>
      <el-form-item label="是否必填" prop="required">
        <el-switch v-model="formData.required" />
      </el-form-item>
      <el-form-item label="加密属性" prop="secure">
        <el-switch v-model="formData.secure" />
      </el-form-item>
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
import { type CreateAttributeRequestData } from "@/api/attribute/types/attribute"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"

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
    name: "Joao",
    id: "1"
  },
  {
    name: "Jean",
    id: "2"
  },
  {
    name: "Johanna",
    id: "3"
  },
  {
    name: "Juan",
    id: "4"
  }
])

const DEFAULT_FORM_DATA: CreateAttributeRequestData = {
  model_uid: props.modelUid,
  group_id: 0,
  field_uid: "",
  field_name: "",
  field_type: "string",
  required: false,
  secure: false
}

const formData = ref<CreateAttributeRequestData>(cloneDeep(DEFAULT_FORM_DATA))
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
