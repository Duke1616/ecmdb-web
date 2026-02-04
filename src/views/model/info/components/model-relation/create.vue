<template>
  <!-- 主内容区域 -->
  <div class="form-container">
    <el-form
      :model="formData"
      size="large"
      label-width="auto"
      ref="formRef"
      :rules="formRules"
      label-position="top"
      class="relation-form"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>基本信息</span>
        </div>

        <div class="form-row">
          <el-form-item label="源模型" prop="source_model_uid" class="form-item">
            <el-select v-model="formData.source_model_uid" placeholder="请选择源模型" size="large" clearable>
              <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
                <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="目标模型" prop="target_model_uid" class="form-item">
            <el-select v-model="formData.target_model_uid" placeholder="请选择目标模型" size="large" clearable>
              <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
                <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon class="section-icon"><Link /></el-icon>
          <span>关联配置</span>
        </div>

        <div class="form-row">
          <el-form-item label="关联类型" prop="relation_type_uid" class="form-item">
            <el-select v-model="formData.relation_type_uid" placeholder="请选择关联类型" size="large" clearable>
              <el-option
                v-for="item in props.relationTypeData"
                :key="item.id"
                :label="`${item.name}(${item.uid})`"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="源→目标约束" prop="mapping" class="form-item">
            <el-select v-model="formData.mapping" placeholder="请选择约束类型" size="large" clearable>
              <el-option v-for="item in mapping" :key="item.label" :label="item.label" :value="item.value">
                <template #default>
                  <div class="mapping-option">
                    <span class="mapping-value">{{ item.value }}</span>
                    <span class="mapping-desc">{{ item.description }}</span>
                  </div>
                </template>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="关联描述" prop="description" class="form-item">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入关联描述（可选）"
              size="large"
            />
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import { CreateModelRelationApi, UpdateModelRelationApi } from "@/api/relation"
import {
  type CreateModelRelationReq,
  type ListRelationTypeData,
  type ModelRelation
} from "@/api/relation/types/relation"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { Setting, Link } from "@element-plus/icons-vue"

interface Props {
  modelUid: string
  relationTypeData: ListRelationTypeData[]
  editData?: ModelRelation
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

const modelData = useModelStore().modelsData
const loading = ref(false)

const DEFAULT_MODEL_RELATION: CreateModelRelationReq = {
  source_model_uid: props.modelUid,
  target_model_uid: "",
  relation_type_uid: "",
  mapping: "",
  description: undefined
}

const formRef = ref<FormInstance | null>(null)
const formData = ref<CreateModelRelationReq>(cloneDeep(DEFAULT_MODEL_RELATION))

// 设置编辑数据
const setEditData = (data: ModelRelation) => {
  formData.value = {
    source_model_uid: data.source_model_uid,
    target_model_uid: data.target_model_uid,
    relation_type_uid: data.relation_type_uid,
    mapping: data.mapping,
    description: undefined
  }
}

const formRules: FormRules<CreateModelRelationReq> = {
  source_model_uid: [{ required: true, trigger: "blur", message: "必须选择源模型" }],
  target_model_uid: [{ required: true, trigger: "blur", message: "必须选择目标模型" }],
  relation_type_uid: [{ required: true, trigger: "blur", message: "必须选择关联类型" }],
  mapping: [{ required: true, trigger: "blur", message: "必须选择关联映射关系" }]
}

const mapping = [
  {
    value: "1-1",
    label: "1-1",
    description: "一对一关系"
  },
  {
    value: "1-N",
    label: "1-N",
    description: "一对多关系"
  },
  {
    value: "N-N",
    label: "N-N",
    description: "多对多关系"
  }
]

const handleCreate = () => {
  return new Promise((resolve, reject) => {
    formRef.value?.validate((valid: boolean, fields) => {
      if (!valid) {
        console.error("表单校验不通过", fields)
        reject(false)
        return
      }

      loading.value = true
      const api = props.editData ? UpdateModelRelationApi : CreateModelRelationApi
      const payload: any = { ...formData.value }

      // 如果是更新，需要带上 ID
      if (props.editData && props.editData.id) {
        payload.id = props.editData.id
      }

      api(payload)
        .then(() => {
          ElMessage.success(props.editData ? "关联更新成功" : "关联创建成功")
          resetForm()
          emit("success")
          resolve(true)
        })
        .catch((error) => {
          console.log("catch", error)
          reject(false)
        })
        .finally(() => {
          loading.value = false
        })
    })
  })
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_MODEL_RELATION)
}

defineExpose({
  handleCreate,
  setEditData,
  resetForm
})

watch(
  () => props.modelUid,
  (newUid) => {
    formData.value.source_model_uid = newUid
  },
  { immediate: true }
)

// 监听编辑数据变化
watch(
  () => props.editData,
  (newEditData) => {
    if (newEditData) {
      setEditData(newEditData)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.form-container {
  padding: 20px;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.relation-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    padding: 10px 14px;
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
  }

  .form-row {
    margin-bottom: 16px;

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

    :deep(.el-textarea__inner) {
      border-radius: 6px;
      border: 1px solid #d1d5db;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }
    }
  }

  .mapping-option {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .mapping-value {
      font-weight: 500;
      color: #1f2937;
      font-family: "Monaco", "Menlo", monospace;
    }

    .mapping-desc {
      color: #6b7280;
      font-size: 12px;
    }
  }
}
</style>
