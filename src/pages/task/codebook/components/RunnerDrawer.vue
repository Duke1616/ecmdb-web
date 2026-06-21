<template>
  <Drawer
    v-model="visible"
    :title="drawerTitle"
    :subtitle="drawerSubtitle"
    :header-icon="Operation"
    size="35%"
    direction="rtl"
    :show-footer="isCreatingRunner"
    :close-on-cancel="false"
    cancel-button-text="返回列表"
    confirm-button-text="保存"
    @closed="onClosed"
    @cancel="handleCancel"
    @confirm="handleConfirm"
  >
    <div v-if="!isCreatingRunner" class="drawer-tabs-wrapper">
      <CustomTabs :tabs="tabList" :no-margin="true" @tab-change="handleTabChange">
        <template #default="{ activeTab }">
          <!-- Tab 1: 当前绑定 -->
          <div v-show="activeTab === 'bound'" class="tab-pane">
            <div class="filter-header">
              <div class="toolbar-main">
                <el-input
                  v-model="boundKeyword"
                  placeholder="搜索名称..."
                  :prefix-icon="Search"
                  clearable
                  class="premium-search"
                />
                <div class="header-right">
                  <AuthButton
                    type="primary"
                    :icon="Plus"
                    class="glass-add-btn"
                    :capability="capabilities.Runner.Add"
                    disableMode
                    @click="handleToCreate"
                    >新增</AuthButton
                  >
                </div>
              </div>
              <div class="toolbar-filters">
                <el-radio-group v-model="boundKind" class="premium-segmented">
                  <el-radio-button :value="undefined">全部</el-radio-button>
                  <el-radio-button :value="Kind.KAFKA">推送模式</el-radio-button>
                  <el-radio-button :value="Kind.GRPC">调度模式</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <div class="card-list-wrapper">
              <div v-if="loading && codebookRunners.length === 0" class="empty-placeholder">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="filteredCodebookRunners.length === 0" class="empty-state">
                <el-empty
                  :description="codebookRunners.length === 0 ? '暂无绑定的执行单元' : '没有匹配的执行单元'"
                  :image-size="100"
                />
              </div>
              <div v-else class="runner-cards">
                <div
                  v-for="item in filteredCodebookRunners"
                  :key="item.id"
                  class="premium-card"
                  :class="item.kind.toLowerCase()"
                >
                  <div class="card-aside">
                    <el-icon class="mode-icon">
                      <Monitor v-if="item.kind === Kind.KAFKA" />
                      <Cpu v-else />
                    </el-icon>
                  </div>
                  <div class="card-body">
                    <div class="card-top">
                      <div class="card-info">
                        <span class="card-title">{{ item.name }}</span>
                        <div class="card-meta">
                          <span class="mode-text">{{
                            item.kind === Kind.KAFKA ? "消息推送模式" : "分布式调度模式"
                          }}</span>
                          <span class="dot-separator">•</span>
                          <span class="target-summary">{{ item.target }}</span>
                          <span v-if="item.handler" class="handler-tag-mini">{{ item.handler }}</span>
                        </div>
                      </div>
                      <div class="item-actions">
                        <AuthButton
                          link
                          type="primary"
                          :icon="Edit"
                          :capability="capabilities.Runner.Edit"
                          disableMode
                          @click="handleEdit(item)"
                        />
                        <AuthButton
                          link
                          type="danger"
                          :icon="Delete"
                          :capability="capabilities.Runner.Delete"
                          disableMode
                          @click="handleDelete(item)"
                        />
                      </div>
                    </div>

                    <div class="tags-row" v-if="item.tags && item.tags.length > 0">
                      <el-tag v-for="tag in item.tags" :key="tag" size="small" class="chip-tag">{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="filteredCodebookRunners.length > 0" class="no-more-data">没有更多数据了</div>
            </div>
          </div>

          <!-- Tab 2: 可复用配置 -->
          <div v-show="activeTab === 'fork'" class="tab-pane">
            <div class="filter-header">
              <div class="toolbar-main">
                <el-input
                  v-model="forkKeyword"
                  placeholder="筛选名称..."
                  :prefix-icon="Search"
                  clearable
                  class="premium-search"
                  @change="handleSearchFork"
                />
              </div>
              <div class="toolbar-filters">
                <el-radio-group v-model="forkKind" class="premium-segmented" @change="handleSearchFork">
                  <el-radio-button :value="undefined">全部</el-radio-button>
                  <el-radio-button :value="Kind.KAFKA">推送模式</el-radio-button>
                  <el-radio-button :value="Kind.GRPC">调度模式</el-radio-button>
                </el-radio-group>
              </div>
            </div>

            <div class="card-list-wrapper" @scroll="handleScrollFork">
              <div v-if="loading && forkableRunners.length === 0" class="empty-placeholder">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="forkableRunners.length === 0" class="empty-state">
                <el-empty description="没有可供复用的执行单元" :image-size="100" />
              </div>
              <div v-else class="runner-cards">
                <div
                  v-for="item in forkableRunners"
                  :key="item.id"
                  class="premium-card fork-item"
                  :class="item.kind.toLowerCase()"
                >
                  <div class="card-aside">
                    <el-icon class="mode-icon">
                      <Monitor v-if="item.kind === Kind.KAFKA" />
                      <Cpu v-else />
                    </el-icon>
                  </div>
                  <div class="card-body">
                    <div class="card-top">
                      <div class="card-info">
                        <span class="card-title">{{ item.name }}</span>
                        <div class="card-meta">
                          <span class="mode-text">{{
                            item.kind === Kind.KAFKA ? "消息推送模式" : "分布式调度模式"
                          }}</span>
                          <span class="dot-separator">•</span>
                          <span class="target-summary">{{ item.target }}</span>
                          <span v-if="item.handler" class="handler-tag-mini">{{ item.handler }}</span>
                        </div>
                      </div>
                      <div class="item-actions">
                        <AuthButton
                          type="primary"
                          size="small"
                          plain
                          class="reuse-btn"
                          :icon="DocumentCopy"
                          :capability="capabilities.Runner.Add"
                          disableMode
                          @click="handleFork(item)"
                        >
                          复用
                        </AuthButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多提示 -->
              <div v-if="forkableRunners.length < forkableRunnersTotal" class="load-more-indicator">
                <el-icon v-if="loading" class="is-loading"><Loading /></el-icon>
                <span v-else>向下滚动加载更多...</span>
              </div>
              <div v-else-if="forkableRunners.length > 0" class="no-more-data">没有更多数据了</div>
            </div>
          </div>
        </template>
      </CustomTabs>
    </div>

    <RunnerForm v-else ref="runnerFormRef" hide-codebook-config @callback="onFormSuccess" />
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue"
import { Operation, Plus, Edit, Delete, DocumentCopy, Monitor, Cpu, Search, Loading } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import RunnerForm from "@/pages/task/runner/form.vue"
import { useRunner } from "../composables/useRunner"
import { cloneDeep } from "lodash-es"
import { codebook } from "@/api/task/codebook/types/codebook"
import { runner, Kind } from "@/api/task/runner/types/runner"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"

const capabilities = TASK_CAPABILITIES

const visible = ref(false)
const isCreatingRunner = ref(false)
const isEditRunner = ref(false)
const currentCodebook = ref<codebook | null>(null)

const tabList = [
  { name: "bound", label: "当前绑定" },
  { name: "fork", label: "复用其他单元" }
]

/** 当前激活的 tab，用于按需加载数据 */
const activeTab = ref("bound")

const runnerFormRef = ref<InstanceType<typeof RunnerForm>>()

const {
  codebookRunners,
  forkableRunners,
  forkableRunnersTotal,
  loading,
  fetchCodebookRunners,
  fetchExcludeCodebookRunners,
  deleteRunner
} = useRunner()

const forkPageParams = ref({
  page: 1,
  limit: 20
})

const boundKeyword = ref("")
const forkKeyword = ref("")
const boundKind = ref<Kind>()
const forkKind = ref<Kind>()

const filteredCodebookRunners = computed(() => {
  const keyword = boundKeyword.value.trim().toLowerCase()

  return codebookRunners.value.filter((item) => {
    if (boundKind.value && item.kind !== boundKind.value) return false
    if (!keyword) return true

    return [item.name, item.target, item.handler, item.desc, item.kind, ...(item.tags ?? [])]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(keyword))
  })
})

