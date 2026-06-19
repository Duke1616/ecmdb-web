<template>
  <div
    class="executor-picker"
    :class="[`variant-${variant}`, { 'is-disabled': disabled, 'has-value': selectedOption }]"
  >
    <div ref="containerRef" class="picker-input-box" @click="toggleDropdown">
      <div v-if="selectedOption" class="selected-single">
        <div class="selected-info">
          <div class="selected-main">
            <span class="selected-service">{{ selectedOption.service }}</span>
            <span class="selected-separator">/</span>
            <span class="selected-handler">{{ selectedOption.handler.name }}</span>
          </div>
          <span class="selected-desc">{{ selectedOption.handler.desc || selectedExecutor?.desc || "暂无描述" }}</span>
        </div>
      </div>
      <span v-else class="placeholder-text">{{ placeholderText }}</span>

      <div class="input-actions">
        <button v-if="selectedOption && !disabled" type="button" class="clear-btn" @click.stop="clearSelection">
          <el-icon><Close /></el-icon>
        </button>
        <el-icon v-if="inputLoading" class="loading-icon"><Loading /></el-icon>
        <el-icon class="picker-arrow" :class="{ 'is-open': showDropdown }"><ArrowDown /></el-icon>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showDropdown && !disabled"
        ref="dropdownRef"
        class="executor-picker-dropdown"
        :style="dropdownStyle"
        @click.stop
      >
        <div class="search-section">
          <div class="search-input-wrapper">
            <el-icon class="search-icon"><Search /></el-icon>
            <input
              ref="searchInputRef"
              v-model="searchKeyword"
              class="search-input"
              :placeholder="searchPlaceholder"
              @input="handleSearch"
            />
          </div>
        </div>

        <div v-loading="loading" class="items-list" :class="{ 'is-loading': loading && options.length === 0 }">
          <div v-if="options.length === 0 && !loading" class="empty-state">暂无匹配的执行能力</div>

          <template v-for="group in groupedOptions" :key="group.executor.name">
            <div class="executor-group">
              <div class="group-icon">{{ getInitial(group.executor.name) }}</div>
              <div class="group-info">
                <div class="group-title">
                  <span>{{ group.executor.name }}</span>
                </div>
                <div class="group-desc">
                  {{ group.executor.desc || `${group.executor.nodes?.length || 0} 个在线节点` }}
                </div>
              </div>
              <div class="group-meta">
                <span class="mode-badge" :class="`is-${String(group.executor.mode || 'unknown').toLowerCase()}`">
                  {{ formatMode(group.executor.mode) }}
                </span>
                <span class="node-count">{{ group.executor.nodes?.length || 0 }} 节点</span>
              </div>
            </div>

            <button
              v-for="option in group.options"
              :key="`${option.service}/${option.handler.name}`"
              type="button"
              class="handler-option"
              :class="{ 'is-selected': isSelected(option) }"
              @click="selectOption(option)"
            >
              <div class="handler-icon">{{ getInitial(option.handler.name) }}</div>
              <div class="handler-info">
                <div class="handler-name">{{ option.handler.name }}</div>
                <div class="handler-desc">{{ option.handler.desc || "暂无描述" }}</div>
              </div>
              <el-icon v-if="isSelected(option)" class="selected-check"><Check /></el-icon>
            </button>
          </template>
        </div>

        <div class="dropdown-footer">
          <el-button v-if="hasMore" text size="small" :loading="loadingMore" @click="loadMore">加载更多</el-button>
          <span v-else>{{ options.length ? "已加载全部执行能力" : "暂无执行能力" }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { ArrowDown, Check, Close, Loading, Search } from "@element-plus/icons-vue"
import { listExecutorsApi } from "@/api/task/executor"
import { listAgentsApi } from "@/api/task/agent"
import type { Executor, HandlerDetail } from "@/api/task/executor/type"
import type { Agent } from "@/api/task/agent/type"

const serviceModel = defineModel<string>("service", { default: "" })
const handlerModel = defineModel<string>("handler", { default: "" })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    inline?: boolean
    size?: "small" | "default" | "large"
    limit?: number
    servicePlaceholder?: string
    handlerPlaceholder?: string
    variant?: "fancy" | "simple" | "element"
    kind?: "executor" | "agent"
  }>(),
  {
    disabled: false,
    inline: true,
    size: "large",
    limit: 20,
    servicePlaceholder: "请选择执行器服务",
    handlerPlaceholder: "请选择执行处理器",
    variant: "element",
    kind: "executor"
  }
)

const emit = defineEmits<{
  serviceChange: [executor: Executor | null]
  handlerChange: [handler: HandlerDetail | null]
}>()

type ExecutorOption = {
  service: string
  executor: Executor
  handler: HandlerDetail
}

type CapabilitySource = Executor | Agent

const showDropdown = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const searchKeyword = ref("")
const activeKeyword = ref("")
const nextCursor = ref("")
const hasMore = ref(false)
const executors = ref<Executor[]>([])
const selectedExecutor = ref<Executor | null>(null)
const containerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const selectingOption = ref(false)

