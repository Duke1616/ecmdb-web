/** 统一处理 Cookie */

import CacheKey from "@@/constants/cache-key"
import Cookies from "js-cookie"

const TOKEN_COOKIE_OPTIONS: Cookies.CookieAttributes = { path: "/" }

function getCookieDomainCandidates() {
  if (typeof window === "undefined") return []

  const hostname = window.location.hostname
  if (!hostname || hostname === "localhost" || /^[\d.]+$/.test(hostname)) return []

  const parts = hostname.split(".")
  const domains = new Set<string>()

  for (let index = 0; index <= parts.length - 2; index++) {
    const domain = parts.slice(index).join(".")
    domains.add(domain)
    domains.add(`.${domain}`)
  }

  return Array.from(domains)
}

export const getToken = () => {
  return Cookies.get(CacheKey.TOKEN)
}

export const setToken = (token: string) => {
  Cookies.set(CacheKey.TOKEN, token, TOKEN_COOKIE_OPTIONS)
}

export const removeToken = () => {
  const paths = ["/", "/api", "/api/user"]
  const domains = getCookieDomainCandidates()

  Cookies.remove(CacheKey.TOKEN)
  for (const path of paths) {
    Cookies.remove(CacheKey.TOKEN, { path })
    for (const domain of domains) {
      Cookies.remove(CacheKey.TOKEN, { path, domain })
    }
  }
}
