<template>
  <article class="message" :class="message.role === AIMessageRole.USER ? 'is-user' : 'is-assistant'">
    <div class="message-meta">
      <span>{{ message.role === AIMessageRole.USER ? "你" : "AI 助手" }}</span>
      <span v-if="message.ctime > 0">{{ formatTime(message.ctime) }}</span>
    </div>

    <div v-if="showContent" class="message-content">
      <div
        v-if="message.content && message.role === AIMessageRole.ASSISTANT"
        class="markdown-content"
        v-html="renderedContent"
      />
      <span v-else-if="message.content">{{ message.content }}</span>
      <span v-else-if="message.status === AIMessageStatus.STREAMING" class="thinking-text">
        <i /><i /><i /> {{ message.progressText || "正在分析" }}
      </span>
      <span v-else>本次回复没有文本说明</span>
    </div>

    <div
      v-if="message.status === AIMessageStatus.FAILED || message.status === AIMessageStatus.CANCELLED"
      class="message-error"
    >
      {{ message.status === AIMessageStatus.CANCELLED ? "生成已停止" : message.error_message || "生成失败" }}
    </div>

    <div
      v-if="message.role === AIMessageRole.ASSISTANT && message.status === AIMessageStatus.COMPLETED"
      class="message-usage"
    >
      <span v-if="message.latency_millis">{{ formatLatency(message.latency_millis) }}</span>
      <span v-if="message.input_tokens || message.output_tokens">
        {{ message.input_tokens + message.output_tokens }} tokens
      </span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue"
import dayjs from "dayjs"
import { AIMessageRole, AIMessageStatus } from "@/api/task/codeassist/ai.enums"
import type { DisplayMessage } from "../composables/useCodeAssistConversation"
import { renderMarkdown } from "../utils/renderMarkdown"

const props = defineProps<{ message: DisplayMessage }>()

const renderedContent = computed(() => renderMarkdown(props.message.content))

const showContent = computed(
  () =>
    props.message.content ||
    props.message.status === AIMessageStatus.STREAMING ||
    props.message.status === AIMessageStatus.COMPLETED
)

function formatTime(value: number) {
  return dayjs(value).format("HH:mm")
}

function formatLatency(value: number) {
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`
}
</script>

<style scoped lang="scss">
.message {
  max-width: 92%;
  margin-bottom: 14px;

  &.is-user {
    margin-left: auto;

    .message-meta {
      justify-content: flex-end;
    }

    .message-content {
      color: #fff;
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      border-radius: 13px 13px 4px;
      box-shadow: 0 5px 14px rgba(37, 99, 235, 0.14);
    }
  }

  &.is-assistant .message-content {
    color: var(--el-text-color-primary);
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px 13px 13px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.025);
    white-space: normal;
  }
}

.message-meta,
.message-usage {
  display: flex;
  align-items: center;
}

.message-meta {
  justify-content: space-between;
  margin: 0 4px 5px;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.message-content {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.72;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.markdown-content {
  min-width: 0;

  :deep(> :first-child) {
    margin-top: 0;
  }

  :deep(> :last-child) {
    margin-bottom: 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 14px 0 7px;
    color: #172033;
    font-weight: 700;
    line-height: 1.35;
  }

  :deep(h1) {
    font-size: 17px;
  }

  :deep(h2) {
    font-size: 15px;
  }

  :deep(h3) {
    font-size: 14px;
  }

  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-size: 12px;
  }

  :deep(p) {
    margin: 0 0 9px;
  }

  :deep(ul),
  :deep(ol) {
    margin: 6px 0 10px;
    padding-left: 21px;
  }

  :deep(li) {
    margin: 3px 0;
  }

  :deep(blockquote) {
    margin: 9px 0;
    padding: 7px 10px;
    color: #64748b;
    background: #f8fafc;
    border-left: 3px solid #93c5fd;
  }

  :deep(code) {
    padding: 1px 4px;
    color: #be185d;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    background: #f1f5f9;
    border-radius: 4px;
  }

  :deep(pre) {
    max-width: 100%;
    margin: 9px 0 11px;
    overflow: auto;
    padding: 10px 11px;
    color: #dbeafe;
    background: #172033;
    border: 1px solid #26354d;
    border-radius: 7px;
    line-height: 1.55;
  }

  :deep(pre code) {
    padding: 0;
    color: inherit;
    background: transparent;
    border-radius: 0;
    white-space: pre;
  }

  :deep(a) {
    color: #2563eb;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(hr) {
    height: 1px;
    margin: 12px 0;
    background: #e2e8f0;
    border: 0;
  }

  :deep(table) {
    display: block;
    max-width: 100%;
    margin: 9px 0 11px;
    overflow-x: auto;
    border-spacing: 0;
    border-collapse: collapse;
  }

  :deep(th),
  :deep(td) {
    padding: 5px 8px;
    border: 1px solid #dbe3ed;
    text-align: left;
    white-space: nowrap;
  }

  :deep(th) {
    background: #f8fafc;
    font-weight: 700;
  }
}

.thinking-text {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--el-text-color-secondary);

  i {
    width: 4px;
    height: 4px;
    background: #94a3b8;
    border-radius: 50%;
    animation: thinking 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

.message-error {
  margin: 5px 4px 0;
  color: var(--el-color-danger);
  font-size: 10px;
}

.message-usage {
  justify-content: flex-end;
  gap: 8px;
  margin: 4px 4px 0;
  color: var(--el-text-color-placeholder);
  font-size: 9px;
}

@keyframes thinking {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-2px);
  }
}
</style>
