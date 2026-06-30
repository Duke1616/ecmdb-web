// WebSocket 文件上传 - 重写版本

interface UploadProgress {
  bytesUploaded: number
  bytesTotal: number
  sftpWritten?: number
  sftpPercent?: string
  resumeFrom?: number
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
  private _startedSending: boolean

  constructor(wsServer: string, finderId: number) {
    this.wsServer = wsServer
    this.finderId = finderId
    // 提升到 256KB，减少主线程事件与 JSON 开销（后端每 ~64KB 报告一次写入进度）
    this.chunkSize = 256 * 1024 // 256KB
    this._progressIntervalMs = 1000 // 进度节流间隔（1s 同步）
    this._startedSending = false
  }

  async uploadFile(
    file: File,
    path: string,
    onProgress?: ProgressCallback,
    onSuccess?: SuccessCallback,
    onError?: ErrorCallback
  ): Promise<UploadSuccessData> {
    if (!(file instanceof File)) {
      const error = new Error("File must be a File object")
      if (onError) onError(error)
      return Promise.reject(error)
    }

    return new Promise((resolve, reject) => {
      const wsURL = `${this.wsServer}/api/cmdb/finder/upload/ws?id=${this.finderId}`
      const ws = new WebSocket(wsURL)
      const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      this._startedSending = false

      // 统一进度节流器
      let _lastEmit = 0
      let _firstServerProgress = true
      const progressState = {
        total: Number(file.size) || 0,
        uploaded: 0,
        written: 0
      }
      const emitProgress = (forceExtras?: Partial<UploadProgress>) => {
        const now = Date.now()
        if (!forceExtras && now - _lastEmit < this._progressIntervalMs) return
        _lastEmit = now
        if (onProgress) {
          const total = progressState.total || 0
          const uploaded = Math.min(progressState.uploaded || 0, total)
          const written = Math.min(progressState.written || 0, total)
          const payload: UploadProgress = {
            bytesUploaded: uploaded,
            bytesTotal: total,
            sftpWritten: written,
            sftpPercent: total > 0 ? ((written / total) * 100).toFixed(2) : "0.00"
          }
          onProgress(forceExtras ? { ...payload, ...forceExtras } : payload)
        }
      }

      ws.onopen = () => {
        this._sendJSON(ws, {
          type: "start",
          id: uploadId,
          fileName: file.name,
          path: path,
          size: file.size
        })
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === "progress") {
            progressState.total = Number(msg.size) || Number(file.size) || 0
            const sftpWritten = Number(msg.sftpWritten) || 0
            const offset = Number(msg.offset) || 0
            progressState.written = Math.max(progressState.written, sftpWritten)
            progressState.uploaded = Math.max(progressState.uploaded, offset)
            const extras = _firstServerProgress ? { resumeFrom: sftpWritten } : undefined
            emitProgress(extras)
            _firstServerProgress = false

            if (!this._startedSending) {
              this._startedSending = true
              this.readAndSendFile(ws, file, uploadId, offset, (sentBytes) => {
                progressState.uploaded = Math.max(progressState.uploaded, sentBytes)
                emitProgress()
              })
            }
          } else if (msg.type === "success") {
            ws.close()
            if (onSuccess) onSuccess(msg.data)
            resolve(msg.data)
          } else if (msg.type === "error") {
            console.error(`[WebSocket上传] 上传失败: ${msg.error || "未知错误"}`)
            ws.close()
            const error = new Error(msg.error || "上传失败")
            if (onError) onError(error)
            reject(error)
          } else {
            // 忽略未知类型
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
        if (event.code !== 1000 && event.code !== 1005) {
          console.warn(`[WebSocket上传] 连接异常关闭: code=${event.code}, reason=${event.reason || "无原因"}`)
        }
        this._startedSending = false
      }
    })
  }

  private readAndSendFile(
    ws: WebSocket,
    file: File,
    uploadId: string,
    startOffset: number,
    onSendProgress?: (bytes: number) => void
  ): void {
    const reader = new FileReader()
    let offset = Number(startOffset) || 0

    const readNextChunk = () => {
      if (!this._wsOpen(ws)) return
      // 背压：缓冲过高时稍后重试
      if (ws.bufferedAmount > this.chunkSize * 8) {
        setTimeout(readNextChunk, 50)
        return
      }
      if (offset >= file.size) {
        this._sendJSON(ws, { type: "end", id: uploadId })
        return
      }

      const chunk = file.slice(offset, offset + this.chunkSize)

      reader.onload = (e) => {
        if (!this._wsOpen(ws)) return
        const result = e.target?.result
        if (!result || !(result instanceof ArrayBuffer)) return
        const arrayBuffer = result
        const base64 = this._b64Encode(new Uint8Array(arrayBuffer))

        this._sendJSON(ws, {
          type: "chunk",
          id: uploadId,
          offset: offset,
          data: base64
        })

        offset += arrayBuffer.byteLength
        if (onSendProgress) onSendProgress(offset)
        setTimeout(readNextChunk, 0)
      }

      reader.onerror = (error) => {
        console.error(`[WebSocket上传] 读取文件块失败:`, error)
        const errorMessage = error instanceof Error ? error.message : "未知错误"
        if (this._wsOpen(ws)) {
          this._sendJSON(ws, { type: "error", id: uploadId, error: "读取文件失败: " + errorMessage })
        }
      }

      reader.readAsArrayBuffer(chunk)
    }

    readNextChunk()
  }

  private _wsOpen(ws: WebSocket): boolean {
    return ws && ws.readyState === WebSocket.OPEN
  }

  private _sendJSON(ws: WebSocket, obj: Record<string, unknown>): void {
    if (!this._wsOpen(ws)) return
    try {
      ws.send(JSON.stringify(obj))
    } catch (e) {
      console.error("[WebSocket上传] 发送失败:", e)
    }
  }

  private _b64Encode(bytes: Uint8Array): string {
    const B64_BLOCK_SIZE = 8192
    const parts: string[] = []
    for (let i = 0; i < bytes.length; i += B64_BLOCK_SIZE) {
      const sub = bytes.subarray(i, i + B64_BLOCK_SIZE)
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      parts.push(String.fromCharCode.apply(null, Array.from(sub) as unknown as number[]))
    }
    return btoa(parts.join(""))
  }
}
