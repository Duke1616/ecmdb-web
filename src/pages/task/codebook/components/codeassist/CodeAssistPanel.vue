<template>
  <aside class="code-assist-panel">
    <header class="assistant-header">
      <div class="assistant-heading">
        <span class="assistant-mark"
          ><el-icon><MagicStick /></el-icon
        ></span>
        <div>
          <div class="assistant-title">AI 项目助手</div>
          <div class="assistant-subtitle">{{ activeConversation?.model || "Codebook 智能协作" }}</div>
        </div>
      </div>
      <div class="header-actions">
        <AuthButton
          :capability="capabilities.CodeAssist.AddConversation"
          :icon="Plus"
          class="new-conversation-button"
          circle
          text
          title="新建对话"
          :disabled="sending"
          @click="handleCreateConversation"
        />
        <el-button :icon="Close" circle text title="关闭 AI 助手" @click="$emit('close')" />
      </div>
    </header>

    <div class="assistant-controls">
      <el-select
        v-model="activeConversationID"
        class="conversation-select"
        placeholder="开始一段新对话"
        :loading="initializing"
        :disabled="sending"
        @change="handleLoadConversation"
      >
        <el-option v-for="item in conversations" :key="item.id" :label="item.title" :value="item.id">
          <div class="conversation-option">
            <span>{{ item.title }}</span>
            <small>{{ formatShortTime(item.utime) }}</small>
          </div>
        </el-option>
      </el-select>

      <div class="context-strip" :class="{ 'has-context': hasFileContext }">
        <span class="context-dot" />
        <div class="context-copy">
          <strong>{{ hasFileContext ? activeFile.name : projectName || "当前项目" }}</strong>
          <span>{{ contextHint }}</span>
        </div>
      </div>

      <div class="recipe-shortcuts" aria-label="AI 协作模式">
        <button
          v-for="recipe in recipes"
          :key="recipe.id"
          type="button"
          :class="{ active: activeRecipeID === recipe.id }"
          :disabled="sending || (recipe.requiresFileContext && !hasFileContext)"
          :title="recipe.requiresFileContext && !hasFileContext ? '需要先打开项目内文件' : recipe.label"
          @click="chooseRecipe(recipe)"
        >
          {{ recipe.label }}
        </button>
      </div>
    </div>

    <div ref="messageListRef" class="message-list" v-loading="loadingMessages">
      <AssistantEmptyState
        v-if="!messages.length && !loadingMessages"
        :has-file-context="hasFileContext"
        @select="fillPrompt"
      />

      <template v-for="message in messages" :key="message.id">
        <MessageBubble :message="message" />
        <ChangeSetCard
          v-for="changeSet in changeSetsForMessage(message.id)"
          :key="changeSet.id"
          :change-set="changeSet"
          :active-file-id="activeFile.id"
          :applying="applyingChangeSetID === changeSet.id"
          :readonly="Boolean(readonly)"
          @apply="applyChangeSet"
          @load-file="loadChangeIntoEditor"
        />
      </template>
    </div>

    <AssistantComposer
      ref="composerRef"
      v-model="prompt"
      :recipe-name="activeRecipe.label"
      :can-send="canSend"
      :sending="sending"
      @send="handleSendMessage"
      @cancel="cancelStream"
      @clear-recipe="clearRecipe"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue"
import dayjs from "dayjs"
import { Close, MagicStick, Plus } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { applyCodeAssistChangeSetApi } from "@/api/task/codeassist"
import { AIChangeOperation, AIChangeSetStatus } from "@/api/task/codeassist/ai.enums"
import type { AIChangeItem, AIChangeSet, AppliedChangeItem } from "@/api/task/codeassist/types"
import type { codebook } from "@/api/task/codebook/types/codebook"
import AssistantComposer from "./components/AssistantComposer.vue"
import AssistantEmptyState from "./components/AssistantEmptyState.vue"
import ChangeSetCard from "./components/ChangeSetCard.vue"
import MessageBubble from "./components/MessageBubble.vue"
import { CODE_ASSIST_RECIPES, GENERAL_RECIPE_ID, type CodeAssistRecipe } from "./constants"
import { useCodeAssistConversation } from "./composables/useCodeAssistConversation"

const props = defineProps<{
  projectId: number
  projectName: string
  activeFile: codebook
  readonly?: boolean
}>()

const emit = defineEmits<{
  (event: "close"): void
  (event: "apply-code", code: string): void
  (event: "change-set-applied", items: AppliedChangeItem[]): void
}>()

const capabilities = TASK_CAPABILITIES
const recipes = CODE_ASSIST_RECIPES
const activeRecipeID = ref(GENERAL_RECIPE_ID)
const prompt = ref("")
const applyingChangeSetID = ref(0)
const messageListRef = ref<HTMLElement>()
const composerRef = ref<InstanceType<typeof AssistantComposer>>()

const hasFileContext = computed(
  () =>
    props.activeFile.kind === "FILE" &&
    props.activeFile.id > 0 &&
    props.activeFile.current_version_id > 0 &&
    props.activeFile.project_id === props.projectId &&
    props.activeFile.scope === "TENANT"
)
const activeRecipe = computed(() => recipes.find((recipe) => recipe.id === activeRecipeID.value) || recipes[0])
const canSend = computed(
  () =>
    Boolean(prompt.value.trim()) && !sending.value && (!activeRecipe.value.requiresFileContext || hasFileContext.value)
)
const contextHint = computed(() => {
  if (hasFileContext.value && props.readonly) {
    return `只读上下文 · 当前版本 #${props.activeFile.current_version_id}`
  }
  if (hasFileContext.value) {
    return `已附带编辑器内容 · 当前版本 #${props.activeFile.current_version_id}`
  }
  if (props.activeFile.kind === "FILE") return "草稿或外部资源不会作为写入上下文"
  return "项目级上下文 · 支持跨文件分析"
})

