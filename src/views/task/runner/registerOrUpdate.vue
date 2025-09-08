<template>
  <div class="runner-form-container">
    <div class="form-header">
      <h3 class="form-title">执行器配置</h3>
      <p class="form-description">配置执行器的基本信息和运行参数</p>
    </div>

    <el-form
      ref="formRef"
      label-position="top"
      :model="formData"
      :rules="formRules"
      label-width="auto"
      class="runner-form"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="执行器名称" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入执行器名称" size="large" clearable />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="worker_name" label="工作节点名称" class="form-item">
            <el-select v-model="formData.worker_name" placeholder="请选择工作节点" size="large" clearable filterable>
              <el-option v-for="item in workers" :key="item.id" :label="getLabel(item)" :value="item.name" />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Document /></el-icon>
          <span>任务模版配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="codebook_uid" label="任务模版标识" class="form-item">
            <el-select v-model="formData.codebook_uid" placeholder="请选择任务模版" size="large" clearable filterable>
              <el-option v-for="item in codebooks" :key="item.id" :label="item.name" :value="item.identifier" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="codebook_secret" label="任务模版密钥" class="form-item">
            <el-input disabled v-model="formData.codebook_secret" size="large" placeholder="选择模版后自动填充" />
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><PriceTag /></el-icon>
          <span>标签配置</span>
        </div>

        <div class="form-row">
          <el-form-item prop="tags" class="form-item">
            <tag v-model="formData.tags" @change="handleTagsChange" />
          </el-form-item>
        </div>
      </div>

      <!-- 变量配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>变量配置</span>
        </div>

        <div class="form-row">
          <el-form-item class="form-item">
            <variable v-model="formData.variables" @change="handleVariablesChange" />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { Setting, Document, PriceTag } from "@element-plus/icons-vue"
import { registerOrUpdateReq, runner, variables } from "@/api/runner/types/runner"
import { registerRunnerApi, updateRunnerAPi } from "@/api/runner"
import variable from "./variable.vue"
import { codebook } from "@/api/codebook/types/codebook"
import { worker } from "@/api/worker/types/worker"
import { listWorkerApi } from "@/api/worker/worker"
import { listCodebookApi } from "@/api/codebook"
import tag from "./tag.vue"

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

// const dialogTagVisible = ref<boolean>(false)
// const handlerTag = () => {
//   dialogTagVisible.value = !dialogTagVisible.value
// }
// const handlerAddTag = (data: string) => {
//   formData.value.tags.push(data)
//   dialogTagVisible.value = false
// }

// const handlerCloseTag = () => {
//   dialogTagVisible.value = false
// }

// 处理标签变化
const handleTagsChange = (tags: string[]) => {
  formData.value.tags = tags
}

// 处理变量变化
const handleVariablesChange = (variables: variables[]) => {
  formData.value.variables = variables
}

const DEFAULT_FORM_DATA: registerOrUpdateReq = {
  name: "",
  worker_name: "",
  topic: "",
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

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? registerRunnerApi : updateRunnerAPi

    // 写入TOPIC
    const matchedWorker = workers.value.find((item) => item.name === formData.value.worker_name)
    formData.value = {
      ...formData.value,
      topic: matchedWorker?.topic || "default_topic"
    }
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
.runner-form-container {
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.form-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;

  .form-title {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: #1f2937;
  }

  .form-description {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
  }
}

.runner-form {
  .form-section {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 8px;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 8px;
      font-size: 18px;
      color: #3b82f6;
    }

    span {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }

      &.is-focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .label-with-tip {
    display: flex;
    align-items: center;
    gap: 6px;

    .tip-icon {
      font-size: 14px;
      color: #9ca3af;
      cursor: help;

      &:hover {
        color: #6b7280;
      }
    }
  }

  .tags-select {
    :deep(.el-select__wrapper) {
      min-height: 40px;
      padding: 4px 8px;
    }

    :deep(.el-tag) {
      border-radius: 6px;
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;

      .el-tag__close {
        color: #6b7280;

        &:hover {
          background: #dbeafe;
          color: #1e40af;
        }
      }
    }
  }

  .empty-tags {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    color: #9ca3af;

    .el-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }

    span {
      font-size: 14px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .runner-form-container {
    padding: 16px;
  }

  .form-header {
    margin-bottom: 24px;

    .form-title {
      font-size: 18px;
    }
  }

  .runner-form {
    .section-title {
      padding: 10px 12px;

      .section-icon {
        font-size: 16px;
      }

      span {
        font-size: 14px;
      }
    }
  }
}
</style>