const placeholderText = computed(() => {
  if (!props.handlerPlaceholder) return props.servicePlaceholder
  return props.servicePlaceholder === "请选择执行器服务" && props.handlerPlaceholder === "请选择执行处理器"
    ? "请选择执行器服务 / 处理器"
    : `${props.servicePlaceholder} / ${props.handlerPlaceholder}`
})
const inputLoading = computed(() => loading.value || loadingMore.value)
const searchPlaceholder = computed(() => {
  return props.kind === "agent" ? "搜索推送节点、处理器或描述..." : "搜索执行器、处理器或描述..."
})

const options = computed<ExecutorOption[]>(() => {
  const keyword = activeKeyword.value.trim().toLowerCase()
  return executors.value.flatMap((executor) => {
    const executorMatched = [executor.name, executor.desc].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(keyword)
    )

    return (executor.handlers || [])
      .filter((handler) => {
        if (!keyword) return true
        return (
          executorMatched ||
          [handler.name, handler.desc].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(keyword)
          )
        )
      })
      .map((handler) => ({
        service: getServiceValue(executor),
        executor,
        handler
      }))
  })
})

const groupedOptions = computed(() => {
  const groups: { executor: Executor; options: ExecutorOption[] }[] = []
  for (const option of options.value) {
    let group = groups.find((item) => item.executor.name === option.executor.name)
    if (!group) {
      group = { executor: option.executor, options: [] }
      groups.push(group)
    }
    group.options.push(option)
  }
  return groups
})

const selectedOption = computed(() => {
  if (!serviceModel.value || !handlerModel.value || !selectedExecutor.value) return null
  const handler = selectedExecutor.value.handlers?.find((item) => item.name === handlerModel.value)
  if (!handler) return null
  return {
    service: serviceModel.value,
    executor: selectedExecutor.value,
    handler
  }
})

const dropdownStyle = computed(() => {
  if (!containerRef.value || !showDropdown.value) return {}
  const rect = containerRef.value.getBoundingClientRect()
  return {
    position: "fixed" as const,
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 9999
  }
})

const mergeExecutors = (list: Executor[], append: boolean) => {
  if (!append) {
    executors.value = list
    return
  }
  const exists = new Set(executors.value.map((item) => item.name))
  executors.value = [...executors.value, ...list.filter((item) => !exists.has(item.name))]
}

const normalizeSource = (source: CapabilitySource): Executor => ({
  name: props.kind === "agent" ? (source as Agent).topic : source.name,
  desc: source.desc,
  handlers: source.handlers,
  nodes: source.nodes || [],
  mode: props.kind === "agent" ? "PUSH" : (source as Executor).mode
})

const getServiceValue = (executor: Executor) => executor.name

const listSources = async (append = false) => {
  const params = {
    limit: props.limit,
    cursor: append ? nextCursor.value : "",
    keyword: activeKeyword.value.trim()
  }

  if (props.kind === "agent") {
    const { data } = await listAgentsApi(params)
    return {
      list: (data.agents || []).map(normalizeSource),
      nextCursor: data.next_cursor || "",
      hasMore: data.has_more
    }
  }

  const { data } = await listExecutorsApi(params)
  return {
    list: (data.executors || []).map(normalizeSource),
    nextCursor: data.next_cursor || "",
    hasMore: data.has_more
  }
}

