<template>
  <aside class="code-assist-panel">
    <header class="assistant-header">
      <div class="assistant-heading">
        <span class="assistant-mark"
          ><el-icon><MagicStick /></el-icon
        ></span>
        <div>
          <div class="assistant-title">AI 助手</div>
          <div class="assistant-subtitle">{{ activeConversation?.model || "Codebook 智能协作" }}</div>
        </div>
      </div>
      <div class="header-actions">
        <AuthButton
          :capability="capabilities.CodeAssist.AddConversation"
          :icon="Plus"
          circle
          text
          title="新建对话"
          :disabled="sending"
          @click="createConversation()"
        />
        <el-button :icon="Close" circle text title="关闭 AI 助手" @click="$emit('close')" />
      </div>
    </header>

    <div class="assistant-toolbar">
      <el-select
        v-model="activeConversationID"
        class="conversation-select"
        placeholder="新对话"
        :loading="initializing"
        :disabled="sending"
        @change="loadConversation"
      >
        <el-option v-for="item in conversations" :key="item.id" :label="item.title" :value="item.id">
          <div class="conversation-option">
            <span>{{ item.title }}</span>
            <span>{{ formatShortTime(item.utime) }}</span>
          </div>
        </el-option>
      </el-select>
    </div>

    <div class="context-strip" :class="{ 'has-context': hasFileContext }">
      <span class="context-dot" />
      <div class="context-copy">
        <strong>{{ hasFileContext ? activeFile.name : projectName || "当前项目" }}</strong>
        <span>{{ contextHint }}</span>
      </div>
    </div>

    <div class="recipe-shortcuts">
      <button
        v-for="action in recipeActions"
        :key="action.id"
        type="button"
        :class="{ active: activeRecipeID === action.id }"
        :disabled="sending || !hasFileContext"
        @click="chooseRecipe(action)"
      >
        {{ action.label }}
      </button>
    </div>

    <div ref="messageListRef" class="message-list" v-loading="loadingMessages">
      <div v-if="!messages.length && !loadingMessages" class="assistant-empty">
        <span class="empty-mark"
          ><el-icon><ChatDotRound /></el-icon
        ></span>
        <strong>从当前项目开始协作</strong>
        <p>可以让 AI 解释代码、审阅风险，或生成一份可检查的候选代码。</p>
        <div class="prompt-examples">
          <button
            v-for="example in emptyExamples"
            :key="example.prompt"
            type="button"
            @click="fillPrompt(example.prompt)"
          >
            {{ example.label }}
          </button>
        </div>
      </div>

      <template v-for="message in messages" :key="message.id">
        <article class="message" :class="message.role === 'USER' ? 'is-user' : 'is-assistant'">
          <div class="message-meta">
            <span>{{ message.role === "USER" ? "你" : "AI" }}</span>
            <span v-if="message.ctime > 0">{{ formatMessageTime(message.ctime) }}</span>
          </div>
          <div
            v-if="message.content || message.status === 'STREAMING' || message.status === 'COMPLETED'"
            class="message-content"
          >
            <span v-if="message.content">{{ message.content }}</span>
            <span v-else-if="message.status === 'STREAMING'" class="thinking-text">
              <i /><i /><i /> {{ message.progressText || "正在分析" }}
            </span>
            <span v-else>暂无文本回复</span>
          </div>
          <div v-if="message.status === 'FAILED' || message.status === 'CANCELLED'" class="message-error">
            {{ message.status === "CANCELLED" ? "生成已停止" : message.error_message || "生成失败" }}
          </div>
          <div v-if="message.role === 'ASSISTANT' && message.status === 'COMPLETED'" class="message-usage">
            <span v-if="message.latency_millis">{{ formatLatency(message.latency_millis) }}</span>
            <span v-if="message.input_tokens || message.output_tokens">
              {{ message.input_tokens + message.output_tokens }} tokens
            </span>
          </div>
        </article>

        <section v-for="suggestion in suggestionsForMessage(message.id)" :key="suggestion.id" class="suggestion-card">
          <div class="suggestion-heading">
            <div>
              <span class="suggestion-label">代码建议</span>
              <strong>{{ suggestion.summary || "完整文件修改" }}</strong>
            </div>
            <span class="suggestion-status" :class="suggestion.status.toLowerCase()">
              {{ suggestionStatusText(suggestion.status) }}
            </span>
          </div>

          <div v-if="suggestion.diagnostics?.length" class="diagnostics">
            <div
              v-for="diagnostic in suggestion.diagnostics"
              :key="`${diagnostic.code}-${diagnostic.message}`"
              :class="diagnostic.severity.toLowerCase()"
            >
              <el-icon><WarningFilled /></el-icon>
              <span>{{ diagnostic.message }}</span>
            </div>
          </div>

          <pre
            v-if="expandedSuggestions.includes(suggestion.id)"
            class="suggestion-code"
          ><code>{{ suggestion.code }}</code></pre>

          <div class="suggestion-actions">
            <el-button text size="small" @click="toggleSuggestion(suggestion.id)">
              {{ expandedSuggestions.includes(suggestion.id) ? "收起代码" : "查看代码" }}
            </el-button>
            <el-button
              size="small"
              :disabled="!canLoadSuggestion(suggestion)"
              @click="loadSuggestionIntoEditor(suggestion)"
            >
              载入编辑器
            </el-button>
            <AuthButton
              :capability="capabilities.CodeAssist.ApplySuggestion"
              size="small"
              type="primary"
              :loading="applyingSuggestionID === suggestion.id"
              :disabled="!canApplySuggestion(suggestion)"
              @click="applySuggestion(suggestion)"
            >
              {{ suggestion.status === "APPLIED" ? "已保存" : "保存为版本" }}
            </AuthButton>
          </div>
        </section>
      </template>
    </div>

    <footer class="composer">
      <el-input
        ref="promptInputRef"
        v-model="prompt"
        type="textarea"
        resize="none"
        :autosize="{ minRows: 2, maxRows: 6 }"
        :maxlength="16000"
        placeholder="询问当前代码，或描述你希望进行的修改…"
        @keydown="handlePromptKeydown"
      />
      <div class="composer-footer">
        <span>{{ activeRecipeName }}</span>
        <div class="composer-actions">
          <el-button v-if="sending" size="small" @click="cancelStream">停止</el-button>
          <AuthButton
            :capability="capabilities.CodeAssist.Chat"
            :icon="Promotion"
            type="primary"
            circle
            :disabled="!canSend"
            :loading="sending"
            title="发送"
            @click="sendMessage"
          />
        </div>
      </div>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import dayjs from "dayjs"
