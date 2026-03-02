<template>
  <div class="runner-form-container">
    <el-form
      ref="formRef"
      label-position="top"
      :model="formData"
      :rules="formRules"
      label-width="auto"
      class="runner-form"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item prop="name" label="执行器名称" class="form-item">
            <el-input v-model="formData.name" disabled placeholder="自动生成：模版名称（目标节点）" size="large" />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item prop="kind" label="运行模式" class="form-item">
            <div class="run-mode-selector">
              <div
                class="mode-card"
                :class="{ 'is-active': formData.kind === Kind.GRPC }"
                @click="onKindChange(Kind.GRPC)"
              >
                <div class="mode-card__icon">
                  <el-icon><Monitor /></el-icon>
                </div>
                <div class="mode-card__body">
                  <span class="mode-card__title">
                    分布式调度
                    <span class="recommend-tag">推荐</span>
                  </span>
                  <span class="mode-card__desc">调度平台节点分发</span>
                </div>
                <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
              </div>

              <div
                class="mode-card"
                :class="{ 'is-active': formData.kind === Kind.KAFKA }"
                @click="onKindChange(Kind.KAFKA)"
              >
                <div class="mode-card__icon">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="mode-card__body">
                  <span class="mode-card__title">消息推送</span>
                  <span class="mode-card__desc">消息队列异步分发</span>
                </div>
                <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </el-form-item>
        </div>

        <!-- KAFKA 模式：工作节点 + handler 级联选择器 -->
        <WorkerSection
          v-if="formData.kind === Kind.KAFKA"
          v-model:target="formData.target"
          v-model:handler="formData.handler"
        />

        <!-- GRPC 模式：执行器 + handler 级联选择器 -->
        <ExecuteSection
          v-if="formData.kind === Kind.GRPC"
          v-model:target="formData.target"
          v-model:handler="formData.handler"
        />
      </div>

      <!-- 任务模版配置（仅独立使用时展示） -->
      <div class="form-section" v-if="!hideCodebookConfig">
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

      <!-- 标签配置 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><PriceTag /></el-icon>
          <span>标签配置</span>
          <el-tooltip content="自动化任务是根据【标签】 + 【任务模版标识】进行匹配工作节点" placement="right">
            <el-icon class="tip-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
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
          <el-tooltip content="配置执行器运行时需要的环境变量和参数" placement="right">
            <el-icon class="tip-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
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
import {
  Setting,
  Document,
  PriceTag,
  QuestionFilled,
  Connection,
  Monitor,
  CircleCheckFilled
} from "@element-plus/icons-vue"
import { registerOrUpdateReq, variables, Kind } from "@/api/runner/types/runner"
import { registerRunnerApi, updateRunnerAPi } from "@/api/runner"
import { useCodebooks } from "./composables/useCodebooks"
import WorkerSection from "./components/WorkerSection.vue"
import ExecuteSection from "./components/ExecuteSection.vue"
import variable from "./variable.vue"
import tag from "./tag.vue"

const props = defineProps<{
  hideCodebookConfig?: boolean
  presetCodebookName?: string
}>()

const emits = defineEmits(["closed", "callback"])

// ── 表单数据 ────────────────────────────────────────────────────────────────
const DEFAULT_FORM_DATA: registerOrUpdateReq = {
  name: "",
  codebook_uid: "",
  codebook_secret: "",
  kind: Kind.GRPC,
  desc: "",
  tags: [],
  variables: [],
  target: "",
  handler: ""
}

const formData = ref<registerOrUpdateReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

// ── 校验规则 ────────────────────────────────────────────────────────────────
const formRules: FormRules = {
  name: [{ required: true, message: "必须输入执行器名称", trigger: "blur" }],
  kind: [{ required: true, message: "必须选择运行模式", trigger: "change" }],
  target: [{ required: true, message: "必须选取目标/服务", trigger: "change" }],
  handler: [
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          return callback(new Error("必须选择执行处理器"))
        }
        callback()
      },
      trigger: "change"
    }
  ],
  codebook_uid: [{ required: true, message: "必须输入任务模版唯一标识", trigger: "blur" }],
  codebook_secret: [{ required: true, message: "必须输入任务模版密钥", trigger: "blur" }],
  tags: [{ required: true, message: "必须输入标签", trigger: "blur" }]
}

// ── Composables ─────────────────────────────────────────────────────────────
const { codebooks, fetchCodebooks } = useCodebooks(formData)

