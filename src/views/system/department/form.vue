<template>
  <div class="department-form">
    <!-- 基础属性 -->
    <div class="form-section">
      <div class="section-title">
        <el-icon><OfficeBuilding /></el-icon>
        <span>基础属性</span>
      </div>

      <el-form ref="formRef" :model="formData" :inline-message="true" :rules="formRules">
        <div class="form-row">
          <div class="form-item required">
            <el-form-item label="部门名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入部门名称" class="form-input" />
            </el-form-item>
          </div>
          <div class="form-item">
            <el-form-item label="上级部门" prop="pid">
              <el-tree-select
                v-model="formData.pid"
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
              />
            </el-form-item>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <el-form-item label="部门主管" prop="leaders">
              <UserPicker
                v-model="selectedLeaders"
                placeholder="选择部门主管"
                :multiple="true"
                :default-to-current-user="false"
                class="modern-select"
              />
            </el-form-item>
          </div>
          <div class="form-item">
            <el-form-item label="分管领导" prop="main_leader">
              <UserPicker
                v-model="selectedMainLeaderUsername"
                placeholder="选择分管领导"
                :default-to-current-user="false"
                class="modern-select"
              />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 功能设置 -->
    <div class="form-section">
      <div class="section-title">
        <el-icon><Setting /></el-icon>
        <span>功能设置</span>
      </div>

      <el-form ref="formRef" :model="formData" :inline-message="true" :rules="formRules">
        <div class="form-row">
          <div class="form-item">
            <el-form-item label="部门排序" prop="sort">
              <el-input-number
                v-model="formData.sort"
                :min="0"
                :max="9999"
                placeholder="请输入排序值"
                controls-position="right"
                class="form-input-number"
              />
            </el-form-item>
          </div>
          <div class="form-item">
            <el-form-item label="部门状态" prop="enabled">
              <el-radio-group v-model="currentEnabled" class="form-radio-group">
                <el-radio-button
                  v-for="(item, index) in statusOptions"
                  :key="index"
                  :value="item.value"
                  :disabled="item.disabled"
                >
                  {{ item.label }}
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, computed } from "vue"
import { cloneDeep } from "lodash-es"
import { createOrUpdateDepartment, department } from "@/api/department/types/department"
import { createDepartmentApi, updateDepartmentApi } from "@/api/department"
import { OfficeBuilding, Setting } from "@element-plus/icons-vue"
import UserPicker from "@/common/components/UserPicker/index.vue"

// 用户选择相关
const selectedLeaders = ref<string[]>([])
const selectedMainLeaderUsername = ref<string>("")

// 树形选择器配置
const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

// 事件定义
const emits = defineEmits(["listDepartmentTreeData", "closed"])

// Props 定义
interface Props {
  departmentData: department[]
}
const props = defineProps<Props>()

// 默认表单数据
const DEFAULT_FORM_DATA: createOrUpdateDepartment = {
  name: "",
  sort: 0,
  enabled: true,
  main_leader: undefined
}

// 状态选项
const statusOptions = ref([
  { value: true, label: "开启", disabled: false },
  { value: false, label: "停用", disabled: false }
])

// 表单数据
const formData = ref<createOrUpdateDepartment>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "部门名称不能为空", trigger: "blur" }]
}

// 计算属性确保数据同步
const currentEnabled = computed({
  get: () => formData.value.enabled,
  set: (value) => {
    formData.value.enabled = value
  }
})

// 提交更新表单
const submitUpdateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 同步用户选择数据到表单数据
    formData.value.leaders = selectedLeaders.value
    formData.value.main_leader = selectedMainLeaderUsername.value

    updateDepartmentApi(formData.value)
      .then(() => {
        ElMessage.success("保存成功")
        resetForm()
        emits("listDepartmentTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

// 提交创建表单
const submitCreateForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 同步用户选择数据到表单数据
    formData.value.leaders = selectedLeaders.value
    formData.value.main_leader = selectedMainLeaderUsername.value

    createDepartmentApi(formData.value)
      .then((data) => {
        ElMessage.success("保存成功")
        resetForm()
        emits("closed", data.data)
        emits("listDepartmentTreeData")
      })
      .catch((error) => {
        console.log("catch", error)
      })
      .finally(() => {})
  })
}

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  selectedLeaders.value = []
  selectedMainLeaderUsername.value = ""
}

