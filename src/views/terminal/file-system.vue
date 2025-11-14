<template>
  <div class="wrapper">
    <vue-finder
      ref="vuefinderRef"
      id="vuefinder"
      :driver="driver"
      :config="{
        view: 'list',
        theme: 'valorite',
        fullScreen: true,
        showTreeView: true,
        showHiddenFiles: false,
        compactListView: true,
        metricUnits: true,
        showThumbnails: true,
        persist: true,
        loadingIndicator: 'linear',
        maxFileSize: '5GB'
      }"
      :custom-uploader="customUploader"
    />
    <!-- 上传面板（未最小化） -->
    <div v-if="uploadPanelVisible && !panelMinimized" class="upload-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-title">上传任务</div>
        <div class="panel-actions">
          <button class="btn" type="button" @click.stop="clearAll">清空</button>
          <button class="btn" type="button" @click.stop="minimizePanel">最小化</button>
        </div>
      </div>
      <div v-if="uploadTasks.length === 0" class="task-empty">暂无任务</div>
      <div v-for="task in uploadTasks" :key="task.id" class="task-item">
        <div class="task-row">
          <div class="task-name">{{ task.name }}</div>
          <div class="task-size">{{ formatSize(task.size) }}</div>
        </div>

        <!-- 进度条（主进度） -->
        <div class="progress-bar">
          <div
            class="progress-inner"
            :class="{ error: task.status === 'error' }"
            :style="{ width: (task.total ? Math.min(100, Math.floor((task.loaded / task.total) * 100)) : 0) + '%' }"
          />
        </div>

        <div class="status-line">
          <div>{{ formatSize(task.loaded) }} / {{ formatSize(task.total) }}</div>
          <div class="status-speed">{{ formatSize(task.speed) }}/s</div>
          <span v-if="task.status === 'success'" class="status-success">完成</span>
          <span v-if="task.status === 'error'" class="status-error">失败</span>
        </div>

        <div class="eta-line">
          <span v-if="isFinite(task.etaSeconds) && task.etaSeconds > 0">剩余 {{ formatETA(task.etaSeconds) }}</span>
        </div>
      </div>
    </div>

    <!-- 最小化圆形进度按钮 -->
    <div v-if="uploadPanelVisible && panelMinimized" class="mini-button" @click.stop="restorePanel" title="点击还原">
      <div class="mini-circle" :style="{ '--p': overallPercent + '%' }">{{ overallPercent }}%</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, type ComponentPublicInstance } from "vue"
import { RemoteDriver } from "vuefinder"
import { WebSocketUploader } from "./components/upload"
import type { PrefixConfig } from "./utils/prefix-config"
import { getPrefixConfig, formatSize, formatETA } from "./utils/prefix-config"

import { ElMessage, ElMessageBox } from "element-plus"

// Props 定义
const props = withDefaults(
  defineProps<{
    resource_id?: string
    prefix?: PrefixConfig
  }>(),
  {
    resource_id: "1"
  }
)

// 定义 Uppy 文件类型
interface UppyFile {
  id: string
  data: File
  [key: string]: unknown
}

// 定义 Uppy 实例类型
interface UppyInstance {
  on(event: "upload", callback: (fileIds: string | string[]) => void | Promise<void>): void
  getFiles(): Record<string, UppyFile>
  emit(event: string, file: UppyFile, data: unknown): void
}

// 定义 VueFinder context 类型
interface VueFinderContext {
  getTargetPath(): string
}

// 定义 VueFinder 组件实例类型
interface VueFinderInstance extends ComponentPublicInstance {
  getSelectedItems?: () => Array<{ path: string; [key: string]: unknown }>
  [key: string]: unknown
}

const vuefinderRef = ref<VueFinderInstance | null>(null)

// 配置常量
const prefixConfig = computed(() => props.prefix || getPrefixConfig())
const BASE_URL = computed(() => `${prefixConfig.value.prefix}/api/cmdb/finder`)
const FINDER_ID = computed(() => Number(props.resource_id) || 20)
const UI_UPDATE_MS = 1000 // 1s 同步一次

// 上传面板与任务列表
interface UploadTask {
  id: string
  name: string
  size: number
  loaded: number
  total: number
  status: UploadStatus
  speed: number
  etaSeconds: number
  _lastLoaded: number
  _lastTime: number
  _uiLastTs: number
  _emaSpeed: number
  _progressStarted: boolean
}
type UploadStatus = "uploading" | "success" | "error"

const uploadPanelVisible = ref(false)
const uploadTasks = ref<UploadTask[]>([])
const panelMinimized = ref(false)

const overallPercent = computed(() => {
  const tasks = uploadTasks.value
  if (!tasks.length) return 0
  let total = 0
  let loaded = 0
  for (const t of tasks) {
    const tt = Number(t.total) || 0
    const ll = Math.min(Number(t.loaded) || 0, tt)
    total += tt
    loaded += ll
  }
  if (total <= 0) return 0
  const p = Math.floor((loaded / total) * 100)
  return Math.max(0, Math.min(100, p))
})

