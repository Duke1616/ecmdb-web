import { afterEach, describe, expect, it, vi } from "vitest"
import { collectFieldMap, parseTemplateRules } from "./dispatchFields"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("parseTemplateRules", () => {
  it("解析 JSON 字符串为规则数组", () => {
    const rules = JSON.stringify([{ type: "input", field: "a", title: "A" }])
    expect(parseTemplateRules(rules)).toEqual([{ type: "input", field: "a", title: "A" }])
  })

  it("原样返回数组并过滤非对象项", () => {
    expect(parseTemplateRules([{ field: "a" }, null, 1, "x"])).toEqual([{ field: "a" }])
  })

  it("非数组/非字符串返回空数组", () => {
    expect(parseTemplateRules(undefined)).toEqual([])
    expect(parseTemplateRules({})).toEqual([])
    expect(parseTemplateRules(JSON.stringify({ a: 1 }))).toEqual([])
  })

  it("非法 JSON 抛出由调用方兜底", () => {
    expect(() => parseTemplateRules("{not json")).toThrow()
  })
})

describe("collectFieldMap", () => {
  it("收集字段并优先使用 title", () => {
    const map = new Map<string, string>()
    collectFieldMap([{ type: "input", field: "name", title: "姓名" }], map)
    expect(map.get("name")).toBe("姓名")
  })

  it("title 缺省时回退字段名", () => {
    const map = new Map<string, string>()
    collectFieldMap([{ type: "input", field: "name" }], map)
    expect(map.get("name")).toBe("name")
  })

  it("排除 fcRow / col 容器但递归其子字段", () => {
    const map = new Map<string, string>()
    collectFieldMap(
      [
        {
          type: "fcRow",
          field: "row1",
          children: [
            { type: "col", field: "col1", children: [{ type: "input", field: "inner", title: "内部" }] }
          ]
        }
      ],
      map
    )
    expect(map.has("row1")).toBe(false)
    expect(map.has("col1")).toBe(false)
    expect(map.get("inner")).toBe("内部")
  })

  it("支持 JSON 字符串输入", () => {
    const map = new Map<string, string>()
    collectFieldMap(JSON.stringify([{ type: "select", field: "env", title: "环境" }]), map)
    expect(map.get("env")).toBe("环境")
  })

  it("非法 JSON 告警且不抛出、不改动 map", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const map = new Map<string, string>([["keep", "保留"]])
    expect(() => collectFieldMap("{bad", map)).not.toThrow()
    expect(warn).toHaveBeenCalled()
    expect(map.get("keep")).toBe("保留")
    expect(map.size).toBe(1)
  })

  it("非数组输入不改动 map", () => {
    const map = new Map<string, string>()
    collectFieldMap(undefined, map)
    collectFieldMap({}, map)
    expect(map.size).toBe(0)
  })

  it("向已有 map 累积写入", () => {
    const map = new Map<string, string>([["old", "旧"]])
    collectFieldMap([{ type: "input", field: "new", title: "新" }], map)
    expect(map.get("old")).toBe("旧")
    expect(map.get("new")).toBe("新")
  })
})