<template>
  <div class="designer-container">
    <div class="designer-content">
      <div class="form-card">
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div class="section-title">
              <h3>表单设计器</h3>
              <p>通过拖拽方式设计表单结构和字段配置</p>
            </div>
          </div>

          <div class="designer-wrapper">
            <fc-designer ref="designerRef" :config="config" class="form-designer" />
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <FormActions @previous="previous" @save="save" @cancel="close" :show-next="false" :show-save="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import FcDesigner from "@form-create/designer"
import FormActions from "@/common/components/FormActions/index.vue"
import { useFormHandler } from "@/common/composables/useFormHandler"
import { createOrUpdateTemplateReq } from "@/api/template/types/template"

const props = defineProps<{
  formData: createOrUpdateTemplateReq
}>()

const emits = defineEmits<{
  previous: []
  save: []
  close: []
  "update:formData": [data: createOrUpdateTemplateReq]
}>()

const { localFormData, updateFormData, setFormData, previous, save, close } = useFormHandler(
  props.formData,
  emits,
  "designer"
)

const designerRef = ref<InstanceType<typeof FcDesigner>>()

const config: any = {
  // 隐藏设计器的保存按钮，使用我们的步骤导航
  showSaveBtn: false,
  // 配置field是否可以编辑
  fieldReadonly: false
}

// 监听 props.formData 变化
watch(
  () => props.formData,
  (newFormData) => {
    setFormData(newFormData)
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  if (designerRef.value) {
    localFormData.value.rules = designerRef.value.getJson()
    localFormData.value.options = designerRef.value.getOptionsJson()
    updateFormData()
  }
})

onMounted(() => {
  if (props.formData?.rules) {
    designerRef.value?.setRule(props.formData.rules)
  }
  if (props.formData?.options) {
    designerRef.value?.setOptions(props.formData.options)
  }
})

// 暴露方法供父组件调用
defineExpose({
  setForm: (row: any) => {
    designerRef.value?.setOptions(row.options)
    designerRef.value?.setRule(JSON.stringify(row.rules))
    localFormData.value = { ...localFormData.value, ...row }
  },
  resetForm: () => {
    designerRef.value?.clearDragRule()
    designerRef.value?.setOptions({})
  }
})
</script>

<style lang="scss" scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  min-height: 500px;
}

// 设计器内容
.designer-content {
  flex: 1;
  padding: 0px;
  overflow-y: auto;

  .form-card {
    background: white;
    border-radius: 12px;
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    max-width: 100%;
    margin: 0;
    height: 100%;
  }
}

// 表单区块
.form-section {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;

    .section-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        width: 16px;
        height: 16px;
        color: white;
      }
    }

    .section-title {
      h3 {
        margin: 0 0 3px 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #64748b;
        line-height: 1.4;
      }
    }
  }

  .designer-wrapper {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
    min-height: 600px;
  }
}

.form-designer {
  height: 100%;
  border: none;
}
</style>
