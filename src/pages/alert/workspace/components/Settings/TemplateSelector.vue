<template>
  <Drawer
    v-model="visible"
    title="选择通知模版"
    subtitle="为工作空间选择消息通知模版"
    :header-icon="Message"
    size="40%"
    direction="rtl"
    :show-footer="true"
    cancel-button-text="取消"
    confirm-button-text="确定"
    @closed="onClosed"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div class="template-selector">
      <div class="template-list" v-loading="loading">
        <!-- 模版网格布局 -->
        <div class="template-grid">
          <div
            v-for="template in templates"
            :key="template.id"
            class="template-card"
            :class="{ active: selectedTemplateId === template.id }"
            @click="selectTemplate(template)"
          >
            <div class="template-info">
              <div class="template-avatar" :style="{ background: generateTemplateColor(template.name) }">
                {{ template.name.charAt(0) }}
              </div>
              <div class="template-details">
                <div class="template-name">{{ template.name }}</div>
                <div class="template-channel">{{ template.channel }}</div>
              </div>
            </div>
            <el-icon class="template-arrow" v-if="selectedTemplateId === template.id">
              <ArrowRight />
            </el-icon>
          </div>
        </div>

        <div v-if="templates.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无模版数据" :image-size="80" />
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { ElMessage } from "element-plus"
import { Message, ArrowRight } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { listTemplatesApi } from "@/api/alert/template"
import type { ChannelTemplate } from "@/api/alert/template/types"

interface Props {
  modelValue: boolean
  currentTemplateId?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentTemplateId: 0
})

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  confirm: [templateId: number, templateName: string]
}>()

// 响应式数据
const visible = ref(false)
const templates = ref<ChannelTemplate[]>([])
const loading = ref(false)
const selectedTemplateId = ref<string | number>("")

// 监听显示状态
watch(
  () => props.modelValue,
  (newVal) => {
    visible.value = newVal
    if (newVal) {
      // 打开时初始化选择状态
      selectedTemplateId.value = props.currentTemplateId || 0
      loadTemplatesData()
    }
  }
)

// 监听内部显示状态
watch(visible, (newVal) => {
  emit("update:modelValue", newVal)
})

// 加载模版数据
const loadTemplatesData = async () => {
  loading.value = true
  try {
    const { data } = await listTemplatesApi({
      offset: 0,
      limit: 100
    })
    templates.value = data.templates || []
  } catch (error) {
    console.error("加载模版数据失败:", error)
    ElMessage.error("加载模版数据失败")
    templates.value = []
  } finally {
    loading.value = false
  }
}

// 选择模版
const selectTemplate = (template: ChannelTemplate) => {
  selectedTemplateId.value = template.id
}

// 生成模版头像颜色
const generateTemplateColor = (name: string) => {
  const colors = [
    "#8b5cf6",
    "#7c3aed",
    "#a855f7",
    "#9333ea",
    "#c084fc",
    "#d946ef",
    "#e879f9",
    "#f0abfc",
    "#fbbf24",
    "#f59e0b",
    "#d97706",
    "#b45309"
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// 抽屉关闭处理
const onClosed = () => {
  // 重置选择状态
  selectedTemplateId.value = ""
  templates.value = []
}

// 取消处理
const handleCancel = () => {
  visible.value = false
}

// 确认处理
const handleConfirm = () => {
  if (!selectedTemplateId.value) {
    ElMessage.warning("请选择一个模版")
    return
  }

  const selectedTemplate = templates.value.find((template) => template.id === selectedTemplateId.value)
  if (!selectedTemplate) {
    ElMessage.warning("请选择一个有效的模版")
    return
  }

  emit("confirm", selectedTemplate.id, selectedTemplate.name)
  visible.value = false
}
</script>

<style lang="scss" scoped>
// 模版选择抽屉样式
.template-selector {
  height: 100%;
  display: flex;
  flex-direction: column;

  .template-list {
    flex: 1;
    overflow-y: auto;
    padding: 0px 12px;
    height: calc(100vh - 200px);
  }

  // 模版网格布局
  .template-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 12px;
  }

  .template-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #ffffff;
    min-height: 80px;

    &:hover {
      border-color: #8b5cf6;
      background: #faf5ff;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
    }

    &.active {
      border-color: #8b5cf6;
      background: #f3e8ff;
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
    }

    .template-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0; // 防止内容溢出

      .template-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 600;
        flex-shrink: 0;
      }

      .template-details {
        flex: 1;
        min-width: 0; // 防止内容溢出

        .template-name {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .template-channel {
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .template-arrow {
      color: #8b5cf6;
      font-size: 16px;
      flex-shrink: 0;
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px 0;
    grid-column: 1 / -1;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .template-selector {
    .template-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
