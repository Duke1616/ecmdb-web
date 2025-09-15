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
              <TimeSettings v-model="formData.rota_rule" />

              <!-- 轮换设置 -->
              <RotationSettings v-model="formData.rota_rule.rotate" />
            </div>
          </div>
        </div>

        <!-- 右侧：排班人员 -->
        <div class="right-section">
          <PersonnelManagement v-model="formData.rota_rule.rota_groups" />
        </div>
      </div>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { useRuleForm } from "../composables/useRuleForm"
import TimeSettings from "../components/timeSettings.vue"
import RotationSettings from "../components/rotationSettings.vue"
import PersonnelManagement from "../components/personnelManagement.vue"

const emits = defineEmits(["closed", "callback"])

const { formData, formRef, formRules, setFrom, getFrom, resetForm, submitForm: submitFormApi } = useRuleForm()

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
      console.log("catch", error)
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
  height: 60vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
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
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: stretch; // 改为 stretch，让两侧高度一致
    flex: 1;
    min-height: 0;
    height: 100%;
  }
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
  min-height: 0; // 确保可以收缩
}

.right-section {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-y: auto; // 允许垂直滚动
  max-height: 100%; // 限制最大高度，超出时显示滚动条
}

.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow-y: auto; // 允许垂直滚动
  max-height: 100%; // 限制最大高度

  .settings-content {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex: 1; // 占据剩余空间
  }
}

/* 左侧滚动条样式 */
.form-section::-webkit-scrollbar {
  width: 6px;
}

.form-section::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.form-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.form-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* 右侧滚动条样式 */
.right-section::-webkit-scrollbar {
  width: 6px;
}

.right-section::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.right-section::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.right-section::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
