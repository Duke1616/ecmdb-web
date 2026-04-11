<template>
  <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top" class="policy-form">
    <!-- 策略语句列表 -->
    <TransitionGroup name="list">
      <PolicyStatement
        v-for="(stmt, index) in formData.statement"
        :key="index"
        :stmt="stmt"
        :index="index"
        :permission-manifest="permissionManifest"
        @update:stmt="(val: any) => (formData.statement[index] = val)"
        @duplicate="duplicateStatement"
        @remove="removeStatement"
      />
    </TransitionGroup>

    <!-- 添加语句 -->
    <div class="add-stmt-bar" @click="addStatement">
      <el-icon><Plus /></el-icon>
      <span>添加新的策略语句</span>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { Plus } from "@element-plus/icons-vue"
import { usePolicyForm } from "./composables/usePolicyForm"
import PolicyStatement from "./components/PolicyStatement.vue"

const props = defineProps<{ isEdit: boolean }>()
const emit = defineEmits(["success"])

const {
  formRef,
  formData,
  formRules,
  permissionManifest,
  loadManifest,
  addStatement,
  removeStatement,
  duplicateStatement,
  setForm,
  submit
} = usePolicyForm(props, emit)

onMounted(loadManifest)

defineExpose({ setForm, submit })
</script>

<style lang="scss" scoped>
.policy-form {
  padding: 0 4px;
}
.base-card {
  margin-bottom: 24px;
}

.add-stmt-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #fcfcfc;
    border-color: #dcdfe6;
    color: #409eff;
  }
}

/* 列表动画 */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