const {
  activeConversation,
  activeConversationID,
  changeSets,
  conversations,
  createConversation,
  initializing,
  loadConversation,
  loadingMessages,
  messages,
  cancelStream,
  sendMessage,
  sending
} = useCodeAssistConversation({
  projectId: () => props.projectId,
  buildContext: () =>
    hasFileContext.value
      ? {
          node_id: props.activeFile.id,
          base_version_id: props.activeFile.current_version_id,
          editor_code: props.activeFile.code || ""
        }
      : { node_id: 0, base_version_id: 0, editor_code: "" }
})

function changeSetsForMessage(messageID: number) {
  return changeSets.value.filter((item) => item.message_id === messageID)
}

async function handleCreateConversation() {
  await createConversation()
  await nextTick()
  composerRef.value?.focus()
}

async function handleLoadConversation(id: number) {
  await loadConversation(id)
  await scrollToBottom(false)
}

async function handleSendMessage() {
  const content = prompt.value.trim()
  if (!content || !canSend.value) return
  prompt.value = ""
  await scrollToBottom()
  await sendMessage(content, activeRecipeID.value)
  activeRecipeID.value = GENERAL_RECIPE_ID
  await scrollToBottom()
}

function chooseRecipe(recipe: CodeAssistRecipe) {
  if (recipe.requiresFileContext && !hasFileContext.value) return
  activeRecipeID.value = recipe.id
  if (recipe.prompt) prompt.value = recipe.prompt
  nextTick(() => composerRef.value?.focus())
}

function fillPrompt(value: string) {
  activeRecipeID.value = GENERAL_RECIPE_ID
  prompt.value = value
  nextTick(() => composerRef.value?.focus())
}

function clearRecipe() {
  activeRecipeID.value = GENERAL_RECIPE_ID
  nextTick(() => composerRef.value?.focus())
}

function loadChangeIntoEditor(item: AIChangeItem) {
  if (item.operation !== AIChangeOperation.UPDATE || item.node_id !== props.activeFile.id) return
  emit("apply-code", item.code)
  ElMessage.success("候选内容已载入编辑器，尚未保存到项目")
}

async function applyChangeSet(changeSet: AIChangeSet) {
  if (applyingChangeSetID.value || props.readonly) return
  applyingChangeSetID.value = changeSet.id
  try {
    const { data } = await applyCodeAssistChangeSetApi(changeSet.id)
    changeSet.status = AIChangeSetStatus.APPLIED
    for (const result of data.items || []) {
      const item = changeSet.items.find((candidate) => candidate.path === result.path)
      if (item) item.applied_version_id = result.version_id
    }
    emit("change-set-applied", data.items || [])
    ElMessage.success(`已应用 ${data.items?.length || 0} 个文件，项目当前版本已更新`)
  } finally {
    applyingChangeSetID.value = 0
  }
}

function formatShortTime(value: number) {
  return dayjs(value).format("MM-DD HH:mm")
}

async function scrollToBottom(smooth = true) {
  await nextTick()
  messageListRef.value?.scrollTo({
    top: messageListRef.value.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  })
}

watch(
  messages,
  () => {
    void scrollToBottom(false)
  },
  { deep: true }
)
watch(hasFileContext, (available) => {
  if (!available && activeRecipe.value.requiresFileContext) activeRecipeID.value = GENERAL_RECIPE_ID
})
</script>

<style scoped lang="scss">
.code-assist-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  color: var(--el-text-color-primary);
  background: radial-gradient(circle at 100% 0, rgba(99, 102, 241, 0.06), transparent 28%), #f8fafc;
  border-left: 1px solid #dce3ed;
}

.assistant-header {
  display: flex;
  height: 56px;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 0 11px 0 14px;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.assistant-heading,
.header-actions,
.assistant-mark {
  display: flex;
  align-items: center;
}

.assistant-heading {
  min-width: 0;
  gap: 10px;
}

.assistant-mark {
  width: 31px;
  height: 31px;
  flex-shrink: 0;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.22);
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
  color: var(--el-text-color-placeholder);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  flex-shrink: 0;
  gap: 2px;

  :deep(.el-button.is-circle) {
    display: inline-flex;
    width: 32px;
    height: 32px;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  :deep(.el-button.is-circle .el-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    line-height: 1;
  }
}

.assistant-controls {
  padding: 10px 12px 9px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid #edf1f6;
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

  small {
    flex-shrink: 0;
    color: var(--el-text-color-placeholder);
    font-size: 10px;
  }
}

.context-strip {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 8px;
  padding: 8px 9px;
  background: #f8fafc;
  border: 1px solid #e5eaf1;
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
    color: var(--el-text-color-secondary);
    font-size: 9px;
  }
}

.recipe-shortcuts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  margin-top: 8px;

  button {
    width: 100%;
    min-width: 0;
    padding: 5px 3px;
    overflow: hidden;
    color: #64748b;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    transition: 0.16s ease;

    &:hover:not(:disabled),
    &.active {
      color: #4f46e5;
      background: #eef2ff;
      border-color: #c7d2fe;
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
  padding: 12px 14px 20px;
  scroll-behavior: smooth;
}
</style>
