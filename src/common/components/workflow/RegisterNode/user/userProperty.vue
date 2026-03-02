<template>
  <el-form
    ref="formRef"
    :model="propertyForm"
    :inline-message="true"
    :rules="formRules"
    label-position="top"
    :disabled="flowDetail.status == '2'"
    class="property-form"
  >
    <FormSection title="基本信息" tooltip="设置节点的显示名称以区分流程环节" theme-color="slate">
      <template #icon>
        <el-icon><Document /></el-icon>
      </template>
      <el-form-item label="节点名称" prop="name" class="form-item">
        <el-input
          v-model="propertyForm.name"
          placeholder="请输入节点名称"
          class="modern-input"
          :disabled="flowDetail.status == '2'"
        />
      </el-form-item>
    </FormSection>

    <FormSection title="审批配置" tooltip="定义谁参与并有权限处理该环节的流程申请" theme-color="blue">
      <template #icon>
        <el-icon><UserFilled /></el-icon>
      </template>
      <el-form-item label="审批规则" prop="rule" class="form-item">
        <el-select
          v-model="propertyForm.rule"
          placeholder="请选择审批规则"
          class="modern-select"
          size="large"
          :disabled="flowDetail.status == '2'"
          @change="handleChange"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            class="modern-option"
          />
        </el-select>
      </el-form-item>

      <!-- 模板字段配置 -->
      <div v-if="propertyForm.rule === 'template'" class="conditional-section">
        <div class="form-row">
          <el-form-item label="模版名称" prop="template_id" class="form-item">
            <el-select
              v-model="propertyForm.template_id"
              placeholder="请选择模版"
              class="modern-select"
              :disabled="flowDetail.status == '2'"
            >
              <el-option
                v-for="item in templateRules"
                :key="item.id"
                :label="item.name"
                :value="item.id"
                class="modern-option"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="模版字段" prop="template_field" class="form-item">
            <el-select
              v-model="propertyForm.template_field"
              :disabled="!propertyForm.template_id || flowDetail.status == '2'"
              placeholder="请选择模版字段"
              class="modern-select"
            >
              <el-option
                v-for="[title, field] in Array.from(getTemplateFieldOptions(propertyForm.template_id))"
                :key="field"
                :label="title"
                :value="field"
                class="modern-option"
              />
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 参与者配置 -->
      <el-form-item
        v-if="['leaders', 'main_leader', 'appoint'].includes(propertyForm.rule)"
        :label="getLabel(propertyForm.rule)"
        prop="approved"
        size="large"
        class="form-item"
      >
        <div class="select-container">
          <el-select
            v-model="propertyForm.approved"
            multiple
            placeholder="请选择参与者"
            :show-arrow="false"
            suffix-icon=""
            tag-type="info"
            size="large"
            :disabled="approvalInputDisabled || flowDetail.status == '2'"
            class="modern-select"
          >
            <el-option
              v-for="item in approvedOptions"
              :key="item.name"
              :label="item.display_name"
              :value="item.name"
              class="modern-option"
            />
          </el-select>
          <el-button class="select-button" :icon="UserFilled" @click="openUser" :disabled="flowDetail.status == '2'" />
        </div>
      </el-form-item>
    </FormSection>

    <FormSection title="流程设置" tooltip="配置审批通过的逻辑（如会签）及抄送规则" theme-color="orange">
      <template #icon>
        <el-icon><Timer /></el-icon>
      </template>
      <div class="switch-cards">
        <div class="switch-card">
          <div class="switch-card-label">
            <span>是否会签</span>
            <el-tooltip content="开启后需要所有参与者都同意才能通过" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch
            v-model="propertyForm.is_cosigned"
            inline-prompt
            active-text="是"
            inactive-text="否"
            :disabled="flowDetail.status == '2'"
            style="--el-switch-on-color: #3b82f6; --el-switch-off-color: #cbd5e1"
          />
        </div>

        <div class="switch-card">
          <div class="switch-card-label">
            <span>仅抄送</span>
            <el-tooltip content="开启后该节点仅用于通知，无需审批" placement="top">
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch
            v-model="propertyForm.is_cc"
            inline-prompt
            active-text="是"
            inactive-text="否"
            :disabled="flowDetail.status == '2'"
            style="--el-switch-on-color: #10b981; --el-switch-off-color: #cbd5e1"
          />
        </div>
      </div>
    </FormSection>

    <FormSection title="表单配置" tooltip="设置审批人在该环节需要处理或查看的业务字段" theme-color="green">
      <template #icon>
        <el-icon><Collection /></el-icon>
      </template>
      <FormList v-model="propertyForm.fields" :disabled="flowDetail.status == '2'" />
    </FormSection>
  </el-form>

  <!-- 用户选择器弹窗 -->
  <FormDialog
    v-model="approvalVisible"
    title="选择审批人员"
    subtitle="从组织架构中选择需要参与审批的人员"
    confirm-text="确认选择"
    :show-footer-info="false"
    @closed="handleUserDialogCancel"
    @confirm="handleUserDialogConfirm"
    @cancel="handleUserDialogCancel"
  >
    <UserSelector
      ref="userSelectorRef"
      v-if="approvalVisible"
      :default-checked-keys="checkedKeys"
      @confirm="handleUserSelected"
      @cancel="handleUserDialogCancel"
    />
  </FormDialog>
