<template>
  <div
    class="executor-picker"
    :class="[`variant-${variant}`, { 'is-disabled': disabled, 'has-value': selectedOption }]"
  >
    <div ref="containerRef" class="trigger-input-wrapper" @click="toggleDropdown">
      <el-input
        :model-value="displayValue"
        readonly
        :placeholder="placeholderText"
        :disabled="disabled"
        :size="size"
        class="premium-executor-trigger"
      >
        <template #suffix>
          <div class="input-actions-inside">
            <button v-if="selectedOption && !disabled" type="button" class="clear-btn" @click.stop="clearSelection">
              <el-icon><Close /></el-icon>
            </button>
            <el-icon v-if="inputLoading" class="loading-icon"><Loading /></el-icon>
            <el-icon class="picker-arrow" :class="{ 'is-open': showDropdown }"><ArrowDown /></el-icon>
          </div>
        </template>
      </el-input>
    </div>

    <Teleport to="body">
      <div v-if="showDropdown && !disabled" ref="dropdownRef" class="executor-picker-dropdown" @click.stop>
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
          <div v-if="options.length === 0 && !loading" class="empty-state">暂无匹配的执行节点</div>

          <template v-for="group in groupedOptions" :key="getGroupKey(group)">
            <button type="button" class="executor-group" @click="toggleExecutorGroup(group)">
              <el-icon class="group-arrow" :class="{ 'is-expanded': isGroupExpanded(group) }"><ArrowDown /></el-icon>
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
                <span class="mode-badge" :class="`is-${String(group.executor.dispatch_mode).toLowerCase()}`">
                  {{ formatMode(group.executor.dispatch_mode) }}
                </span>
                <span class="node-count">{{ group.executor.nodes?.length || 0 }} 节点</span>
              </div>
            </button>

            <template v-if="isGroupExpanded(group)">
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
          </template>
        </div>

        <div class="dropdown-footer">
          <el-pagination
            v-if="total > props.limit"
            v-model:current-page="currentPage"
            background
            small
            layout="prev, pager, next"
            :page-size="props.limit"
            :total="total"
          />
          <span v-else>{{ options.length ? "共找到 " + total + " 个执行节点" : "暂无执行节点" }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { ArrowDown, Check, Close, Loading, Search } from "@element-plus/icons-vue"
import { createPopper, type Instance as PopperInstance } from "@popperjs/core"
import {
  ResourceKind,
  ResourceDispatchMode,
  type Executor,
  type HandlerDetail,
  type Resource
} from "@/api/task/resource/type"
import { listResourcesApi } from "@/api/task/resource"

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
    limit: 10,
    servicePlaceholder: "请选择执行节点",
    handlerPlaceholder: "",
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

type ExecutorGroup = {
  executor: Executor
  options: ExecutorOption[]
}

type CapabilitySource = Resource

const showDropdown = ref(false)
const loading = ref(false)
const searchKeyword = ref("")
const activeKeyword = ref("")
const currentPage = ref(1)
const total = ref(0)
const executors = ref<Executor[]>([])
const selectedExecutor = ref<Executor | null>(null)
const containerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()
const selectingOption = ref(false)
const popperInstance = ref<PopperInstance | null>(null)
const expandedServices = ref<Set<string>>(new Set())

const placeholderText = computed(() => {
  if (!props.handlerPlaceholder) return props.servicePlaceholder
  return props.servicePlaceholder === "请选择执行器服务" && props.handlerPlaceholder === "请选择执行处理器"
    ? "请选择执行器服务 / 处理器"
    : `${props.servicePlaceholder} / ${props.handlerPlaceholder}`
})
const inputLoading = computed(() => loading.value)
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

const groupedOptions = computed<ExecutorGroup[]>(() => {
  const groups: ExecutorGroup[] = []
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
  if (!serviceModel.value || !handlerModel.value) return null
  const handler = selectedExecutor.value?.handlers?.find((item) => item.name === handlerModel.value) || {
    name: handlerModel.value,
    desc: "",
    metadata: []
  }
  return {
    service: serviceModel.value,
    executor: selectedExecutor.value,
    handler
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
  // Runner 始终保存资源池名称；Topic 只属于 Agent 资源池的传输元数据。
  name: source.name,
  desc: source.desc,
  handlers: source.handlers,
  nodes: source.nodes || [],
  dispatch_mode: source.dispatch_mode
})

const getServiceValue = (executor: Executor) => executor.name
const getGroupKey = (group: ExecutorGroup) => getServiceValue(group.executor)

const isGroupExpanded = (group: ExecutorGroup) => {
  const key = getGroupKey(group)
  return expandedServices.value.has(key) || group.options.some(isSelected)
}

const setGroupExpanded = (key: string, expanded: boolean) => {
  const next = new Set(expandedServices.value)
  if (expanded) next.add(key)
  else next.delete(key)
  expandedServices.value = next
}

const toggleExecutorGroup = (group: ExecutorGroup) => {
  const key = getGroupKey(group)
  setGroupExpanded(key, !expandedServices.value.has(key))
  void syncPopperPosition()
}

const syncExpandedGroups = () => {
  const groups = groupedOptions.value
  if (!groups.length) {
    expandedServices.value = new Set()
    return
  }

  const availableKeys = new Set(groups.map(getGroupKey))
  const next = new Set([...expandedServices.value].filter((key) => availableKeys.has(key)))

  if (activeKeyword.value.trim()) {
    groups.forEach((group) => next.add(getGroupKey(group)))
  } else if (serviceModel.value && availableKeys.has(serviceModel.value)) {
    next.add(serviceModel.value)
  }

  expandedServices.value = next
}

const listSources = async () => {
  const commonParams = {
    limit: props.limit,
    keyword: activeKeyword.value.trim(),
    offset: (currentPage.value - 1) * props.limit,
    kind: props.kind === "agent" ? ResourceKind.Agent : ResourceKind.Executor
  }

  const { data } = await listResourcesApi(commonParams)
  return {
    list: (data.resources || []).map(normalizeSource),
    total: data.total || 0
  }
}

const fetchExecutors = async () => {
  loading.value = true

  try {
    const data = await listSources()
    mergeExecutors(data.list, false)
    total.value = data.total
  } finally {
    loading.value = false
    if (showDropdown.value) await syncPopperPosition()
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
  const { data } = await listResourcesApi({
    limit: props.limit,
    keyword,
    kind: props.kind === "agent" ? ResourceKind.Agent : ResourceKind.Executor
  })
  return (data.resources || []).map(normalizeSource)
}

const waitForNextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

const syncPopperPosition = async () => {
  await nextTick()
  await waitForNextFrame()
  if (!containerRef.value || !dropdownRef.value) return

  dropdownRef.value.style.width = `${containerRef.value.offsetWidth}px`
  await popperInstance.value?.update()
}

const createPopperInstance = async () => {
  await nextTick()
  await waitForNextFrame()
  if (!containerRef.value || !dropdownRef.value) return

  dropdownRef.value.style.width = `${containerRef.value.offsetWidth}px`
  popperInstance.value?.destroy()
  popperInstance.value = createPopper(containerRef.value, dropdownRef.value, {
    placement: "bottom-start",
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 8] } },
      {
        name: "flip",
        options: {
          fallbackPlacements: ["top-start", "bottom-start"],
          padding: 12
        }
      },
      {
        name: "preventOverflow",
        options: {
          boundary: "viewport",
          padding: 12
        }
      }
    ]
  })
  await syncPopperPosition()
}

