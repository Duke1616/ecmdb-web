<template>
  <Drawer
    v-model="visible"
    title="批量授权治理"
    subtitle="建立身份主体与权限集合的原子级关联，构建租户全域安全治理边界"
    :header-icon="Connection"
    size="60%"
    class="eiam-auth-wizard"
    @confirm="handleSubmit"
    :confirm-loading="submitting"
    :show-confirm-button="true"
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
                placeholder="搜索主体名称或标识 (支持模糊搜索)..."
                class="search-input"
                clearable
                @input="subjectSelector.debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-radio-group
                v-model="subjectSelector.query.sub_type"
                class="eiam-radio-filter"
                @change="subjectSelector.fetchList"
              >
                <el-radio-button label="">全部身份</el-radio-button>
                <el-radio-button value="user">IAM 用户</el-radio-button>
                <el-radio-button value="role">IAM 角色</el-radio-button>
              </el-radio-group>
            </div>
            <el-table
              :ref="subjectSelector.tableRef"
              v-loading="subjectSelector.loading.value"
              :data="subjectSelector.list.value"
              height="300"
              :row-key="(row) => row.type + '-' + row.id"
              @selection-change="subjectSelector.handleSelectionChange"
            >
              <el-table-column type="selection" width="40" reserve-selection />
              <el-table-column label="身份标识" width="185">
                <template #default="{ row }">
                  <div class="identity-info">
                    <span class="display-name">{{ row.name }}</span>
                    <span class="id-tag mono">{{ row.id }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="100" align="center">
                <template #default="{ row }">
                  <span class="type-badge" :class="row.type">{{ row.type === "user" ? "用户" : "角色" }}</span>
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="200" show-overflow-tooltip>
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
                layout="total, sizes, prev, pager, next"
                :page-sizes="[10, 20, 50]"
                :total="subjectSelector.total.value"
                @size-change="subjectSelector.handleSizeChange"
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
                <div
                  v-for="item in subjectSelector.selectedList.value"
                  :key="item.type + '-' + item.id"
                  class="buffer-item"
                >
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.id }}</span>
                  </div>
                  <div class="actions">
                    <span class="type-badge small" :class="item.type">{{
                      item.type === "user" ? "用户" : "角色"
                    }}</span>
                    <el-icon class="remove-btn" @click="subjectSelector.removeSelection(item)"><Close /></el-icon>
                  </div>
                </div>
              </TransitionGroup>
              <el-empty v-if="subjectSelector.selectedTotal.value === 0" description="点击左侧勾选" :image-size="40" />
            </div>
          </div>
        </div>
      </div>

      <!-- 🚦 分隔指示器 -->
      <div class="wizard-connector">
        <el-icon class="connector-icon"><ArrowDown /></el-icon>
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
                placeholder="搜索策略名称或标识 (支持模糊搜索)..."
                class="search-input"
                clearable
                @input="policySelector.debouncedSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-radio-group
                v-model="policySelector.query.type"
                class="eiam-radio-filter"
                @change="policySelector.fetchList"
              >
                <el-radio-button label="">全部类型</el-radio-button>
                <el-radio-button :value="1">系统预设</el-radio-button>
                <el-radio-button :value="2">自定义</el-radio-button>
              </el-radio-group>
            </div>

            <el-table
              :ref="policySelector.tableRef"
              v-loading="policySelector.loading.value"
              :data="policySelector.list.value"
              height="300"
              :row-key="(row) => String(row.type) + '-' + row.code"
              @selection-change="policySelector.handleSelectionChange"
            >
              <el-table-column type="selection" width="40" reserve-selection />
              <el-table-column label="策略资产" width="185">
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
              <el-table-column label="类型" width="100" align="center">
                <template #default="{ row }">
                  <span class="type-badge" :class="row.type === 1 ? 'system' : 'custom'">
                    {{ row.type === 1 ? "系统" : "自定义" }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="200" show-overflow-tooltip>
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
                layout="total, sizes, prev, pager, next"
                :page-sizes="[10, 20, 50]"
                :total="policySelector.total.value"
                @size-change="policySelector.handleSizeChange"
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
                <div
                  v-for="item in policySelector.selectedList.value"
                  :key="String(item.type) + '-' + item.code"
                  class="buffer-item"
                >
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.code }}</span>
                  </div>
                  <div class="actions">
                    <span class="type-badge small" :class="item.type === 1 ? 'system' : 'custom'">
                      {{ item.type === 1 ? "系统" : "自定义" }}
                    </span>
                    <el-icon class="remove-btn" @click="policySelector.removeSelection(item)"><Close /></el-icon>
                  </div>
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
  rowKey: (row: Subject) => `${row.type}-${row.id}`,
  initialQuery: { keyword: "", sub_type: "" }
})

// --- 权限策略治理选择器 (Policy) ---
const policySelector = useResourceSelector<Policy, { keyword: string; type: string | number }>({
  fetchApi: listPoliciesApi,
  listKey: "policies",
  rowKey: (row: Policy) => `${row.type}-${row.code}`,
  initialQuery: { keyword: "", type: "" }
})

// --- 确认提交 ---
const submitting = ref(false)
const canSubmit = computed(() => subjectSelector.selectedTotal.value > 0 && policySelector.selectedTotal.value > 0)

