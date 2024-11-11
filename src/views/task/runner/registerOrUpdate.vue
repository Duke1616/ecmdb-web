<template>
  <div>
    <el-form ref="formRef" label-position="top" :model="formData" :rules="formRules" label-width="auto">
      <el-form-item prop="name" label="执行器名称">
        <el-input v-model="formData.name" placeholder="请输入执行器名称" />
      </el-form-item>
      <el-form-item prop="worker_name" label="工作节点名称">
        <el-select v-model="formData.worker_name" placeholder="请选择工作节点">
          <el-option v-for="item in workers" :key="item.id" :label="getLabel(item)" :value="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item prop="codebook_uid" label="任务模版标识">
        <el-select v-model="formData.codebook_uid" placeholder="请选择工作节点">
          <el-option v-for="item in codebooks" :key="item.id" :label="item.name" :value="item.identifier" />
        </el-select>
      </el-form-item>
      <el-form-item prop="codebook_secret" label="任务模版密钥">
        <el-input disabled v-model="formData.codebook_secret" />
      </el-form-item>
      <el-form-item prop="tags">
        <template #label>
          标签
          <span class="highlight-text">（自动化任务是根据【标签】 + 【任务模版标识】进行匹配工作节点）</span>
        </template>
        <div class="select-container">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            remote
            placeholder=""
            :show-arrow="false"
            suffix-icon=""
            tag-type="info"
          >
            <!-- 选项内容 -->
          </el-select>

          <el-button class="select-button" :icon="Plus" @click="handlerTag" />
          <tag
            :dialogTagVisible="dialogTagVisible"
            :tags="formData.tags"
            @close="handlerCloseTag"
            @add-tag="handlerAddTag"
          />
        </div>
      </el-form-item>
      <!-- 变量配置 -->
      <variable
        :dialogVariable="dialogVariable"
        :varibales="formData.variables"
        @close="handlerCloseVariable"
        @add-varibale="handlerAddVaribale"
        @del-varibale="handlerDelVaribale"
      />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { registerOrUpdateReq, runner, variables } from "@/api/runner/types/runner"
import { registerRunnerApi, updateRunnerAPi } from "@/api/runner"
import { Plus } from "@element-plus/icons-vue"
import variable from "./variable.vue"
import tag from "./tag.vue"
import { codebook } from "@/api/codebook/types/codebook"
import { worker } from "@/api/worker/types/worker"
import { listWorkerApi } from "@/api/worker/worker"
import { listCodebookApi } from "@/api/codebook"

const emits = defineEmits(["closed", "callback"])
const onClosed = () => {
  emits("closed")
}

const getLabel = (item: worker) => {
  return `${item.name} -【 topic: ${item.topic} 】`
}

const computedSecret = computed(() => {
  const selectedCodebook = codebooks.value.find((item) => item.identifier === formData.value.codebook_uid)

  return selectedCodebook ? selectedCodebook.secret : ""
})

const dialogTagVisible = ref<boolean>(false)
const handlerTag = () => {
  dialogTagVisible.value = !dialogTagVisible.value
}
const handlerAddTag = (data: string) => {
  formData.value.tags.push(data)
  dialogTagVisible.value = false
}

const handlerCloseTag = () => {
  dialogTagVisible.value = false
}

const dialogVariable = ref(false)
const handlerCloseVariable = () => {
  dialogVariable.value = false
}

const DEFAULT_FORM_DATA: registerOrUpdateReq = {
  name: "",
  worker_name: "",
  codebook_uid: "",
  codebook_secret: "",
  desc: "",
  tags: [],
  variables: []
}

const formData = ref<registerOrUpdateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入执行器名称", trigger: "blur" }],
  worker_name: [{ required: true, message: "必须输入工作节点名称", trigger: "blur" }],
  codebook_uid: [{ required: true, message: "必须输入任务模版唯一标识", trigger: "blur" }],
  codebook_secret: [{ required: true, message: "必须输入任务模版密钥", trigger: "blur" }],
  tags: [{ required: true, message: "必须输入标签", trigger: "blur" }]
}

const handlerAddVaribale = (data: variables) => {
  formData.value.variables?.push({ ...data })
}

const handlerDelVaribale = (key: string) => {
  formData.value.variables = formData.value.variables?.filter((variable) => variable.key !== key)
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? registerRunnerApi : updateRunnerAPi
    api(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
        emits("callback")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

/** 查询模版列表 */
const codebooks = ref<codebook[]>([])
const listCodebookDagta = () => {
  listCodebookApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      codebooks.value = data.codebooks
    })
    .catch(() => {
      codebooks.value = []
    })
    .finally(() => {})
}

/** 查询流程列表 */
const workers = ref<worker[]>([])
const listWorkerData = () => {
  listWorkerApi({
    offset: 0,
    limit: 100
  })
    .then(({ data }) => {
      workers.value = data.workers
    })
    .catch(() => {
      workers.value = []
    })
    .finally(() => {})
}

const setFrom = (row: runner) => {
  formData.value = cloneDeep(row)

  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

onMounted(() => {
  listCodebookDagta()
  listWorkerData()
})

defineExpose({
  submitForm,
  setFrom,
  resetForm
})

watch(
  () => computedSecret.value,
  (val) => {
    formData.value.codebook_secret = val
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.select-container {
  display: flex;
  justify-items: center;
  align-items: center;
  width: 100%;
}
.highlight-text {
  color: red;
}
</style>
