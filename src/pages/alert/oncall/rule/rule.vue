<template>
  <div class="rule-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="rule-form"
      label-position="left"
    >
      <div class="form-layout">
        <!-- 左侧：时间和轮换设置 -->
        <div class="left-section">
          <div class="form-section">
            <div class="settings-content">
              <!-- 时间设置 -->
              <TimeSettings v-model:rotaRuleForm="formData.oncall_rule" />

              <!-- 轮换设置 -->
              <RotationSettings
                v-model:time_duration="formData.oncall_rule.rotate.time_duration"
                v-model:time_unit="formData.oncall_rule.rotate.time_unit"
              />
            </div>
          </div>
        </div>

        <!-- 右侧：排班人员 -->
        <div class="right-section">
          <PersonnelManagement v-model:rotaGroupsForm="formData.oncall_rule.oncall_groups" />
        </div>
      </div>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import type { AddRuleReq } from "@/api/alert/oncall/types/oncall"
import { addShiftSchedulingRuleApi } from "@/api/alert/oncall"
import TimeSettings from "../components/timeSettings.vue"
import RotationSettings from "../components/rotationSettings.vue"
import PersonnelManagement from "../components/personnelManagement.vue"

const emits = defineEmits(["closed", "callback"])

// 表单数据
const DEFAULT_FORM_DATA: AddRuleReq = {
  id: 0,
  oncall_rule: {
    id: 0,
    rule_type: 1,
    enabled: false,
    start_time: new Date(new Date().setHours(0, 0, 0, 0)).getTime(),
    end_time: 0,
    oncall_groups: [],
    rotate: {
      time_unit: 4,
      time_duration: 1
    }
  }
}

const formData = ref<AddRuleReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)

const formRules: FormRules = {
  name: [{ required: true, message: "必须输入值班名称", trigger: "blur" }],
  owner: [{ required: true, message: "必须输入值班管理人员", trigger: "blur" }]
}

const setFrom = (row: AddRuleReq) => {
  formData.value = cloneDeep(row)
}

const getFrom = () => {
  return formData
}

const resetForm = () => {
  // formRef.value?.resetFields()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
}

const submitFormApi = (rotaId: number) => {
  formData.value.id = rotaId
  if (formData.value.id === 0) {
    ElMessage.error("值班不存在，无法保存")
    return Promise.reject("值班不存在")
  }

  return addShiftSchedulingRuleApi(formData.value)
    .then(() => {
      ElMessage.success("保存成功")
    })
    .catch((error) => {
      throw error
    })
}

const onClosed = () => {
  emits("closed")
}

const submitForm = (rotaId: number) => {
  return submitFormApi(rotaId)
    .then(() => {
      onClosed()
      // 通知父组件刷新数据
      emits("callback")
    })
    .catch((error) => {
      if (error !== "值班不存在") {
        ElMessage.error("保存规则失败，请稍后重试")
      }
    })
}

defineExpose({
  submitForm,
  setFrom,
  getFrom,
  resetForm
})
</script>

<style scoped lang="scss">
// 规则表单样式
.rule-form-container {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.rule-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .form-layout {
    display: grid;
    grid-template-columns: minmax(340px, 0.95fr) minmax(420px, 1.05fr);
    gap: 0;
    align-items: stretch;
    flex: 1;
    min-height: 0;
    height: 100%;
    padding: 0 10px 0 0;
    background: transparent;
    border: 0;
    border-radius: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
}

.left-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding-right: 20px;
}

.right-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-left: 20px;
  border-left: 1px solid #e2e8f0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  max-height: 100%;
}

.form-section {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: visible;

  .settings-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1;
  }
}

@media (max-width: 900px) {
  .rule-form-container {
    height: 100%;
  }

  .rule-form {
    .form-layout {
      grid-template-columns: 1fr;
      gap: 18px;
    }
  }

  .left-section,
  .right-section {
    height: auto;
    max-height: none;
    padding: 0;
    border-left: 0;
    overflow: visible;
  }
}

/* 配置面板滚动条样式 */
.form-layout::-webkit-scrollbar {
  width: 6px;
}

.form-layout::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.form-layout::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.form-layout::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
