<template>
  <ProGovernanceLayout
    v-if="policy"
    :title="policy.name"
    :subtitle="policy.code"
    :show-back-button="true"
    :show-refresh="false"
    :is-detail="true"
    :swap-actions="false"
    :primary-action="{
      capability: IAM_CAPABILITIES.Policy.Edit,
      label: '完善策略',
      icon: Edit
    }"
    :danger-action="
      policy.type !== 1
        ? {
            capability: IAM_CAPABILITIES.Policy.Delete,
            label: '移除策略',
            icon: Delete
          }
        : undefined
    "
    class="policy-detail-page"
    @back="router.back()"
    @primary-action="handleEdit"
    @danger-action="handleDelete"
  >
    <div v-loading="loading" class="governance-body">
      <!-- 1. 置顶横向状态条 -->
      <StatusStrip :items="statusItems" />

      <!-- 2. 基础识别与职能定义 -->
      <InfoCard title="策略身份与职能定义" :icon="OfficeBuilding" :items="infoItems" @copy="copyText" />

      <!-- 治理深度内容区 -->
      <GovernanceTabs v-model="activeTab">
        <!-- 看板：策略内容 -->
        <AuthTabPane label="策略内容洞察" name="insights" :allowed="tabPermissions.insights" disable-mode lazy>
          <PolicyServiceInsights :policy="policy" :services="services" @copy="copyText" />
        </AuthTabPane>

        <!-- 看板：授权管理 -->
        <AuthTabPane label="授权主体管理" name="assignments" :allowed="tabPermissions.assignments" disable-mode lazy>
          <PolicyAssignmentTable
            ref="assignmentTableRef"
            :policy-code="policy.code"
            :can-add="hasPermission(IAM_CAPABILITIES.Policy.BatchAttach)"
            :can-detach="hasPermission(IAM_CAPABILITIES.Policy.Detach)"
            :can-batch-detach="hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)"
            :selectable="() => hasPermission(IAM_CAPABILITIES.Policy.BatchDetach)"
            @add="handleAddSubject"
          />
        </AuthTabPane>
      </GovernanceTabs>
    </div>

    <!-- 授权向导 (固定策略模式) -->
    <AuthorizeDrawer v-model="attachSubjectVisible" :fixed-policies="[policy]" @success="handleAttachSuccess" />

    <!-- 主体选择对话框 -->
    <SubjectSelectDialog
      v-model="subjectSelectVisible"
      title="关联授权主体"
      confirm-text="确认关联主体"
      :confirm-loading="submitting"
      @confirm="handleAttachSubjects"
    />

    <template #empty>
      <el-empty v-if="!loading" description="未能获取到策略治理指标" />
    </template>
  </ProGovernanceLayout>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue"
import { useRouter } from "vue-router"
import { Delete, Edit, OfficeBuilding } from "@element-plus/icons-vue"
import ProGovernanceLayout from "@/common/components/ProGovernancePage/ProGovernanceLayout.vue"

// Composables
import { usePolicyDetail } from "./composables/usePolicyDetail"
import { useTabRouter } from "@/common/composables/useTabRouter"

// Components
import InfoCard from "@/common/components/Governance/InfoCard.vue"
import StatusStrip, { type StatusItem } from "@/common/components/Governance/StatusStrip.vue"
import PolicyServiceInsights from "./components/detail/PolicyServiceInsights.vue"
import PolicyAssignmentTable from "./components/detail/PolicyAssignmentTable.vue"
import GovernanceTabs from "@/common/components/Governance/GovernanceTabs.vue"
import AuthTabPane from "@/common/components/Auth/AuthTabPane.vue"
import AuthorizeDrawer from "@/pages/iam/authorization/components/AuthorizeDrawer.vue"
import SubjectSelectDialog from "@/pages/iam/authorization/components/SubjectSelectDialog.vue"
import { batchAttachPolicyApi } from "@/api/iam/policy"
import type { Subject } from "@/api/iam/permission/type"
import { formatTimestamp } from "@@/utils/day"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const router = useRouter()
const { hasPermission } = usePermission()
const { policy, services, loading, copyText, handleDelete } = usePolicyDetail()

