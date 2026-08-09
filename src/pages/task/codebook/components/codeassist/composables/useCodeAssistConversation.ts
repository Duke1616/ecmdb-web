import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { ElMessage } from "element-plus"
import {
  createCodeAssistConversationApi,
  getCodeAssistConversationDetailApi,
  listCodeAssistConversationsApi,
  streamCodeAssistMessage
} from "@/api/task/codeassist"
import { AIMessageRole, AIMessageStatus, StreamEventName } from "@/api/task/codeassist/ai.enums"
import type {
  AIChangeSet,
  AIChatContext,
  AIConversation,
  AIMessage,
  StreamEventData
} from "@/api/task/codeassist/types"

export type DisplayMessage = AIMessage & { progressText?: string }

interface ConversationOptions {
  projectId: () => number
  buildContext: () => AIChatContext
}

export function useCodeAssistConversation(options: ConversationOptions) {
  const conversations = ref<AIConversation[]>([])
  const activeConversationID = ref<number>()
  const messages = ref<DisplayMessage[]>([])
  const changeSets = ref<AIChangeSet[]>([])
  const initializing = ref(false)
  const loadingMessages = ref(false)
  const sending = ref(false)
  let streamController: AbortController | null = null
  let temporaryMessageID = -1

  const activeConversation = computed(() => conversations.value.find((item) => item.id === activeConversationID.value))

  function createDisplayMessage(overrides: Partial<DisplayMessage>): DisplayMessage {
    return {
      id: temporaryMessageID--,
      role: AIMessageRole.ASSISTANT,
      content: "",
      status: AIMessageStatus.STREAMING,
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
    const projectID = options.projectId()
    if (!projectID || initializing.value) return
    initializing.value = true
    try {
      const { data } = await listCodeAssistConversationsApi({ project_id: projectID })
      conversations.value = data.conversations || []
      if (conversations.value.length) {
        activeConversationID.value = conversations.value[0].id
        await loadConversation(activeConversationID.value)
      }
    } finally {
      initializing.value = false
    }
  }

  async function createConversation(title = "新对话") {
    if (sending.value) return undefined
    const { data } = await createCodeAssistConversationApi({
      project_id: options.projectId(),
      title
    })
    conversations.value = [data, ...conversations.value.filter((item) => item.id !== data.id)]
    activeConversationID.value = data.id
    messages.value = []
    changeSets.value = []
    return data
  }

  async function loadConversation(id?: number) {
    if (!id) return
    loadingMessages.value = true
    try {
      const { data } = await getCodeAssistConversationDetailApi({ conversation_id: id })
      messages.value = data.messages || []
      changeSets.value = data.change_sets || []
    } finally {
      loadingMessages.value = false
    }
  }

  async function sendMessage(content: string, recipeID: string) {
    if (!content || sending.value) return false
    if (!activeConversationID.value) {
      const conversation = await createConversation(content.slice(0, 28))
      if (!conversation) return false
    }

    const userMessage = createDisplayMessage({
      role: AIMessageRole.USER,
      content,
      status: AIMessageStatus.COMPLETED
    })
    const assistantMessage = createDisplayMessage({ role: AIMessageRole.ASSISTANT })
    messages.value.push(userMessage, assistantMessage)
    sending.value = true
    streamController = new AbortController()
    let failedEventReceived = false

    try {
      await streamCodeAssistMessage(
        {
          conversation_id: activeConversationID.value!,
          recipe_id: recipeID,
          content,
          context: options.buildContext()
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
      return true
    } catch (error) {
      if (streamController.signal.aborted) {
        assistantMessage.status = AIMessageStatus.CANCELLED
        assistantMessage.error_message = "生成已停止"
      } else {
        assistantMessage.status = AIMessageStatus.FAILED
        assistantMessage.error_message = error instanceof Error ? error.message : "AI 请求失败"
        if (!failedEventReceived) ElMessage.error(assistantMessage.error_message)
      }
      return false
    } finally {
      streamController = null
      sending.value = false
    }
  }

  function handleStreamEvent(
    name: StreamEventName,
    data: StreamEventData,
    assistant: DisplayMessage,
    markFailed: () => void
  ) {
    if (name === StreamEventName.MESSAGE_STARTED && data.message_id) {
      assistant.id = data.message_id
    } else if (name === StreamEventName.MESSAGE_DELTA) {
      assistant.content += data.text || ""
    } else if (name === StreamEventName.MESSAGE_PROGRESS) {
      assistant.progressText = data.text || "正在生成项目变更"
    } else if (name === StreamEventName.MESSAGE_COMPLETED) {
      assistant.status = AIMessageStatus.COMPLETED
      assistant.input_tokens = data.input_tokens || 0
      assistant.output_tokens = data.output_tokens || 0
    } else if (name === StreamEventName.MESSAGE_FAILED) {
      markFailed()
      assistant.status = AIMessageStatus.FAILED
      assistant.error_message = data.error || "AI 请求失败"
    }
  }

  function cancelStream() {
    streamController?.abort()
  }

  function reset() {
    cancelStream()
    conversations.value = []
    activeConversationID.value = undefined
    messages.value = []
    changeSets.value = []
  }

  watch(options.projectId, () => {
    reset()
    void initialize()
  })
  onMounted(initialize)
  onBeforeUnmount(cancelStream)

  return {
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
  }
}
