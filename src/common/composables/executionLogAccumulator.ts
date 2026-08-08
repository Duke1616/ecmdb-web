import stripAnsi from "strip-ansi"

export interface ExecutionLogEntry {
  id: number
  content: string
}

/** 创建一个同时支持历史补齐和实时追加的日志累加器。 */
export function createExecutionLogAccumulator() {
  const entries = new Map<number, { raw: string; plain: string }>()
  let content = ""
  let rawContent = ""
  let visibleCursor = 0
  let fetchedCursor = 0

  const merge = (logs: ExecutionLogEntry[]) => {
    const additions = logs.filter((log) => log.id > 0 && !entries.has(log.id)).sort((a, b) => a.id - b.id)
    if (additions.length === 0) return false

    const needsRebuild = additions[0].id < visibleCursor
    for (const log of additions) {
      entries.set(log.id, { raw: log.content, plain: stripAnsi(log.content) })
    }

    if (needsRebuild) {
      const ordered = [...entries.entries()].sort(([left], [right]) => left - right)
      content = ordered.map(([, value]) => value.plain).join("\n")
      rawContent = ordered.map(([, value]) => value.raw).join("\n")
    } else {
      const appendedPlain = additions.map((log) => entries.get(log.id)?.plain || "").join("\n")
      const appendedRaw = additions.map((log) => entries.get(log.id)?.raw || "").join("\n")
      content = content ? `${content}\n${appendedPlain}` : appendedPlain
      rawContent = rawContent ? `${rawContent}\n${appendedRaw}` : appendedRaw
    }
    visibleCursor = Math.max(visibleCursor, ...additions.map((log) => log.id))
    return true
  }

  return {
    merge,
    confirmFetched(logs: ExecutionLogEntry[], maxId = 0) {
      if (logs.length > 0) {
        fetchedCursor = Math.max(fetchedCursor, maxId, ...logs.map((log) => log.id))
      }
    },
    reset() {
      entries.clear()
      content = ""
      rawContent = ""
      visibleCursor = 0
      fetchedCursor = 0
    },
    get content() {
      return content
    },
    get rawContent() {
      return rawContent
    },
    get fetchedCursor() {
      return fetchedCursor
    }
  }
}