// 治理项 Tabs 控制
const { activeTab } = useTabRouter("insights")

/** 页签权限控制 */
const tabPermissions = computed(() => ({
  insights: true, // 策略内容洞察作为核心内容，默认开启
  assignments: hasPermission(IAM_CAPABILITIES.Permission.ViewAuthorizations) // 授权主体管理跟随详情权限
}))

// --- 授权管理向导逻辑 ---
const attachSubjectVisible = ref(false)
const subjectSelectVisible = ref(false)
const submitting = ref(false)
const assignmentTableRef = ref<InstanceType<typeof PolicyAssignmentTable>>()

const handleAddSubject = () => {
  subjectSelectVisible.value = true
}

const handleAttachSubjects = async (selectedSubjects: Subject[]) => {
  if (!policy.value || !selectedSubjects.length) return
  submitting.value = true
  try {
    await batchAttachPolicyApi({
      subjects: selectedSubjects.map((s) => ({ type: s.type, code: s.id })),
      policy_codes: [policy.value.code]
    })
    subjectSelectVisible.value = false
    assignmentTableRef.value?.fetchAssignments()
  } finally {
    submitting.value = false
  }
}

const handleAttachSuccess = () => {
  assignmentTableRef.value?.fetchAssignments()
}

/**
 * 核心逻辑：监听 Tab 切换触发数据刷新
 */
watch(activeTab, (val) => {
  if (val === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
})

// 初始进入时数据刷新
onMounted(() => {
  if (activeTab.value === "assignments") {
    assignmentTableRef.value?.fetchAssignments()
  }
})

/** 治理指标适配 */
const statusItems = computed<StatusItem[]>(() => {
  if (!policy.value) return []
  return [
    {
      label: "策略类型",
      value: policy.value.type === 1 ? "系统内置" : "动态生效",
      dot: true,
      type: policy.value.type === 1 ? "info" : "success"
    },
    { label: "影响服务", value: `${services.value.length} 个`, dot: true, type: "success" },
    { label: "权限负载", value: `${totalGranted.value} 项`, dot: true, type: "success" },
    {
      label: "治理覆盖率",
      value: `${avgCoverage.value}%`,
      dot: true,
      type: avgCoverage.value > 80 ? "success" : "warning"
    }
  ]
})

const infoItems = computed(() => {
  if (!policy.value) return []
  return [
    { label: "策略显示名称", value: policy.value.name },
    { label: "唯一识别码 (CODE)", value: policy.value.code, mono: true, copyable: true },
    { label: "创建于", value: formatTimestamp(policy.value.ctime) },
    {
      label: "职能边界描述",
      value: policy.value.desc || "暂无对此策略职能边界的详细描述",
      full: true,
      desc: true
    }
  ]
})

/** 基础治理指标计算 */
const totalGranted = computed(() => {
  return services.value.reduce((acc, svc) => acc + svc.granted_count, 0)
})

const avgCoverage = computed(() => {
  const total = services.value.reduce((acc, svc) => acc + svc.total_count, 0)
  if (total === 0) return 0
  return Math.round((totalGranted.value / total) * 100)
})

const handleEdit = () => {
  if (!policy.value) return
  router.push({
    name: "PolicyEdit",
    query: { code: policy.value.code }
  })
}
</script>

<style lang="scss" scoped>
.policy-detail-page {
  --gov-brand: #3b82f6;
  --gov-bg: #f8fafc;
  --gov-border: #e2e8f0;

  overflow-y: auto;
  overflow-x: hidden;
  background: var(--gov-bg);
}

.governance-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 4px;
}

.header-action-stack {
  display: flex;
  gap: 12px;
}

.success-text {
  color: #10b981;
}
.warning-text {
  color: #f59e0b;
}
</style>
