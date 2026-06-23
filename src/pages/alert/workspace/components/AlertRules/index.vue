<template>
  <WorkspaceSectionPage title="告警规则" subtitle="查看工作空间告警规则与 PromQL 配置">
    <div class="rules-content" v-loading="loading">
      <!-- 空状态 -->
      <div v-if="!loading && rules.length === 0" class="empty-state">
        <div class="empty-icon">
          <el-icon><Setting /></el-icon>
        </div>
        <h4 class="empty-title">暂无告警规则</h4>
        <p class="empty-description">当前工作空间没有配置告警规则</p>
      </div>

      <!-- 规则列表 -->
      <div v-else class="rules-list">
        <CollapsibleSection
          v-for="rule in rules"
          :key="rule.id"
          :title="rule.name"
          :tip="rule.description || '暂无描述'"
          :default-collapsed="true"
        >
          <div class="rule-header">
            <div class="rule-info">
              <div class="rule-meta">
                <el-tag :type="getSeverityType(rule.level)" size="small">
                  {{ getSeverityLabel(rule.level) }}
                </el-tag>
                <el-tag :type="rule.enabled ? 'success' : 'info'" size="small">
                  {{ rule.enabled ? "已启用" : "已禁用" }}
                </el-tag>
                <span class="rule-interval">检测间隔: {{ rule.eval_interval }}s</span>
              </div>
            </div>
          </div>

          <div class="rule-content">
            <div class="rule-expression">
              <span class="label">PromQL:</span>
              <code class="expression">{{ rule.prom_ql }}</code>
            </div>

            <div v-if="rule.external_labels && Object.keys(rule.external_labels).length > 0" class="rule-labels">
              <span class="label">标签:</span>
              <div class="labels-list">
                <el-tag v-for="(value, key) in rule.external_labels" :key="key" size="small" type="info" effect="plain">
                  {{ key }}: {{ value }}
                </el-tag>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        background
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </WorkspaceSectionPage>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { Setting } from "@element-plus/icons-vue"
import { listRulesByWorkspaceApi } from "@/api/alert/rule"
import type { ListRulesByWorkspaceReq, Rule } from "@/api/alert/rule/types/rule"
import CollapsibleSection from "@@/components/CollapsibleSection/index.vue"
import WorkspaceSectionPage from "../WorkspaceSectionPage.vue"

const props = defineProps<{
  workspaceId: number
}>()

// 数据
const rules = ref<Rule[]>([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 加载规则列表
const loadRules = async () => {
  if (!props.workspaceId) return

  try {
    loading.value = true
    const params: ListRulesByWorkspaceReq = {
      workspace_id: props.workspaceId,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    }

    const response = await listRulesByWorkspaceApi(params)
    rules.value = response.data.rules || []
    total.value = response.data.total || 0
  } catch (error) {
    console.error("加载告警规则失败:", error)
  } finally {
    loading.value = false
  }
}

// 获取严重级别类型
const getSeverityType = (level: number): "primary" | "success" | "warning" | "info" | "danger" => {
  const severityMap: Record<number, "primary" | "success" | "warning" | "info" | "danger"> = {
    1: "danger", // EMERGENCY
    2: "danger", // CRITICAL
    3: "warning", // ERROR
    4: "warning", // WARNING
    5: "info" // INFO
  }
  return severityMap[level] || "info"
}

// 获取严重级别标签
const getSeverityLabel = (level: number) => {
  const severityMap: Record<number, string> = {
    1: "P0 紧急",
    2: "P1 严重",
    3: "P2 错误",
    4: "P3 警告",
    5: "P4 信息"
  }
  return severityMap[level] || `级别${level}`
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadRules()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadRules()
}

// 监听工作空间ID变化
watch(
  () => props.workspaceId,
  (newId) => {
    if (newId) {
      currentPage.value = 1
      loadRules()
    }
  },
  { immediate: true }
)

defineExpose({
  loadData: loadRules,
  loadRules
})
</script>

<style lang="scss" scoped>
.rules-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;

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
    transition: background 0.2s ease;

    &:hover {
      background: #94a3b8;
    }
  }

  &::-webkit-scrollbar-thumb:active {
    background: #64748b;
  }
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 280px;
  padding: 40px 20px;
  color: #64748b;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-right: 0;
  border-left: 0;
  border-radius: 0;
  text-align: center;

  .empty-icon {
    margin-bottom: 12px;

    .el-icon {
      color: #94a3b8;
      font-size: 36px;
    }
  }

  .empty-title {
    margin: 0 0 6px;
    color: #374151;
    font-size: 16px;
    font-weight: 700;
  }

  .empty-description {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.4;
  }
}

.rules-list {
  display: flex;
  flex-direction: column;

  :deep(.collapsible-section) {
    margin-bottom: 0;
    border-right: 0;
    border-left: 0;
    border-radius: 0;

    & + .collapsible-section {
      border-top: 0;
    }
  }

  :deep(.section-header) {
    border-radius: 0;
  }

  .rule-header {
    padding: 0;
    background: transparent;
    border: none;

    .rule-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;

      .rule-interval {
        color: #64748b;
        font-size: 12px;
      }
    }
  }

  .rule-content {
    padding-top: 16px;
  }
}

.rule-expression {
  margin-bottom: 16px;

  .label {
    display: block;
    margin-bottom: 8px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .expression {
    display: block;
    padding: 12px 14px;
    color: #1f2937;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-family: Monaco, Menlo, "Ubuntu Mono", monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.rule-labels {
  .label {
    display: block;
    margin-bottom: 8px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .labels-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .el-tag {
      border-radius: 4px;
      font-size: 11px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  padding: 12px 16px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}
</style>
