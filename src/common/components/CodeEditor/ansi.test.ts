import { describe, expect, it } from "vitest"
import { parseAnsiText } from "./ansi"

describe("ANSI 日志解析", () => {
  it("保留文本和样式并清除所有控制序列", () => {
    const result = parseAnsiText(
      "plain \u001B[0;32mok\u001B[0m \u001B[1;31mfailed\u001B[0m\n\u001B]0;Ansible Demo\u0007PLAY RECAP"
    )

    expect(result.text).toBe("plain ok failed\nPLAY RECAP")
    expect(result.spans).toEqual([
      { from: 6, to: 8, style: "color:#98c379" },
      { from: 9, to: 15, style: "color:#e06c75;font-weight:700" }
    ])
  })

  it("支持真彩色、背景色和文本装饰", () => {
    const result = parseAnsiText("\u001B[38;2;10;20;30;48;2;40;50;60;4mvalue\u001B[0m")

    expect(result.text).toBe("value")
    expect(result.spans[0].style).toContain("color:rgb(10, 20, 30)")
    expect(result.spans[0].style).toContain("background-color:rgb(40, 50, 60)")
    expect(result.spans[0].style).toContain("text-decoration:underline")
  })
})
