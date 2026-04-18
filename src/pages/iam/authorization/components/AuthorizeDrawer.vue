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
    :show-confirm-button="true"
  >
    <div class="wizard-workflow">
      <!-- 1. 授权主体卡片 (非固定模式下显示) -->
      <template v-if="!isFixedMode">
        <SubjectSelectCard ref="subjectSelectorRef" v-model:selection="selectedSubjects" flat />

        <!-- 🚦 分隔指示器 -->
        <div class="wizard-connector" />
      </template>

      <!-- 2. 权限策略卡片 -->
      <PolicySelectCard ref="policySelectorRef" v-model:selection="selectedPolicies" show-risk flat />
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { Connection } from "@element-plus/icons-vue"
import { batchAttachPolicyApi } from "@/api/iam/policy"
import type { Subject } from "@/api/iam/permission/type"
import type { Policy } from "@/api/iam/policy/type"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import SubjectSelectCard from "./SubjectSelectCard.vue"
import PolicySelectCard from "./PolicySelectCard.vue"

// --- 1. 定义 & 属性 ---
interface Props {
  fixedSubjects?: Subject[] // 固定授权主体模式
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: "success"): void }>()

const visible = defineModel<boolean>({ default: false })

// --- 2. 治理选区状态 ---
const selectedSubjects = ref<Subject[]>([])
const selectedPolicies = ref<Policy[]>([])
const submitting = ref(false)

// 组件实例引用
const subjectSelectorRef = ref<InstanceType<typeof SubjectSelectCard>>()
const policySelectorRef = ref<InstanceType<typeof PolicySelectCard>>()

// --- 3. 核心计算属性 ---
const isFixedMode = computed(() => !!props.fixedSubjects?.length)
const effectiveSubjects = computed(() => (isFixedMode.value ? props.fixedSubjects! : selectedSubjects.value))

// 提交按钮的激活状态
const canSubmit = computed(() => effectiveSubjects.value.length > 0 && selectedPolicies.value.length > 0)

// --- 4. 业务逻辑方法 ---

/**
 * 构造提交载荷：将治理选区状态转换为后端需要的协议格式
 */
const preparePayload = () => ({
  subjects: effectiveSubjects.value.map((s) => ({
    type: s.type,
    code: s.id
  })),
  policy_codes: selectedPolicies.value.map((p) => p.code)
})

/**
 * 处理提交后的反馈提示
 */
const notifyFeedback = (inserted: number, ignored: number) => {
  if (inserted === 0 && ignored === 0) return

  const hasNew = inserted > 0
  ElMessage({
    type: hasNew ? "success" : "warning",
    message: hasNew
      ? `授权成功：新建立 ${inserted} 条关联` + (ignored > 0 ? ` (自动跳过 ${ignored} 条重复项)` : "")
      : `所选项均已存在，无需重复授权`,
    duration: 4000
  })
}

/**
 * 提交治理结果
 */
const handleSubmit = async () => {
  if (!canSubmit.value) {
    ElMessage.warning(effectiveSubjects.value.length === 0 ? "未找到有效的授权主体" : "请至少勾选一个权限策略")
    return
  }

  submitting.value = true
  try {
    const { data } = await batchAttachPolicyApi(preparePayload())
    notifyFeedback(data.inserted, data.ignored)
    emit("success")
    visible.value = false
  } catch (err) {
    ElMessage.error("授权执行失败，服务器响应异常")
  } finally {
    submitting.value = false
  }
}

// --- 5. 生命周期与监听 ---
watch(visible, async (open) => {
  if (open) {
    await nextTick()
    if (!isFixedMode.value) subjectSelectorRef.value?.fetchList()
    policySelectorRef.value?.fetchList()
  } else {
    // 重置缓冲区
    selectedSubjects.value = []
    selectedPolicies.value = []
    // 重置子组件内部状态
    if (!isFixedMode.value) subjectSelectorRef.value?.reset()
    policySelectorRef.value?.reset()
  }
})
</script>

<style lang="scss" scoped>
.wizard-workflow {
  padding: 16px 20px; /* 压缩外边距 */
  display: flex;
  flex-direction: column;
  gap: 8px; /* 显著收紧卡片间距 */
  background: #ffffff;
}

/* 步骤连接符：精简高度 */
.wizard-connector {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 16px; /* 从 32px 压缩到 16px */
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