import { ChatDotRound, Close, MagicStick, Plus, Promotion, WarningFilled } from "@element-plus/icons-vue"
import { ElMessage, type InputInstance } from "element-plus"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import {
  applyCodeAssistSuggestionApi,
  createCodeAssistConversationApi,
  getCodeAssistConversationDetailApi,
  listCodeAssistConversationsApi,
  streamCodeAssistMessage
} from "@/api/task/codeassist"
import type {
  AIConversation,
  AIMessage,
  AISuggestion,
  AISuggestionStatus,
  StreamEventData,
  StreamEventName
} from "@/api/task/codeassist/types"
import type { codebook } from "@/api/task/codebook/types/codebook"

const props = defineProps<{
  projectId: number
  projectName: string
  activeFile: codebook
  readonly?: boolean
}>()

const emit = defineEmits<{
  (event: "close"): void
  (event: "apply-code", code: string): void
  (event: "version-created", versionID: number): void
}>()

type DisplayMessage = AIMessage & { progressText?: string }

const capabilities = TASK_CAPABILITIES
const conversations = ref<AIConversation[]>([])
const activeConversationID = ref<number>()
const activeRecipeID = ref("codebook.general")
const messages = ref<DisplayMessage[]>([])
const suggestions = ref<AISuggestion[]>([])
const prompt = ref("")
const initializing = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const applyingSuggestionID = ref(0)
const expandedSuggestions = ref<number[]>([])
const messageListRef = ref<HTMLElement>()
const promptInputRef = ref<InputInstance>()
let streamController: AbortController | null = null
let temporaryMessageID = -1