// 扩展 RemoteDriver 以支持自定义下载（使用原生下载，支持 Range，避免内存聚合）
class CustomRemoteDriver extends RemoteDriver {
  async download(filePath: string): Promise<void> {
    try {
      const url = `${BASE_URL.value}/download?path=${encodeURIComponent(filePath)}&id=${encodeURIComponent(String(FINDER_ID.value))}`
      const link = document.createElement("a")
      link.href = url
      link.rel = "noopener noreferrer"
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("下载失败:", error)
      ElMessage.error("下载失败，请重试")
      throw error
    }
  }
}

// 使用自定义的 RemoteDriver
const driver = computed(() => {
  return new CustomRemoteDriver({
    baseURL: BASE_URL.value,
    headers: {
      "X-Finder-ID": FINDER_ID.value
    },
    retry: 0,
    url: {
      list: "/files",
      upload: "/upload",
      delete: "/delete",
      rename: "/rename",
      copy: "/copy",
      move: "/move",
      archive: "/archive",
      unarchive: "/unarchive",
      createFile: "/new_file",
      createFolder: "/new_folder",
      preview: "/preview",
      download: "/download",
      search: "/search",
      save: "/save"
    }
  })
})

// 创建 WebSocket 上传器实例
const wsUploader = computed(() => new WebSocketUploader(prefixConfig.value.wsServer, FINDER_ID.value))

// 使用 VueFinder 的 customUploader prop 配置 WebSocket 上传
// 参考: https://github.com/n1crack/vuefinder/blob/master/docs/api-reference/props.md
const customUploader = (uppy: UppyInstance, context: VueFinderContext) => {
  uppy.on("upload", async (fileIds: string | string[]) => {
    const targetPath = context.getTargetPath() || ""
    const allFiles = uppy.getFiles()

    const fileList: UppyFile[] =
      typeof fileIds === "string"
        ? allFiles[fileIds]
          ? [allFiles[fileIds]]
          : (Object.values(allFiles) as UppyFile[])
        : Array.isArray(fileIds)
          ? (fileIds.map((id) => allFiles[id]).filter(Boolean) as UppyFile[])
          : (Object.values(allFiles) as UppyFile[])

    for (const uppyFile of fileList) {
      if (!uppyFile) continue

      const file = uppyFile.data
      if (!file || !(file instanceof File)) {
        uppy.emit("upload-error", uppyFile, new Error("无效的文件对象"))
        continue
      }

      try {
        // 新建任务（必须使用 reactive，避免本地引用与数组中的代理不一致导致不更新）
        uploadPanelVisible.value = true
        const task = reactive<UploadTask>({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          loaded: 0,
          total: file.size || 0,
          status: "uploading", // uploading | success | error
          speed: 0,
          etaSeconds: Infinity,
          _lastLoaded: 0,
          _lastTime: Date.now(),
          _uiLastTs: 0,
          _emaSpeed: 0,
          _progressStarted: false
        })
        uploadTasks.value.push(task)

        await wsUploader.value.uploadFile(
          file,
          targetPath,
          (progress) => {
            const now = Date.now()
            const total = Number(progress.bytesTotal) || task.total || task.size || 0
            const sftp = Number(progress.sftpWritten) || 0

            task.total = total
            task.loaded = Math.min(sftp, total)

            // 若后端给出断点续传起点，则作为新的基线，避免历史写入影响速率
            if (
              progress &&
              typeof (progress as any).resumeFrom === "number" &&
              isFinite((progress as any).resumeFrom)
            ) {
              task._progressStarted = true
              task._lastLoaded = Number((progress as any).resumeFrom)
              task._lastTime = now
              task._uiLastTs = now
            }

            // 首次进度到来时初始化基线然后返回，下一拍再计算速率
            if (!task._progressStarted) {
              task._progressStarted = true
              task._lastLoaded = task.loaded
              task._lastTime = now
              task._uiLastTs = now
              return
            }

            // 仅在 1s 节拍或完成时刷新速度与 ETA（减少闪烁）
            if (now - task._uiLastTs >= UI_UPDATE_MS || task.loaded >= total) {
              const basisLoaded = sftp
              const dt = Math.max(0.2, (now - task._lastTime) / 1000)
              const dBytes = Math.max(0, basisLoaded - task._lastLoaded)
              const instSpeed = dBytes / dt
              const alpha = 0.3
              const ema = isFinite(instSpeed)
                ? alpha * instSpeed + (1 - alpha) * (task._emaSpeed || 0)
                : task._emaSpeed || 0
              task._emaSpeed = ema
              task.speed = Math.max(0, ema)
              const remain = Math.max(0, total - basisLoaded)
              task.etaSeconds = task.speed > 1 ? remain / task.speed : remain > 0 ? Infinity : 0

              task._lastLoaded = basisLoaded
              task._lastTime = now
              task._uiLastTs = now

              // 维持 Uppy 的进度事件（以 SFTP 写入为准）
              uppy.emit("upload-progress", uppyFile, {
                bytesUploaded: sftp,
                bytesTotal: total
              })
            }
          },
          (data) => {
            // 成功
            task.loaded = task.total
            task.speed = 0
            task.etaSeconds = 0
            task.status = "success"
            uppy.emit("upload-success", uppyFile, { status: 200, body: data })
          },
          (error) => {
            // 失败
            task.status = "error"
            task.speed = 0
            uppy.emit("upload-error", uppyFile, error)
          }
        )
      } catch (error) {
        // 失败（异常）
        const t = uploadTasks.value[uploadTasks.value.length - 1]
        if (t) {
          t.status = "error"
          t.speed = 0
        }
        uppy.emit("upload-error", uppyFile, error)
      }
    }
  })
}

