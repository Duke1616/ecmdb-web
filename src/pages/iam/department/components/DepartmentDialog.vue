<template>
  <FormDialog
    v-model="visible"
    :title="id ? '治理部门资产' : '初始化部门定义'"
    :header-icon="OfficeBuilding"
    width="640px"
    :confirm-loading="saving"
    @confirm="submit"
    @cancel="visible = false"
  >
    <div class="dept-form-container">
      <DepartmentDetailForm
        ref="detailFormRef"
        :form-data="formData"
        :department-data="departmentData || []"
        v-model:selected-leaders="selectedLeaders"
        v-model:selected-main-leader-username="selectedMainLeaderUsername"
      />
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { OfficeBuilding } from "@element-plus/icons-vue"
import { listDepartmentTreeApi, getDepartmentDetailApi } from "@/api/iam/department"
import type { IDepartmentNode } from "@/api/iam/department/type"
import { FormDialog } from "@@/components/Dialogs"
import DepartmentDetailForm from "./DepartmentDetailForm.vue"
import { useDepartmentForm } from "../composables/useDepartmentForm"

// NOTE: 该组件为纯 UI 弹窗控制器，使用 defineModel 进行开放/折叠的状态双向绑定
const visible = defineModel<boolean>({ default: false })

interface IDepartmentDialogProps {
  id?: number
  parentId?: number
}

const props = defineProps<IDepartmentDialogProps>()

const emits = defineEmits<{
  (e: "success"): void
}>()

const detailFormRef = ref<InstanceType<typeof DepartmentDetailForm> | null>(null)
const departmentData = ref<IDepartmentNode[]>()

// 引入 Composable 来统一看护状态和提交
const {
  formData,
  selectedLeaders,
  selectedMainLeaderUsername,
  saving,
  resetForm,
  setDepartmentData,
  setFormForPid,
  submitCreateForm,
  submitUpdateForm
} = useDepartmentForm(() => {
  visible.value = false
  emits("success")
})

// 递归过滤当前部门及其子部门，防止上级部门选择时死循环
const filterSelfAndDescendants = (nodes: IDepartmentNode[], targetId: number): IDepartmentNode[] => {
  return nodes
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      children: node.children && node.children.length > 0 ? filterSelfAndDescendants(node.children, targetId) : []
    }))
}

const loadDeptTree = async () => {
  try {
    const { data } = await listDepartmentTreeApi()
    if (props.id) {
      departmentData.value = filterSelfAndDescendants(data, props.id)
    } else {
      departmentData.value = data
    }
  } catch (error) {
    console.error("加载上级部门树失败:", error)
  }
}

const loadDetail = async () => {
  if (!props.id) return
  try {
    const { data } = await getDepartmentDetailApi(props.id)
    setDepartmentData(data)
  } catch (error) {
    console.error("加载部门详情失败:", error)
  }
}

watch(visible, async (val) => {
  if (val) {
    await loadDeptTree()
    if (props.id) {
      await loadDetail()
    } else {
      resetForm()
      if (props.parentId) {
        setFormForPid(props.parentId)
      }
      nextTick(() => {
        detailFormRef.value?.formRef?.clearValidate()
      })
    }
  }
})

const submit = async () => {
  const form = detailFormRef.value?.formRef
  if (!form) return

  if (props.id) {
    await submitUpdateForm(form)
  } else {
    await submitCreateForm(form)
  }
}
</script>

<style lang="scss" scoped>
.dept-form-container {
  padding: 8px 24px;
}
</style>