const drawerTitle = computed(() => {
  if (isCreatingRunner.value) {
    return isEditRunner.value
      ? `修改执行单元 -【 ${currentCodebook.value?.name} 】`
      : `配置执行单元 -【 ${currentCodebook.value?.name} 】`
  }
  return "执行单元列表"
})

const drawerSubtitle = computed(() => {
  if (isCreatingRunner.value) {
    return "为任务模版快速配置工作节点与执行参数"
  }
  return `管理模版【${currentCodebook.value?.name || ""}】下的所有执行单元`
})

const open = (row: codebook) => {
  currentCodebook.value = row
  isCreatingRunner.value = false
  isEditRunner.value = false
  visible.value = true
  forkPageParams.value.page = 1
  boundKeyword.value = ""
  boundKind.value = undefined
  activeTab.value = "bound"
  // NOTE: 打开时只加载当前激活的 bound tab 数据，fork tab 按需加载
  _fetchBound(row.id)
}

const _fetchBound = (id: number, isAppend: boolean = false) => {
  fetchCodebookRunners(id, isAppend)
}

/** 切换 tab 时按需加载对应数据 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  if (tabName === "bound") {
    if (currentCodebook.value) _fetchBound(currentCodebook.value.id)
  } else if (tabName === "fork") {
    forkPageParams.value.page = 1
    handleRefreshFork()
  }
}

const handleRefresh = () => {
  // NOTE: 刷新时只刷新当前 tab 的数据
  if (activeTab.value === "bound" && currentCodebook.value) {
    _fetchBound(currentCodebook.value.id)
  } else if (activeTab.value === "fork") {
    handleRefreshFork()
  }
}

const handleRefreshFork = (isAppend: boolean = false) => {
  if (currentCodebook.value) {
    const offset = (forkPageParams.value.page - 1) * forkPageParams.value.limit
    fetchExcludeCodebookRunners(
      currentCodebook.value.id,
      offset,
      forkPageParams.value.limit,
      forkKeyword.value,
      forkKind.value,
      isAppend
    )
  }
}

const handleSearchFork = () => {
  forkPageParams.value.page = 1
  handleRefreshFork()
}

const handleScrollFork = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
    if (!loading.value && forkableRunners.value.length < forkableRunnersTotal.value) {
      forkPageParams.value.page++
      handleRefreshFork(true)
    }
  }
}

const handleToCreate = () => {
  isCreatingRunner.value = true
  isEditRunner.value = false
  nextTick(() => {
    runnerFormRef.value?.resetForm()
    if (currentCodebook.value) {
      runnerFormRef.value?.setFrom({
        id: undefined,
        name: currentCodebook.value.name + "_执行单元",
        codebook_id: currentCodebook.value.id,
        codebook_secret: currentCodebook.value.secret,
        kind: Kind.GRPC,
        desc: "",
        tags: [],
        variables: [],
        target: "",
        handler: ""
      } as any)
    }
  })
}

const handleEdit = (row: runner) => {
  isCreatingRunner.value = true
  isEditRunner.value = true
  nextTick(() => {
    runnerFormRef.value?.setFrom(cloneDeep(row))
  })
}

const handleFork = (row: runner) => {
  isCreatingRunner.value = true
  isEditRunner.value = false
  nextTick(() => {
    runnerFormRef.value?.resetForm()
    if (currentCodebook.value) {
      const cloned = cloneDeep(row)
      delete (cloned as any).id
      // Optional: don't copy name aggressively, let it auto-generate or use a blank state
      cloned.name = ""
      cloned.codebook_id = currentCodebook.value.id
      cloned.codebook_secret = currentCodebook.value.secret
      runnerFormRef.value?.setFrom(cloned)
    }
  })
}

const handleDelete = (row: runner) => {
  deleteRunner(row, () => {
    handleRefresh()
  })
}

const handleConfirm = () => {
  runnerFormRef.value?.submitForm()
}

const onFormSuccess = () => {
  isCreatingRunner.value = false
  handleRefresh()
}

const handleCancel = () => {
  // NOTE: 无论在哪个视图，取消按鈕都只负责“返回列表”，不关闭整个 Drawer
  isCreatingRunner.value = false
  isEditRunner.value = false
}

const onClosed = () => {
  visible.value = false
  isCreatingRunner.value = false
  runnerFormRef.value?.resetForm()
  currentCodebook.value = null
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.drawer-tabs-wrapper {
  background: #f8fafc;
  height: 100%;
}

.tab-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-header {
  display: flex;
  flex-direction: column;
  padding: 12px 18px 14px;
  background: #ffffff;
  border-bottom: 1px solid #eef2f7;
  gap: 8px;

  .toolbar-main {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .toolbar-filters {
    display: flex;
    width: 100%;
  }

  .premium-search {
    flex: 1 1 auto;
    min-width: 0;

    :deep(.el-input__wrapper) {
      height: 34px;
      box-shadow: none !important;
      border: 1px solid #d8e0ec;
      background: #ffffff;
      border-radius: 7px;
      padding: 1px 11px;
      transition:
        border-color 0.18s ease,
        background-color 0.18s ease;

      &:hover {
        border-color: #c7d2e3;
      }

      &.is-focus {
        border-color: #9fb0c7;
        background: #ffffff;
        box-shadow: none !important;
      }
    }

    :deep(.el-input__inner) {
      color: #1f2937;
      font-size: 13px;
    }
  }

  .premium-segmented {
    display: flex;
    width: 100%;
    padding: 2px;
    background: #f6f8fb;
    border: 1px solid #e5e7eb;
    border-radius: 7px;

    :deep(.el-radio-button) {
      flex: 1;
    }

    :deep(.el-radio-button__inner) {
      width: 100%;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      font-size: 12px;
      background: transparent;
      border: none !important;
      margin: 0;
      border-radius: 5px !important;
      color: #64748b;
      font-weight: 600;
      transition:
        color 0.18s ease,
        background-color 0.18s ease,
        box-shadow 0.18s ease;
      box-shadow: none !important;

      &:hover {
        color: #1e293b;
      }
    }
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: #ffffff;
      color: #1f2937;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06) !important;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 8px;
  }

  .glass-add-btn {
    height: 34px;
    padding: 0 13px;
    border-radius: 7px;
    background: #2563eb;
    border-color: #2563eb;
    font-weight: 600;
    font-size: 13px;
    box-shadow: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      background: #1d4ed8;
      border-color: #1d4ed8;
    }
  }
}

@media (max-width: 560px) {
  .filter-header {
    .toolbar-main {
      flex-wrap: wrap;
    }

    .premium-search,
    .header-right {
      width: 100%;
    }

    .header-right {
      justify-content: flex-end;
    }
  }
}

.card-list-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
}

.runner-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.premium-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  padding: 16px;
  gap: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #94a3b8;
    opacity: 0.1;
  }

  &.kafka::before {
    background: #3b82f6;
    opacity: 1;
  }
  &.grpc::before {
    background: #10b981;
    opacity: 1;
  }

  &:hover {
    border-color: #cbd5e1;
    transform: scale(1.005);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
  }

  .card-aside {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    background: #f8fafc;
    border-radius: 10px;
    color: #64748b;
    flex-shrink: 0;

    .mode-icon {
      font-size: 20px;
    }
  }

  &.kafka .card-aside {
    color: #3b82f6;
    background: #eff6ff;
  }
  &.grpc .card-aside {
    color: #10b981;
    background: #ecfdf5;
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
    font-size: 12px;
    color: #64748b;

    .mode-text {
      font-weight: 500;
    }
    .dot-separator {
      color: #cbd5e1;
    }
    .target-summary {
      color: #94a3b8;
    }

    .handler-tag-mini {
      background: #ecfdf5;
      color: #10b981;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid #d1fae5;
      white-space: nowrap;
    }
  }

  .item-actions {
    display: flex;
    gap: 4px;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  &:hover .item-actions {
    opacity: 1;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .chip-tag {
      background: #f1f5f9;
      border: none;
      color: #475569;
      height: 20px;
      padding: 0 8px;
      font-size: 11px;
      border-radius: 4px;
    }
  }

  .reuse-btn {
    border-radius: 8px;
    font-weight: 500;
  }
}

.load-more-indicator,
.no-more-data {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

.is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.empty-state {
  padding: 60px 0;
}
</style>
