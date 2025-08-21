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
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item prop="name" label="任务名称">
              <el-input v-model="formData.name" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="name" label="唯一标识">
              <el-input v-model="formData.identifier" placeholder="请输入唯一标识" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item prop="owner" label="管理人员">
              <el-select
                v-model="formData.owner"
                reserve-keyword
                placeholder="输入关键字选择"
                :remote-method="remoteMethod"
                :loading="loading"
                clearable
                filterable
                remote
              >
                <el-option v-for="item in usersData" :key="item.id" :label="item.display_name" :value="item.id" />
                <template #footer>
                  <el-pagination
                    class="justify-center h-10 p-2 bg-white"
                    background
                    :layout="paginationData.layout"
                    :page-sizes="paginationData.pageSizes"
                    :total="paginationData.total"
                    :page-size="paginationData.pageSize"
                    :currentPage="paginationData.currentPage"
                    @size-change="handleSizeChange"
                    @current-change="handleCurrentChange"
                  />
                </template>
                <template #loading>
                  <div v-loading="loading" element-loading-text="加载中" class="h-20" />
                </template>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
          <el-button type="primary" @click="handlerCreateOrUpdagte"> 保存 </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue"
import CodeMirror from "@@/components/CodeMirror/index.vue"
import { type codebook, type createOrUpdateCodebookReq } from "@/api/codebook/types/codebook"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { createCodebookApi, updateCodebookApi } from "@/api/codebook"
import { findByUserIdApi, listUsersByKeywordApi } from "@/api/user"
import { usePagination } from "@/hooks/usePagination"
import { user } from "@/api/user/types/user"

const init = {
  total: 0,
  currentPage: 1,
  pageSizes: [10, 20, 50],
  pageSize: 5,
  layout: "total, prev, pager, next"
}
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination(init)

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
  owner: 0,
  name: "",
  code: "",
  language: "",
  identifier: ""
}

const formData = ref<createOrUpdateCodebookReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入管理员", trigger: "blur" }],
  identifier: [{ required: true, message: "必须输入唯一标识", trigger: "blur" }]
}

const handlerCreateOrUpdagte = () => {
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
    const api = props.createOrUpdate === "create" ? createCodebookApi : updateCodebookApi
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

const loading = ref<boolean>(false)
const keyword = ref<string>("")
const remoteMethod = (query: string) => {
  if (query) {
    keyword.value = query

    nextTick(() => {
      setTimeout(() => {
        listUsersData()
      }, 500)
    })
  } else {
    usersData.value = []
  }
}

const usersData = ref<user[]>([])
const listUsersData = () => {
  listUsersByKeywordApi({
    keyword: keyword.value,
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      usersData.value = data.users
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
}

const setOwnerForm = () => {
  findByUserIdApi(formData.value.owner)
    .then(({ data }) => {
      usersData.value = [data]

      // 给定默认负责人
      if (formData.value.owner === 0) {
        formData.value.owner = data.id
      }
    })
    .catch(() => {
      usersData.value = []
    })
    .finally(() => {})
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

    // 设置负责人展示
    setOwnerForm()
  },
  { immediate: true }
)
</script>