const recipeActions = [
  { id: "codebook.review", label: "审阅代码", prompt: "审阅当前脚本，指出正确性、安全性和可读性问题" },
  { id: "codebook.edit", label: "修改代码", prompt: "根据我的要求修改当前脚本，并生成完整候选代码：" },
  { id: "codebook.legacy-migration", label: "迁移旧脚本", prompt: "将当前脚本迁移到最新 etask 运行协议" }
]
const activeConversation = computed(() => conversations.value.find((item) => item.id === activeConversationID.value))
const activeRecipeName = computed(
  () => recipeActions.find((item) => item.id === activeRecipeID.value)?.label || "自由对话"
)
const hasFileContext = computed(
  () =>
    props.activeFile.kind === "FILE" &&
    props.activeFile.id > 0 &&
    props.activeFile.current_version_id > 0 &&
    props.activeFile.project_id === props.projectId &&
    props.activeFile.scope === "TENANT" &&
    !props.readonly &&
    !props.activeFile.readonly
)
const emptyExamples = computed(() =>
  hasFileContext.value
    ? [
        { label: "解释当前脚本的执行流程", prompt: "解释当前脚本的执行流程" },
        { label: "分析当前脚本引用的依赖", prompt: "分析当前脚本引用的 SYSTEM 和租户制品依赖" }
      ]
    : [
        { label: "介绍当前项目结构", prompt: "介绍当前项目的目录结构和主要文件" },
        { label: "分析项目中的依赖关系", prompt: "分析当前项目的目录和依赖关系" }
      ]
)
const contextHint = computed(() => {
  if (hasFileContext.value) return `基于当前版本 #${props.activeFile.current_version_id} 和编辑器内容`
  if (props.activeFile.kind === "FILE") return "当前文件是草稿或只读资源，本次对话不附带代码"
  return "项目级对话，打开租户脚本后可附带代码上下文"
})
const canSend = computed(() => {
  if (!prompt.value.trim() || sending.value) return false
  return activeRecipeID.value === "codebook.general" || hasFileContext.value
})

function emptyMessage(overrides: Partial<DisplayMessage>): DisplayMessage {
  return {
    id: temporaryMessageID--,
    role: "ASSISTANT",
    content: "",
    status: "STREAMING",
    input_tokens: 0,
    output_tokens: 0,
    latency_millis: 0,
    error_message: "",
    progressText: "",
    ctime: Date.now(),
    ...overrides
  }
}

async function initialize() {
  if (!props.projectId || initializing.value) return
  initializing.value = true
  try {
    const conversationResponse = await listCodeAssistConversationsApi({ project_id: props.projectId })
    conversations.value = conversationResponse.data.conversations || []
    if (conversations.value.length) {
      activeConversationID.value = conversations.value[0].id
      await loadConversation(conversations.value[0].id)
    }
  } finally {
    initializing.value = false
  }
}

async function createConversation(title = "新对话") {
  if (sending.value) return undefined
  const { data } = await createCodeAssistConversationApi({ project_id: props.projectId, title })
  conversations.value = [data, ...conversations.value.filter((item) => item.id !== data.id)]
  activeConversationID.value = data.id
  messages.value = []
  suggestions.value = []
  await nextTick()
  promptInputRef.value?.focus()
  return data
}

async function loadConversation(id?: number) {
  if (!id) return
  loadingMessages.value = true
  try {
    const { data } = await getCodeAssistConversationDetailApi({ conversation_id: id })
    messages.value = data.messages || []
    suggestions.value = data.suggestions || []
    await scrollToBottom(false)
  } finally {
    loadingMessages.value = false
  }
}

