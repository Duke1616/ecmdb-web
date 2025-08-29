<template>
  <el-drawer v-model="visible" :show-close="false" :with-header="false" @closed="resetForm" class="modern-drawer">
    <div class="drawer-content">
      <div class="header-info">
        <h3>新建关联</h3>
        <p>创建模型之间的关联关系</p>
      </div>

      <el-form
        :model="formData"
        size="small"
        label-width="auto"
        ref="formRef"
        :rules="formRules"
        label-position="top"
        class="relation-form"
      >
        <div class="form-section">
          <h4 class="section-title">基本信息</h4>

          <el-form-item label="源模型" prop="source_model_uid">
            <el-select v-model="formData.source_model_uid" placeholder="请选择源模型" class="form-select" size="small">
              <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
                <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item label="目标模型" prop="target_model_uid">
            <el-select
              v-model="formData.target_model_uid"
              placeholder="请选择目标模型"
              class="form-select"
              size="small"
            >
              <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
                <el-option v-for="item in group.models" :key="item.id" :label="item.name" :value="item.uid" />
              </el-option-group>
            </el-select>
          </el-form-item>
        </div>

        <div class="form-section">
          <h4 class="section-title">关联配置</h4>

          <el-form-item label="关联类型" prop="relation_type_uid">
            <el-select
              v-model="formData.relation_type_uid"
              placeholder="请选择关联类型"
              class="form-select"
              size="small"
            >
              <el-option
                v-for="item in props.relationTypeData"
                :key="item.id"
                :label="`${item.name}(${item.uid})`"
                :value="item.uid"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="源→目标约束" prop="mapping">
            <el-select v-model="formData.mapping" placeholder="请选择约束类型" class="form-select" size="small">
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

          <el-form-item label="关联描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入关联描述（可选）"
              class="form-textarea"
              size="small"
            />
          </el-form-item>
        </div>
      </el-form>

      <div class="form-actions">
        <el-button @click="handleClose" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="handleCreate" class="save-btn" :loading="loading"> 保存关联 </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import { CreateModelRelationApi } from "@/api/relation"
import { type CreateModelRelationReq, type ListRelationTypeData } from "@/api/relation/types/relation"
import { cloneDeep } from "lodash-es"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"

interface Props {
  modelUid: string
  relationTypeData: ListRelationTypeData[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

const visible = defineModel<boolean>("visible")

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
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)

    loading.value = true
    CreateModelRelationApi(formData.value)
      .then(() => {
        ElMessage.success("关联创建成功")
        handleClose()
        emit("success")
      })
      .finally(() => {
        loading.value = false
      })
  })
}

const handleClose = () => {
  visible.value = false
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_MODEL_RELATION)
}

watch(
  () => props.modelUid,
  (newUid) => {
    formData.value.source_model_uid = newUid
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
:deep(.modern-drawer) {
  .el-drawer__body {
    padding: 0;
  }
}

.drawer-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;

  .header-info {
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 6px 0;
    }

    p {
      color: #6b7280;
      margin: 0;
      line-height: 1.4;
      font-size: 14px;
    }
  }

  .relation-form {
    flex: 1;

    .form-section {
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
      }

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 12px 0;
      }
    }

    .el-form-item {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .el-form-item__label {
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        font-size: 14px;
      }

      .form-select,
      .form-textarea {
        width: 100%;

        :deep(.el-input__wrapper),
        :deep(.el-textarea__inner) {
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          transition: all 0.2s;

          &:hover {
            border-color: #3b82f6;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
          }
        }
      }
    }

    .mapping-option {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .mapping-value {
        font-weight: 600;
        color: #1f2937;
        font-family: "Monaco", "Menlo", monospace;
      }

      .mapping-desc {
        color: #6b7280;
        font-size: 12px;
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e5e7eb;

    .cancel-btn {
      background: #f9fafb;
      color: #6b7280;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px 16px;
      font-size: 14px;

      &:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }
    }

    .save-btn {
      background: #3b82f6;
      border-color: #3b82f6;
      border-radius: 6px;
      padding: 8px 16px;
      font-weight: 600;
      font-size: 14px;

      &:hover {
        background: #2563eb;
        border-color: #2563eb;
      }
    }
  }
}
</style>
