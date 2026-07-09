<template>
  <SectionPanel v-model:expanded="isExpanded" :label="label" panel-class="full-bleed" :required="required">
    <template #preview>
      <template v-if="managedServiceCodes.length > 0">
        {{ managedServiceCodes.length }} 个模块 /
        {{ actionMode === "all" ? "全部 API" : stmt.action.length + " 个特定操作" }}
      </template>
      <span v-else class="placeholder-text">点击配置模块权限...</span>
    </template>

    <div class="dual-pane-layout orchestrator-panel" :class="{ 'is-fullscreen': isFullscreen }">
      <aside class="pane-nav">
        <div class="pane-title">
          <span>业务模块</span>
          <div class="bulk-actions">
            <el-link type="primary" :underline="false" @click="toggleAllServices(true)">全选</el-link>
            <el-link type="info" :underline="false" @click="toggleAllServices(false)">清空</el-link>
          </div>
        </div>
        <!-- 搜索过滤栏 -->
        <div class="search-bar">
          <el-input
            v-model="searchQuery"
            placeholder="搜索模块..."
            prefix-icon="Search"
            clearable
            size="small"
            class="v4-search-input"
          />
        </div>
        <div class="pane-list scroll-area">
          <div
            v-for="s in filteredManifest"
            :key="s.code"
            class="svc-item-check"
            :class="{ is_active: managedServiceCodes.includes(s.code) }"
          >
            <el-checkbox
              :model-value="managedServiceCodes.includes(s.code)"
              @change="(checked: string | number | boolean) => handleServiceItemChange(s.code, Boolean(checked))"
            >
              <span class="name">{{ s.name }}</span>
              <span class="code">{{ s.code }}</span>
            </el-checkbox>

            <!-- 精致微型定位小按钮 -->
            <el-tooltip content="定位到右侧配置" placement="top" :show-after="200" :teleported="false">
              <el-button link class="locate-btn" @click.stop="scrollToService(s.code)">
                <el-icon><Aim /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </aside>
      <main class="pane-content">
        <div class="pane-header">
          <span class="title">操作项配置</span>
          <div class="header-actions">
            <el-radio-group :model-value="actionMode" size="small" @update:model-value="onActionModeChange">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="specific">精细化</el-radio-button>
            </el-radio-group>
            <el-divider direction="vertical" />
            <el-button type="primary" link class="fullscreen-btn" @click="toggleFullscreen">
              <el-icon class="btn-icon">
                <FullScreen />
              </el-icon>
              <span>{{ isFullscreen ? "收起" : "全屏" }}</span>
            </el-button>
          </div>
        </div>
        <!-- 搜索操作项过滤栏 -->
        <div v-if="actionMode === 'specific' && activeServices.length > 0" class="search-bar">
          <el-input
            v-model="actionSearchQuery"
            placeholder="搜索操作项(支持名称、Code码 过滤)..."
            prefix-icon="Search"
            clearable
            size="small"
            class="v4-search-input"
          />
        </div>
        <div ref="scrollAreaRef" class="pane-body scroll-area">
          <PermissionMatrix
            v-if="actionMode === 'specific' && activeServices.length > 0"
            :active-services="activeServices"
            :selected-actions="stmt.action"
            :search-query="actionSearchQuery"
            @toggle-action="onActionToggle"
            @update-actions="onActionsUpdate"
          />
          <div v-else class="empty-placeholder">
            <el-icon><Pointer /></el-icon>
            <p>
              {{ managedServiceCodes.length === 0 ? "从左侧选择业务模块" : "当前已选择整模块全量权限接入" }}
            </p>
          </div>
        </div>
      </main>
    </div>
  </SectionPanel>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue"
import { ElMessage } from "element-plus"
import { Pointer, FullScreen, Aim } from "@element-plus/icons-vue"
import SectionPanel from "./SectionPanel.vue"
import PermissionMatrix from "../PermissionMatrix.vue"
import {
  getServiceCodesFromActions,
  serviceHasMatchedAction,
  type StatementVO,
  type ManifestService
} from "../../../composables/usePolicyData"
import scrollIntoView from "scroll-into-view-if-needed"

const props = defineProps<{
  label: string
  stmt: StatementVO
  permissionManifest: ManifestService[]
  required?: boolean
}>()