function buildChatContext() {
  if (!hasFileContext.value) {
    return { node_id: 0, base_version_id: 0, editor_code: "" }
  }
  return {
    node_id: props.activeFile.id,
    base_version_id: props.activeFile.current_version_id,
    editor_code: props.activeFile.code || ""
  }
}

async function sendMessage() {
  const content = prompt.value.trim()
  if (!content || !canSend.value) return
  if (!activeConversationID.value) {
    const conversation = await createConversation(content.slice(0, 28))
    if (!conversation) return
  }

  const recipeID = activeRecipeID.value
  const userMessage = emptyMessage({ role: "USER", content, status: "COMPLETED" })
  const assistantMessage = emptyMessage({ role: "ASSISTANT" })
  messages.value.push(userMessage, assistantMessage)
  prompt.value = ""
  sending.value = true
  streamController = new AbortController()
  await scrollToBottom()

  let failedEventReceived = false
  try {
    await streamCodeAssistMessage(
      {
        conversation_id: activeConversationID.value!,
        recipe_id: recipeID,
        content,
        context: buildChatContext()
      },
      {
        signal: streamController.signal,
        onEvent: (name, data) =>
          handleStreamEvent(name, data, assistantMessage, () => {
            failedEventReceived = true
          })
      }
    )
    await loadConversation(activeConversationID.value)
  } catch (error) {
    if (streamController.signal.aborted) {
      assistantMessage.status = "CANCELLED"
      assistantMessage.error_message = "生成已停止"
    } else {
      assistantMessage.status = "FAILED"
      assistantMessage.error_message = error instanceof Error ? error.message : "AI 请求失败"
      if (!failedEventReceived) ElMessage.error(assistantMessage.error_message)
    }
  } finally {
    activeRecipeID.value = "codebook.general"
    streamController = null
    sending.value = false
    await scrollToBottom()
  }
}

function handleStreamEvent(
  name: StreamEventName,
  data: StreamEventData,
  assistant: DisplayMessage,
  markFailed: () => void
) {
  if (name === "message.started" && data.message_id) {
    assistant.id = data.message_id
  } else if (name === "message.delta") {
    assistant.content += data.text || ""
  } else if (name === "message.progress") {
    assistant.progressText = data.text || "正在生成候选代码"
  } else if (name === "message.completed") {
    assistant.status = "COMPLETED"
    assistant.input_tokens = data.input_tokens || 0
    assistant.output_tokens = data.output_tokens || 0
  } else if (name === "message.failed") {
    markFailed()
    assistant.status = "FAILED"
    assistant.error_message = data.error || "AI 请求失败"
  }
  void scrollToBottom()
}

function cancelStream() {
  streamController?.abort()
}

function suggestionsForMessage(messageID: number) {
  return suggestions.value.filter((item) => item.message_id === messageID)
}

function toggleSuggestion(id: number) {
  expandedSuggestions.value = expandedSuggestions.value.includes(id)
    ? expandedSuggestions.value.filter((item) => item !== id)
    : [...expandedSuggestions.value, id]
}

function canLoadSuggestion(suggestion: AISuggestion) {
  return hasFileContext.value && suggestion.node_id === props.activeFile.id
}

function canApplySuggestion(suggestion: AISuggestion) {
  return (
    suggestion.status !== "APPLIED" &&
    suggestion.status !== "APPLYING" &&
    !suggestion.diagnostics?.some((item) => item.severity === "ERROR")
  )
}

function loadSuggestionIntoEditor(suggestion: AISuggestion) {
  if (!canLoadSuggestion(suggestion)) return
  emit("apply-code", suggestion.code)
  ElMessage.success("候选代码已载入编辑器，请确认后保存或试运行")
}

