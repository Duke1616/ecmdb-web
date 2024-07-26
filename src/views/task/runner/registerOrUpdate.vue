<template>
  <div>
    <el-drawer
      class="add-drawer"
      v-model="dialogDrawer"
      :title="props.createOrUpdate === 'create' ? '添加' : '修改'"
      size="33%"
      @closed="onClosed"
    >
      <el-form ref="formRef" label-position="top" :model="formData" :rules="formRules" label-width="auto">
        <el-form-item prop="name" label="服务名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item prop="worker_name" label="工作节点名称">
          <el-input v-model="formData.worker_name" placeholder="请输入工作节点名称" />
        </el-form-item>
        <el-form-item prop="codebook_uid" label="任务模版标识">
          <template #label>
            任务模版标识
            <span v-if="props.createOrUpdate !== 'create'" class="highlight-text">（禁止修改）</span>
          </template>
          <el-input
            v-model="formData.codebook_uid"
            :disabled="props.createOrUpdate !== 'create'"
            placeholder="请输入任务模版唯一标识"
          />
        </el-form-item>
        <el-form-item prop="codebook_secret" label="任务模版密钥">
          <el-input v-model="formData.codebook_secret" placeholder="请输入任务模版密钥" />
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
import { ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { registerOrUpdateReq, runner, variables } from "@/api/runner/types/runner"
import { registerRunnerApi, updateRunnerAPi } from "@/api/runner"
import { Plus } from "@element-plus/icons-vue"
import variable from "./variable.vue"
import tag from "./tag.vue"

// 接收父组建传递
interface Props {
  dialogVisible: boolean
  createOrUpdate: string
  runnerRow: runner
}

const dialogDrawer = ref<boolean>(false)
const dialogTagVisible = ref<boolean>(false)
const props = defineProps<Props>()
const emits = defineEmits(["close", "list-runners"])
const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  emits("close", false)
}

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

const DEFAULT_FORM_DATA: registerOrUpdateReq = {
  id: 0,
  name: "",
  worker_name: "",
  codebook_uid: "",
  codebook_secret: "",
  desc: "",
  tags: [],
  variables: []
}

const dialogVariable = ref(false)
const handlerCloseVariable = () => {
  dialogVariable.value = false
}

const formData = ref<registerOrUpdateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
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

const handlerCreateOrUpdagte = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = props.createOrUpdate === "create" ? registerRunnerApi : updateRunnerAPi
    api(formData.value)
      .then(() => {
        dialogDrawer.value = false
        ElMessage.success("保存成功")
        emits("list-runners")
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
  () => props.runnerRow,
  (val: runner) => {
    console.log(val, "123")
    formData.value = cloneDeep(val)
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
