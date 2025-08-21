function formatDate(date: Date | null) {
  if (!date) {
    return ""
  }

  console.log(date)
  const month = date.getMonth() + 1 // 月份从 0 开始
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0") // 补零
  const minutes = date.getMinutes().toString().padStart(2, "0") // 补零
  return `${month}月${day}日 ${hours}:${minutes}`
}

function formatTimestamp(timestamp: number | undefined) {
  if (!timestamp) {
    return ""
  }

  const date = new Date(timestamp)

  // 使用 Intl.DateTimeFormat 格式化日期
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })

  // 格式化后的结果
  const parts = formatter.formatToParts(date)

  // 提取对应的部分并拼接成需要的格式
  const month = parts.find((part) => part.type === "month")?.value || "00"
  const day = parts.find((part) => part.type === "day")?.value || "00"
  const hour = parts.find((part) => part.type === "hour")?.value || "00"
  const minute = parts.find((part) => part.type === "minute")?.value || "00"

  return `${month}月${day}日 ${hour}:${minute}`
}

// 统一导出
export { formatDate, formatTimestamp }
