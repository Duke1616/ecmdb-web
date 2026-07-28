<template>
  <BaseDialog
    v-model="visible"
    width="420px"
    type="custom"
    show-close
    top="18vh"
  >
    <template #header>
      <div class="rating-header">
        <h2>{{ readonly ? "评价详情" : "评价工单" }}</h2>
        <p>{{ dialogSubtitle }}</p>
      </div>
    </template>

    <div class="rating-content">
      <div class="rating-field">
        <div class="field-label">
          <span>满意度</span>
          <small v-if="!readonly">必选</small>
        </div>
        <div class="rating-control">
          <el-rate v-model="score" :disabled="readonly" aria-label="工单评分" />
          <span :class="{ 'is-empty': score === 0 }">{{ score ? ratingTexts[score - 1] : "请选择" }}</span>
        </div>
      </div>

      <div class="rating-field">
        <div class="field-label">
          <span>补充说明</span>
          <small>选填</small>
        </div>
        <p v-if="readonly" class="rating-comment" :class="{ 'is-empty': !comment }">
          {{ comment || "未填写补充说明" }}
        </p>
        <el-input
          v-else
          v-model="comment"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          resize="none"
          placeholder="可以补充本次处理体验（选填）"
        />
      </div>
    </div>

    <template v-if="!readonly" #footer>
      <div class="rating-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="score === 0" @click="submit">提交评价</el-button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import dayjs from "dayjs"
import { ElMessage } from "element-plus"
import { BaseDialog } from "@@/components/Dialogs"
import { submitTicketRatingApi } from "@/api/ticket/manager"
import type { Ticket, TicketRating } from "@/api/ticket/manager/types/manager"

const props = defineProps<{
  modelValue: boolean
  ticket?: Ticket
}>()

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void
  (event: "submitted", rating: TicketRating): void
}>()

const score = ref(0)
const comment = ref("")
const submitting = ref(false)
const ratingTexts = ["很不满意", "不满意", "一般", "满意", "非常满意"]

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const readonly = computed(() => !!props.ticket?.rating)
const dialogSubtitle = computed(() => {
  if (!props.ticket) return ""
  const ratedAt = props.ticket.rating?.rated_at
  return ratedAt
    ? `工单 #${props.ticket.id} · ${dayjs(ratedAt).format("YYYY-MM-DD HH:mm")}`
    : `工单 #${props.ticket.id}`
})

watch(
  () => [props.modelValue, props.ticket] as const,
  ([opened, ticket]) => {
    if (!opened) return
    score.value = ticket?.rating?.score || 0
    comment.value = ticket?.rating?.comment || ""
  },
  { immediate: true }
)

const submit = async () => {
  if (!props.ticket || score.value === 0 || submitting.value) return
  submitting.value = true
  try {
    const { data } = await submitTicketRatingApi({
      ticket_id: props.ticket.id,
      score: score.value,
      comment: comment.value.trim()
    })
    ElMessage.success("感谢您的评价")
    emit("submitted", data)
    visible.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.rating-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.rating-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-right: 40px;

  h2 {
    margin: 0;
    color: #1f2937;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  p {
    margin: 0;
    color: #8491a5;
    font-size: 13px;
    line-height: 18px;
  }
}

.rating-field {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;

  small {
    color: #9ca3af;
    font-size: 12px;
    font-weight: 400;
  }
}

.rating-control {
  display: flex;
  align-items: center;
  gap: 10px;

  span {
    color: #92400e;
    font-size: 13px;
    font-weight: 500;

    &.is-empty {
      color: #9ca3af;
      font-weight: 400;
    }
  }
}

.rating-comment {
  margin: 0;
  padding: 10px 12px;
  color: #4b5563;
  background: #f9fafb;
  border-radius: 5px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;

  &.is-empty {
    padding: 0;
    color: #9ca3af;
    background: transparent;
  }
}

.rating-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-rate) {
  height: 26px;
}

:deep(.el-rate__icon) {
  margin-right: 3px;
  font-size: 21px;
}

:deep(.base-dialog--custom) {
  max-width: calc(100vw - 32px);
  padding: 0;
  overflow: hidden;
  border-radius: 8px;

  .el-dialog__header {
    margin: 0;
    padding: 20px 24px 16px;
    border-bottom: 1px solid #eef0f3;
  }

  .el-dialog__headerbtn {
    top: 14px;
    right: 14px;
    width: 36px;
    height: 36px;
  }

  .el-dialog__body {
    padding: 20px 24px 22px;
  }

  .el-dialog__footer {
    padding: 0 24px 20px;
  }

  .el-textarea__inner {
    min-height: 86px !important;
    padding: 10px 12px;
    border-radius: 6px;
    line-height: 20px;
  }
}
</style>