// 下载处理函数
const handleDownload = async (filePath: string) => {
  await driver.value.download(filePath)
}

// 下载链接点击处理函数
const handleDownloadClick = async (event: MouseEvent) => {
  const targetElement = event.target as HTMLElement | null
  if (!targetElement) return
  const target = targetElement.closest("a")
  if (!target) return

  const href = target.getAttribute("href")
  if (!href) return

  // 检查是否是下载链接（支持新旧路径格式）
  const isDownloadLink = href.includes("/api/cmdb/finder/download") || href.includes("/api/finder/download")
  if (!isDownloadLink) return

  event.preventDefault()
  event.stopPropagation()

  try {
    // 处理相对路径和绝对路径
    let url: URL
    if (href.startsWith("http://") || href.startsWith("https://")) {
      url = new URL(href)
    } else {
      url = new URL(href, window.location.origin)
    }

    const filePath = url.searchParams.get("path")
    if (!filePath) {
      // 如果没有 path 参数，检查是否有选中的文件
      const selectedItems = vuefinderRef.value?.getSelectedItems?.() || []
      if (selectedItems.length === 0) {
        ElMessage.warning("请先选择要下载的文件")
        return
      }
      // 如果有选中的文件，下载第一个
      const firstItem = selectedItems[0]
      if (firstItem.path) {
        await handleDownload(firstItem.path)
      } else {
        console.warn("选中的文件缺少 path 属性:", firstItem)
        ElMessage.warning("无法获取文件路径")
      }
      return
    }

    await handleDownload(filePath)
  } catch (error) {
    console.error("解析下载 URL 失败:", error, href)
    // 如果 URL 解析失败，尝试从 href 中直接提取 path 参数
    const pathMatch = href.match(/[?&]path=([^&]+)/)
    if (pathMatch) {
      const filePath = decodeURIComponent(pathMatch[1])
      await handleDownload(filePath)
    } else {
      // 如果仍然无法提取，检查是否有选中的文件
      const selectedItems = vuefinderRef.value?.getSelectedItems?.() || []
      if (selectedItems.length === 0) {
        ElMessage.warning("请先选择要下载的文件")
        console.error("无法从 URL 中提取 path 参数，且没有选中的文件:", href)
        return
      }
      // 如果有选中的文件，下载第一个
      const firstItem = selectedItems[0]
      if (firstItem.path) {
        await handleDownload(firstItem.path)
      } else {
        ElMessage.warning("无法获取文件路径")
      }
    }
  }
}

onMounted(() => {
  document.addEventListener("click", handleDownloadClick, true)
})

onUnmounted(() => {
  document.removeEventListener("click", handleDownloadClick, true)
})

// 面板交互方法（避免在模板直接赋值 ref 导致错误）
const minimizePanel = () => {
  panelMinimized.value = true
}
const restorePanel = () => {
  panelMinimized.value = false
}
const clearAll = async () => {
  try {
    await ElMessageBox.confirm("确认清空所有上传任务？", "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    })
    uploadTasks.value = []
    uploadPanelVisible.value = false
    panelMinimized.value = false
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
body {
  margin: 0;
  background: #eeeeee;
}
.wrapper {
  max-width: 800px;
  margin: 80px auto;
}
.btn {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  outline: none;
}

/* 上传面板样式 */
.upload-panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 99999;
  width: 340px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  pointer-events: auto;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.panel-title {
  font-weight: 600;
}
.panel-actions {
  display: flex;
  gap: 8px;
}
.panel-actions .btn {
  margin: 0;
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.task-empty {
  color: #999;
  font-size: 13px;
}
.task-item {
  margin-bottom: 12px;
}
.task-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}
.task-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}
.task-size {
  color: #666;
}
.progress-bar {
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}
.progress-inner {
  height: 100%;
  background: #67c23a;
}
.progress-inner.error {
  background: #f56c6c;
}
.status-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  gap: 8px;
}
.status-speed {
  flex: 1;
  text-align: right;
}
.status-success {
  color: #67c23a;
}
.status-error {
  color: #f56c6c;
}
.eta-line {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 最小化圆形按钮 */
.mini-button {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 100000;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ddd;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
}
.mini-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: conic-gradient(#67c23a var(--p), #eee 0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  font-size: 12px;
  font-weight: 600;
}
</style>

<style>
.sm\:block {
  display: block !important;
}

.md\:block {
  display: block !important;
}
</style>
