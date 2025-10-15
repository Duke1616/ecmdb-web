<template>
  <div class="team-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="team-form"
      label-position="left"
    >
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基本信息</span>
        </div>

        <el-form-item prop="name" label="团队名称" class="form-item required">
          <el-input v-model="formData.name" placeholder="请输入团队名称" clearable class="form-input" />
        </el-form-item>

        <el-form-item prop="owner" label="管理人员" class="form-item required">
          <UserPicker
            v-model="selectedOwner"
            placeholder="选择管理人员"
            :multiple="false"
            :default-to-current-user="false"
            variant="simple"
            class="form-input"
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>成员管理</span>
        </div>

        <MemberSelector v-model="selectedMembers" />
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { cloneDeep } from "lodash-es"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { InfoFilled, Setting } from "@element-plus/icons-vue"
import UserPicker from "@/common/components/UserPicker/index.vue"
import MemberSelector from "./components/MemberSelector/index.vue"
import { SaveTeamReq, Team } from "@/api/alert/team/types"
import { saveTeamApi } from "@/api/alert/team"

// 接收父组件传递
const emits = defineEmits(["closed", "callback"])

const DEFAULT_FORM_DATA: SaveTeamReq = {
  name: "",
  owner: "",
  members: []
}

const formData = ref<SaveTeamReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

// 用户选择相关
const selectedOwner = ref<string>("")
const selectedMembers = ref<string[]>([])

const formRules: FormRules = {
  name: [{ required: true, message: "请输入团队名称", trigger: "blur" }]
}

// 同步用户选择数据到表单数据
const syncUserData = () => {
  formData.value.owner = selectedOwner.value
  formData.value.members = [...selectedMembers.value]
}

const submitForm = () => {
  formRef.value?.validate((valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 同步用户选择数据到表单数据
    syncUserData()

    saveTeamApi(formData.value)
      .then(() => {
        onClosed()
        ElMessage.success("保存成功")
        emits("callback")
      })
      .catch((error: any) => {
        console.log("catch", error)
      })
  })
}

const setForm = (row: Team) => {
  formData.value = {
    id: row.id,
    name: row.name,
    owner: row.owner,
    members: [...row.members]
  }

  // 加载用户选择数据
  selectedOwner.value = row.owner
  selectedMembers.value = [...row.members]
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  selectedOwner.value = ""
  selectedMembers.value = []
}

const onClosed = () => {
  emits("closed")
}

defineExpose({
  submitForm,
  setForm,
  resetForm
})
</script>

<style lang="scss" scoped>
.team-form-container {
  padding: 20px;
}

.team-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e4e7ed;
    color: #303133;
    font-size: 14px;
    font-weight: 500;

    .el-icon {
      color: #409eff;
    }
  }

  .form-item {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    &.required {
      :deep(.el-form-item__label) {
        &::before {
          content: "*";
          color: #f56c6c;
          margin-right: 4px;
        }
      }
    }
  }

  .form-input {
    width: 100%;
  }
}
</style>
