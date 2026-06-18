<template>
  <div class="dispatch-form-layout">
    <aside class="automation-pane">
      <div class="pane-header">
        <span class="pane-title">自动化节点</span>
        <span class="pane-count">{{ automationNodes.length }}</span>
      </div>
      <el-scrollbar class="node-scrollbar">
        <button
          v-for="node in automationNodes"
          :key="node.name"
          class="automation-node"
          :class="{ active: selectedAutomationName === node.name }"
          type="button"
          @click="selectAutomation(node.name)"
        >
          <span class="node-name">{{ node.name }}</span>
          <span class="node-codebook">{{ node.codebookUid }}</span>
          <span class="node-runner-count">{{ getNodeRunners(node.codebookUid).length }} 个执行器</span>
        </button>
        <el-empty v-if="automationNodes.length === 0" description="暂无自动化节点" :image-size="88" />
      </el-scrollbar>
    </aside>

    <section class="config-pane">
      <div class="selected-summary">
        <div>
          <div class="summary-label">当前节点</div>
          <div class="summary-title">{{ selectedAutomationName || "未选择" }}</div>
        </div>
        <el-tag v-if="selectedCodebookUid" type="info" effect="plain">{{ selectedCodebookUid }}</el-tag>
      </div>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
        <el-form-item prop="field" label="模版字段">
          <el-select v-model="formData.field" placeholder="请选择模版字段" filterable>
            <el-option
              v-for="[field, title] in Array.from(props.fieldsMap)"
              :key="field"
              :label="title"
              :value="field"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="value" label="匹配值">
          <el-input v-model="formData.value" placeholder="请输入匹配值" />
        </el-form-item>
        <el-form-item prop="runner_id" label="执行器">
          <el-select
            v-model="formData.runner_id"
            placeholder="请选择执行器"
            filterable
            :disabled="filteredRunners.length === 0"
          >
            <el-option v-for="item in filteredRunners" :key="item.id" :label="item.name" :value="item.id">
              <div class="runner-option">
                <span>{{ item.name }}</span>
                <small>{{ item.target }} / {{ item.handler }}</small>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { createOrUpdateDispatchReq, dispatch } from "@/api/ticket/dispatch/types/dispatch"
import type { runner } from "@/api/task/runner/types/runner"
import { computed, ref, watch } from "vue"

import { ElMessage, FormInstance, FormRules } from "element-plus"
import { cloneDeep } from "lodash-es"
import { createDispatchApi, updateDispatchApi } from "@/api/ticket/dispatch"

const emits = defineEmits(["closed", "callback"])

// 接收父组件传递
interface Props {
  fieldsMap: Map<string, string>
  automationCodebooks: Map<string, string>
  runners: runner[]
  templateId: number | undefined
}

const props = defineProps<Props>()

const onClosed = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()

  emits("closed")
}

const DEFAULT_FORM_DATA: createOrUpdateDispatchReq = {
  template_id: 0,
  runner_id: 0,
  field: "",
  value: ""
}

const formData = ref<createOrUpdateDispatchReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const selectedAutomationName = ref("")

const automationNodes = computed(() =>
  Array.from(props.automationCodebooks, ([name, codebookUid]) => ({
    name,
    codebookUid
  }))
)

const selectedCodebookUid = computed(() => props.automationCodebooks.get(selectedAutomationName.value) || "")

const getNodeRunners = (codebookUid: string) => props.runners.filter((item) => item.codebook_uid === codebookUid)

const filteredRunners = computed(() => (selectedCodebookUid.value ? getNodeRunners(selectedCodebookUid.value) : []))

const selectAutomation = (name: string) => {
  selectedAutomationName.value = name
}

const formRules: FormRules = {
  runner_id: [{ required: true, message: "必须输入执行器", trigger: "blur" }],
  field: [{ required: true, message: "必须输入字段名称", trigger: "blur" }],
  value: [{ required: true, message: "必须输入匹配值", trigger: "blur" }]
}

watch(
  automationNodes,
  (nodes) => {
    if (!nodes.length) {
      selectedAutomationName.value = ""
      return
    }

    const hasSelected = nodes.some((node) => node.name === selectedAutomationName.value)
    if (!hasSelected) {
      selectedAutomationName.value = nodes[0].name
    }
  },
  { immediate: true }
)

watch(selectedCodebookUid, () => {
  if (!formData.value.runner_id) return

  const exists = filteredRunners.value.some((item) => item.id === formData.value.runner_id)
  if (!exists) {
    formData.value.runner_id = 0
  }
})

const submitForm = async () => {
  try {
    await formRef.value?.validate()
    if (!props.templateId) return
    formData.value.template_id = props.templateId

    const api = formData.value.id === undefined ? createDispatchApi : updateDispatchApi
    await api(formData.value)

    ElMessage.success("保存成功")
    onClosed()
    emits("callback")
  } catch (error) {
    // 表单验证错误已由Element Plus处理
    if (!(error instanceof Error)) {
      console.log(error)
    }
  }
}

const setForm = (row: dispatch) => {
  formData.value = cloneDeep(row)
  const matchedNode = automationNodes.value.find((node) =>
    getNodeRunners(node.codebookUid).some((item) => item.id === row.runner_id)
  )
  if (matchedNode) {
    selectedAutomationName.value = matchedNode.name
  }
}

const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formRef.value?.resetFields()
  selectedAutomationName.value = automationNodes.value[0]?.name || ""

  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })
}

const selectAutomationByName = (name: string) => {
  const exists = automationNodes.value.some((node) => node.name === name)
  selectedAutomationName.value = exists ? name : automationNodes.value[0]?.name || ""
}

defineExpose({
  submitForm,
  setForm,
  resetForm,
  selectAutomationByName
})
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.dispatch-form-layout {
  display: flex;
  gap: 18px;
  min-height: 420px;
}

.automation-pane {
  width: 280px;
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.pane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #ffffff;
}

.pane-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.pane-count {
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
  font-weight: 600;
}

.node-scrollbar {
  height: 356px;
}

.automation-node {
  width: calc(100% - 16px);
  margin: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover,
  &.active {
    border-color: #3b82f6;
    background: #eff6ff;
  }
}

.node-name {
  max-width: 100%;
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-codebook,
.node-runner-count {
  max-width: 100%;
  color: #64748b;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-pane {
  flex: 1;
  min-width: 0;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
}

.selected-summary {
  min-height: 72px;
  margin-bottom: 18px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #f8fbff;
}

.summary-label {
  color: #64748b;
  font-size: 12px;
}

.summary-title {
  margin-top: 4px;
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.runner-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  small {
    color: #94a3b8;
  }
}

:deep(.el-select) {
  width: 100%;
}
</style>
