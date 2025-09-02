<template>
  <div class="user-property-dialog">
    <!-- 弹窗头部 -->
    <div class="dialog-header">
      <div class="header-icon">
        <div class="icon-circle">
          <SvgIcon name="user" icon-class="user" />
        </div>
      </div>
      <div class="header-content">
        <h3 class="header-title">用户节点配置</h3>
        <p class="header-subtitle">配置审批流程的用户节点属性</p>
      </div>
    </div>

    <!-- 表单内容 -->
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="propertyForm"
        :inline-message="true"
        :rules="formRules"
        label-position="top"
        :disabled="flowDetail.status == '2'"
        class="property-form"
      >
        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">📝</span>
            <span>基本信息</span>
          </div>

          <el-form-item label="节点名称" prop="name" class="form-item">
            <el-input
              v-model="propertyForm.name"
              placeholder="请输入节点名称"
              class="modern-input"
              :disabled="flowDetail.status == '2'"
            />
            <div class="form-help">节点名称用于标识审批步骤，建议使用描述性名称</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">⚙️</span>
            <span>审批配置</span>
          </div>

          <el-form-item label="审批规则" prop="rule" class="form-item">
            <el-select
              v-model="propertyForm.rule"
              placeholder="请选择审批规则"
              class="modern-select"
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
            <div class="form-help">选择审批人员的确定方式，影响后续的参与者配置</div>
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
              <el-button
                class="select-button"
                :icon="UserFilled"
                @click="openUser"
                :disabled="flowDetail.status == '2'"
              />
            </div>
            <div class="form-help">点击右侧按钮选择具体的审批人员</div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="title-icon">🔔</span>
            <span>流程设置</span>
          </div>

          <div class="settings-grid">
            <div class="setting-item">
              <el-form-item label="是否会签" prop="is_cosigned">
                <el-switch
                  v-model="propertyForm.is_cosigned"
                  size="default"
                  :disabled="flowDetail.status == '2'"
                  active-color="var(--primary)"
                  inactive-color="var(--border)"
                />
              </el-form-item>
            </div>

            <div class="setting-item">
              <el-form-item label="仅抄送" prop="is_cc">
                <el-switch
                  v-model="propertyForm.is_cc"
                  size="default"
                  :disabled="flowDetail.status == '2'"
                  active-color="var(--primary)"
                  inactive-color="var(--border)"
                />
              </el-form-item>
            </div>
          </div>

          <div class="settings-help">
            <div class="help-item">
              <span class="help-icon">ℹ️</span>
              <span class="help-text">会签：开启后需要所有参与者都同意才能通过</span>
            </div>
            <div class="help-item">
              <span class="help-icon">ℹ️</span>
              <span class="help-text">抄送：开启后该节点仅用于通知，无需审批</span>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <!-- 弹窗底部按钮 -->
    <div class="dialog-footer" v-if="flowDetail.status != '2'">
      <el-button @click="cancelFunc" class="footer-btn footer-btn-cancel"> 取消 </el-button>
      <el-button type="primary" @click="confirmFunc" class="footer-btn footer-btn-confirm"> 确定 </el-button>
    </div>
    <!-- 用户选择器组件 -->
    <UserSelector v-model="approvalVisible" :default-checked-keys="checkedKeys" @confirm="handleUserSelected" />
  </div>
</template>
<script setup lang="ts">
import { FormInstance, FormRules } from "element-plus"
import { ref, onMounted, reactive } from "vue"
import { UserFilled } from "@element-plus/icons-vue"
import { findByUsernamesApi } from "@/api/user"
import SvgIcon from "@@/components/SvgIcon/index.vue"
import UserSelector from "./UserSelector.vue"

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
  is_cc: false
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
  console.log("父组件收到用户选择确认事件:", users)

  // 填充数据
  propertyForm.approved = users.map((user) => user.name)
  console.log("更新后的 propertyForm.approved:", propertyForm.approved)

  // 填充默认值
  checkedKeys.value = users.map((user) => user.id)
  console.log("更新后的 checkedKeys:", checkedKeys.value)

  // 填充选项
  approvedOptions.value = users.map((user) => ({
    display_name: user.display_name,
    name: user.name
  }))
  console.log("更新后的 approvedOptions:", approvedOptions.value)
}