async function applySuggestion(suggestion: AISuggestion) {
  if (!canApplySuggestion(suggestion)) return
  applyingSuggestionID.value = suggestion.id
  try {
    const { data } = await applyCodeAssistSuggestionApi(suggestion.id)
    suggestion.status = "APPLIED"
    suggestion.applied_version_id = data.version_id
    emit("version-created", data.version_id)
    ElMessage.success("已保存为新版本，未自动切换当前版本")
  } finally {
    applyingSuggestionID.value = 0
  }
}

function suggestionStatusText(status: AISuggestionStatus) {
  return {
    DRAFT: "待修正",
    VALIDATED: "已校验",
    APPLYING: "保存中",
    APPLIED: "已保存"
  }[status]
}

function chooseRecipe(action: (typeof recipeActions)[number]) {
  if (!hasFileContext.value) return
  activeRecipeID.value = action.id
  prompt.value = action.prompt
  nextTick(() => promptInputRef.value?.focus())
}

function fillPrompt(value: string) {
  activeRecipeID.value = "codebook.general"
  prompt.value = value
  nextTick(() => promptInputRef.value?.focus())
}

function handlePromptKeydown(event: Event | KeyboardEvent) {
  if (!(event instanceof KeyboardEvent)) return
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return
  event.preventDefault()
  void sendMessage()
}

function formatShortTime(value: number) {
  return dayjs(value).format("MM-DD HH:mm")
}

function formatMessageTime(value: number) {
  return dayjs(value).format("HH:mm")
}

