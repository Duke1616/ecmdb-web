<template>
  <div class="wrapper">
    <vue-finder
      ref="vuefinderRef"
      id="vuefinder"
      :driver="driver"
      :config="{
        persist: true,
        theme: 'valorite',
        maxFileSize: '500mb',
        fullScreen: true
      }"
      :custom-uploader="customUploader"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, type ComponentPublicInstance } from "vue"
import { RemoteDriver } from "vuefinder"
import { WebSocketUploader } from "./components/upload"
import type { PrefixConfig } from "./utils/prefix-config"
import { getPrefixConfig } from "./utils/prefix-config"
import { ElMessage } from "element-plus"

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

// 扩展 RemoteDriver 以支持自定义下载
class CustomRemoteDriver extends RemoteDriver {
  private baseUrl: string

  constructor(config: { baseURL: string; [key: string]: unknown }) {
    super(config)
    this.baseUrl = config.baseURL
  }

  async download(filePath: string, fileName?: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/download?path=${encodeURIComponent(filePath)}`
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Finder-ID": String(FINDER_ID.value)
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "下载失败")
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition")
      const finalFileName = contentDisposition
        ? contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]?.replace(/['"]/g, "") ||
          fileName ||
          filePath.split("/").pop()
        : fileName || filePath.split("/").pop()

      // 下载文件
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = finalFileName || "download"
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("下载失败:", error)
      const errorMessage = error instanceof Error ? error.message : "未知错误"
      alert(`下载失败: ${errorMessage}`)
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
const wsUploader = computed(() => new WebSocketUploader(prefixConfig.value.wsServer, BASE_URL.value, FINDER_ID.value))

// 使用 VueFinder 的 customUploader prop 配置 WebSocket 上传
// 参考: https://github.com/n1crack/vuefinder/blob/master/docs/api-reference/props.md
const customUploader = (uppy: UppyInstance, context: VueFinderContext) => {
  // 监听上传事件
  uppy.on("upload", async (fileIds: string | string[]) => {
    const targetPath = context.getTargetPath() || ""
    const allFiles = uppy.getFiles()

    // 获取要上传的文件列表（保留 fallback 逻辑）
    const fileList: UppyFile[] =
      typeof fileIds === "string"
        ? allFiles[fileIds]
          ? [allFiles[fileIds]]
          : (Object.values(allFiles) as UppyFile[])
        : Array.isArray(fileIds)
          ? (fileIds.map((id) => allFiles[id]).filter(Boolean) as UppyFile[])
          : (Object.values(allFiles) as UppyFile[])

    // 使用 WebSocket 上传每个文件
    for (const uppyFile of fileList) {
      if (!uppyFile) continue

      const file = uppyFile.data
      if (!file || !(file instanceof File)) {
        uppy.emit("upload-error", uppyFile, new Error("无效的文件对象"))
        continue
      }

      try {
        await wsUploader.value.uploadFile(
          file,
          targetPath,
          (progress) => {
            uppy.emit("upload-progress", uppyFile, {
              bytesUploaded: progress.bytesUploaded,
              bytesTotal: progress.bytesTotal
            })
          },
          (data) => {
            uppy.emit("upload-success", uppyFile, {
              status: 200,
              body: data
            })
          },
          (error) => {
            uppy.emit("upload-error", uppyFile, error)
          }
        )
      } catch (error) {
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
</script>

<style lang="scss">
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
</style>
