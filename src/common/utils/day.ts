function formatDate(date: Date | null) {
  if (!date) {
    return ""
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${year}年${month}月${day}日 ${hours}:${minutes}`
}

function formatTimestamp(timestamp: number | string | undefined) {
  if (!timestamp) {
    return ""
  }

  const numericTimestamp = typeof timestamp === "string" ? Number(timestamp) : timestamp
  const date = new Date(numericTimestamp)

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })

  const parts = formatter.formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value || "0000"
  const month = parts.find((part) => part.type === "month")?.value || "00"
  const day = parts.find((part) => part.type === "day")?.value || "00"
  const hour = parts.find((part) => part.type === "hour")?.value || "00"
  const minute = parts.find((part) => part.type === "minute")?.value || "00"
  const second = parts.find((part) => part.type === "second")?.value || "00"

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

// 统一导出
export { formatDate, formatTimestamp }
