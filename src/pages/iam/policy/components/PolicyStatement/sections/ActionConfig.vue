<template>
  <SectionPanel v-model:expanded="isExpanded" :label="label" panel-class="full-bleed" :required="required">
    <template #preview>
      <template v-if="managedServiceCodes.length > 0">
        {{ managedServiceCodes.length }} 个模块 /
        {{ actionMode === "all" ? "全部 API" : stmt.action.length + " 个特定操作" }}
      </template>
      <span v-else class="placeholder-text">点击配置模块权限...</span>
    </template>

    <div class="dual-pane-layout orchestrator-panel">
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
          <el-checkbox-group v-model="managedServiceCodes" @change="onServiceChange">
            <div
              v-for="s in filteredManifest"
              :key="s.code"
              class="svc-item-check"
              :class="{ is_active: managedServiceCodes.includes(s.code) }"
            >
              <el-checkbox :label="s.code">
                <span class="name">{{ s.name }}</span>
                <span class="code">{{ s.code }}</span>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
      </aside>
      <main class="pane-content">
        <div class="pane-header">
          <span class="title">操作项配置</span>
          <el-radio-group :model-value="actionMode" size="small" @update:model-value="onActionModeChange">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="specific">精细化</el-radio-button>
          </el-radio-group>
        </div>
        <div class="pane-body scroll-area">
          <PermissionMatrix
            v-if="actionMode === 'specific' && activeServices.length > 0"
            :active-services="activeServices"
            :selected-actions="stmt.action"
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
import { computed } from "vue"
import { Pointer } from "@element-plus/icons-vue"
import SectionPanel from "./SectionPanel.vue"
import PermissionMatrix from "../PermissionMatrix.vue"
import type { StatementVO, ManifestService } from "../../../composables/usePolicyData"

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
  () => props.stmt.action,
  (actions) => {
    const codesFromActions = actions.map((a) => a.split(":")[0])
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

const onServiceChange = (val: (string | number | boolean)[]) => {
  const newCodes = val as string[]
  const removed = managedServiceCodes.value.filter((c) => !newCodes.includes(c))

  let nextActions = [...props.stmt.action]
  removed.forEach((code) => {
    nextActions = nextActions.filter((a) => !a.startsWith(`${code}:`))
  })

  // 如果处于全选模式，新增的 service 也要补全 :*
  if (actionMode.value === "all") {
    nextActions = newCodes.map((c) => `${c}:*`)
  }

  patchStmt({ action: nextActions })
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

/** 批量切换全场所有服务的 Actions */
const toggleAllServices = (checked: boolean) => {
  if (!checked) {
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

  .pane-nav {
    width: 180px;
    border-right: 1px solid #f0f0f0;
    display: flex;
    flex-direction: column;
  }

  .pane-content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .pane-title,
  .pane-header {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
    font-size: 12px;
    font-weight: bold;
    color: #999;
    box-sizing: border-box;

    .bulk-actions {
      display: flex;
      gap: 8px;
      font-weight: normal;
      .el-link {
        font-size: 11px;
      }
    }
  }

  .search-bar {
    padding: 8px 12px;
    border-bottom: 1px solid #f0f0f0;
    :deep(.el-input__wrapper) {
      background: #f5f5f5;
      box-shadow: none !important;
      border-radius: 4px;
    }
  }

  .pane-header {
    justify-content: space-between;
  }

  .scroll-area {
    flex: 1;
    overflow-y: auto;
  }

  .svc-item-check {
    padding: 6px 12px;
    cursor: pointer;
    &:hover {
      background: #f5f5f5;
    }
    &.is_active {
      background: #e6f7ff;
      .name {
        color: #1890ff;
      }
    }
    .el-checkbox {
      width: 100%;
      display: flex;
      align-items: center;
      .el-checkbox__label {
        flex: 1;
        padding-left: 10px;
      }
    }
    .name {
      font-size: 12px;
      font-weight: 600;
      display: block;
      color: #262626;
    }
    .code {
      font-size: 10px;
      color: #bfbfbf;
      font-family: mono;
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
