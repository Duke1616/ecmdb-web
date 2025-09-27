<template>
  <div class="inhibit-rules-page">
    <ManagerHeader
      title="抑制规则"
      subtitle="全局抑制规则，对所有工作空间生效"
      :show-back-button="false"
      :show-add-button="true"
      :show-refresh-button="true"
      :add-button-text="'添加规则'"
      @add="handleAddRule"
      @refresh="loadRules"
    />

    <div class="inhibit-rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Filter /></el-icon>
        </div>
        <h4 class="empty-title">暂无抑制规则</h4>
        <p class="empty-description">配置全局抑制规则，减少不必要的告警通知</p>
        <el-button type="primary" :icon="Filter" @click="handleAddRule"> 添加抑制规则 </el-button>
      </div>

      <!-- 规则列表 -->
      <div class="rules-grid">
        <div v-for="rule in rules" :key="rule.id" class="inhibit-rule-card">
          <!-- 卡片头部 -->
          <div class="card-header">
            <div class="header-left">
              <div class="rule-title">
                <h5 class="rule-name">{{ rule.name }}</h5>
                <div class="rule-meta">
                  <el-tag type="primary" size="small" class="type-tag">抑制规则</el-tag>
                  <el-tag :type="rule.enabled ? 'success' : 'info'" size="small" class="status-tag">
                    {{ rule.enabled ? "运行中" : "已停用" }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="header-right">
              <el-switch v-model="rule.enabled" @change="handleToggleRule(rule)" size="large" />
              <el-button type="primary" :icon="Edit" size="default" @click="handleEditRule(rule)">编辑</el-button>
              <el-button type="danger" :icon="Delete" size="default" @click="handleDeleteRule(rule.id)">删除</el-button>
            </div>
          </div>

          <!-- 卡片内容 -->
          <div class="card-content">
            <!-- 匹配器信息 -->
            <div class="matchers-section">
              <div class="section-title">
                <el-icon><Filter /></el-icon>
                <span>匹配器配置</span>
              </div>
              <div class="matchers-grid">
                <!-- 源匹配器 -->
                <div class="matcher-group">
                  <div class="matcher-header">
                    <span class="matcher-title">源匹配器</span>
                    <el-tag v-if="rule.source_match?.length" size="small" type="info">{{
                      rule.source_match.length
                    }}</el-tag>
                  </div>
                  <div class="matcher-content">
                    <div v-if="!rule.source_match || rule.source_match.length === 0" class="empty-matcher">
                      <el-icon><Warning /></el-icon>
                      <span>无匹配条件</span>
                    </div>
                    <div v-else class="matcher-tags">
                      <el-tag
                        v-for="(matcher, index) in rule.source_match"
                        :key="index"
                        size="small"
                        class="matcher-tag"
                      >
                        {{ matcher.name }}{{ getOperatorText(matcher.type) }}{{ matcher.value }}
                      </el-tag>
                    </div>
                  </div>
                </div>

                <!-- 目标匹配器 -->
                <div class="matcher-group">
                  <div class="matcher-header">
                    <span class="matcher-title">目标匹配器</span>
                    <el-tag v-if="rule.target_match?.length" size="small" type="info">{{
                      rule.target_match.length
                    }}</el-tag>
                  </div>
                  <div class="matcher-content">
                    <div v-if="!rule.target_match || rule.target_match.length === 0" class="empty-matcher">
                      <el-icon><Warning /></el-icon>
                      <span>无匹配条件</span>
                    </div>
                    <div v-else class="matcher-tags">
                      <el-tag
                        v-for="(matcher, index) in rule.target_match"
                        :key="index"
                        size="small"
                        class="matcher-tag"
                      >
                        {{ matcher.name }}{{ getOperatorText(matcher.type) }}{{ matcher.value }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 相同标签 -->
            <div v-if="rule.equal_labels && rule.equal_labels.length > 0" class="equal-labels-section">
              <div class="section-title">
                <el-icon><PriceTag /></el-icon>
                <span>相同标签</span>
              </div>
              <div class="labels-container">
                <el-tag v-for="label in rule.equal_labels" :key="label" type="info" size="small" class="label-tag">
                  {{ label }}
                </el-tag>
              </div>
            </div>

            <!-- 时间窗口 -->
            <div v-if="rule.time_window" class="time-window-section">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                <span>时间窗口</span>
              </div>
              <div class="time-window-info">
                <span class="time-text">
                  {{ formatTime(rule.time_window.start) }} - {{ formatTime(rule.time_window.end) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑规则抽屉 -->
    <InhibitDrawer
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
import { Filter, Edit, Delete, PriceTag, Clock, Warning } from "@element-plus/icons-vue"
import ManagerHeader from "@@/components/ManagerHeader/index.vue"
import InhibitDrawer from "./drawer.vue"
import { listInhibitRulesApi, deleteInhibitRuleApi, saveInhibitRuleApi } from "@/api/alert/inhibit"
import type { SaveInhibitRuleReq, InhibitRule } from "@/api/alert/inhibit/types"

// 定义事件
const emit = defineEmits<{
  refresh: []
}>()

// 使用 defineModel 管理状态
const dialogVisible = defineModel<boolean>("dialogVisible", { default: false })
const isEdit = defineModel<boolean>("isEdit", { default: false })
const submitting = defineModel<boolean>("submitting", { default: false })
const formData = defineModel<SaveInhibitRuleReq>("formData", {
  default: () =>
    reactive({
      name: "",
      source_matchers: [],
      target_matchers: [],
      equal_labels: [],
      time_window: null,
      enabled: true
    })
})

// 响应式数据
const loading = ref(false)
const rules = ref<InhibitRule[]>([])

// 重置表单
const resetForm = () => {
  formData.value = reactive({
    name: "",
    source_matchers: [],
    target_matchers: [],
    equal_labels: [],
    time_window: null,
    enabled: true
  })
}

// 加载规则数据
const loadRules = async () => {
  loading.value = true
  try {
    const { data } = await listInhibitRulesApi()

    // 确保每个规则都有必要的属性，并统一字段名
    rules.value = (data.inhibit_rules || []).map((rule) => ({
      ...rule,
      source_match: rule.source_matchers || [],
      target_match: rule.target_matchers || [],
      equal_labels: rule.equal_labels || []
    }))
  } catch (error) {
    console.error("加载抑制规则失败:", error)
    ElMessage.error("加载抑制规则失败")
    rules.value = []
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化 formData 的默认值
  if (!formData.value) {
    formData.value = {
      name: "",
      source_matchers: [],
      target_matchers: [],
      equal_labels: [],
      time_window: null,
      enabled: true
    }
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
const handleEditRule = (rule: InhibitRule) => {
  isEdit.value = true

  // 确保匹配器数据结构正确
  const sourceMatchers = (rule.source_match || []).map((matcher) => ({
    type: matcher.type,
    name: matcher.name,
    value: matcher.value
  }))

  const targetMatchers = (rule.target_match || []).map((matcher) => ({
    type: matcher.type,
    name: matcher.name,
    value: matcher.value
  }))

  formData.value = reactive({
    id: rule.id,
    name: rule.name,
    source_matchers: sourceMatchers,
    target_matchers: targetMatchers,
    equal_labels: rule.equal_labels || [],
    time_window: rule.time_window,
    enabled: rule.enabled
  })

  dialogVisible.value = true
}

// 删除规则
const handleDeleteRule = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个抑制规则吗？", "确认删除", {
      type: "warning"
    })

    await deleteInhibitRuleApi(id)
    ElMessage.success("删除成功")
    loadRules()
    emit("refresh")
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除抑制规则失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

// 切换规则状态
const handleToggleRule = async (rule: InhibitRule) => {
  try {
    await saveInhibitRuleApi({
      id: rule.id,
      name: rule.name,
      source_matchers: rule.source_match || [],
      target_matchers: rule.target_match || [],
      equal_labels: rule.equal_labels || [],
      time_window: rule.time_window,
      enabled: rule.enabled
    })
    ElMessage.success(rule.enabled ? "规则已启用" : "规则已停用")
    loadRules()
    emit("refresh")
  } catch (error) {
    console.error("切换规则状态失败:", error)
    ElMessage.error("操作失败")
    // 恢复原状态
    rule.enabled = !rule.enabled
  }
}

// 抽屉确认
const handleConfirm = async () => {
  if (!formData.value) return

  try {
    submitting.value = true
    await saveInhibitRuleApi(formData.value)
    ElMessage.success(isEdit.value ? "规则更新成功" : "规则创建成功")

    dialogVisible.value = false
    loadRules()
    emit("refresh")
  } catch (error) {
    console.error("保存规则失败:", error)
    ElMessage.error("保存失败")
  } finally {
    submitting.value = false
  }
}

// 抽屉取消
const handleCancel = () => {
  dialogVisible.value = false
  isEdit.value = false
}

// 获取操作符文本
const getOperatorText = (type: number): string => {
  const operators = ["=", "!=", "~"]
  return operators[type] || "="
}

// 格式化时间
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
}
</script>

<style lang="scss" scoped>
.inhibit-rules-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inhibit-rules-content {
  flex: 1;
  padding: 20px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  height: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.inhibit-rule-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: #f8f9fa;
    border-bottom: 1px solid #e9ecef;

    .header-left {
      .rule-title {
        .rule-name {
          font-size: 16px;
          font-weight: 600;
          color: #495057;
          margin: 0 0 8px 0;
        }

        .rule-meta {
          display: flex;
          align-items: center;
          gap: 8px;

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
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;

      .el-button {
        padding: 8px 16px;
        font-weight: 500;
        font-size: 14px;
        border-radius: 6px;
        min-width: 70px;
      }
    }
  }

  .card-content {
    padding: 20px;

    .matchers-section,
    .equal-labels-section,
    .time-window-section {
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
    }

    .matchers-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .matcher-group {
        .matcher-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #495057;
        }

        .matcher-content {
          .empty-matcher {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 12px;
            background: #f8f9fa;
            border: 1px dashed #dee2e6;
            border-radius: 4px;
            color: #6c757d;
            font-size: 12px;

            .el-icon {
              font-size: 14px;
            }
          }

          .matcher-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;

            .matcher-tag {
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 4px;
              background: #e9ecef;
              color: #495057;
              border: 1px solid #dee2e6;
            }
          }
        }
      }
    }

    .labels-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .label-tag {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
      }
    }

    .time-window-info {
      .time-text {
        font-size: 14px;
        font-weight: 500;
        color: #495057;
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .inhibit-rules-content {
    padding: 16px;
  }

  .rules-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .inhibit-rule-card {
    .card-header {
      padding: 12px 16px;
      flex-direction: column;
      gap: 12px;
      align-items: flex-start;

      .header-right {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .card-content {
      padding: 16px;

      .matchers-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
    }
  }
}
</style>
