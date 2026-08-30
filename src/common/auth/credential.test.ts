import { beforeEach, describe, expect, it } from "vitest"
import {
  acceptCredentialResponse,
  authHeaders,
  clearCredential,
  setAccessToken,
  shouldUseBearerCredential,
  useCookieCarrier
} from "./credential"

const storage = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, String(value))
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  },
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
  get length() {
    return storage.size
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true
})

describe("credential authHeaders", () => {
  beforeEach(() => {
    storage.clear()
    clearCredential()
  })

  it("未登录或无凭证时返回空 Headers", () => {
    expect(shouldUseBearerCredential()).toBe(false)
    expect(authHeaders()).toEqual({})
  })

  it("Token 模式下且持有有效 token 时，正确注入 Authorization Bearer 凭据", () => {
    setAccessToken("test-access-token-xyz")

    expect(shouldUseBearerCredential()).toBe(true)
    expect(authHeaders()).toEqual({
      Authorization: "Bearer test-access-token-xyz"
    })
  })

  it("Cookie 模式下即使存在残留 token，也不应注入 Authorization Bearer", () => {
    setAccessToken("test-access-token-xyz")
    useCookieCarrier()

    expect(shouldUseBearerCredential()).toBe(false)
    expect(authHeaders()).toEqual({})
  })

  it("通过服务端 Header 识别为 token 模式后可正常注入", () => {
    acceptCredentialResponse(
      {
        "x-token-carrier": "token",
        "x-access-token": "server-issued-jwt"
      },
      true
    )

    expect(shouldUseBearerCredential()).toBe(true)
    expect(authHeaders()).toEqual({
      Authorization: "Bearer server-issued-jwt"
    })
  })
})