</template>
<script setup lang="ts">
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { UserFilled, QuestionFilled, Document, Timer, Collection } from "@element-plus/icons-vue"
import { findByUsernamesApi } from "@/api/user"
import { FormSection } from "../../PropertySetting"
import FormDialog from "@@/components/Dialogs/Form/index.vue"
import UserSelector from "./UserSelector.vue"
import FormList from "./FormList.vue"

import { useTemplateRules } from "@/common/composables/useTemplateRules"
// 使用模板 Hook
const { templateRules, getTemplateFieldOptions, fetchTemplates } = useTemplateRules()

// 在需要获取模板的地方调用 fetchTemplates
const handleChange = async () => {
  if (propertyForm.rule !== "template") return
  if (props.id === undefined) return

  await fetchTemplates(props.id)
}

const options = [
  {
    label: "指定内部人员",
    value: "appoint"
  },
  {
    label: "所属部门领导【允许多人】",
    value: "leaders"
  },
  {
    label: "所属分管领导【仅有一人】",
    value: "main_leader"
  },
  {
    label: "工单提交人",
    value: "founder"
  },
  {
    label: "模版字段提取",
    value: "template"
  }
]

const getLabel = (rule: string) => {
  switch (rule) {
    case "leaders":
      return "部门领导（保底机制）"
    case "main_leader":
      return "分管领导（保底机制）"
    case "appoint":
      return "参与者"
    default:
      return ""
  }
}

const props = defineProps({
  nodeData: Object,
  lf: Object || String,
  id: Number,
  //详情
  flowDetail: {
    type: Object,
    default: () => {
      return {}
    }
  }
})

const approvalInputDisabled = ref(true)
const approvalVisible = ref(false)
const emits = defineEmits(["closed"])
const propertyForm = reactive({
  name: "",
  approved: ref<string[]>(),
  template_field: "",
  template_id: 0,
  rule: "appoint",
  is_cosigned: false,
  is_cc: false,
  fields: [] as any[]
})

interface ParticipantOption {
  display_name: string
  name: string
}
const approvedOptions = ref<ParticipantOption[]>([])
const checkedKeys = ref<number[]>([])
const getUsernamesData = (uns: string[]) => {
  findByUsernamesApi(uns)
    .then(({ data }) => {
      approvedOptions.value = data.users.map((node) => ({
        display_name: node.display_name,
        name: node.username
      }))
      checkedKeys.value = data.users.map((node) => node.id)
    })
    .catch(() => {
      approvedOptions.value = []
    })
    .finally(() => {})
}

const openUser = () => {
  approvalVisible.value = !approvalVisible.value
}

// 处理用户选择确认
const handleUserSelected = (users: Array<{ name: string; display_name: string; id: number }>) => {
  // 填充数据
  propertyForm.approved = users.map((user) => user.name)

  // 填充默认值
  checkedKeys.value = users.map((user) => user.id)

  // 填充选项
  approvedOptions.value = users.map((user) => ({
    display_name: user.display_name,
    name: user.name
  }))

  // 关闭对话框
  approvalVisible.value = false
}

