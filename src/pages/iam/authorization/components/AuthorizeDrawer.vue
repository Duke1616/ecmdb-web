<template>
  <Drawer
    v-model="visible"
    :title="isFixedMode ? '关联权限策略' : '批量授权治理'"
    :subtitle="
      isFixedMode ? `正在为核心主体精准派发权限资源` : '建立身份主体与权限集合的原子级关联，构建全域安全治理边界'
    "
    :header-icon="Connection"
    size="60%"
    class="eiam-auth-wizard"
    @confirm="handleSubmit"
    :confirm-loading="submitting"
    show-confirm-button
  >
    <div class="wizard-workflow">
      <!-- 1. 授权主体卡片 (非固定模式下显示) -->
      <SubjectSelectCard v-if="!isFixedSubjects" ref="subjectSelectorRef" v-model:selection="selectedSubjects" flat />

      <!-- 🚦 分隔指示器 -->
      <div v-if="!isFixedSubjects && !isFixedPolicies" class="wizard-connector" />

      <!-- 2. 权限策略卡片 (非固定模式下显示) -->
      <PolicySelectCard
        v-if="!isFixedPolicies"
        ref="policySelectorRef"
        v-model:selection="selectedPolicies"
        show-risk
        flat
      />
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { Connection } from "@element-plus/icons-vue"
import { batchAttachPolicyApi } from "@/api/iam/policy"
import type { BatchAttachPolicyRequest, SubjectItem } from "@/api/iam/policy/type"
import type { Subject } from "@/api/iam/permission/type"
import type { Policy } from "@/api/iam/policy/type"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import SubjectSelectCard from "./SubjectSelectCard.vue"
import PolicySelectCard from "./PolicySelectCard.vue"

// --- 1. 定义 & 属性 ---
interface Props {
  fixedSubjects?: Subject[] // 固定授权主体模式 (由外部传入，不可更改)
  fixedPolicies?: Policy[] // 固定权限策略模式 (由外部传入，不可更改)
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: "success"): void }>()
const visible = defineModel<boolean>({ default: false })

// --- 2. 治理选区状态 ---
const selectedSubjects = ref<Subject[]>([])
const selectedPolicies = ref<Policy[]>([])
const submitting = ref(false)

const subjectSelectorRef = ref<InstanceType<typeof SubjectSelectCard>>()
const policySelectorRef = ref<InstanceType<typeof PolicySelectCard>>()

// --- 3. 核心计算属性 ---
const isFixedSubjects = computed(() => !!props.fixedSubjects?.length)
const isFixedPolicies = computed(() => !!props.fixedPolicies?.length)
const isFixedMode = computed(() => isFixedSubjects.value || isFixedPolicies.value)

// 最终生效的主体与策略清单 (固定模式优于选择模式)
const effectiveSubjects = computed(() => (isFixedSubjects.value ? props.fixedSubjects! : selectedSubjects.value))
const effectivePolicies = computed(() => (isFixedPolicies.value ? props.fixedPolicies! : selectedPolicies.value))

// 提交按钮的激活状态与错误信息
const validation = computed(() => {
  const hasSubjects = effectiveSubjects.value.length > 0
  const hasPolicies = effectivePolicies.value.length > 0
  return {
    valid: hasSubjects && hasPolicies,
    error: !hasSubjects ? "未找到有效的授权主体" : !hasPolicies ? "请至少勾选一个权限策略" : ""
  }
})

// --- 4. 业务逻辑方法 ---

/**
 * 处理提交后的反馈提示 (增强视觉区分度)
 */
const notifyFeedback = (inserted: number, ignored: number) => {
  if (inserted === 0 && ignored === 0) return

  if (inserted > 0) {
    ElMessage.success({
      message: `授权成功：新建立 ${inserted} 条关联` + (ignored > 0 ? ` (已跳过 ${ignored} 条重复项)` : ""),
      duration: 5000
    })
  } else {
    ElMessage.warning("所选项均已存在，系统已自动忽略重复操作")
  }
}

/**
 * 提交治理结果
 */
const handleSubmit = async () => {
  if (!validation.value.valid) {
    ElMessage.warning(validation.value.error)
    return
  }

  submitting.value = true
  try {
    const payload: BatchAttachPolicyRequest = {
      subjects: effectiveSubjects.value.map(
        (s): SubjectItem => ({
          type: s.type,
          code: s.id
        })
      ),
      policy_codes: effectivePolicies.value.map((p) => p.code)
    }

    const { data } = await batchAttachPolicyApi(payload)
    notifyFeedback(data.inserted, data.ignored)

    emit("success")
    visible.value = false
  } catch (err) {
    ElMessage.error("授权执行失败，请检查网络或权限设置")
  } finally {
    submitting.value = false
  }
}

// --- 5. 生命周期与监听 ---
watch(visible, async (open) => {
  if (open) {
    await nextTick()
    // 打开时按需触发子组件列表加载
    if (!isFixedSubjects.value) subjectSelectorRef.value?.fetchList()
    if (!isFixedPolicies.value) policySelectorRef.value?.fetchList()
  } else {
    // 关闭时彻底清理状态
    selectedSubjects.value = []
    selectedPolicies.value = []
    if (!isFixedSubjects.value) subjectSelectorRef.value?.reset()
    if (!isFixedPolicies.value) policySelectorRef.value?.reset()
  }
})
</script>

<style lang="scss" scoped>
.wizard-workflow {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #ffffff;
}

.wizard-connector {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 16px;
  margin: -4px 0;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0;
    border-left: 2px dashed #f1f5f9;
  }
}
</style>
