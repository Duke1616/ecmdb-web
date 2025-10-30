<template>
  <div class="aggregate-rules-page">
    <ManagerHeader
      title="聚合规则"
      subtitle="每个工作空间只能有一个聚合规则"
      :show-back-button="false"
      :show-add-button="true"
      :show-refresh-button="true"
      :add-button-text="rule ? '已有规则' : '添加规则'"
      :add-button-disabled="!!rule"
      @add="handleAddRule"
      @refresh="loadRules"
    />

    <div class="aggregate-rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && !rule" class="empty-state">
        <div class="empty-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h4 class="empty-title">暂无聚合规则</h4>
        <p class="empty-description">为当前工作空间配置告警聚合规则，减少重复告警</p>
        <el-button type="primary" :icon="Setting" :disabled="!!rule" @click="handleAddRule">
          {{ rule ? "已有规则" : "添加聚合规则" }}
        </el-button>
      </div>

      <!-- 规则卡片 -->
      <div v-if="rule" class="aggregate-rule-card">
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="header-left">
            <div class="rule-meta">
              <el-tag :type="rule.type === 0 ? 'primary' : 'warning'" size="small" class="type-tag">
                {{ rule.type === 0 ? "按标签聚合" : "按时间聚合" }}
              </el-tag>
              <el-tag type="success" size="small" class="status-tag"> 运行中 </el-tag>
            </div>
          </div>
          <div class="header-right">
            <el-button type="primary" :icon="Edit" size="default" @click="handleEditRule"> 编辑 </el-button>
            <el-button type="danger" :icon="Delete" size="default" @click="handleDeleteRule"> 删除 </el-button>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-content">
          <!-- 标签区域 -->
          <div class="info-section">
            <div class="section-title">
              <el-icon><PriceTag /></el-icon>
              <span>聚合标签</span>
            </div>
            <div class="section-content">
              <div v-if="rule.labels && rule.labels.length > 0" class="tags-container">
                <el-tag v-for="label in rule.labels" :key="label" type="info" size="small" class="label-tag">
                  {{ label }}
                </el-tag>
              </div>
              <div v-else class="empty-state">
                <el-icon><Warning /></el-icon>
                <span>未配置聚合标签</span>
              </div>
            </div>
          </div>

          <!-- 时间配置区域 -->
          <div class="info-section">
            <div class="section-title">
              <el-icon><Clock /></el-icon>
              <span>时间配置</span>
            </div>
            <div class="section-content">
              <div class="timing-cards">
                <div class="timing-card">
                  <div class="timing-value">{{ rule.group_wait }}</div>
                  <div class="timing-label">等待时间(秒)</div>
                </div>
                <div class="timing-card">
                  <div class="timing-value">{{ rule.group_interval }}</div>
                  <div class="timing-label">组间隔(秒)</div>
                </div>
                <div class="timing-card">
                  <div class="timing-value">{{ rule.repeat_interval }}</div>
                  <div class="timing-label">重复间隔(秒)</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 其他配置区域 -->
          <div class="info-section">
            <div class="section-title">
              <el-icon><Operation /></el-icon>
              <span>其他配置</span>
            </div>
            <div class="section-content">
              <div class="config-cards">
                <div class="config-card">
                  <div class="config-icon">
                    <el-icon><DataBoard /></el-icon>
                  </div>
                  <div class="config-content">
                    <div class="config-label">区分数据源</div>
                    <div class="config-value">
                      <el-tag :type="rule.is_diff_data_source ? 'success' : 'info'" size="small" class="status-tag">
                        {{ rule.is_diff_data_source ? "是" : "否" }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则抽屉 -->
    <AggregateDrawer
      v-model:visible="dialogVisible"
      v-model:is-edit="isEdit"
      v-model:submitting="submitting"
      v-model:form-data="formData"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Setting, Edit, Delete, PriceTag, Warning, Operation, DataBoard } from "@element-plus/icons-vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import AggregateDrawer from "./drawer.vue"
import { getAggregateGroupByWorkspaceApi, deleteAggregateRuleApi, saveAggregateRuleApi } from "@/api/aggregate"
import type { CreateAggregateGroupRuleReq } from "@/api/aggregate/types"
import type { RetrieveAggregateGroup } from "@/api/aggregate/types/retrieve"
import { useRoute } from "vue-router"
import { computed } from "vue"
const route = useRoute()
const workspaceId = computed(() => Number(route.params.workspaceId))

// 定义事件
const emit = defineEmits<{
  refresh: []
}>()

// 使用 defineModel 管理状态
const dialogVisible = defineModel<boolean>("dialogVisible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<CreateAggregateGroupRuleReq>("formData", {
  default: () =>
    reactive({
      workspace_id: 0, // 将在 onMounted 中设置
      type: 0,
      is_diff_data_source: false,
      labels: [],
      time_window: null,
      notification_template: "",
      matchers: [],
      group_wait: 0,
      group_interval: 0,
      repeat_interval: 0
    })
})