// 设置部门数据
const setDepartmentData = (form: department) => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(form)

  // 清空空值
  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })

  // 加载用户数据
  loadUserData(form)
}

// 设置上级部门
const setFromForPid = (pid: number | null) => {
  if (pid === null) return
  formData.value.pid = pid
}

// 加载用户数据
const loadUserData = (form: department) => {
  // 设置部门主管
  if (Array.isArray(form.leaders) && form.leaders.length > 0) {
    selectedLeaders.value = form.leaders
  } else {
    selectedLeaders.value = []
  }

  // 设置分管领导
  if (form.main_leader) {
    selectedMainLeaderUsername.value = form.main_leader
  } else {
    selectedMainLeaderUsername.value = ""
  }
}

defineExpose({
  submitCreateForm,
  submitUpdateForm,
  resetForm,
  setDepartmentData,
  setFromForPid
})
</script>

<style lang="scss" scoped>
.department-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

      .el-icon {
        font-size: 14px;
        color: #3b82f6;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .form-item {
      margin-bottom: 0;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
        position: relative;
        display: flex;
        align-items: center;

        &::before {
          content: "";
          display: inline-block;
          width: 16px;
          flex-shrink: 0;
        }
      }

      &.required {
        :deep(.el-form-item__label) {
          &::before {
            content: "*";
            color: #ef4444;
            font-size: 14px;
            font-weight: 600;
            margin-right: 0;
            display: inline-block;
            width: 16px;
            text-align: center;
          }
        }
      }

      .form-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }

        :deep(.el-input__inner) {
          font-size: 13px;
          color: #374151;
        }
      }

      .form-input-number {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }

      .form-radio-group {
        :deep(.el-radio-button__inner) {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          padding: 8px 16px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            color: #3b82f6;
          }
        }

        :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
          background: #409eff !important;
          border-color: #409eff !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }

        :deep(.el-radio-button.is-active .el-radio-button__inner) {
          background: #409eff !important;
          border-color: #409eff !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }

      // 只保留圆角样式
      .modern-select :deep(.el-select__wrapper) {
        border-radius: 10px;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .department-form {
    .form-section {
      margin-bottom: 24px;

      .section-title {
        padding: 10px 12px;
        margin-bottom: 16px;

        span {
          font-size: 13px;
        }
      }
    }
  }
}
</style>

<style lang="scss">
// UserPicker 在部门表单中的全局样式适配
.department-form .user-picker-container {
  .user-picker-input {
    background: #ffffff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 6px 12px;
    min-height: 36px;
    height: 36px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      background: #f9fafb;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  .selected-user {
    gap: 8px;
    justify-content: flex-start;
  }

  .user-avatar {
    width: 24px;
    height: 24px;
    font-size: 11px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .user-name {
    font-size: 12px;
    font-weight: 500;
  }

  .placeholder-text {
    font-size: 12px;
    color: #9ca3af;
    text-align: left;
  }

  .picker-arrow {
    width: 20px;
    height: 20px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  // 多选模式样式适配
  .selected-users {
    gap: 4px;
    min-height: 18px;
  }

  .user-tag {
    padding: 1px 4px;
    border-radius: 10px;
    font-size: 10px;
    max-width: 100px;
    height: 20px;
    display: flex;
    align-items: center;

    .user-avatar {
      width: 14px;
      height: 14px;
      font-size: 8px;
      box-shadow: none;
    }

    .user-name {
      font-size: 10px;
      margin: 0 2px;
    }

    .remove-btn {
      width: 12px;
      height: 12px;
      margin-left: 2px;

      svg {
        width: 6px;
        height: 6px;
      }
    }
  }
}
</style>
