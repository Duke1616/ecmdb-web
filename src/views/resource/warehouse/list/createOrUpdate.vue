<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
    <el-collapse v-model="activeNames">
      <el-collapse-item title="基础属性" name="1">
        <el-row :gutter="20">
          <el-col v-for="(item, index) of nonFileFields" :key="index" :span="12" class="lightgreen-box">
            <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name">
              <template v-if="item.field_type === 'string'">
                <el-input v-model="formData.data[item.field_uid]" :placeholder="handlerPlaceholder(item.field_name)" />
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
          <el-col :span="24" v-for="(item, index) of multilineFields" :key="index">
            <el-form-item :prop="'data.' + item.field_uid" :label="item.field_name">
              <el-input
                v-model="formData.data[item.field_uid]"
                :autosize="{ minRows: 2, maxRows: 4 }"
                type="textarea"
                :placeholder="handlerPlaceholder(item.field_name)"
              />
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
                :on-remove="createHandleRemove(item.field_uid)"
                :before-remove="beforeRemove"
                :limit="5"
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
import { createResourceApi, setCustomFieldApi, updateResourceApi } from "@/api/resource"
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
import { decodedUrlPath, getLocalMinioUrl } from "@/utils/url"

// 接收父组建传递
interface Props {
  modelUid: string
  attributeFiledsData: Attribute[]
}

const props = defineProps<Props>()
const emits = defineEmits(["list", "closed"])
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

const handlerPlaceholder = (name: string) => {
  return `请输入${name}`
}

const uploadFile = (action: UploadRequestOptions, fieldUid: string) => {
  const objectName = action.file.uid + "/" + action.file.name
  return putMinioPresignedUrl(objectName).then((res: any) => {
    const url = getLocalMinioUrl(res.data)
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

            if (percentCompleted === 100) {
              action.onSuccess && action.onSuccess(action.file)
            }
          }
        }
      })
      .then(() => {
        const fileList = formData.value.data[fieldUid]
        const file = fileList.find((item: UploadUserFile) => item.name === action.file.name)
        if (file) {
          file.url = res.data.split("?")[0]
        }

        // 当为修改的时候，主动调用接口更新字段信息，防止文件已经删除，页面依旧展示
        // 如果新增情况下，主动上传文件不触发保存 Minio 会存在脏数据情况，暂时不处理
        if (formData.value.id !== undefined) {
          setCustomFieldApi({
            id: formData.value.id,
            field: fieldUid,
            data: fileList
          }).catch(() => {
            ElMessage.error("上传失败")
          })
        }
      })
      .catch(() => {
        ElMessage.error("上传失败")
      })
  })
}

const createHandleRemove = (field: string) => {
  const handleRemove: UploadProps["onRemove"] = (file) => {
    if (file.url === undefined) {
      return
    }

    removeMinioObject(decodedUrlPath(file.url)).then(() => {
      formData.value.data[field] = formData.value.data[field].map((item: UploadUserFile) =>
        item.name === file.name ? { ...item } : item
      )

      setCustomFieldApi({
        id: formData.value.id as number,
        field: field,
        data: formData.value.data[field]
      }).catch(() => {
        ElMessage.error("上传失败")
      })
    })
  }

  return handleRemove
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
  return props.attributeFiledsData.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
})

const fileFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type === "file")
})

const multilineFields = computed(() => {
  return props.attributeFiledsData.filter((item) => item.field_type === "multiline")
})

/** 新增关联类型 */
const handleSubmit = () => {
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
}

const onClosed = () => {
  emits("closed")
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

defineExpose({
  handleSubmit,
  setForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.upload-file {
  width: 100%;
  ::v-deep .el-upload-list__item {
    transition: none !important;
  }
}
</style>
