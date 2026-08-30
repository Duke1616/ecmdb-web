import CacheKey from "@@/constants/cache-key"

export type TokenCarrier = "token" | "cookie"

const TOKEN_CARRIER_HEADER = "x-token-carrier"
const TOKEN_HEADER = "x-access-token"

function getResponseHeader(headers: Record<string, unknown> | undefined, name: string) {
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name)
  return entry?.[1]
}

function getStoredValue(key: string) {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(key)
}

function setStoredValue(key: string, value: string) {
  if (typeof localStorage !== "undefined") localStorage.setItem(key, value)
}

function removeStoredValue(key: string) {
  if (typeof localStorage !== "undefined") localStorage.removeItem(key)
}

export function getAccessToken() {
  return getStoredValue(CacheKey.ACCESS_TOKEN)
}

export function getTokenCarrier(): TokenCarrier {
  const carrier = getStoredValue(CacheKey.TOKEN_CARRIER)
  if (carrier === "token" || carrier === "cookie") return carrier
  return getAccessToken() ? "token" : "cookie"
}

export function hasCredential() {
  if (getTokenCarrier() === "token") return Boolean(getAccessToken())
  return getStoredValue(CacheKey.SESSION_ESTABLISHED) === "true"
}

export function setAccessToken(token: string) {
  const value = token.trim()
  if (!value) return
  setStoredValue(CacheKey.ACCESS_TOKEN, value)
  setStoredValue(CacheKey.TOKEN_CARRIER, "token")
}

export function useCookieCarrier() {
  removeStoredValue(CacheKey.ACCESS_TOKEN)
  setStoredValue(CacheKey.TOKEN_CARRIER, "cookie")
}

export function clearCredential() {
  removeStoredValue(CacheKey.ACCESS_TOKEN)
  removeStoredValue(CacheKey.TOKEN_CARRIER)
  removeStoredValue(CacheKey.SESSION_ESTABLISHED)
}

/**
 * The backend declares the token carrier explicitly. Cookie mode can also
 * return X-Access-Token, but it must not switch the frontend to Bearer mode.
 */
export function acceptCredentialResponse(headers: Record<string, unknown> | undefined, sessionEstablished = false) {
  const carrier = getResponseHeader(headers, TOKEN_CARRIER_HEADER)
  if (typeof carrier === "string" && carrier.trim().toLowerCase() === "token") {
    const token = getResponseHeader(headers, TOKEN_HEADER)
    if (typeof token === "string" && token.trim()) setAccessToken(token)
    return "token" as const
  }

  if (typeof carrier === "string" && carrier.trim().toLowerCase() === "cookie") {
    useCookieCarrier()
    if (sessionEstablished) setStoredValue(CacheKey.SESSION_ESTABLISHED, "true")
    return "cookie" as const
  }

  if (sessionEstablished) {
    useCookieCarrier()
    setStoredValue(CacheKey.SESSION_ESTABLISHED, "true")
  }
  return getTokenCarrier()
}

export function shouldUseBearerCredential() {
  return getTokenCarrier() === "token" && Boolean(getAccessToken())
}

/**
 * 为非 Axios 请求（例如 SSE 长连接、Fetch 流式请求）构造身份认证请求头
 *
 * 与全局 Axios 拦截器策略保持严格一致：
 * 1. 仅在服务端声明为 Token 载体模式，且本地持有有效凭据时生成 `Authorization: Bearer <token>`
 * 2. 在 Cookie 模式或凭据缺失时返回空对象，交由浏览器 Cookie 处理，避免发送畸变或空 Header
 */
export function authHeaders(): Record<string, string> {
  if (!shouldUseBearerCredential()) return {}
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
