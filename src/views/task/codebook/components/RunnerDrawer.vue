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
              <div class="search-group">
                <el-input
                  v-model="boundKeyword"
                  placeholder="搜索名称..."
                  :prefix-icon="Search"
                  clearable
                  class="premium-search"
                  @change="handleSearchBound"
                />
                <el-radio-group v-model="boundKind" class="premium-segmented" @change="handleSearchBound">
                  <el-radio-button :value="undefined">全部</el-radio-button>
                  <el-radio-button :value="Kind.KAFKA">推送模式</el-radio-button>
                  <el-radio-button :value="Kind.GRPC">调度模式</el-radio-button>
                </el-radio-group>
              </div>
              <div class="header-right">
                <el-button type="primary" :icon="Plus" class="glass-add-btn" @click="handleToCreate">新增</el-button>
                <el-button @click="handleRefresh" :icon="Refresh" circle class="subtle-refresh" />
              </div>
            </div>

            <div class="card-list-wrapper" @scroll="handleScrollBound">
              <div v-if="loading && codebookRunners.length === 0" class="empty-placeholder">
                <el-skeleton :rows="3" animated />
              </div>
              <div v-else-if="codebookRunners.length === 0" class="empty-state">
                <el-empty description="暂无绑定的执行单元" :image-size="100" />
              </div>
              <div v-else class="runner-cards">
                <div
                  v-for="item in codebookRunners"
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
                        <el-button link type="primary" :icon="Edit" @click="handleEdit(item)" />
                        <el-button link type="danger" :icon="Delete" @click="handleDelete(item)" />
                      </div>
                    </div>

                    <div class="tags-row" v-if="item.tags && item.tags.length > 0">
                      <el-tag v-for="tag in item.tags" :key="tag" size="small" class="chip-tag">{{ tag }}</el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载更多提示 -->
              <div v-if="codebookRunners.length < codebookRunnersTotal" class="load-more-indicator">
                <el-icon v-if="loading" class="is-loading"><Loading /></el-icon>
                <span v-else>向下滚动加载更多...</span>
              </div>
              <div v-else-if="codebookRunners.length > 0" class="no-more-data">没有更多数据了</div>
            </div>
          </div>

          <!-- Tab 2: 可复用配置 -->
          <div v-show="activeTab === 'fork'" class="tab-pane">
            <div class="filter-header">
              <div class="search-group">
                <el-input
                  v-model="forkKeyword"
                  placeholder="筛选名称..."
                  :prefix-icon="Search"
                  clearable
                  class="premium-search"
                  @change="handleSearchFork"
                />
                <el-radio-group v-model="forkKind" class="premium-segmented" @change="handleSearchFork">
                  <el-radio-button :value="undefined">全部</el-radio-button>
                  <el-radio-button :value="Kind.KAFKA">推送模式</el-radio-button>
                  <el-radio-button :value="Kind.GRPC">调度模式</el-radio-button>
                </el-radio-group>
              </div>
              <div class="header-right">
                <el-tooltip content="刷新列表" placement="top">
                  <el-button @click="() => handleRefreshFork()" :icon="Refresh" circle class="subtle-refresh" />
                </el-tooltip>
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
                        <el-button
                          type="primary"
                          size="small"
                          plain
                          class="reuse-btn"
                          :icon="DocumentCopy"
                          @click="handleFork(item)"
                        >
                          复用
                        </el-button>
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
import {
  Operation,
  Plus,
  Refresh,
  Edit,
  Delete,
  DocumentCopy,
  Monitor,
  Cpu,
  Search,
  Loading
} from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import CustomTabs from "@/common/components/Tabs/CustomTabs.vue"
import RunnerForm from "@/views/task/runner/form.vue"
import { useRunner } from "../composables/useRunner"
import { cloneDeep } from "lodash-es"
import { codebook } from "@/api/ticket/codebook/types/codebook"
import { runner, Kind } from "@/api/ticket/runner/types/runner"

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
  codebookRunnersTotal,
  forkableRunners,
  forkableRunnersTotal,
  loading,
  fetchCodebookRunners,
  fetchExcludeCodebookRunners,
  deleteRunner
} = useRunner()

const boundPageParams = ref({
  page: 1,
  limit: 20
})

const forkPageParams = ref({
  page: 1,
  limit: 20
})

const boundKeyword = ref("")
const forkKeyword = ref("")
const boundKind = ref<Kind>()
const forkKind = ref<Kind>()

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
  boundPageParams.value.page = 1
  forkPageParams.value.page = 1
  activeTab.value = "bound"
  // NOTE: 打开时只加载当前激活的 bound tab 数据，fork tab 按需加载
  _fetchBound(row.identifier)
}

const _fetchBound = (uid: string, isAppend: boolean = false) => {
  const offset = (boundPageParams.value.page - 1) * boundPageParams.value.limit
  fetchCodebookRunners(uid, offset, boundPageParams.value.limit, boundKeyword.value, boundKind.value, isAppend)
}

const handleSearchBound = () => {
  boundPageParams.value.page = 1
  if (currentCodebook.value) _fetchBound(currentCodebook.value.identifier)
}

const handleScrollBound = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
    if (!loading.value && codebookRunners.value.length < codebookRunnersTotal.value) {
      boundPageParams.value.page++
      if (currentCodebook.value) _fetchBound(currentCodebook.value.identifier, true)
    }
  }
}

/** 切换 tab 时按需加载对应数据 */
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  if (tabName === "bound") {
    if (currentCodebook.value) _fetchBound(currentCodebook.value.identifier)
  } else if (tabName === "fork") {
    forkPageParams.value.page = 1
    handleRefreshFork()
  }
}

const handleRefresh = () => {
  // NOTE: 刷新时只刷新当前 tab 的数据
  if (activeTab.value === "bound" && currentCodebook.value) {
    _fetchBound(currentCodebook.value.identifier)
  } else if (activeTab.value === "fork") {
    handleRefreshFork()
  }
}

const handleRefreshFork = (isAppend: boolean = false) => {
  if (currentCodebook.value) {
    const offset = (forkPageParams.value.page - 1) * forkPageParams.value.limit
    fetchExcludeCodebookRunners(
      currentCodebook.value.identifier,
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
        codebook_uid: currentCodebook.value.identifier,
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
      cloned.codebook_uid = currentCodebook.value.identifier
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
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  gap: 16px;

  .search-group {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }

  .premium-search {
    flex: 1;
    max-width: 240px;
    :deep(.el-input__wrapper) {
      box-shadow: none !important;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 8px;
      padding: 1px 12px;
      transition: all 0.2s;
      &.is-focus {
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 1px #3b82f6 !important;
      }
    }
  }

  .premium-segmented {
    :deep(.el-radio-button__inner) {
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      font-size: 13px;
      background: #f1f5f9;
      border: none !important;
      margin: 0 2px;
      border-radius: 8px !important;
      color: #64748b;
      font-weight: 500;
      transition: all 0.2s;
      box-shadow: none !important;

      &:hover {
        color: #1e293b;
      }
    }
    :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .glass-add-btn {
    border-radius: 8px;
    background: #3b82f6;
    border: none;
    font-weight: 500;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
      background: #2563eb;
      transform: translateY(-1px);
    }
  }

  .subtle-refresh {
    border: none;
    background: #f1f5f9;
    color: #64748b;
    &:hover {
      background: #e2e8f0;
      color: #3b82f6;
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