// ── 计算属性 ────────────────────────────────────────────────────────────────
/** 当前 codebook 名称：优先取父组件注入，其次从列表匹配 */
const codebookName = computed(() => {
  if (props.presetCodebookName) return props.presetCodebookName
  const matched = codebooks.value.find((item) => item.identifier === formData.value.codebook_uid)
  return matched?.name ?? ""
})

// ── 自动生成执行单元名称 ──────────────────────────────────────────────────────
watch(
  () => [codebookName.value, formData.value.target, formData.value.handler] as const,
  ([cName, target, handler]) => {
    if (cName && target) {
      const targetStr = handler ? `${target}/${handler}` : target
      formData.value.name = `${cName}（${targetStr}）`
    } else if (cName) {
      formData.value.name = `${cName}（）`
    }
  },
  { deep: true, immediate: true }
)

// ── 表单操作 ────────────────────────────────────────────────────────────────
const onKindChange = (kind: Kind) => {
  formData.value.kind = kind
  formData.value.target = ""
  formData.value.handler = ""
}

const handleTagsChange = (tags: string[]) => {
  formData.value.tags = tags
}

const handleVariablesChange = (vars: variables[]) => {
  formData.value.variables = vars
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    const api = formData.value.id === undefined ? registerRunnerApi : updateRunnerAPi
    const submitData = cloneDeep(formData.value)

    api(submitData)
      .then(() => {
        emits("closed")
        ElMessage.success("保存成功")
        emits("callback")
      })
      .catch((error) => {
        console.error("submit error", error)
      })
  })
}

const setFrom = (row: any) => {
  const data = cloneDeep(row)
  // 兼容旧数据的扁平化处理
  if (!data.kind && data.run_mode) {
    data.kind = data.run_mode === "WORKER" ? Kind.KAFKA : Kind.GRPC
  }
  if (!data.target) {
    data.target = data.worker?.topic || ""
  }
  formData.value = data
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

// ── 生命周期 ────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchCodebooks()
})

defineExpose({ submitForm, setFrom, resetForm })
</script>

<style lang="scss" scoped>
.runner-form-container {
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.runner-form {
  .form-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 运行模式卡片选择器
  .run-mode-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    width: 100%;

    .mode-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #fafafa;
      position: relative;
      user-select: none;

      &:hover {
        border-color: #93c5fd;
        background: #f0f7ff;
      }

      &.is-active {
        border-color: #3b82f6;
        background: #eff6ff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

        .mode-card__icon .el-icon {
          color: #3b82f6;
        }

        .mode-card__title {
          color: #1d4ed8;
        }

        .mode-card__check {
          opacity: 1;
          color: #3b82f6;
        }
      }

      &__icon {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: #e0e7ff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
          font-size: 18px;
          color: #6366f1;
          transition: color 0.2s ease;
        }
      }

      &__body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;
      }

      &__title {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
        line-height: 1;
        transition: color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;

        .recommend-tag {
          font-size: 10px;
          padding: 0 6px;
          background: #fef3c7;
          color: #d97706;
          border-radius: 4px;
          font-weight: 600;
          border: 1px solid #fde68a;
          display: inline-flex;
          align-items: center;
          height: 16px;
          line-height: 1;
        }
      }

      &__desc {
        font-size: 11px;
        color: #9ca3af;
        line-height: 1.3;
      }

      &__check {
        font-size: 18px;
        opacity: 0;
        transition: opacity 0.2s ease;
        flex-shrink: 0;
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;

    .section-icon {
      margin-right: 6px;
      font-size: 16px;
      color: #3b82f6;
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .tip-icon {
      margin-left: 6px;
      font-size: 14px;
      color: #9ca3af;
      cursor: help;
      flex-shrink: 0;

      &:hover {
        color: #6b7280;
      }
    }
  }

  .form-row {
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
      font-size: 13px;
    }

    :deep(.el-input__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }
}

@media (max-width: 768px) {
  .runner-form-container {
    padding: 16px;
  }

  .runner-form {
    .form-section {
      margin-bottom: 20px;
    }

    .section-title {
      padding: 8px 12px;
      margin-bottom: 12px;

      .section-icon {
        font-size: 14px;
      }

      span {
        font-size: 13px;
      }
    }

    .form-row {
      margin-bottom: 12px;
    }
  }
}
</style>
