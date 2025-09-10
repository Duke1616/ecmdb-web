<template>
  <div class="user-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="user-form"
      label-position="left"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>

        <el-form-item prop="username" label="用户名称" class="form-item required">
          <el-input
            v-model="formData.username"
            :disabled="formData.id !== undefined"
            placeholder="请输入用户名称"
            clearable
            :prefix-icon="User"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="display_name" label="显示名称" class="form-item required">
          <el-input
            v-model="formData.display_name"
            placeholder="请输入用户显示名称"
            clearable
            :prefix-icon="UserFilled"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="email" label="电子邮箱" class="form-item">
          <el-input
            v-model="formData.email"
            placeholder="请输入邮箱地址"
            clearable
            :prefix-icon="Message"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="department" label="所属部门" class="form-item">
          <el-tree-select
            v-model="formData.department_id"
            :data="treeData"
            node-key="id"
            :render-after-expand="false"
            :expand-on-click-node="false"
            show-checkbox
            check-strictly
            check-on-click-node
            :props="defaultProps"
            placeholder="请选择所属部门"
            :prefix-icon="OfficeBuilding"
            clearable
            class="form-input"
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>第三方集成</span>
        </div>

        <el-form-item prop="feishu_info.user_id" label="飞书用户" class="form-item">
          <el-input
            v-model="formData.feishu_info.user_id"
            placeholder="请输入飞书用户ID"
            clearable
            :prefix-icon="ChatDotRound"
            class="form-input"
          />
        </el-form-item>

        <el-form-item prop="wechat_info.user_id" label="企微用户" class="form-item">
          <el-input
            v-model="formData.wechat_info.user_id"
            placeholder="请输入企业微信用户ID"
            clearable
            :prefix-icon="ChatDotSquare"
            class="form-input"
          />
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { 
  User, 
  UserFilled, 
  Message, 
  OfficeBuilding, 
  InfoFilled,
  Setting,
  ChatDotRound, 
  ChatDotSquare 
} from "@element-plus/icons-vue"
import { createOrUpdateUserReq, feishuInfo, user, wechatInfo } from "@/api/user/types/user"
import { updateUserApi, syncLdapUserApi } from "@/api/user"
import { listDepartmentTreeApi } from "@/api/department"
import { department } from "@/api/department/types/department"
import { user as syncUser } from "@/api/user/types/ldap"

// 接收父组建传递
const emits = defineEmits(["closed", "callback"])
const onClosed = () => {
  emits("closed")
}

const FeishuInfo: feishuInfo = {}
const WechatInfo: wechatInfo = {}
const DEFAULT_FORM_DATA: createOrUpdateUserReq = {
  username: "",
  display_name: "",
  feishu_info: FeishuInfo,
  wechat_info: WechatInfo
}

const defaultProps = ref<any>({
  children: "children",
  label: (node: department) => node.name,
  key: "id"
})

const formData = ref<createOrUpdateUserReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  display_name: [{ required: true, message: "必须输入用户展示名称", trigger: "blur" }],
  username: [{ required: true, message: "必须输入用户名称（唯一值）", trigger: "blur" }]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)
    const api = formData.value.id === undefined ? syncLdapUserApi : updateUserApi
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

const treeData = ref<department[]>([])
const listDepartmentTreeData = async () => {
  listDepartmentTreeApi()
    .then(async ({ data }) => {
      treeData.value = data
    })
    .catch(() => {
      treeData.value = []
    })
    .finally(() => {})
}

const setFrom = (row: user) => {
  formData.value = cloneDeep(row)

  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

const setSyncForm = (row: syncUser) => {
  formData.value = {
    ...cloneDeep(row),
    feishu_info: {},
    wechat_info: {}
  }
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

onMounted(() => {
  listDepartmentTreeData()
})

defineExpose({
  submitForm,
  setFrom,
  setSyncForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.user-form-container {
  padding: 0;
  background: transparent;
  max-height: 80vh;
  overflow-y: auto;
}

.user-form {
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

    .form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
        position: relative;
        display: flex;
        align-items: center;
        
        &::before {
          content: '';
          display: inline-block;
          width: 16px;
          flex-shrink: 0;
        }
      }

      &.required {
        :deep(.el-form-item__label) {
          &::before {
            content: '*';
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

        :deep(.el-input__prefix) {
          color: #9ca3af;
        }
      }

      :deep(.el-tree-select) {
        .el-select__wrapper {
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

        .el-select__placeholder {
          color: #9ca3af;
          font-size: 13px;
        }

        .el-select__prefix {
          color: #9ca3af;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-form-container {
    padding: 0;
  }

  .user-form {
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
