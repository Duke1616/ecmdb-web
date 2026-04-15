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
        </div>

        <div class="dual-panel-container">
          <!-- 左侧：源列表 -->
          <div class="panel-source">
            <div class="panel-source-header">
              <el-input
                v-model="subjectQuery.keyword"
                placeholder="搜索主体名称..."
                class="search-input"
                style="width: 200px"
                size="small"
                clearable
                @keyup.enter="handleSearchSubjects"
              >
                <template #prefix
                  ><el-icon><Search /></el-icon
                ></template>
              </el-input>
              <el-radio-group v-model="subjectQuery.sub_type" size="small" @change="handleSearchSubjects">
                <el-radio-button label="">全部</el-radio-button>
                <el-radio-button value="user">用户</el-radio-button>
                <el-radio-button value="role">角色</el-radio-button>
              </el-radio-group>
            </div>

            <el-table
              ref="subjectTableRef"
              v-loading="loadingSubjects"
              :data="subjects"
              height="300"
              row-key="id"
              @selection-change="handleSubjectSelectionChange"
            >
              <el-table-column type="selection" width="40" />
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
                v-model:current-page="subjectQuery.offset"
                v-model:page-size="subjectQuery.limit"
                small
                background
                layout="prev, pager, next"
                :total="subjectTotal"
                @current-change="handleSearchSubjects"
              />
            </div>
          </div>

          <!-- 右侧：购物车/已选 -->
          <div class="panel-buffer">
            <div class="buffer-header">
              <span>已选主体</span>
              <span class="count-tag">{{ selectedSubjects.size }}</span>
            </div>
            <div class="buffer-list">
              <TransitionGroup name="list-fade">
                <div v-for="item in Array.from(selectedSubjects.values())" :key="item.id" class="buffer-item">
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.id }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="removeSubject(item.id)"><Close /></el-icon>
                </div>
              </TransitionGroup>
              <el-empty v-if="selectedSubjects.size === 0" description="点击左侧勾选" :image-size="40" />
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
        </div>

        <div class="dual-panel-container">
          <div class="panel-source">
            <div class="panel-source-header">
              <el-input
                v-model="policyQuery.keyword"
                placeholder="搜索策略..."
                class="search-input"
                style="width: 200px"
                size="small"
                clearable
                @keyup.enter="handleSearchPolicies"
              >
                <template #prefix
                  ><el-icon><Search /></el-icon
                ></template>
              </el-input>
              <el-select v-model="policyQuery.type" size="small" style="width: 120px" @change="handleSearchPolicies">
                <el-option label="所有类型" value="" />
                <el-option label="系统预设" :value="1" />
                <el-option label="自定义" :value="2" />
              </el-select>
            </div>

            <el-table
              ref="policyTableRef"
              v-loading="loadingPolicies"
              :data="policies"
              height="300"
              row-key="code"
              @selection-change="handlePolicySelectionChange"
            >
              <el-table-column type="selection" width="40" />
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
                v-model:current-page="policyQuery.offset"
                v-model:page-size="policyQuery.limit"
                small
                background
                layout="prev, pager, next"
                :total="policyTotal"
                @current-change="handleSearchPolicies"
              />
            </div>
          </div>

          <div class="panel-buffer">
            <div class="buffer-header">
              <span>已选策略</span>
              <span class="count-tag">{{ selectedPolicies.size }}</span>
            </div>
            <div class="buffer-list">
              <TransitionGroup name="list-fade">
                <div v-for="item in Array.from(selectedPolicies.values())" :key="item.code" class="buffer-item">
                  <div class="info">
                    <span class="name">{{ item.name }}</span>
                    <span class="id mono">{{ item.code }}</span>
                  </div>
                  <el-icon class="remove-btn" @click="removePolicy(item.code)"><Close /></el-icon>
                </div>
              </TransitionGroup>
              <el-empty v-if="selectedPolicies.size === 0" description="点击左侧勾选" :image-size="40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { Search, User, Close, Connection, ArrowDown } from "@element-plus/icons-vue"
