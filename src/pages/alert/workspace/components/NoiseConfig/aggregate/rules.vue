<template>
  <WorkspaceSectionPage
    title="聚合规则"
    subtitle="每个工作空间只能有一个聚合规则"
    :flush-body="false"
    :primary-action="primaryAction"
    :secondary-action="secondaryAction"
    @primary-action="handlePrimaryAction"
    @secondary-action="handleDeleteRule"
  >
    <div class="aggregate-rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && !rule" class="empty-state">
        <div class="empty-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h4 class="empty-title">暂无聚合规则</h4>
        <p class="empty-description">为当前工作空间配置告警聚合规则，减少重复告警</p>
        <AuthButton
          type="primary"
          :icon="Setting"
          :disabled="!!rule"
          :capability="ALERT_CAPABILITIES.Aggregate.Add"
          disable-mode
          @click="handleAddRule"
        >
          添加聚合规则
        </AuthButton>
      </div>

      <!-- 规则卡片 -->
      <div v-if="rule" class="aggregate-config-card">
        <div class="config-card-body">
          <section class="config-panel dimension-panel">
            <div class="panel-title">
              <el-icon><PriceTag /></el-icon>
              <span>聚合标签</span>
              <el-tag :type="rule.type === 0 ? 'primary' : 'warning'" size="small">
                {{ rule.type === 0 ? "按标签聚合" : "按时间聚合" }}
              </el-tag>
              <el-tag type="success" size="small">运行中</el-tag>
            </div>
            <div v-if="rule.labels && rule.labels.length > 0" class="tags-container">
              <el-tag v-for="label in rule.labels" :key="label" type="info" size="small" class="label-tag">
                {{ label }}
              </el-tag>
            </div>
            <div v-else class="inline-empty">未配置聚合标签</div>
          </section>

          <section class="config-panel timing-panel">
            <div class="panel-title">
              <el-icon><Clock /></el-icon>
              <span>时间策略</span>
            </div>
            <div class="timing-list">
              <div class="timing-item">
                <span>等待时间</span>
                <strong>{{ rule.group_wait }}s</strong>
              </div>
              <div class="timing-item">
                <span>组间隔</span>
                <strong>{{ rule.group_interval }}s</strong>
              </div>
              <div class="timing-item">
                <span>重复间隔</span>
                <strong>{{ rule.repeat_interval }}s</strong>
              </div>
            </div>
          </section>

          <section class="config-panel option-panel">
            <div class="panel-title">
              <el-icon><DataBoard /></el-icon>
              <span>其他配置</span>
            </div>
            <div class="option-row">
              <span>区分数据源</span>
              <el-tag :type="rule.is_diff_data_source ? 'success' : 'info'" size="small">
                {{ rule.is_diff_data_source ? "是" : "否" }}
              </el-tag>
            </div>
          </section>
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
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Setting, Edit, Delete, PriceTag, Clock, DataBoard } from "@element-plus/icons-vue"
import AggregateDrawer from "./drawer.vue"
import { getAggregateGroupByWorkspaceApi, deleteAggregateRuleApi, saveAggregateRuleApi } from "@/api/alert/aggregate"
import type { CreateAggregateGroupRuleReq } from "@/api/alert/aggregate/types"
import type { RetrieveAggregateGroup } from "@/api/alert/aggregate/types/retrieve"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import WorkspaceSectionPage from "../../WorkspaceSectionPage.vue"
const props = defineProps<{ workspaceId: number }>()
const currentWorkspaceId = computed(() => {
  return props.workspaceId
})

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
const primaryAction = computed(() => ({
  label: rule.value ? "编辑配置" : "添加规则",
  icon: rule.value ? Edit : Setting,
  capability: rule.value ? ALERT_CAPABILITIES.Aggregate.Edit : ALERT_CAPABILITIES.Aggregate.Add
}))
const secondaryAction = computed(() =>
  rule.value
    ? {
        label: "删除配置",
        icon: Delete,
        type: "danger" as const,
        capability: ALERT_CAPABILITIES.Aggregate.Delete
      }
    : undefined
)

// 重置表单
const resetForm = () => {
  formData.value = reactive({
    workspace_id: currentWorkspaceId.value || 0,
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
  if (!props.workspaceId) return
  loading.value = true
  try {
    const { data } = await getAggregateGroupByWorkspaceApi(props.workspaceId)
    // 后端直接返回数据对象
    rule.value = data
  } catch (error) {
    console.error("加载聚合规则失败:", error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
watch(
  () => props.workspaceId,
  () => {
    loadRules()
  },
  { immediate: true }
)

// 添加规则
const handleAddRule = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handlePrimaryAction = () => {
  if (rule.value) {
    handleEditRule()
    return
  }

  handleAddRule()
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
  if (!formData.value) {
    return
  }

  try {
    submitting.value = true
    await saveAggregateRuleApi(formData.value)

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
.aggregate-rules-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 360px;
  padding: 64px 20px;
  text-align: center;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;

  .empty-icon {
    color: #94a3b8;
    font-size: 44px;
    margin-bottom: 16px;
  }

  .empty-title {
    margin: 0 0 8px;
    color: #334155;
    font-size: 16px;
    font-weight: 700;
  }

  .empty-description {
    max-width: 320px;
    margin: 0 0 24px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.5;
  }
}

.aggregate-config-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.config-card-body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
  grid-template-rows: auto 1fr;
  gap: 18px;
  min-width: 0;
  min-height: 0;
  padding: 24px;
  background: #ffffff;
}

.config-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 22px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dimension-panel {
  grid-row: 1 / span 2;
}

.option-panel {
  min-height: 180px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  color: #334155;
  font-size: 16px;
  font-weight: 800;

  .el-icon {
    color: #64748b;
    font-size: 16px;
  }
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-content: flex-start;
  flex: 1;
}

.label-tag {
  height: 30px;
  padding: 0 10px;
  color: #64748b;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.inline-empty {
  display: inline-flex;
  align-items: center;
  min-height: 56px;
  padding: 14px 16px;
  color: #94a3b8;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 7px;
  font-size: 13px;
}

.timing-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  flex: 1;
}

.timing-item,
.option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  min-height: 96px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.timing-item {
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;

  span {
    color: #64748b;
    font-size: 13px;
    font-weight: 700;
  }

  strong {
    color: #1e293b;
    font-size: 30px;
    font-weight: 800;
    line-height: 1;
  }
}

.option-row {
  span {
    color: #64748b;
    font-size: 14px;
    font-weight: 700;
  }
}

@media (max-width: 1200px) {
  .config-card-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }

  .dimension-panel {
    grid-row: auto;
  }
}

@media (max-width: 768px) {
  .config-card-body {
    padding: 16px;
  }

  .config-panel {
    padding: 16px;
  }

  .timing-list {
    grid-template-columns: 1fr;
  }
}
</style>
