// WebSocket 文件上传 - 重写版本

interface UploadProgress {
  bytesUploaded: number
  bytesTotal: number
  sftpWritten?: number
  sftpPercent?: string
}

interface UploadSuccessData {
  [key: string]: unknown
}

type ProgressCallback = (progress: UploadProgress) => void
type SuccessCallback = (data: UploadSuccessData) => void
type ErrorCallback = (error: Error) => void

export class WebSocketUploader {
  private wsServer: string
  private finderId: number
  private chunkSize: number
  private _progressIntervalMs: number

  constructor(wsServer: string, finderId: number) {
    this.wsServer = wsServer
    this.finderId = finderId
    // 提升到 256KB，减少主线程事件与 JSON 开销（后端每 ~64KB 报告一次写入进度）
    this.chunkSize = 256 * 1024 // 256KB
    this._progressIntervalMs = 1000 // 进度节流间隔（1s 同步）
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: ProgressCallback,
    onSuccess?: SuccessCallback,
    onError?: ErrorCallback
  ): Promise<UploadSuccessData> {
    // 确保 file 是 File 对象
    if (!(file instanceof File)) {
      const error = new Error("File must be a File object")
      if (onError) onError(error)
      return Promise.reject(error)
    }

    return new Promise((resolve, reject) => {
      const wsURL = `${this.wsServer}/api/cmdb/finder/upload/ws?id=${this.finderId}`
      const ws = new WebSocket(wsURL)
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // 发送阶段的进度节流器
      let _lastEmit = 0
      const emitSendingProgress = (bytes: number) => {
        const now = Date.now()
        if (now - _lastEmit < this._progressIntervalMs) return
        _lastEmit = now
        if (onProgress) {
          onProgress({
            bytesUploaded: bytes,
            bytesTotal: file.size
          })
        }
      }

      ws.onopen = () => {
        // 发送开始消息
        ws.send(
          JSON.stringify({
            type: "start",
            id: uploadId,
            fileName: file.name,
            path: path,
            size: file.size
          })
        )

        // 开始读取文件并发送
        this.readAndSendFile(ws, file, uploadId, (bytes) => {
          emitSendingProgress(bytes)
        })
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)

          if (msg.type === "progress") {
            // SFTP 写入进度
            const total = Number(msg.size) || Number(file.size) || 0
            const sftpWritten = Number(msg.sftpWritten) || 0
            const offset = Number(msg.offset) || 0 // 已接收
            const sftpPercent = total > 0 ? ((sftpWritten / total) * 100).toFixed(2) : "0.00"

            if (onProgress) {
              onProgress({
                // 已发送/已接收（客户端->服务端）
                bytesUploaded: offset,
                bytesTotal: total,
                // 已写入远端（服务端->SFTP）
                sftpWritten: sftpWritten,
                sftpPercent: sftpPercent
              })
            }
          } else if (msg.type === "success") {
            ws.close()
            if (onSuccess) {
              onSuccess(msg.data)
            }
            resolve(msg.data)
          } else if (msg.type === "error") {
            console.error(`[WebSocket上传] 上传失败: ${msg.error || "未知错误"}`)
            ws.close()
            const error = new Error(msg.error || "上传失败")
            if (onError) onError(error)
            reject(error)
          }
        } catch (err) {
          console.error(`[WebSocket上传] 解析服务器消息失败:`, err)
          ws.close()
          const errorMessage = err instanceof Error ? err.message : String(err)
          const error = new Error("解析服务器消息失败: " + errorMessage)
          if (onError) onError(error)
          reject(error)
        }
      }

      ws.onerror = () => {
        console.error(`[WebSocket上传] WebSocket 错误`)
        ws.close()
        const error = new Error("WebSocket 连接错误")
        if (onError) onError(error)
        reject(error)
      }

      ws.onclose = (event) => {
        // 1000: 正常关闭
        // 1005: 没有状态码（通常表示正常关闭，浏览器没有提供状态码，常见于上传完成后）
        // 只记录异常关闭的情况
        if (event.code !== 1000 && event.code !== 1005) {
          console.warn(`[WebSocket上传] 连接异常关闭: code=${event.code}, reason=${event.reason || "无原因"}`)
        }
      }
    })
  }

  private readAndSendFile(ws: WebSocket, file: File, uploadId: string, onProgress?: (bytes: number) => void): void {
    const reader = new FileReader()
    let offset = 0

    const readNextChunk = () => {
      if (offset >= file.size) {
        // 文件读取完成，发送结束消息
        ws.send(
          JSON.stringify({
            type: "end",
            id: uploadId
          })
        )
        return
      }

      const chunk = file.slice(offset, offset + this.chunkSize)

      reader.onload = (e) => {
        const result = e.target?.result
        if (!result || !(result instanceof ArrayBuffer)) {
          return
        }
        const arrayBuffer = result
        const bytes = new Uint8Array(arrayBuffer)

        // 转换为 base64
        let binary = ""
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)

        // 发送数据块
        ws.send(
          JSON.stringify({
            type: "chunk",
            id: uploadId,
            data: base64
          })
        )

        offset += arrayBuffer.byteLength

        // 更新进度
        if (onProgress) {
          onProgress(offset)
        }

        // 继续读取下一块
        setTimeout(readNextChunk, 0)
      }

      reader.onerror = (error) => {
        console.error(`[WebSocket上传] 读取文件块失败:`, error)
        const errorMessage = error instanceof Error ? error.message : "未知错误"
        ws.send(
          JSON.stringify({
            type: "error",
            id: uploadId,
            error: "读取文件失败: " + errorMessage
          })
        )
      }

      reader.readAsArrayBuffer(chunk)
    }

    // 开始读取
    readNextChunk()
  }
}
