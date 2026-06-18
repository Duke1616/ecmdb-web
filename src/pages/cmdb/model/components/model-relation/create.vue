<template>
  <Drawer
    v-model="visible"
    :title="activeRelation ? '编辑关联' : '新建关联'"
    subtitle="配置模型之间的关联关系"
    size="35%"
    direction="rtl"
    header-icon="Link"
    :show-footer="true"
    cancel-button-text="取消"
    confirm-button-text="保存关联"
    :confirm-loading="loading"
    @cancel="visible = false"
    @confirm="handleSubmit"
    @closed="handleClosed"
  >
    <div class="form-container" v-if="visible">
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
                  <el-option v-for="item in group.models || []" :key="item.id" :label="item.name" :value="item.uid" />
                </el-option-group>
              </el-select>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item label="目标模型" prop="target_model_uid" class="form-item">
              <el-select v-model="formData.target_model_uid" placeholder="请选择目标模型" size="large" clearable>
                <el-option-group v-for="group in modelData" :key="group.group_id" :label="group.group_name">
                  <el-option v-for="item in group.models || []" :key="item.id" :label="item.name" :value="item.uid" />
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
                <el-option v-for="item in mappingOptions" :key="item.label" :label="item.label" :value="item.value">
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
  </Drawer>
</template>

<script lang="ts" setup>
import { watch } from "vue"
import { useModelStore } from "@/pinia/stores/model"
import { Drawer } from "@@/components/Dialogs"
import { type ListRelationTypeData, type ModelRelation } from "@/api/cmdb/relation/types/relation"
import { Setting, Link } from "@element-plus/icons-vue"
import { useModelRelationForm } from "../../composables/useModelRelationForm"

interface Props {
  modelUid: string
  relationTypeData: ListRelationTypeData[]
  activeRelation: ModelRelation | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  success: []
}>()

// NOTE: 该组件为纯 UI 控制组件，Drawer 显隐状态需由父组件双向绑定统一管理
const visible = defineModel<boolean>({ default: false })

const modelData = useModelStore().modelsData

const {
  MAPPING_OPTIONS: mappingOptions,
  formRef,
  formData,
  formRules,
  loading,
  setEditData,
  resetForm,
  handleCreate
} = useModelRelationForm(props)

const handleSubmit = async () => {
  const success = await handleCreate()
  if (success) {
    visible.value = false
    emit("success")
  }
}

const handleClosed = () => {
  resetForm()
}

// 声明式监听活动行数据变化进行初始化与重置
watch(
  () => props.activeRelation,
  (newVal) => {
    if (newVal) setEditData(newVal)
    else resetForm()
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