const destroyPopperInstance = () => {
  popperInstance.value?.destroy()
  popperInstance.value = null
}

const toggleDropdown = async () => {
  if (props.disabled) return
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    activeKeyword.value = searchKeyword.value.trim()
    await createPopperInstance()
    if (executors.value.length === 0) fetchExecutors()
    nextTick(() => searchInputRef.value?.focus())
  } else {
    destroyPopperInstance()
  }
}

const closeDropdown = () => {
  showDropdown.value = false
  destroyPopperInstance()
}

const emitSelectedHandler = () => {
  if (!handlerModel.value) {
    emit("handlerChange", null)
    return
  }
  const handler = selectedExecutor.value?.handlers?.find((item) => item.name === handlerModel.value) || null
  emit("handlerChange", handler)
}

const handleSearch = () => {
  const nextKeyword = searchKeyword.value.trim()
  if (activeKeyword.value && !nextKeyword) expandedServices.value = new Set()
  activeKeyword.value = nextKeyword
  if (currentPage.value !== 1) {
    currentPage.value = 1
    return
  }
  fetchExecutors()
}

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
  if (mode === ResourceDispatchMode.Pull) return "主动拉取"
  if (mode === ResourceDispatchMode.Push) return "调度推送"
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
    const isExternalChange = service !== previousService && previousService !== undefined && !selectingOption.value
    if (isExternalChange && !service) {
      handlerModel.value = ""
      emit("handlerChange", null)
    }
    const executor = await resolveExecutor(service)
    emit("serviceChange", executor)
    if (handlerModel.value) emitSelectedHandler()
  },
  { immediate: true }
)

watch(() => handlerModel.value, emitSelectedHandler, { immediate: true })

watch(groupedOptions, syncExpandedGroups, { immediate: true })

watch(currentPage, () => {
  if (showDropdown.value) fetchExecutors()
})

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
  destroyPopperInstance()
})

const displayValue = computed(() => {
  if (!selectedOption.value) return ""
  return `${selectedOption.value.service} / ${selectedOption.value.handler.name}`
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

.trigger-input-wrapper {
  width: 100%;
  cursor: pointer;
}

.premium-executor-trigger {
  cursor: pointer;

  :deep(.el-input__wrapper) {
    cursor: pointer !important;
    background-color: #ffffff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    border: 1px solid #d1d5db;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &.is-focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .el-input__inner {
      cursor: pointer !important;
      color: #1f2937;
      font-weight: 500;
    }
  }

  &.is-disabled :deep(.el-input__wrapper) {
    cursor: not-allowed !important;
    background-color: #f5f7fa;
    .el-input__inner {
      cursor: not-allowed !important;
    }
  }
}

.input-actions-inside {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a8abb2;
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
  z-index: 9999;
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
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #f8fafc;
  border: 0;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.executor-picker-dropdown .executor-group:hover {
  background: #f1f5f9;
}

.executor-picker-dropdown .group-arrow {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 14px;
  transition: transform 0.2s ease;
}

.executor-picker-dropdown .group-arrow.is-expanded {
  transform: rotate(180deg);
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