// 处理用户选择器弹窗确认
const handleUserDialogConfirm = () => {
  // 直接调用 UserSelector 的确认逻辑
  if (userSelectorRef.value) {
    userSelectorRef.value.handleConfirm()
  }
}

// 处理用户选择器弹窗取消
const handleUserDialogCancel = () => {
  approvalVisible.value = false
}

const formRef = ref<FormInstance | null>(null)
const userSelectorRef = ref()
const formRules: FormRules = {
  name: [
    { required: true, message: "名称不能为空" },
    {
      max: 50,
      message: "最大50字符"
    }
  ]
}

//更新节点属性
const setProperties = () => {
  props.lf?.setProperties(props.nodeData?.id, {
    name: propertyForm.name,
    approved: propertyForm.approved,
    template_id: propertyForm.template_id,
    template_field: propertyForm.template_field,
    rule: propertyForm.rule,
    is_cosigned: propertyForm.is_cosigned,
    is_cc: propertyForm.is_cc,
    fields: propertyForm.fields
  })
}

//确定
const confirmFunc = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      setProperties()
      props.lf?.updateText(props.nodeData?.id, propertyForm.name)
      emits("closed")
    }
  })
}

onMounted(async () => {
  console.log("userProperty mounted, nodeData:", props.nodeData)
  console.log("userProperty properties:", props.nodeData?.properties)
  propertyForm.name = props.nodeData?.properties.name || ""
  propertyForm.is_cosigned = props.nodeData?.properties.is_cosigned ? props.nodeData.properties.is_cosigned : false
  propertyForm.approved = Array.isArray(props.nodeData?.properties.approved) ? props.nodeData.properties.approved : []
  propertyForm.template_field = props.nodeData?.properties.template_field || ""
  propertyForm.template_id = props.nodeData?.properties.template_id || ""
  propertyForm.rule = props.nodeData?.properties.rule || "appoint"
  propertyForm.is_cc = props.nodeData?.properties.is_cc ? props.nodeData.properties.is_cc : false
  propertyForm.fields = props.nodeData?.properties.fields
    ? props.nodeData.properties.fields
    : props.nodeData?.properties.form
      ? props.nodeData.properties.form
      : []
  // 如果存在审批用户则获取
  if (
    props.nodeData?.properties.approved &&
    Array.isArray(props.nodeData.properties.approved) &&
    props.nodeData.properties.approved.length > 0
  ) {
    getUsernamesData(props.nodeData.properties.approved)
  }

  // 如果执行方式是模板，加载模板数据
  if (propertyForm.rule === "template" && propertyForm.template_id) {
    if (props.id !== undefined) {
      fetchTemplates(props.id).then(() => {
        getTemplateFieldOptions(propertyForm.template_id)
      })
    }
  }
})

// 暴露方法给父组件
defineExpose({
  confirmFunc
})
</script>
<style scoped lang="scss">
.property-form {
  padding: 4px 12px;
  background: transparent;
  min-height: 100%;
}

// ── 通用控件（极致优化） ──────────────────────────────────────────────
.modern-input,
.modern-select {
  width: 100%;
  :deep(.el-input__wrapper) {
    background: #ffffff !important;
    border-radius: 6px;
    box-shadow: none !important;
    border: 1px solid #cbd5e1 !important;
    padding: 2px 10px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #94a3b8 !important;
    }

    &.is-focus {
      border-color: #6366f1 !important;
      box-shadow: 0 0 0 1px #6366f1 !important;
    }
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-item {
  margin-bottom: 0px;
  :deep(.el-form-item__label) {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
    margin-bottom: 6px;
  }
}

.conditional-section {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.switch-cards {
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
}

.switch-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }
}

.switch-card-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.help-icon {
  font-size: 14px;
  color: #94a3b8;
  cursor: help;
  transition: color 0.2s;

  &:hover {
    color: #64748b;
  }
}

.select-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;

  .modern-select {
    flex: 1;
  }

  .select-button {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    color: #64748b;
    border-radius: 6px;
    padding: 8px;
    height: 32px;
    width: 32px;
    transition: all 0.2s;

    &:hover {
      background: #e2e8f0;
      color: #334155;
      border-color: #94a3b8;
    }

    &:active {
      background: #cbd5e1;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style>
