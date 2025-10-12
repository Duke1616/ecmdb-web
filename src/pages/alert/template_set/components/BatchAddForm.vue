<template>
  <div class="batch-add-content">
    <div class="batch-add-header">
      <div class="header-left">
        <div class="add-section">
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="channelOptions.length === 0"
            @click="addBatchItem"
            size="default"
            class="add-btn"
          >
            添加新条目
          </el-button>
          <div class="item-count">
            <el-text type="info" size="small">
              <el-icon><List /></el-icon>
              当前 {{ modelValue.length }} 个条目
            </el-text>
          </div>
        </div>
        <div v-if="modelValue.length > 0" class="batch-info">
          <el-text type="success" size="small">
            <el-icon><Check /></el-icon>
            批量添加模式
          </el-text>
        </div>
      </div>
      <div v-if="channelOptions.length === 0" class="no-channels-tip">
        <el-alert
          title="所有渠道类型都已添加"
          description="无法继续添加新条目，请删除现有条目后再试"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
    </div>
    <!-- 条目列表 -->
    <div class="batch-items" v-if="modelValue.length > 0">
      <div v-for="(item, index) in modelValue" :key="index" class="batch-item">
        <div class="item-header">
          <div class="item-number">
            <el-tag type="primary" size="small">条目 {{ index + 1 }}</el-tag>
          </div>
          <el-button
            type="danger"
            :icon="Delete"
            size="small"
            circle
            @click="removeBatchItem(index)"
            class="remove-btn"
          />
        </div>

        <div class="item-content">
          <el-form :model="item" label-position="top" class="batch-item-form">
            <div class="form-row">
              <el-form-item label="渠道类型" class="channel-field">
                <el-select
                  v-model="item.channel"
                  placeholder="请选择渠道类型"
                  @change="(channel) => handleBatchChannelChange(index, channel)"
                  class="full-width"
                >
                  <el-option
                    v-for="channel in getAvailableChannelsForIndex(index)"
                    :key="channel.value"
                    :label="channel.label"
                    :value="channel.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="模板" class="template-field">
                <el-select
                  v-model="item.template_id"
                  placeholder="请选择模板"
                  filterable
                  :disabled="!item.channel"
                  class="full-width"
                >
                  <el-option
                    v-for="template in batchTemplates[index] || []"
                    :key="template.id"
                    :label="template.name"
                    :value="template.id"
                  >
                    <div class="template-option">
                      <div class="template-name">{{ template.name }}</div>
                      <div class="template-desc">{{ template.description }}</div>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </div>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="开始批量添加模板条目">
        <template #image>
          <el-icon size="60" color="#cbd5e1">
            <DocumentAdd />
          </el-icon>
        </template>
        <el-button
          type="primary"
          :icon="Plus"
          @click="addBatchItem"
          :disabled="channelOptions.length === 0"
          size="large"
        >
          添加第一个条目
        </el-button>
        <div v-if="channelOptions.length === 0" class="empty-tip">
          <el-text type="warning" size="small"> 所有渠道类型都已添加，无法继续添加新条目 </el-text>
        </div>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useRoute } from "vue-router"
import { Plus, Delete, List, Check, DocumentAdd } from "@element-plus/icons-vue"
import type { AddItemReq } from "@/api/alert/template_set/types"
import type { ChannelTemplate, ChannelType } from "@/api/alert/template/types"
import { DEFAULT_CHANNEL_TYPE } from "@/api/alert/template/types"
import { listTemplatesByChannelApi } from "@/api/alert/template"
import { getChannelOptions } from "../../template/config/channels"

interface Props {
  setId: number
  existingChannels: string[] // 已存在的渠道类型
}

const props = defineProps<Props>()

// 路由
const route = useRoute()

// 使用 defineModel 简化双向绑定
const modelValue = defineModel<AddItemReq[]>({ required: true })
const batchTemplates = defineModel<Record<number, ChannelTemplate[]>>("batchTemplates", { required: true })

// 渠道选项 - 过滤掉已存在的渠道
const channelOptions = computed(() => {
  const allOptions = getChannelOptions()
  return allOptions.filter((option) => !props.existingChannels.includes(option.value))
})

// 添加批量条目
const addBatchItem = () => {
  const index = modelValue.value.length
  const setId = Number(route.params.id)
  modelValue.value.push({
    set_id: setId,
    channel: DEFAULT_CHANNEL_TYPE,
    template_id: undefined
  })
  batchTemplates.value[index] = []
}

// 获取可用的渠道选项（排除已存在的和当前批量项中已选择的）
const getAvailableChannelsForIndex = (currentIndex: number) => {
  const allOptions = getChannelOptions()
  const usedChannels = [
    ...props.existingChannels, // 已存在的渠道
    ...modelValue.value.map((item, index) => (index !== currentIndex ? item.channel : null)).filter(Boolean) // 当前批量项中其他项已选择的渠道
  ]
  return allOptions.filter((option) => !usedChannels.includes(option.value))
}

// 移除批量条目
const removeBatchItem = (index: number) => {
  modelValue.value.splice(index, 1)
  delete batchTemplates.value[index]
  // 重新索引模板列表
  const newBatchTemplates: Record<number, ChannelTemplate[]> = {}
  Object.keys(batchTemplates.value).forEach((key, newIndex) => {
    newBatchTemplates[newIndex] = batchTemplates.value[Number(key)]
  })
  batchTemplates.value = newBatchTemplates
}

// 批量渠道变化处理
const handleBatchChannelChange = async (index: number, channel: ChannelType) => {
  modelValue.value[index].template_id = undefined

  try {
    const response = await listTemplatesByChannelApi({
      channel,
      offset: 0,
      limit: 1000
    })
    batchTemplates.value[index] = response.data.templates || []
  } catch (error) {
    console.error("加载模板失败:", error)
    batchTemplates.value[index] = []
  }
}

// 清空数据
const clearData = () => {
  modelValue.value = []
  batchTemplates.value = {}
}

// 暴露方法给父组件
defineExpose({
  clearData
})
</script>

<style lang="scss" scoped>
// 批量添加样式
.batch-add-content {
  height: 60vh;
  display: flex;
  flex-direction: column;
  .batch-add-header {
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .add-section {
        display: flex;
        align-items: center;
        gap: 12px;

        .add-btn {
          font-weight: 500;
        }

        .item-count {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #f8fafc;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
        }
      }

      .batch-info {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background: #f0f9ff;
        border-radius: 20px;
        border: 1px solid #bae6fd;
        font-size: 13px;
      }
    }

    .no-channels-tip {
      margin-top: 12px;
    }
  }

  .batch-items {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
    min-height: 0;

    .batch-item {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      margin-bottom: 16px;
      background: #fafafa;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        border-radius: 12px 12px 0 0;

        .item-number {
          font-weight: 500;
        }

        .remove-btn {
          opacity: 0.7;
          transition: opacity 0.2s ease;

          &:hover {
            opacity: 1;
          }
        }
      }

      .item-content {
        padding: 16px;

        .batch-item-form {
          .form-row {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 20px;
            align-items: start;

            .channel-field,
            .template-field {
              margin-bottom: 0;

              .full-width {
                width: 100%;
              }
            }
          }
        }
      }
    }
  }

  .empty-state {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
    background: #f9fafb;
    border-radius: 12px;
    border: 2px dashed #d1d5db;
    min-height: 0;

    .empty-tip {
      margin-top: 12px;
    }
  }
}

// 模板选项样式
.template-option {
  .template-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .template-desc {
    font-size: 12px;
    color: #6b7280;
    margin-top: 2px;
  }
}

// 无可用渠道提示
.no-channels-tip {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
