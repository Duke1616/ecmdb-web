<template>
  <div>
    <el-drawer
      class="add-drawer"
      v-model="dialogDrawer"
      :title="props.createOrUpdate === 'create' ? '添加任务脚本' : '修改任务脚本'"
      direction="ttb"
      size="100%"
      @closed="onClosed"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="auto">
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
      <CodeMirror
        ref="codeMirrorRef"
        :createOrUpdate="props.createOrUpdate"
        :language="props.codebookRow.language"
        :code="props.codebookRow.code"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogDrawer = false">取消</el-button>
          <el-button type="primary" @click="handlerCreate"> 保存 </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import CodeMirror from "@/components/CodeMirror/index.vue"
import { type codebook, type createOrUpdateCodebookReq } from "@/api/task/types/codebook"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createCodebookApi, updateCodebookApi } from "@/api/task"

// 接收父组建传递
interface Props {
  dialogVisible: boolean
  createOrUpdate: string
  codebookRow: codebook
}

const dialogDrawer = ref(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "list-codebooks"])
const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  emits("close", false)
}

const codeMirrorRef = ref<InstanceType<typeof CodeMirror>>()
const DEFAULT_FORM_DATA: createOrUpdateCodebookReq = {
  id: undefined,
  name: "",
  code: "",
  language: ""
}

const formData = ref<createOrUpdateCodebookReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }]
}

const handlerCreate = () => {
  const code = codeMirrorRef.value?.getCode()
  const language = codeMirrorRef.value?.getLanguage()
  if (code != undefined) {
    formData.value.code = code
  }

  if (language != undefined) {
    formData.value.language = language
  }

  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? createCodebookApi : updateCodebookApi
    api(formData.value)
      .then(() => {
        dialogDrawer.value = false
        ElMessage.success("保存成功")
        emits("list-codebooks")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

watch(
  () => props.dialogVisible,
  (val: boolean) => {
    dialogDrawer.value = val
  },
  { immediate: true }
)

watch(
  () => props.codebookRow,
  (val: codebook) => {
    formData.value = cloneDeep(val)
  },
  { immediate: true }
)
</script>