const handleSubmit = async () => {
  if (!canSubmit.value) {
    if (subjectSelector.selectedTotal.value === 0) {
      ElMessage.warning("请在上方列表勾选至少一个授权主体")
    } else {
      ElMessage.warning("请在下方列表勾选至少一个权限策略")
    }
    return
  }
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

    const { inserted, ignored } = data
    if (inserted > 0 || ignored > 0) {
      ElMessage({
        type: inserted > 0 ? "success" : "warning",
        message:
          inserted > 0
            ? `授权执行完毕：成功建立 ${inserted} 条新关联` + (ignored > 0 ? ` (已跳过 ${ignored} 条重复关联)` : "")
            : `所选授权项均已存在，未重复建立关联`,
        duration: 5000
      })
    }
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
  padding: 12px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f8fafc;
  font-family:
    "Plus Jakarta Sans",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}

.governance-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.02),
    0 2px 4px -2px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.05),
      0 4px 6px -4px rgba(0, 0, 0, 0.025);
  }

  .card-header {
    padding: 14px 20px;
    background: #ffffff;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      .main-icon {
        color: #3b82f6;
        font-size: 18px;
        background: #eff6ff;
        padding: 6px;
        border-radius: 8px;
      }
      .text {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
        letter-spacing: -0.01em;
      }
    }
  }
}

.dual-panel-container {
  display: flex;
  height: 380px;
}

.panel-source {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f5f9;
  background: #ffffff;

  .panel-source-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .search-input {
      flex: 1; /* 让搜索框占据剩余空间 */
      :deep(.el-input__wrapper) {
        border-radius: 8px;
        background-color: #f8fafc;
        box-shadow: 0 0 0 1px #e2e8f0 inset;
        height: 36px;
        padding: 0 12px;
        transition: all 0.2s;

        &:hover {
          box-shadow: 0 0 0 1px #cbd5e1 inset;
        }

        &.is-focus,
        &:focus-within {
          background-color: #ffffff;
          box-shadow:
            0 0 0 2px #dbeafe inset,
            0 0 0 1px #3b82f6 inset;
        }

        .el-input__inner {
          font-size: 13px;
          height: 36px;
        }
      }
    }

    .eiam-radio-filter {
      flex-shrink: 0;
      height: 36px;
      display: flex;
      :deep(.el-radio-button__inner) {
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 16px;
        font-size: 13px;
        font-weight: 500;
      }
    }
  }

  .pagination-bar {
    margin-top: auto;
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    :deep(.el-pagination) {
      .el-pagination__total {
        color: #64748b;
        font-weight: 500;
      }
      .el-select .el-input {
        width: 110px;
      }
    }
  }
}

.panel-buffer {
  width: 300px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;

  .buffer-header {
    padding: 12px 20px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;

    .count-tag {
      background: #0ea5e9;
      color: white;
      padding: 0 10px;
      height: 20px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      font-weight: 700;
    }
  }

  .buffer-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.buffer-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02);

  &:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }

  .info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 60%;

    .name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .id {
      font-size: 10px;
      color: #64748b;
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .remove-btn {
    cursor: pointer;
    color: #94a3b8;
    padding: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;
    &:hover {
      color: #ef4444;
      background: #fee2e2;
    }
  }
}

.wizard-connector {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #94a3b8;
  height: 14px;
  margin: -4px 0;

  &::before,
  &::after {
    content: "";
    position: absolute;
    height: 100%;
    width: 2px;
    background: linear-gradient(to bottom, #e2e8f0, #cbd5e1);
  }

  .connector-icon {
    z-index: 1;
    background: #f8fafc;
    padding: 4px;
    border-radius: 50%;
    font-size: 20px;
    color: #cbd5e1;
  }
}

.identity-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .display-name {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
  }
}

.id-tag {
  font-size: 10px;
  color: #64748b;
  background: #f8fafc;
  padding: 1px 5px;
  border-radius: 4px;
  align-self: flex-start;
  border: 1px solid #e2e8f0;
  letter-spacing: 0.02em;
}

.policy-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  .name-box {
    display: flex;
    align-items: center;
    gap: 8px;
    .policy-name {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
    }
  }
  .policy-code {
    font-size: 10px;
    color: #64748b;
    background: #f8fafc;
    padding: 1px 5px;
    border-radius: 4px;
    align-self: flex-start;
    border: 1px solid #e2e8f0;
    letter-spacing: 0.02em;
  }
}

.risk-badge {
  padding: 0 6px;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #f87171;
  animation: pulse-red 2.5s infinite;
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

.type-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  &.small {
    font-size: 10px;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }
  &.user {
    background: #e0f2fe;
    color: #0284c7;
  }
  &.role {
    background: #fef3c7;
    color: #d97706;
  }
  &.system {
    background: #f1f5f9;
    color: #475569;
  }
  &.custom {
    background: #dcfce7;
    color: #15803d;
  }
}

.mono {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
}

.desc-text {
  font-size: 12px;
  color: #64748b;
}

/* 列表过渡动效，移除位移带来的闪烁感，改为更柔和的缩放消隐 */
.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

:deep(.el-table) {
  --el-table-header-bg-color: #f8fafc;
  --el-table-header-text-color: #475569;
  font-size: 13px;
  .el-table__header th {
    font-weight: 600;
  }
}
</style>
