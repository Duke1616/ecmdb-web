<template>
  <div class="alert-rules-page">
    <div class="rules-header">
      <h3>告警规则</h3>
    </div>

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
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { ElMessage } from "element-plus"
import { Setting } from "@element-plus/icons-vue"
import { listRulesByWorkspaceApi } from "@/api/alert/rule"
import type { ListRulesByWorkspaceReq, Rule } from "@/api/alert/rule/types/rule"
import CollapsibleSection from "@@/components/CollapsibleSection/index.vue"

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
    ElMessage.error("加载告警规则失败")
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

onMounted(() => {
  if (props.workspaceId) {
    loadRules()
  }
})
</script>

<style lang="scss" scoped>
.alert-rules-page {
  height: 100%;
  display: flex;
  flex-direction: column;

  .rules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .rules-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    // 自定义滚动条样式
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

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      background: #f8fafc;
      border: 2px dashed #d1d5db;
      border-radius: 6px;

      .empty-icon {
        margin-bottom: 12px;

        .el-icon {
          font-size: 36px;
          color: #9ca3af;
        }
      }

      .empty-title {
        margin: 0 0 6px 0;
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }

      .empty-description {
        margin: 0 0 20px 0;
        font-size: 13px;
        color: #6b7280;
        line-height: 1.4;
      }
    }

    .rules-list {
      .rule-header {
        padding: 0;
        background: transparent;
        border: none;

        .rule-info {
          .rule-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;

            .rule-interval {
              font-size: 12px;
              color: #6b7280;
              margin-left: 8px;
            }
          }
        }
      }

      .rule-content {
        padding: 16px 0 0 0;

        .rule-expression {
          margin-bottom: 16px;

          .label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .expression {
            display: block;
            padding: 12px 16px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
            font-size: 13px;
            color: #1f2937;
            line-height: 1.5;
            word-break: break-all;
            white-space: pre-wrap;
          }
        }

        .rule-labels {
          .label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .labels-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;

            .el-tag {
              font-size: 11px;
              padding: 2px 6px;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }

  .pagination-container {
    margin-top: 16px;
    padding: 16px 0;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    background: #ffffff;
    flex-shrink: 0;
  }
}
</style>