import { searchSubjectsApi } from "@/api/iam/permission"
import { listPoliciesApi, batchAttachPolicyApi } from "@/api/iam/policy"
import type { Subject } from "@/api/iam/permission/type"
import type { Policy } from "@/api/iam/policy/type"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"

// NOTE: 该组件为独立受控向导，状态由 v-model 控制开闭
const visible = defineModel<boolean>({ default: false })

// --- 识别高风险策略 ---
const isHighRisk = (name: string) => {
  const risks = ["Admin", "FullAccess", "Owner", "Super"]
  return risks.some((r) => name.toLowerCase().includes(r.toLowerCase()))
}

// --- 授权主体治理 (Subject) ---
const subjectTableRef = ref()
const loadingSubjects = ref(false)
const subjects = ref<Subject[]>([])
const subjectTotal = ref(0)
const subjectQuery = reactive({
  keyword: "",
  sub_type: "",
  offset: 1,
  limit: 10
})
const selectedSubjects = ref(new Map<string, Subject>())

const handleSearchSubjects = async () => {
  loadingSubjects.value = true
  try {
    const { data } = await searchSubjectsApi({
      ...subjectQuery,
      offset: (subjectQuery.offset - 1) * subjectQuery.limit
    })
    subjects.value = data.subjects
    subjectTotal.value = data.total
  } finally {
    loadingSubjects.value = false
  }
}

const handleSubjectSelectionChange = (selection: Subject[]) => {
  // NOTE: 这种方式处理分页选中状态，生产环境建议使用全局 set 管理
  selection.forEach((s) => selectedSubjects.value.set(s.id, s))
}

const removeSubject = (id: string) => {
  selectedSubjects.value.delete(id)
  const row = subjects.value.find((s) => s.id === id)
  if (row) {
    subjectTableRef.value?.toggleRowSelection(row, false)
  }
}

// --- 权限策略治理 (Policy) ---
const policyTableRef = ref()
const loadingPolicies = ref(false)
const policies = ref<Policy[]>([])
const policyTotal = ref(0)
const policyQuery = reactive({
  keyword: "",
  type: "" as any,
  offset: 1,
  limit: 10
})
const selectedPolicies = ref(new Map<string, Policy>())

const handleSearchPolicies = async () => {
  loadingPolicies.value = true
  try {
    const { data } = await listPoliciesApi({
      ...policyQuery,
      offset: (policyQuery.offset - 1) * policyQuery.limit
    })
    policies.value = data.policies
    policyTotal.value = data.total
  } finally {
    loadingPolicies.value = false
  }
}

const handlePolicySelectionChange = (selection: Policy[]) => {
  selection.forEach((p) => selectedPolicies.value.set(p.code, p))
}

const removePolicy = (code: string) => {
  selectedPolicies.value.delete(code)
  const row = policies.value.find((p) => p.code === code)
  if (row) {
    policyTableRef.value?.toggleRowSelection(row, false)
  }
}

// --- 确认提交 ---
const submitting = ref(false)
const canSubmit = computed(() => selectedSubjects.value.size > 0 && selectedPolicies.value.size > 0)

const handleSubmit = async () => {
  submitting.value = true
  try {
    // 组装请求数据：将选中的主体和策略提交给后端
    const subjects = Array.from(selectedSubjects.value.values()).map((s) => ({
      type: s.type,
      code: s.id
    }))
    const policyCodes = Array.from(selectedPolicies.value.values()).map((p) => p.code)

    const { data } = await batchAttachPolicyApi({
      subjects,
      policy_codes: policyCodes
    })

    ElMessage({
      message: `授权成功：共建立 ${data.total} 条策略关联`,
      type: "success",
      duration: 3000
    })
    visible.value = false
  } catch (err) {
    ElMessage.error("批量授权失败，请重试")
  } finally {
    submitting.value = false
  }
}

watch(visible, (val) => {
  if (val) {
    handleSearchSubjects()
    handleSearchPolicies()
  } else {
    selectedSubjects.value.clear()
    selectedPolicies.value.clear()
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
