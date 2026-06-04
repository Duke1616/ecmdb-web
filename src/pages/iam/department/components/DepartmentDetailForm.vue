<template>
  <div class="department-form-inner">
    <div class="governance-section is-first-section">
      <div class="section-header">
        <div class="header-title">
          <el-icon><OfficeBuilding /></el-icon>
          <span>基础属性配置</span>
        </div>
      </div>

      <el-form ref="formRef" :model="localFormData" :rules="formRules" label-position="top" class="governance-form">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="部门名称" prop="name">
              <el-input v-model="localFormData.name" placeholder="请输入部门名称" class="gov-input" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级部门" prop="parent_id">
              <el-tree-select
                v-model="localFormData.parent_id"
                :data="props.departmentData"
                node-key="id"
                :render-after-expand="false"
                :expand-on-click-node="false"
                show-checkbox
                check-strictly
                check-on-click-node
                :props="defaultProps"
                placeholder="请选择上级部门"
                class="modern-select"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="部门主管" prop="leaders">
              <UserPicker
                v-model="localFormData.leaders"
                placeholder="选择部门主管"
                :multiple="true"
                :default-to-current-user="false"
                class="modern-select"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分管领导" prop="main_leader">
              <UserPicker
                v-model="localFormData.main_leader"
                placeholder="选择分管领导"
                :default-to-current-user="false"
                class="modern-select"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { OfficeBuilding } from "@element-plus/icons-vue"
import type { IDepartmentNode } from "@/api/iam/department/type"
import UserPicker from "@/common/components/UserPicker/index.vue"

interface IDepartmentFormState {
  id: number
  parent_id?: number
  name: string
  sort: number
  leaders: string[]
  main_leader: string
}

interface IDepartmentDetailFormProps {
  formData: IDepartmentFormState
  departmentData: IDepartmentNode[]
}

const props = defineProps<IDepartmentDetailFormProps>()

// NOTE: 为遵守 ESLint 规则并避免在模板中直接修改 props 对象属性，本地声明 localFormData 代理引用
const localFormData = props.formData

const formRef = ref<FormInstance | null>(null)

const defaultProps = {
  children: "children",
  label: (node: IDepartmentNode) => node.name,
  key: "id"
}

const formRules: FormRules = {
  name: [{ required: true, message: "部门名称不能为空", trigger: "blur" }]
}

defineExpose({
  formRef
})
</script>

<style lang="scss" scoped>
.department-form-inner {
  padding: 8px 12px;
}

.governance-section {
  position: relative;
  margin-top: 12px;

  &.is-first-section {
    margin-top: 0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f1f5f9;

    .header-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
      .el-icon {
        color: #3b82f6;
      }
    }
  }
}

.gov-input {
  width: 100%;
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    height: 38px;
    border-radius: 8px;
    transition: all 0.2s;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus,
    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
    }
  }
}

.form-input-number {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    height: 38px;
    border-radius: 8px;
    transition: all 0.2s;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
    }
  }
}

.modern-select {
  width: 100%;
  :deep(.el-select__wrapper) {
    border-radius: 8px;
    height: 38px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    &:hover {
      border-color: #cbd5e1;
    }
    &.is-focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08) !important;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px !important;
  line-height: 1.5;
}
</style>

<style lang="scss">
.department-form-inner .generic-picker-container {
  .picker-input-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    min-height: 38px;
    height: auto;
    box-shadow: none;
    transition: all 0.2s ease;

    &:hover {
      border-color: #cbd5e1;
    }

    &.is-focus {
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
    }
  }

  &.is-single {
    .picker-input-box {
      height: 38px;
      min-height: 38px;
    }
  }

  &.is-multiple {
    .picker-input-box {
      padding: 4px 12px;
      min-height: 38px;
      height: auto;
    }
  }

  .selected-tags {
    gap: 4px;
    min-height: 22px;
  }

  .picker-tag {
    padding: 1px 4px;
    border-radius: 6px;
    font-size: 11px;
    height: 24px;
    display: flex;
    align-items: center;

    .user-avatar {
      width: 16px;
      height: 16px;
      font-size: 9px;
      box-shadow: none;
    }

    .user-name {
      font-size: 11px;
      margin: 0 4px;
    }
  }
}
</style>
