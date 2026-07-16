<template>
  <Drawer
    v-model="visible"
    title="制品发布历史"
    :subtitle="projectName ? `管理制品库【${projectName}】的发布版本` : '查看制品发布版本'"
    :header-icon="Clock"
    size="min(960px, 100%)"
    direction="rtl"
    :show-footer="false"
    class="artifact-history-drawer"
    @closed="reset"
  >
    <template #header-actions>
      <el-tooltip content="刷新发布历史" placement="bottom" :show-after="300">
        <el-button
          class="drawer-refresh-button"
          :icon="RefreshRight"
          circle
          text
          :loading="loading"
          @click="fetchReleases"
        />
      </el-tooltip>
    </template>

    <div class="history-content">
      <DataTable
        class="history-table"
        :data="releases"
        :columns="columns"
        :loading="loading"
        :show-selection="false"
        :show-pagination="true"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        pagination-layout="total, prev, pager, next"
        :action-column-width="92"
        :table-props="tableProps"
        @current-change="changePage"
      >
        <template #version="{ index }">
          <div class="version-cell">
            <strong>v{{ versionNumber(index) }}</strong>
          </div>
        </template>

        <template #release="{ row }">
          <span class="single-line-text">{{ row.message || "无发布说明" }}</span>
        </template>

        <template #time="{ row }">
          <span class="time-text">{{ formatReleaseTime(row.ctime) }}</span>
        </template>

        <template #digest="{ row }">
          <button class="digest-button" type="button" title="复制完整摘要" @click="copyDigest(row.digest)">
            <span>{{ shortDigest(row.digest) }}</span>
            <el-icon><CopyDocument /></el-icon>
          </button>
        </template>

        <template #size="{ row }">
          <span class="size-text">{{ formatBytes(row.size) }}</span>
        </template>

        <template #actions="{ row }">
          <el-tag v-if="row.active" type="success" effect="plain" size="small">当前</el-tag>
          <AuthButton
            v-else
            :capability="capabilities.Artifact.Activate"
            disableMode
            link
            type="primary"
            :loading="activatingID === row.id"
            @click="activate(row)"
          >
            激活
          </AuthButton>
        </template>
      </DataTable>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Clock, CopyDocument, RefreshRight } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Drawer } from "@/common/components/Dialogs"
import DataTable from "@/common/components/DataTable/index.vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { formatTimestamp } from "@/common/utils/day"
import { activateArtifactApi, listArtifactsApi } from "@/api/task/artifact"
import type { ArtifactRelease } from "@/api/task/artifact/types/artifact"
import type { Column } from "@/common/components/DataTable/types"

const props = defineProps<{
  projectId: number
  projectName: string
}>()

const emit = defineEmits<{
  activated: []
}>()

const capabilities = TASK_CAPABILITIES
const visible = ref(false)
const loading = ref(false)
const releases = ref<ArtifactRelease[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const activatingID = ref(0)

const columns: Column[] = [
  { prop: "id", label: "版本", slot: "version", align: "center", width: 100 },
  { prop: "message", label: "发布说明", slot: "release", align: "center", minWidth: 180 },
  { prop: "ctime", label: "发布时间", slot: "time", align: "center", width: 168 },
  { prop: "digest", label: "制品摘要", slot: "digest", align: "center", width: 154 },
  { prop: "size", label: "大小", slot: "size", align: "center", width: 76 }
]

const tableProps = {
  border: false,
  stripe: false,
  height: "100%",
  rowClassName: ({ row }: { row: ArtifactRelease }) => (row.active ? "is-active-release" : "")
}

/** 打开抽屉并加载第一页发布记录。 */
async function open() {
  page.value = 1
  visible.value = true
  await fetchReleases()
}

/** 加载当前页发布记录。 */
async function fetchReleases() {
  if (!props.projectId) return
  loading.value = true
  try {
    const { data } = await listArtifactsApi({
      scope: "TENANT",
      project_id: props.projectId,
      offset: (page.value - 1) * pageSize,
      limit: pageSize
    })
    releases.value = data.releases || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

/** 切换发布历史分页。 */
async function changePage(value: number) {
  page.value = value
  await fetchReleases()
}

/** 激活选中的历史制品版本。 */
async function activate(release: ArtifactRelease) {
  const version = versionLabel(release)
  try {
    await ElMessageBox.confirm(`确认激活 ${version}？之后创建的任务执行将使用该版本。`, "切换制品版本", {
      type: "warning",
      confirmButtonText: "确认激活",
      cancelButtonText: "取消"
    })
  } catch {
    return
  }

  activatingID.value = release.id
  try {
    await activateArtifactApi({
      scope: "TENANT",
      project_id: props.projectId,
      id: release.id
    })
    ElMessage.success("制品版本已切换")
    await fetchReleases()
    emit("activated")
  } finally {
    activatingID.value = 0
  }
}

/** 计算当前分页行对应的项目内连续版本号。 */
function versionNumber(index: number) {
  return Math.max(total.value - (page.value - 1) * pageSize - index, 1)
}

/** 获取发布记录在当前项目内的展示版本。 */
function versionLabel(release: ArtifactRelease) {
  const index = releases.value.findIndex((item) => item.id === release.id)
  return `v${versionNumber(Math.max(index, 0))}`
}

/** 复制完整制品摘要。 */
async function copyDigest(digest: string) {
  await navigator.clipboard.writeText(digest)
  ElMessage.success("制品摘要已复制")
}

/** 生成便于展示的短摘要。 */
function shortDigest(digest: string) {
  return digest ? digest.slice(0, 12) : "-"
}

/** 格式化制品大小。 */
function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

/** 格式化毫秒时间戳。 */
function formatReleaseTime(value: number) {
  return value > 0 ? formatTimestamp(value) : "-"
}

/** 关闭后清理抽屉状态。 */
function reset() {
  page.value = 1
  releases.value = []
  total.value = 0
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.history-content {
  display: flex;
  height: 100%;
  min-height: 0;
  padding: 18px;
  box-sizing: border-box;
  flex-direction: column;
  background: #ffffff;
}

.drawer-refresh-button {
  color: #64748b;

  &:hover {
    color: #2563eb;
    background: #eff6ff;
  }
}

.history-table {
  flex: 1 1 auto !important;
  min-height: 0;
}

.version-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;

  strong {
    color: #0f172a;
    font-size: 14px;
  }
}

.single-line-text,
.time-text {
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-text {
  color: #64748b;
  font-variant-numeric: tabular-nums;
}

.digest-button {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  gap: 6px;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  background: transparent;
  border: 0;
  font: inherit;

  &:hover {
    color: #1d4ed8;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.size-text {
  color: #475569;
  font-variant-numeric: tabular-nums;
}

.history-table :deep(.is-active-release) {
  --el-table-tr-bg-color: #f0fdf4;
}

@media (max-width: 900px) {
  .history-content {
    padding: 12px;
  }
}
</style>