const fetchExecutors = async (append = false) => {
  if (append && (!hasMore.value || loadingMore.value)) return
  if (append) loadingMore.value = true
  else loading.value = true

  try {
    const data = await listSources(append)
    mergeExecutors(data.list, append)
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore && Boolean(nextCursor.value)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const resolveExecutor = async (service: string) => {
  if (!service) {
    selectedExecutor.value = null
    return null
  }

  const existed = executors.value.find((item) => item.name === service)
  if (existed) {
    selectedExecutor.value = existed
    return existed
  }

  const foundList = await listSourceByKeyword(service)
  const found = foundList.find((item) => item.name === service) || foundList[0] || null
  selectedExecutor.value = found
  if (found) mergeExecutors([found], true)
  return found
}

const listSourceByKeyword = async (keyword: string) => {
  if (props.kind === "agent") {
    const { data } = await listAgentsApi({ limit: 1, keyword })
    return (data.agents || []).map(normalizeSource)
  }

  const { data } = await listExecutorsApi({ limit: 1, keyword })
  return (data.executors || []).map(normalizeSource)
}

const toggleDropdown = () => {
  if (props.disabled) return
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    activeKeyword.value = searchKeyword.value.trim()
    if (executors.value.length === 0) fetchExecutors()
    nextTick(() => searchInputRef.value?.focus())
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const handleSearch = () => {
  activeKeyword.value = searchKeyword.value.trim()
  nextCursor.value = ""
  fetchExecutors()
}

const loadMore = () => fetchExecutors(true)

const selectOption = (option: ExecutorOption) => {
  selectingOption.value = true
  serviceModel.value = option.service
  handlerModel.value = option.handler.name
  selectedExecutor.value = option.executor
  emit("serviceChange", option.executor)
  emit("handlerChange", option.handler)
  closeDropdown()
  nextTick(() => {
    selectingOption.value = false
  })
}

const clearSelection = () => {
  serviceModel.value = ""
  handlerModel.value = ""
  selectedExecutor.value = null
  emit("serviceChange", null)
  emit("handlerChange", null)
}

const isSelected = (option: ExecutorOption) => {
  return option.service === serviceModel.value && option.handler.name === handlerModel.value
}

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "E"
const formatMode = (mode?: string) => {
  if (props.kind === "agent") return "消息推送"
  if (mode === "PULL") return "主动拉取"
  if (mode === "PUSH") return "调度推送"
  return "未知模式"
}

const handleClickOutside = (event: Event) => {
  if (
    showDropdown.value &&
    containerRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    closeDropdown()
  }
}

watch(
  () => serviceModel.value,
  async (service, previousService) => {
    if (service !== previousService && previousService !== undefined && !selectingOption.value) {
      handlerModel.value = ""
      emit("handlerChange", null)
    }
    const executor = await resolveExecutor(service)
    emit("serviceChange", executor)
  },
  { immediate: true }
)

watch(
  () => handlerModel.value,
  () => {
    if (!handlerModel.value) return
    const handler = selectedExecutor.value?.handlers?.find((item) => item.name === handlerModel.value) || null
    emit("handlerChange", handler)
  },
  { immediate: true }
)

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
})

defineExpose({
  selectedExecutor,
  options
})
</script>

<style scoped lang="scss">
.executor-picker {
  position: relative;
  width: 100%;
}

.picker-input-box {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 11px;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

  &:hover {
    border-color: #c0c4cc;
  }
}

.executor-picker.variant-fancy .picker-input-box {
  min-height: 42px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.executor-picker.variant-simple .picker-input-box {
  min-height: 32px;
}

.executor-picker.is-disabled .picker-input-box {
  color: #a8abb2;
  background: #f5f7fa;
  border-color: #e4e7ed;
  cursor: not-allowed;
}

.selected-single {
  display: flex;
  min-width: 0;
  align-items: center;
  flex: 1;
}

.executor-icon,
.handler-icon,
.group-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #606266;
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-weight: 700;
}

.executor-icon,
.handler-icon {
  width: 28px;
  height: 28px;
  font-size: 13px;
}

.group-icon {
  width: 30px;
  height: 30px;
  font-size: 14px;
}

.selected-info,
.group-info,
.handler-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.selected-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
}

.selected-service,
.selected-handler,
.handler-name {
  overflow: hidden;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-service {
  flex: 0 1 auto;
  color: #374151;
  font-weight: 500;
}

.selected-separator {
  flex: 0 0 auto;
  color: #9ca3af;
  font-size: 13px;
}

.selected-handler {
  flex: 0 1 auto;
  color: #2563eb;
  font-weight: 600;
}

.handler-name {
  color: #606266;
}

.selected-desc,
.group-desc,
.handler-desc {
  overflow: hidden;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placeholder-text {
  overflow: hidden;
  color: #a8abb2;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  color: #a8abb2;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: #a8abb2;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.picker-arrow {
  font-size: 14px;
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(180deg);
  }
}

.loading-icon {
  color: #409eff;
  font-size: 14px;
  animation: executor-picker-rotate 1s linear infinite;
}

@keyframes executor-picker-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
.executor-picker-dropdown {
  display: flex;
  max-height: 420px;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.executor-picker-dropdown .search-section {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.executor-picker-dropdown .search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.executor-picker-dropdown .search-icon {
  position: absolute;
  left: 12px;
  z-index: 1;
  color: #94a3b8;
  font-size: 16px;
}

.executor-picker-dropdown .search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  color: #1e293b;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  outline: none;
  font-size: 13px;
}

.executor-picker-dropdown .search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.06);
}

.executor-picker-dropdown .items-list {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
}

.executor-picker-dropdown .items-list.is-loading {
  min-height: 180px;
}

.executor-picker-dropdown .empty-state {
  padding: 32px 16px;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.executor-picker-dropdown .executor-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
}

.executor-picker-dropdown .group-info {
  flex: 1;
  min-width: 0;
}

.executor-picker-dropdown .group-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  color: #1e293b;
  font-size: 13px;
  font-weight: 700;
}

.executor-picker-dropdown .group-meta {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.executor-picker-dropdown .mode-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;

  &.is-pull {
    color: #2563eb;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
  }

  &.is-push {
    color: #b45309;
    background: #fffbeb;
    border: 1px solid #fde68a;
  }

  &.is-unknown {
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
}

.executor-picker-dropdown .node-count {
  color: #94a3b8;
  font-size: 12px;
  white-space: nowrap;
}

.executor-picker-dropdown .handler-option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 10px 56px;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.executor-picker-dropdown .handler-option:hover,
.executor-picker-dropdown .handler-option.is-selected {
  background: #f8fafc;
}

.executor-picker-dropdown .selected-check {
  flex-shrink: 0;
  color: #3b82f6;
  font-size: 16px;
}

.executor-picker-dropdown .dropdown-footer {
  display: flex;
  justify-content: center;
  padding: 8px 16px;
  color: #94a3b8;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
}
</style>
