import { describe, expect, it } from "vitest"
import { formatFileSize, getFileExt, getFileIconName, getFileTypeLabel, inferLanguage } from "./file"

describe("文件元信息", () => {
  const sizeCases: Array<[number, string]> = [
    [0, "0 B"],
    [1024, "1.0 KB"],
    [1024 * 1024, "1.0 MB"],
    [1024 * 1024 * 1024, "1.0 GB"]
  ]

  it.each(["deployment.yaml", "config.YML"])("识别 YAML 文件: %s", (fileName) => {
    expect(getFileExt(fileName)).toMatch(/ya?ml/)
    expect(inferLanguage(fileName)).toBe("yaml")
    expect(getFileIconName(fileName)).toBe("preserve-color/yaml")
    expect(getFileTypeLabel(fileName)).toBe("YAML")
  })

  it("为未知扩展名生成可读类型", () => {
    expect(getFileTypeLabel("inventory.ini")).toBe("INI 文件")
    expect(getFileTypeLabel("Dockerfile")).toBe("文件")
  })

  it.each(sizeCases)("格式化文件大小 %d", (size, expected) => {
    expect(formatFileSize(size)).toBe(expected)
  })
})
