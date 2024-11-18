function formatDate(date: Date | null) {
  if (!date) {
    return ""
  }
  const month = date.getMonth() + 1 // 月份从 0 开始
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, "0") // 补零
  const minutes = date.getMinutes().toString().padStart(2, "0") // 补零
  return `${month}月${day}日 ${hours}:${minutes}`
}

export default formatDate