const formRef = ref<FormInstance | null>(null)
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
    is_cc: propertyForm.is_cc
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

//取消
const cancelFunc = () => {
  emits("closed")
}

onMounted(async () => {
  propertyForm.name = props.nodeData?.properties.name || ""
  propertyForm.is_cosigned = props.nodeData?.properties.is_cosigned ? props.nodeData.properties.is_cosigned : false
  propertyForm.approved = Array.isArray(props.nodeData?.properties.approved) ? props.nodeData.properties.approved : []
  propertyForm.template_field = props.nodeData?.properties.template_field || ""
  propertyForm.template_id = props.nodeData?.properties.template_id || ""
  propertyForm.rule = props.nodeData?.properties.rule || "appoint"
  propertyForm.is_cc = props.nodeData?.properties.is_cc ? props.nodeData.properties.is_cc : false
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
</script>
<style lang="scss" scoped>
.user-property-dialog {
  background: transparent;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 520px;
  width: 100%;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    border-radius: 24px;
    z-index: -1;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  padding: 24px 28px;
  color: white;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 24px 24px 0 0;
  position: relative;
  z-index: 1;

  &::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.header-icon {
  .icon-circle {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    position: relative;

    &::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      border-radius: 12px;
      pointer-events: none;
    }

    :deep(.svg-icon) {
      width: 28px;
      height: 28px;
      color: white;
      position: relative;
      z-index: 1;
    }
  }
}

.header-content {
  flex: 1;
}

.header-title {
  margin: 0 0 6px 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.3;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  line-height: 1.4;
}

.dialog-content {
  padding: 20px 24px 16px;
  background: #ffffff;
  position: relative;
  z-index: 1;
  border-radius: 0 0 24px 24px;
}

.form-section {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #e2e8f0;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;

  .title-icon {
    font-size: 16px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
}

.conditional-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-top: 16px;
}

.modern-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-select {
  width: 100%;

  :deep(.el-input__wrapper) {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px 18px;
    height: 52px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
      transform: translateY(-1px);
    }

    &.is-focus {
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      transform: translateY(-2px);
    }
  }

  :deep(.el-input__inner) {
    font-size: 14px;
    color: #1e293b;
    font-weight: 500;
  }
}

.modern-option {
  :deep(.el-select-dropdown__item) {
    padding: 12px 16px;
    font-size: 14px;

    &.selected {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
    }

    &:hover {
      background: #f1f5f9;
    }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  .setting-item {
    background: #f9fafb;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;

    .el-form-item {
      margin-bottom: 0;

      :deep(.el-form-item__content) {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      :deep(.el-switch) {
        --el-switch-on-color: #3b82f6;
        --el-switch-off-color: #d1d5db;
      }
    }
  }
}

.settings-help {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .help-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 6px;
    border-left: 3px solid #3b82f6;

    .help-icon {
      font-size: 14px;
      color: #3b82f6;
    }

    .help-text {
      font-size: 12px;
      color: #64748b;
      line-height: 1.4;
    }
  }
}

.form-help {
  margin-top: 12px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.select-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 12px;

  .modern-select {
    flex: 1;
  }

  .select-button {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    color: white;
    border-radius: 10px;
    padding: 12px;
    height: 48px;
    width: 48px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    &:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

.dialog-footer {
  padding: 16px 24px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.footer-btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.footer-btn-cancel {
  background: #ffffff;
  color: #64748b;
  border-color: #e2e8f0;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #475569;
  }
}

.footer-btn-confirm {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-color: #3b82f6;

  &:hover {
    background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
    border-color: #1d4ed8;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
}
</style>