const emit = defineEmits(["update:stmt"])

// 授权操作默认为展开状态，使用 v-model:expanded 与子组件同步
const isExpanded = ref(true)
const searchQuery = ref("")
const actionSearchQuery = ref("")
const isFullscreen = ref(false)
const scrollAreaRef = ref<HTMLElement>()

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = "hidden"
  } else {
    document.body.style.overflow = ""
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isFullscreen.value) {
    toggleFullscreen()
  }
}

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown)
  document.body.style.overflow = ""
})

/** 过滤后的展示列表 */
const filteredManifest = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return props.permissionManifest
  return props.permissionManifest.filter(
    (s) => s.name.toLowerCase().includes(query) || s.code.toLowerCase().includes(query)
  )
})

const patchStmt = (patch: Partial<StatementVO>) => {
  emit("update:stmt", { ...props.stmt, ...patch })
}

// --------------------------------------------------------------------------
// 授权操作（Action）相关内部逻辑，完全自我闭环，向外只派发 update:stmt
// --------------------------------------------------------------------------

// 选中的服务 codes，使用 ref 显式管理，确保在“精细化”模式下即使未选具体 Action 也能保持侧边栏勾选状态
const managedServiceCodes = ref<string[]>([])

// 实时从 stmt.action 中提取 codes，但要与 managedServiceCodes 保持同步
watch(
  [() => props.stmt.action, () => props.permissionManifest],
  ([actions, manifest]) => {
    const codesFromActions = getServiceCodesFromActions(actions, manifest)
    // 只有当 action 中出现了 managedServiceCodes 不包含的 code 时（比如全选操作），才强制同步
    const missing = codesFromActions.filter((c) => !managedServiceCodes.value.includes(c))
    if (missing.length > 0) {
      managedServiceCodes.value = [...new Set([...managedServiceCodes.value, ...codesFromActions])]
    }
  },
  { immediate: true }
)

const actionMode = computed(() => (props.stmt.action.some((a) => a.endsWith(":*")) ? "all" : "specific"))

const activeServices = computed(() =>
  props.permissionManifest.filter((s) => managedServiceCodes.value.includes(s.code))
)

const handleServiceItemChange = (code: string, checked: boolean) => {
  if (!checked) {
    // NOTE: 校验防错阻断，如果该模块下已经有勾选的具体操作项，则不允许直接取消勾选，引导用户先清空操作项
    const service = props.permissionManifest.find((pm) => pm.code === code)
    const hasSelectedActions = service
      ? serviceHasMatchedAction(props.stmt.action, service)
      : props.stmt.action.some((a) => a.startsWith(`${code}:`))
    if (hasSelectedActions) {
      const name = service ? service.name : code
      ElMessage.warning(`业务模块“${name}”下已有选中的操作项，无法取消勾选。请先清空对应操作项。`)
      return
    }

    // 正常取消勾选流程
    managedServiceCodes.value = managedServiceCodes.value.filter((c) => c !== code)
    const nextActions = props.stmt.action.filter((a) => !a.startsWith(`${code}:`))
    patchStmt({ action: nextActions })
  } else {
    // 正常勾选流程
    managedServiceCodes.value = [...new Set([...managedServiceCodes.value, code])]

    // 如果处于全选模式，新增的 service 也要补全 :*
    let nextActions = [...props.stmt.action]
    if (actionMode.value === "all") {
      nextActions = managedServiceCodes.value.map((c) => `${c}:*`)
    }
    patchStmt({ action: nextActions })
  }
}

const onActionModeChange = (val: string | number | boolean | undefined) => {
  if (String(val) === "all") {
    patchStmt({ action: managedServiceCodes.value.map((c) => `${c}:*`) })
  } else {
    patchStmt({ action: props.stmt.action.filter((a) => !a.endsWith(":*")) })
  }
}

const onActionToggle = (actionCode: string, checked: boolean) => {
  const next = checked
    ? [...new Set([...props.stmt.action, actionCode])]
    : props.stmt.action.filter((a) => a !== actionCode)
  patchStmt({ action: next })
}

const onActionsUpdate = (actions: string[]) => patchStmt({ action: actions })