function formatLatency(value: number) {
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`
}

async function scrollToBottom(smooth = true) {
  await nextTick()
  messageListRef.value?.scrollTo({
    top: messageListRef.value.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  })
}

watch(hasFileContext, (available) => {
  if (!available) activeRecipeID.value = "codebook.general"
})
watch(
  () => props.projectId,
  () => {
    conversations.value = []
    activeConversationID.value = undefined
    messages.value = []
    suggestions.value = []
    void initialize()
  }
)

onMounted(initialize)
onBeforeUnmount(cancelStream)
</script>

<style scoped lang="scss">
.code-assist-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #f8fafc;
  border-left: 1px solid #dce3ed;
}

.assistant-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 12px 0 14px;
  background: #fff;
  border-bottom: 1px solid #e5eaf1;
}

.assistant-heading,
.header-actions,
.assistant-mark,
.composer-footer,
.composer-actions,
.message-meta,
.message-usage,
.suggestion-actions {
  display: flex;
  align-items: center;
}

.assistant-heading {
  gap: 10px;
}

.assistant-mark,
.empty-mark {
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 5px 14px rgba(79, 70, 229, 0.2);
}

.assistant-mark {
  width: 30px;
  height: 30px;
  border-radius: 9px;
}

.assistant-title {
  color: #172033;
  font-size: 14px;
  font-weight: 700;
}

.assistant-subtitle {
  max-width: 190px;
  margin-top: 2px;
  overflow: hidden;
  color: #8a96a8;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  gap: 2px;
}

.assistant-toolbar {
  display: block;
  padding: 10px 12px 8px;
  background: #fff;
}

.conversation-select {
  width: 100%;
}

.conversation-option {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14px;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span:last-child,
  small {
    flex-shrink: 0;
    color: #94a3b8;
    font-size: 11px;
  }
}

.context-strip {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 12px 8px;
  padding: 8px 10px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  &.has-context {
    background: #eff6ff;
    border-color: #bfdbfe;

    .context-dot {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
    }
  }
}

.context-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  background: #94a3b8;
  border-radius: 50%;
}

.context-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;

  strong,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #334155;
    font-size: 11px;
  }

  span {
    margin-top: 1px;
    color: #8491a3;
    font-size: 10px;
  }
}

.recipe-shortcuts {
  display: flex;
  gap: 6px;
  padding: 0 12px 9px;
  background: #fff;

  button {
    flex: 1;
    min-width: 0;
    padding: 5px 7px;
    overflow: hidden;
    color: #64748b;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;

    &:hover:not(:disabled),
    &.active {
      color: #2563eb;
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    &:disabled {
      color: #b6c0ce;
      cursor: not-allowed;
      background: #f8fafc;
    }
  }
}

.message-list {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 14px 18px;
  scroll-behavior: smooth;
}

.assistant-empty {
  display: flex;
  align-items: center;
  padding: 56px 18px 24px;
  color: #64748b;
  text-align: center;
  flex-direction: column;

  .empty-mark {
    display: flex;
    width: 42px;
    height: 42px;
    align-items: center;
    margin-bottom: 16px;
    border-radius: 13px;
    font-size: 20px;
  }

  strong {
    color: #27364c;
    font-size: 14px;
  }

  p {
    max-width: 280px;
    margin: 8px 0 18px;
    color: #8491a3;
    font-size: 12px;
    line-height: 1.65;
  }
}

.prompt-examples {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 7px;

  button {
    padding: 8px 11px;
    color: #52647d;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;

    &:hover {
      color: #2563eb;
      border-color: #bfdbfe;
    }
  }
}

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
      background: #2563eb;
      border-radius: 12px 12px 3px 12px;
      box-shadow: 0 5px 12px rgba(37, 99, 235, 0.12);
    }
  }

  &.is-assistant .message-content {
    color: #334155;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 3px 12px 12px;
  }
}

.message-meta {
  justify-content: space-between;
  margin: 0 4px 5px;
  color: #94a3b8;
  font-size: 10px;
}

.message-content {
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.thinking-text {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #8491a3;

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
  color: #dc2626;
  font-size: 10px;
}

.message-usage {
  justify-content: flex-end;
  gap: 8px;
  margin: 4px 4px 0;
  color: #a0aabc;
  font-size: 9px;
}

.suggestion-card {
  margin: -3px 0 16px 20px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.suggestion-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 11px;

  > div {
    display: flex;
    min-width: 0;
    flex-direction: column;
  }

  strong {
    margin-top: 3px;
    overflow: hidden;
    color: #334155;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.suggestion-label {
  color: #6366f1;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.suggestion-status {
  flex-shrink: 0;
  padding: 2px 6px;
  color: #64748b;
  font-size: 9px;
  background: #f1f5f9;
  border-radius: 5px;

  &.validated {
    color: #15803d;
    background: #dcfce7;
  }

  &.applied {
    color: #1d4ed8;
    background: #dbeafe;
  }

  &.draft {
    color: #b45309;
    background: #fef3c7;
  }
}

.diagnostics {
  display: flex;
  padding: 0 11px 9px;
  flex-direction: column;
  gap: 4px;

  > div {
    display: flex;
    align-items: flex-start;
    gap: 5px;
    color: #a16207;
    font-size: 9px;
    line-height: 1.45;

    &.error {
      color: #dc2626;
    }

    .el-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }
  }
}

.suggestion-code {
  max-height: 240px;
  margin: 0;
  overflow: auto;
  padding: 10px 11px;
  color: #d7e2f0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 10px;
  line-height: 1.6;
  background: #172033;
  white-space: pre;
}

.suggestion-actions {
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 9px;
  border-top: 1px solid #edf1f6;
}

.composer {
  padding: 10px 12px 12px;
  background: #fff;
  border-top: 1px solid #dce3ed;

  :deep(.el-textarea__inner) {
    padding: 10px 11px;
    color: #334155;
    font-size: 12px;
    line-height: 1.55;
    background: #f8fafc;
    border-radius: 9px;
    box-shadow: 0 0 0 1px #dbe3ed inset;

    &:focus {
      box-shadow: 0 0 0 1px #93c5fd inset;
    }
  }
}

.composer-footer {
  justify-content: space-between;
  min-height: 31px;
  padding: 6px 1px 0 4px;
  color: #94a3b8;
  font-size: 10px;
}

.composer-actions {
  gap: 6px;
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
