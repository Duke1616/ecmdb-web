<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
    <el-collapse v-model="activeNames">
      <el-collapse-item title="基础属性" name="1">
        <el-row :gutter="20">
          <el-col v-for="(item, index) of nonFileFields" :key="index" :span="12" class="lightgreen-box">
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
        <el-row :gutter="20">
          <el-col :span="24" v-for="(item, index) of fileFields" :key="index">
            <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name">
              <el-upload
                v-model:file-list="formData.data[item.field_uid]"
                class="upload-file"
                action="#"
                multiple
                show-file-list
                :http-request="(action: UploadRequestOptions) => uploadFile(action, item.field_uid)"
                :on-preview="handlePreview"
                :on-remove="handleRemove"
                :before-remove="beforeRemove"
                :limit="3"
                :on-exceed="handleExceed"
                :on-progress="handleProgress"
              >
                <el-button type="primary">文件上传</el-button>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>
      </el-collapse-item>
    </el-collapse>
  </el-form>
</template>

<script lang="ts" setup>
import { ref, computed, h } from "vue"
import { createResourceApi, updateResourceApi } from "@/api/resource"
import { Resource, type CreateOrUpdateResourceReq } from "@/api/resource/types/resource"
import { cloneDeep } from "lodash-es"
import {
  type FormInstance,
  type FormRules,
  ElMessage,
  ElMessageBox,
  UploadProgressEvent,
  UploadProps,
  UploadRequestOptions,
  UploadUserFile
} from "element-plus"
import { Attribute } from "@/api/attribute/types/attribute"
import { putMinioPresignedUrl, removeMinioObject } from "@/api/tools"
import axios from "axios"

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

const uploadFile = (action: UploadRequestOptions, fieldUid: string) => {
  return putMinioPresignedUrl(action.file.name).then((res: any) => {
    // 替换 URL 为本地的访问地址，通过代理Minio进行访问
    const currentUrl = window.location.origin
    const backendUrlObj = new URL(res.data)
    const path = "/minio" + backendUrlObj.pathname
    const url = `${currentUrl}${path}${backendUrlObj.search}`

    // 请求上传
    axios
      .put(url, action.file, {
        headers: {
          "Content-Type": action.file.type
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            action.onProgress({
              percent: percentCompleted
            } as UploadProgressEvent)
          }
        }
      })
      .then(() => {
        const fileList = formData.value.data[fieldUid]
        const file = fileList.find((item: UploadUserFile) => item.name === action.file.name)
        if (file) {
          file.url = res.data.split("?")[0]
          console.log("file", file)
        }
      })
      .catch(() => {
        ElMessage.error("上传失败")
      })
  })
}

const handleRemove: UploadProps["onRemove"] = (file) => {
  const filePath = file.url?.split("ecmdb/")[1]
  if (filePath === undefined) {
    return
  }

  // 会有中文特殊字符，需要进行解码
  const decodedFilePath = decodeURIComponent(filePath)

  removeMinioObject(decodedFilePath).then(() => {
    ElMessage.success("删除成功")
  })
}
const handleProgress = (event: UploadProgressEvent, file: UploadUserFile) => {
  file.percentage = event.percent
}

const handlePreview: UploadProps["onPreview"] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps["onExceed"] = (files) => {
  ElMessage.warning(`限制最多上传 ${files.length} 个文件`)
}

const beforeRemove: UploadProps["beforeRemove"] = (uploadFile) => {
  return ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除文件: "),
      h("i", { style: "color: red" }, `${uploadFile.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => true)
}

const nonFileFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type !== "file")
})

const fileFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type === "file")
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

<style lang="scss" scoped>
.upload-file {
  width: 100%;
}
</style>