/** 点击左侧服务直接定位到右侧对应的矩阵模块 */
const scrollToService = async (code: string) => {
  // 如果尚未激活该模块，则帮其勾选激活
  if (!managedServiceCodes.value.includes(code)) {
    handleServiceItemChange(code, true)
  }

  // 双重 nextTick 确保跨组件单向数据流完整同步，并渲染出新增模块的 DOM 结构
  await nextTick()
  await nextTick()

  const container = scrollAreaRef.value
  const target = container?.querySelector(`[data-svc-code="${code}"]`) as HTMLElement
  if (container && target) {
    scrollIntoView(target, {
      scrollMode: "always", // 总是执行滚动定位
      block: "start", // 对齐至局部滚动容器最上方
      inline: "nearest",
      behavior: "smooth", // 平滑滚动
      boundary: container // 限制滚动边界在局部，防止误滚外部 window 页面
    })
  }
}

/** 批量切换全场所有服务的 Actions */
const toggleAllServices = (checked: boolean) => {
  if (!checked) {
    managedServiceCodes.value = []
    patchStmt({ action: [] })
    return
  }
  const allCodes = props.permissionManifest.map((s) => s.code)
  patchStmt({ action: allCodes.map((c) => `${c}:*`) })
}
</script>

<style lang="scss" scoped>
.orchestrator-panel {
  display: flex;
  height: 480px;
  background: #fff;
  transition: all 0.25s ease-in-out;

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh !important;
    z-index: 1900;
    background: #fff;
    padding: 16px 24px 24px;
    box-sizing: border-box;
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .pane-nav {
    width: 180px;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
  }

  .pane-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .pane-title {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: bold;
    color: #475569;
    box-sizing: border-box;

    .bulk-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: normal;
      .el-link {
        font-size: 11px;
        color: #64748b;
        &:hover {
          color: #3b82f6;
        }
      }
    }
  }

  .pane-header {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 12px;
    font-weight: bold;
    color: #475569;
    box-sizing: border-box;
  }

  .search-bar {
    padding: 8px 12px;
    border-bottom: 1px solid #e2e8f0;
    :deep(.el-input__wrapper) {
      background: #f5f5f5;
      box-shadow: none !important;
      border-radius: 4px;
    }
  }

  .pane-header {
    justify-content: space-between;

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 24px;

      :deep(.el-divider--vertical) {
        margin: 0;
        border-color: #cbd5e1;
        height: 12px;
        align-self: center;
      }

      .fullscreen-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #3b82f6;
        transition: color 0.15s;
        height: 24px; /* 精确适配单选按钮组高度 */
        padding: 0 2px;
        border: none;
        background: transparent;
        line-height: 1;

        &:hover {
          color: #2563eb;
        }

        .btn-icon {
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 14px;
        }
      }
    }
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
  }

  .pane-list {
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .svc-item-check {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    transition: all 0.2s ease-in-out;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    &:hover {
      background: #f1f5f9;
      border-color: #e2e8f0;

      .locate-btn {
        opacity: 0.8;
      }
    }

    &.is_active {
      background: #eff6ff;
      border-color: #bfdbfe;
      box-shadow: 0 1px 2px 0 rgba(59, 130, 246, 0.05);

      .name {
        color: #2563eb;
      }
      .code {
        color: #3b82f6;
      }

      .locate-btn {
        color: #3b82f6;
      }
    }

    .el-checkbox {
      flex: 1;
      display: flex;
      align-items: center;
      margin-right: 0;

      :deep(.el-checkbox__label) {
        flex: 1;
        padding-left: 12px;
        line-height: 1.4;
      }
    }

    .name {
      font-size: 13px;
      font-weight: 600;
      display: block;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .code {
      font-size: 11px;
      color: #64748b;
      font-family: ui-monospace, monospace;
      font-weight: 500;
    }

    .locate-btn {
      color: #64748b;
      padding: 4px;
      font-size: 15px;
      border-radius: 4px;
      transition: all 0.2s;
      opacity: 0.3;

      &:hover {
        color: #3b82f6;
        background: #eff6ff;
        opacity: 1 !important;
      }
    }
  }

  .empty-placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #ccc;
    i {
      font-size: 40px;
    }
  }
}

.placeholder-text {
  color: #ccc;
  font-style: italic;
}
</style>
