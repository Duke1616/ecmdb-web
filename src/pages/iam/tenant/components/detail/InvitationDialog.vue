<script setup lang="ts">
import { ref, computed } from "vue"
import { FormDialog } from "@@/components/Dialogs"
import { Message, Link } from "@element-plus/icons-vue"
import { createInvitationApi } from "@/api/iam/invitation"
import type { InvitationVO } from "@/api/iam/invitation/type"
import { ElMessage } from "element-plus"
import useClipboard from "vue-clipboard3"
import dayjs from "dayjs"

// 子组件
import ConfigStage from "./invitation/ConfigStage.vue"
import ResultStage from "./invitation/ResultStage.vue"

// 该组件为独立的状态控制器，用于管理邀请凭证的创建与展示
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  tenantId?: number
  initialData?: InvitationVO | null
}>()

const emit = defineEmits<{
  success: []
}>()

const { toClipboard } = useClipboard()

// --- 状态定义 ---
const step = ref(1)
const submitting = ref(false)
const invitationCode = ref("")
const generatedLink = ref("")

const form = ref({
  max_uses: 1,
  expiry_days: 7,
  role_codes: [] as string[],
  require_approval: false
})

// --- 计算属性 ---
const isDetailMode = computed(() => !!props.initialData)

const displayLink = computed(() => {
  if (props.initialData) {
    return `${window.location.origin}/join?code=${props.initialData.code}`
  }
  return generatedLink.value
})

const displaySummary = computed(() => {
  if (props.initialData) return props.initialData
  return {
    max_uses: form.value.max_uses,
    role_codes: form.value.role_codes,
    require_approval: form.value.require_approval,
    expire_at: 0
  }
})

const displayExpiry = computed(() => {
  if (props.initialData) {
    return props.initialData.expire_at === 0 ? "永久有效" : dayjs(props.initialData.expire_at).format("YYYY-MM-DD")
  }
  return form.value.expiry_days === 0 ? "永久有效" : `${form.value.expiry_days} 天`
})

// --- 逻辑处理 ---
const handleGenerate = async () => {
  submitting.value = true
  try {
    const res = await createInvitationApi(
      {
        max_uses: form.value.max_uses,
        expiry_days: form.value.expiry_days,
        role_codes: form.value.role_codes,
        require_approval: form.value.require_approval
      },
      props.tenantId!
    )
    invitationCode.value = res.data.code
    generatedLink.value = `${window.location.origin}/join?code=${res.data.code}`
    step.value = 2
    ElMessage.success("邀请链接已生成")
    emit("success")
  } catch (error) {
    console.error("Generate invitation failed:", error)
    ElMessage.error("生成邀请链接失败，请稍后重试")
  } finally {
    submitting.value = false
  }
}

const copyLink = async () => {
  try {
    await toClipboard(displayLink.value)
    ElMessage.success("链接已复制到剪贴板")
  } catch (e) {
    ElMessage.error("复制失败")
  }
}

const reset = () => {
  step.value = 1
  invitationCode.value = ""
  generatedLink.value = ""
  form.value = {
    max_uses: 1,
    expiry_days: 7,
    role_codes: [] as string[],
    require_approval: false
  }
}
</script>

<template>
  <FormDialog
    v-model="visible"
    :title="isDetailMode ? '邀请凭证详情' : '邀请成员入驻'"
    :subtitle="isDetailMode ? '查看并分享现有的租户邀请凭证' : '生成邀请链接或二维码，邀请新成员加入租户空间'"
    width="560px"
    :header-icon="isDetailMode ? Link : Message"
    :show-footer="!isDetailMode && step === 1"
    confirm-text="生成邀请链接"
    :confirm-loading="submitting"
    @confirm="handleGenerate"
    @cancel="visible = false"
    @closed="reset"
  >
    <div class="inv-wrap">
      <!-- ① 配置阶段 -->
      <ConfigStage v-if="!isDetailMode && step === 1" v-model="form" :tenant-id="tenantId" />

      <!-- ② 结果阶段 -->
      <ResultStage
        v-else
        :is-detail-mode="isDetailMode"
        :display-link="displayLink"
        :display-summary="displaySummary"
        :display-expiry="displayExpiry"
        @copy="copyLink"
      />
    </div>
  </FormDialog>
</template>

<style lang="scss" scoped>
.inv-wrap {
  padding: 4px 0 8px;
}
</style>
