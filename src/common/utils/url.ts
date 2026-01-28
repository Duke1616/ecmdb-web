// 替换 URL 为本地的访问地址，通过代理Minio进行访问
function getLocalMinioUrl(res: string) {
  if (!res) {
    throw new Error("URL 不能为空")
  }

  const currentUrl = window.location.origin

  try {
    const backendUrlObj = new URL(res)
    const path = "/minio" + backendUrlObj.pathname
    return `${currentUrl}${path}${backendUrlObj.search}`
  } catch (error) {
    console.error("URL 解析失败:", res)
    throw new Error(`无效的 URL: ${res}`)
  }
}

function decodedUrlPath(url: string) {
  const filePath = url.split("ecmdb/")[1]

  // 会有中文特殊字符，需要进行解码
  return decodeURIComponent(filePath)
}

// 统一导出
export { getLocalMinioUrl, decodedUrlPath }
