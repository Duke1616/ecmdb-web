<template>
  <FormDialog
    v-model="visible"
    :title="code ? '编辑用户组' : '新增用户组'"
    :header-icon="UserFilled"
    width="640px"
    :confirm-loading="saving"
    @confirm="submit"
    @cancel="visible = false"
  >
    <div class="group-form-container">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="standard-form">
        <div class="form-chapter">
          <div class="chapter-title">
            <el-icon><UserFilled /></el-icon>
            <span>用户组基础定义</span>
          </div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户组名称" prop="name">
                <el-input v-model="formData.name" placeholder="例如: 运维工程师组" class="gov-input" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="标识码" prop="code">
                <el-input
                  v-model="formData.code"
                  :disabled="isEdit"
                  placeholder="例如: ops_engineers"
                  class="gov-input mono"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="说明描述" prop="desc">
            <el-input
              v-model="formData.desc"
              type="textarea"
              :rows="3"
              placeholder="描述该用户组覆盖的人群、业务职责或授权边界..."
              class="gov-input gov-textarea"
            />
          </el-form-item>
        </div>

        <div v-if="isEdit" class="setting-control-card info">
          <div class="control-label">
            <span class="title">组标识锁定</span>
            <span class="hint">标识码用于成员与角色关系绑定，创建后不可变更。</span>
          </div>
          <el-tag effect="light" type="info" class="gov-tag">{{ formData.code }}</el-tag>
        </div>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { UserFilled } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"
import { createGroupApi, groupDetailApi, updateGroupApi } from "@/api/iam/group"

const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  code?: string
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)

const getInitialData = () => ({
  id: 0,
  name: "",
  code: "",
  desc: ""
})

const formData = reactive(getInitialData())
const isEdit = computed(() => !!props.code)

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入用户组名称", trigger: "blur" }],
  code: [
    { required: true, message: "请输入用户组标识码", trigger: "blur" },
    { pattern: /^[a-z0-9_]+$/, message: "仅支持小写字母、数字和下划线", trigger: "blur" }
  ]
})

const resetForm = () => {
  Object.assign(formData, getInitialData())
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const loadDetail = async () => {
  if (!props.code) return
  const { data } = await groupDetailApi(props.code)
  Object.assign(formData, {
    id: data.id,
    name: data.name,
    code: data.code,
    desc: data.desc || ""
  })
}

watch(visible, async (val) => {
  if (!val) return
  resetForm()
  if (props.code) {
    await loadDetail()
  }
})

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  saving.value = true
  try {
    if (isEdit.value) {
      await updateGroupApi({
        id: formData.id,
        name: formData.name,
        desc: formData.desc
      })
    } else {
      await createGroupApi({
        name: formData.name,
        code: formData.code,
        desc: formData.desc
      })
    }

    visible.value = false
    emit("success")
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
.group-form-container {
  padding: 8px 24px;
}

.standard-form {
  display: flex;
  flex-direction: column;
}

.form-chapter {
  margin-bottom: 8px;

  .chapter-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: #1e293b;
    font-size: 14px;
    font-weight: 700;

    .el-icon {
      color: #3b82f6;
      font-size: 16px;
    }

    &::after {
      content: "";
      flex: 1;
      height: 1px;
      background: #f1f5f9;
      margin-left: 12px;
    }
  }
}

.setting-control-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 4px;

  .control-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .hint {
      font-size: 12px;
      color: #94a3b8;
    }
  }
}

.gov-input {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    box-shadow: none !important;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      border-color: #cbd5e1;
    }

    &.is-focus,
    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    }
  }

  &.mono :deep(.el-input__inner) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px !important;
  line-height: 1.5;
}

.gov-tag {
  border-radius: 6px;
  font-weight: 600;
  max-width: 220px;
}
</style>
