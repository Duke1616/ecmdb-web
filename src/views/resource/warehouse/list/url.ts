// 替换 URL 为本地的访问地址，通过代理Minio进行访问
function getLocalMinioUrl(res: string) {
  const currentUrl = window.location.origin
  const backendUrlObj = new URL(res)
  const path = "/minio" + backendUrlObj.pathname
  return `${currentUrl}${path}${backendUrlObj.search}`
}

function decodedUrlPath(url: string) {
  const filePath = url.split("ecmdb/")[1]

  // 会有中文特殊字符，需要进行解码
  return decodeURIComponent(filePath)
}

// 统一导出
export { getLocalMinioUrl, decodedUrlPath }
