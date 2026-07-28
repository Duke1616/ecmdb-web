<template>
  <FormDialog
    v-model="visible"
    :title="readonly ? '评价详情' : '评价工单'"
    :subtitle="dialogSubtitle"
    width="520px"
    :header-icon="StarFilled"
    confirm-text="提交评价"
    :confirm-loading="submitting"
    :confirm-disabled="ratingForm.score === 0"
    :show-footer="!readonly"
    :show-footer-info="!readonly"
    footer-info-text="请选择满意度后提交评价"
    @confirm="submit"
    @cancel="visible = false"
  >
    <div class="rating-dialog">
      <div v-if="ticket" class="ticket-summary">
        <span class="ticket-summary__label">评价工单</span>
        <span class="ticket-summary__title" :title="ticket.title">{{ ticket.title }}</span>
        <span class="ticket-summary__id">#{{ ticket.id }}</span>
      </div>

      <el-form :model="ratingForm" label-position="top" class="rating-form" @submit.prevent="submit">
        <el-form-item label="本次处理满意度" required>
          <div class="score-panel" :class="{ 'is-selected': ratingForm.score > 0 }">
            <div class="score-panel__main">
              <el-rate
                v-model="ratingForm.score"
                :disabled="readonly"
                :colors="rateColors"
                void-color="#d8e1ed"
                aria-label="工单评分"
              />
              <span class="score-text" :class="{ 'is-empty': ratingForm.score === 0 }">
                {{ ratingForm.score ? ratingTexts[ratingForm.score - 1] : "请选择满意度" }}
              </span>
            </div>
            <span v-if="!readonly" class="score-panel__hint">点击星级评分</span>
          </div>
        </el-form-item>

        <el-form-item label="补充说明" class="comment-form-item">
          <p v-if="readonly" class="rating-comment" :class="{ 'is-empty': !ratingForm.comment }">
            {{ ratingForm.comment || "未填写补充说明" }}
          </p>
          <el-input
            v-else
            v-model="ratingForm.comment"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            resize="none"
            placeholder="欢迎补充本次工单处理体验（选填）"
          />
        </el-form-item>
      </el-form>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import dayjs from "dayjs"
import { StarFilled } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
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

const ratingForm = reactive({
  score: 0,
  comment: ""
})
const submitting = ref(false)
const ratingTexts = ["很不满意", "不满意", "一般", "满意", "非常满意"]
const rateColors = ["#f56c6c", "#e6a23c", "#e6a23c", "#67c23a", "#409eff"]

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const readonly = computed(() => !!props.ticket?.rating)
const dialogSubtitle = computed(() => {
  if (!props.ticket) return ""
  const ratedAt = props.ticket.rating?.rated_at
  return ratedAt ? `已于 ${dayjs(ratedAt).format("YYYY-MM-DD HH:mm")} 提交评价` : "请为本次工单处理体验评分"
})

watch(
  () => [props.modelValue, props.ticket] as const,
  ([opened, ticket]) => {
    if (!opened) return
    ratingForm.score = ticket?.rating?.score || 0
    ratingForm.comment = ticket?.rating?.comment || ""
  },
  { immediate: true }
)

const submit = async () => {
  if (!props.ticket || ratingForm.score === 0 || submitting.value) return
  submitting.value = true
  try {
    const { data } = await submitTicketRatingApi({
      ticket_id: props.ticket.id,
      score: ratingForm.score,
      comment: ratingForm.comment.trim()
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
.rating-dialog {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 2px 2px 6px;
}

.ticket-summary {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: linear-gradient(135deg, #f5f9ff 0%, #f8fbff 100%);
  border: 1px solid #e3edf9;
  border-radius: 8px;

  &__label,
  &__id {
    color: #64748b;
    font-size: 12px;
    white-space: nowrap;
  }

  &__label {
    padding-right: 8px;
    border-right: 1px solid #dbe7f5;
  }

  &__title {
    overflow: hidden;
    color: #334155;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__id {
    padding: 2px 7px;
    color: #3b82f6;
    background: #eaf3ff;
    border-radius: 4px;
  }
}

.rating-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    padding-bottom: 8px;
    color: #334155;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }

  .comment-form-item {
    margin-bottom: 0;
  }
}

.score-panel {
  width: 100%;
  padding: 15px 16px;
  background: #fafcff;
  border: 1px solid #e6edf5;
  border-radius: 8px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &.is-selected {
    background: #f8fbff;
    border-color: #bfdbfe;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__hint {
    display: block;
    margin-top: 7px;
    color: #94a3b8;
    font-size: 12px;
    line-height: 18px;
  }
}

.score-text {
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;

  &.is-empty {
    color: #94a3b8;
    font-weight: 400;
  }
}

.rating-comment {
  width: 100%;
  min-height: 88px;
  margin: 0;
  padding: 12px 14px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #edf1f5;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.65;
  white-space: pre-wrap;

  &.is-empty {
    display: flex;
    align-items: center;
    color: #94a3b8;
  }
}

:deep(.el-rate) {
  height: 28px;
}

:deep(.el-rate__icon) {
  margin-right: 5px;
  font-size: 24px;
}

:deep(.el-textarea__inner) {
  min-height: 112px !important;
  padding: 11px 13px;
  border-radius: 8px;
  line-height: 21px;
}

@media (max-width: 560px) {
  .ticket-summary {
    grid-template-columns: auto minmax(0, 1fr);

    &__id {
      display: none;
    }
  }

  .score-panel__main {
    flex-wrap: wrap;
    gap: 6px 12px;
  }
}
</style>
