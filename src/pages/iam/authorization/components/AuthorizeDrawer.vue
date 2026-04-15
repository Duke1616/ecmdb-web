<template>
  <Drawer
    v-model="visible"
    title="批量授权治理"
    subtitle="建立身份主体与权限集合的原子级关联，构建租户全域安全治理边界"
    :header-icon="Connection"
    size="1050px"
    class="eiam-auth-wizard"
    @confirm="handleSubmit"
    :confirm-loading="submitting"
    :show-confirm-button="canSubmit"
  >
    <div class="wizard-workflow">
      <!-- 1. 授权主体治理卡片 -->
      <div class="governance-card subject-card">
        <div class="card-header">
          <div class="title-wrap">
            <el-icon class="main-icon"><User /></el-icon>
            <span class="text">授权主体 (Subject)</span>
          </div>
          <div class="header-actions">
            <el-button
              v-if="subjectSelector.selectedTotal.value > 0"
              link
              type="danger"
              size="small"
              @click="subjectSelector.clearSelection()"
            >
              清空已选
            </el-button>
          </div>
        </div>

        <div class="dual-panel-container">
          <!-- 左侧：源列表 -->
          <div class="panel-source">
            <div class="panel-source-header">
              <el-input
                v-model="subjectSelector.query.keyword"
                placeholder="搜索主体名称..."
                class="search-input"
                style="width: 200px"
                size="small"
                clearable
                @input="subjectSelector.debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-radio-group v-model="subjectSelector.query.sub_type" size="small" @change="subjectSelector.fetchList">
                <el-radio-button label="">全部</el-radio-button>
                <el-radio-button value="user">用户</el-radio-button>
                <el-radio-button value="role">角色</el-radio-button>
              </el-radio-group>
            </div>

            <el-table
              :ref="subjectSelector.tableRef"
              v-loading="subjectSelector.loading.value"
              :data="subjectSelector.list.value"
              height="300"
              row-key="id"
              @selection-change="subjectSelector.handleSelectionChange"
            >
              <el-table-column type="selection" width="40" reserve-selection />
              <el-table-column label="身份标识" min-width="160">
                <template #default="{ row }">
                  <div class="identity-info">
                    <span class="display-name">{{ row.name }}</span>
                    <span class="id-tag mono">{{ row.id }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80">
                <template #default="{ row }">
                  <span class="type-badge" :class="row.type">{{ row.type === "user" ? "用户" : "角色" }}</span>
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="desc-text">{{ row.desc || "-" }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-bar">
              <el-pagination
                v-model:current-page="subjectSelector.query.page"
                v-model:page-size="subjectSelector.query.limit"
                small
                background
                layout="prev, pager, next"
                :total="subjectSelector.total.value"
                @current-change="subjectSelector.fetchList"
              />
            </div>
          </div>

          <!-- 右侧：购物车/已选 -->
          <div class="panel-buffer">
            <div class="buffer-header">
              <span>已选主体</span>
              <span class="count-tag">{{ subjectSelector.selectedTotal.value }}</span>
            </div>
            <div class="buffer-list">
              <TransitionGroup name="list-fade">
                <div v-for="item in subjectSelector.selectedList.value" :key="item.id" class="buffer-item">
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.id }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="subjectSelector.removeSelection(item)"><Close /></el-icon>
                </div>
              </TransitionGroup>
              <el-empty v-if="subjectSelector.selectedTotal.value === 0" description="点击左侧勾选" :image-size="40" />
            </div>
          </div>
        </div>
      </div>

      <!-- 🚦 分隔指示器 -->
      <div class="wizard-connector">
        <el-icon><ArrowDown /></el-icon>
      </div>

      <!-- 2. 权限策略治理卡片 -->
      <div class="governance-card policy-card">
        <div class="card-header">
          <div class="title-wrap">
            <el-icon class="main-icon"><Connection /></el-icon>
            <span class="text">权限策略 (Policy)</span>
          </div>
          <div class="header-actions">
            <el-button
              v-if="policySelector.selectedTotal.value > 0"
              link
              type="danger"
              size="small"
              @click="policySelector.clearSelection()"
            >
              清空已选
            </el-button>
          </div>
        </div>

        <div class="dual-panel-container">
          <div class="panel-source">
            <div class="panel-source-header">
              <el-input
                v-model="policySelector.query.keyword"
                placeholder="搜索策略..."
                class="search-input"
                style="width: 200px"
                size="small"
                clearable
                @input="policySelector.debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-select
                v-model="policySelector.query.type"
                size="small"
                style="width: 120px"
                @change="policySelector.fetchList"
              >
                <el-option label="所有类型" value="" />
                <el-option label="系统预设" :value="1" />
                <el-option label="自定义" :value="2" />
              </el-select>
            </div>

            <el-table
              :ref="policySelector.tableRef"
              v-loading="policySelector.loading.value"
              :data="policySelector.list.value"
              height="300"
              row-key="code"
              @selection-change="policySelector.handleSelectionChange"
            >
              <el-table-column type="selection" width="40" reserve-selection />
              <el-table-column label="策略资产" min-width="160">
                <template #default="{ row }">
                  <div class="policy-info">
                    <div class="name-box">
                      <span class="policy-name">{{ row.name }}</span>
                      <el-tag v-if="isHighRisk(row.name)" type="danger" size="small" effect="dark" class="risk-badge"
                        >高风险</el-tag
                      >
                    </div>
                    <span class="policy-code mono">{{ row.code }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="80">
                <template #default="{ row }">
                  <span class="type-badge" :class="row.type === 1 ? 'system' : 'custom'">
                    {{ row.type === 1 ? "系统" : "自定义" }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="140" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="desc-text">{{ row.desc || "-" }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="pagination-bar">
              <el-pagination
                v-model:current-page="policySelector.query.page"
                v-model:page-size="policySelector.query.limit"
                small
                background
                layout="prev, pager, next"
                :total="policySelector.total.value"
                @current-change="policySelector.fetchList"
              />
            </div>
          </div>

          <div class="panel-buffer">
            <div class="buffer-header">
              <span>已选策略</span>
              <span class="count-tag">{{ policySelector.selectedTotal.value }}</span>
            </div>
            <div class="buffer-list">
              <TransitionGroup name="list-fade">
                <div v-for="item in policySelector.selectedList.value" :key="item.code" class="buffer-item">
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.code }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="policySelector.removeSelection(item)"><Close /></el-icon>
                </div>
              </TransitionGroup>
              <el-empty v-if="policySelector.selectedTotal.value === 0" description="点击左侧勾选" :image-size="40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { Search, User, Close, Connection, ArrowDown } from "@element-plus/icons-vue"
import { searchSubjectsApi } from "@/api/iam/permission"
import { listPoliciesApi, batchAttachPolicyApi } from "@/api/iam/policy"
import type { Subject } from "@/api/iam/permission/type"
import type { Policy } from "@/api/iam/policy/type"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { useResourceSelector } from "../composables/useResourceSelector"

const emit = defineEmits<{
  (e: "success"): void
}>()

// NOTE: 该组件为独立受控向导，状态由 v-model 控制开闭
const visible = defineModel<boolean>({ default: false })

// --- 识别高风险策略 ---
const isHighRisk = (name: string) => {
  const risks = ["Admin", "FullAccess", "Owner", "Super"]
  return risks.some((r) => name.toLowerCase().includes(r.toLowerCase()))
}

// --- 授权主体治理选择器 (Subject) ---
const subjectSelector = useResourceSelector<Subject, { keyword: string; sub_type: string }>({
  fetchApi: searchSubjectsApi,
  listKey: "subjects",
  rowKey: "id",
  initialQuery: { keyword: "", sub_type: "" }
})

// --- 权限策略治理选择器 (Policy) ---
const policySelector = useResourceSelector<Policy, { keyword: string; type: string | number }>({
  fetchApi: listPoliciesApi,
  listKey: "policies",
  rowKey: "code",
  initialQuery: { keyword: "", type: "" }
})

// --- 确认提交 ---
const submitting = ref(false)
const canSubmit = computed(() => subjectSelector.selectedTotal.value > 0 && policySelector.selectedTotal.value > 0)

const handleSubmit = async () => {
  submitting.value = true
  try {
    const subjects = subjectSelector.selectedList.value.map((s) => ({
      type: s.type,
      code: s.id
    }))
    const policyCodes = policySelector.selectedList.value.map((p) => p.code)

    const { data } = await batchAttachPolicyApi({
      subjects,
      policy_codes: policyCodes
    })

    ElMessage.success(`授权成功：共建立 ${data.total} 条策略关联`)
    emit("success")
    visible.value = false
  } catch (err) {
    ElMessage.error("批量授权失败，请重试")
  } finally {
    submitting.value = false
  }
}

// --- 开闭状态联动 ---
watch(visible, (val) => {
  if (val) {
    subjectSelector.fetchList()
    policySelector.fetchList()
  } else {
    subjectSelector.reset()
    policySelector.reset()
  }
})
</script>

<style lang="scss" scoped>
.wizard-workflow {
  padding: 12px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #f8fafc;
}

.governance-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  overflow: hidden;

  .card-header {
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      .main-icon {
        color: #6366f1;
        font-size: 18px;
      }
      .text {
        font-size: 14px;
        font-weight: 700;
        color: #1e293b;
      }
    }
  }
}

.dual-panel-container {
  display: flex;
  height: 340px;
}

.panel-source {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;

  .panel-source-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .pagination-bar {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
  }
}

.panel-buffer {
  width: 280px;
  background: #fcfcfd;
  display: flex;
  flex-direction: column;

  .buffer-header {
    padding: 10px 16px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border-bottom: 1px solid #f1f5f9;

    .count-tag {
      background: #6366f1;
      color: white;
      padding: 0 8px;
      height: 18px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      font-size: 11px;
    }
  }

  .buffer-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.buffer-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;

  &:hover {
    border-color: #6366f1;
    transform: translateX(4px);
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    .name {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    .id {
      font-size: 10px;
      color: #94a3b8;
    }
  }

  .remove-btn {
    cursor: pointer;
    color: #94a3b8;
    padding: 4px;
    border-radius: 4px;
    &:hover {
      color: #ef4444;
      background: #fee2e2;
    }
  }
}

.wizard-connector {
  display: flex;
  justify-content: center;
  color: #cbd5e1;
  font-size: 20px;
  height: 20px;
  margin: -8px 0;
}

.identity-info {
  display: flex;
  flex-direction: column;
  .display-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 2px;
  }
}

.id-tag {
  font-size: 10px;
  color: #64748b;
  align-self: flex-start;
}

.policy-info {
  display: flex;
  flex-direction: column;
  .name-box {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    .policy-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
  }
  .policy-code {
    font-size: 10px;
    color: #94a3b8;
    margin-bottom: 2px;
  }
  .policy-desc {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }
}

.risk-badge {
  padding: 0 4px;
  height: 16px;
  font-size: 10px;
  font-weight: 700;
  border: none;
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  &.user {
    background: #eef2ff;
    color: #6366f1;
  }
  &.role {
    background: #fff7ed;
    color: #f59e0b;
  }
  &.system {
    background: #f1f5f9;
    color: #64748b;
  }
  &.custom {
    background: #ecfdf5;
    color: #10b981;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.desc-text {
  font-size: 11px;
  color: #64748b;
}

/* 列表过渡动效 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s ease;
}
.list-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  font-size: 12px;
}
</style>