// 响应式数据
const loading = ref(false)
const rule = ref<RetrieveAggregateGroup | null>(null)

// 重置表单
const resetForm = () => {
  formData.value = reactive({
    workspace_id: workspaceId.value,
    type: 0,
    is_diff_data_source: false,
    labels: [],
    time_window: null,
    notification_template: "",
    matchers: [],
    group_wait: 0,
    group_interval: 0,
    repeat_interval: 0
  })
}

// 加载规则数据
const loadRules = async () => {
  loading.value = true
  try {
    const { data } = await getAggregateGroupByWorkspaceApi(workspaceId.value)
    // 后端直接返回数据对象
    rule.value = data
  } catch (error) {
    console.error("加载聚合规则失败:", error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化 formData 的 workspace_id
  if (formData.value) {
    formData.value.workspace_id = workspaceId.value
  }
  loadRules()
})

// 添加规则
const handleAddRule = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑规则
const handleEditRule = () => {
  if (!rule.value) return

  isEdit.value = true
  // 直接使用对象展开语法，只处理必要的字段转换
  formData.value = reactive({
    ...rule.value,
    matchers: rule.value.matchers || []
  })
  dialogVisible.value = true
}

// 删除规则
const handleDeleteRule = async () => {
  if (!rule.value) return

  try {
    await ElMessageBox.confirm("确定要删除这个聚合规则吗？", "确认删除", {
      type: "warning"
    })

    await deleteAggregateRuleApi(rule.value.id)
    ElMessage.success("删除成功")
    loadRules()
    emit("refresh")
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除聚合规则失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

// 抽屉确认
const handleConfirm = async () => {
  console.log("handleConfirm 被调用", { formData: formData.value, isEdit: isEdit.value })

  if (!formData.value) {
    console.log("formData 为空，返回")
    return
  }

  try {
    submitting.value = true
    console.log("开始调用 saveAggregateRuleApi", formData.value)
    await saveAggregateRuleApi(formData.value)
    console.log("saveAggregateRuleApi 调用成功")

    dialogVisible.value = false
    loadRules()
    emit("refresh")
  } catch (error) {
    console.error("保存规则失败:", error)
  } finally {
    submitting.value = false
  }
}

// 抽屉取消
const handleCancel = () => {
  dialogVisible.value = false
  isEdit.value = false
}
</script>

<style lang="scss" scoped>
.aggregate-rules-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.aggregate-rules-content {
  flex: 1;
  overflow-y: auto;

  // 自定义滚动条样式
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;

    &:hover {
      background: #a8a8a8;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: #f8f9fa;
  border: 1px dashed #dee2e6;
  border-radius: 8px;
  margin: 20px 0;

  .empty-icon {
    font-size: 48px;
    color: #adb5bd;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: #495057;
    margin: 0 0 8px 0;
  }

  .empty-description {
    font-size: 14px;
    color: #6c757d;
    margin: 0 0 24px 0;
    max-width: 300px;
  }
}

.aggregate-rule-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .type-tag {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .status-tag {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }

    .header-right {
      display: flex;
      gap: 8px;
    }
  }

  .card-content {
    padding: 20px;

    .info-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e9ecef;

        .el-icon {
          font-size: 14px;
          color: #6c757d;
        }
      }

      .section-content {
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .label-tag {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
          }
        }

        .empty-state {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6c757d;
          font-size: 13px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;

          .el-icon {
            font-size: 14px;
          }
        }

        .timing-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;

          .timing-card {
            text-align: center;
            padding: 16px 12px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;

            .timing-value {
              font-size: 24px;
              font-weight: 600;
              color: #495057;
              margin-bottom: 4px;
            }

            .timing-label {
              font-size: 12px;
              color: #6c757d;
            }
          }
        }

        .config-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;

          .config-card {
            display: flex;
            align-items: center;
            padding: 16px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;

            .config-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              background: #007bff;
              border-radius: 6px;
              margin-right: 12px;
              flex-shrink: 0;

              .el-icon {
                font-size: 16px;
                color: #fff;
              }
            }

            .config-content {
              flex: 1;

              .config-label {
                font-size: 12px;
                color: #6c757d;
                margin-bottom: 4px;
              }

              .config-value {
                .status-tag {
                  font-size: 11px;
                  padding: 2px 6px;
                }

                .template-id {
                  font-size: 13px;
                  font-weight: 500;
                  color: #495057;
                  background: #fff;
                  padding: 2px 6px;
                  border-radius: 4px;
                  border: 1px solid #e9ecef;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>
