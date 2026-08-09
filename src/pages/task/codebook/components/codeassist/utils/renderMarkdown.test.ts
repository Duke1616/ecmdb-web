import { beforeEach, describe, expect, it, vi } from "vitest"

const { sanitize } = vi.hoisted(() => ({
  sanitize: vi.fn((html: string) => html)
}))

vi.mock("dompurify", () => ({
  default: { sanitize }
}))

import { renderMarkdown } from "./renderMarkdown"

describe("renderMarkdown", () => {
  beforeEach(() => sanitize.mockClear())

  it("解析标题、列表和 YAML 代码块", () => {
    const result = renderMarkdown("### 候选文件\n\n- 可重复执行\n\n```yaml\n---\nname: nginx\n```")

    expect(result).toContain("<h3>候选文件</h3>")
    expect(result).toContain("<li>可重复执行</li>")
    expect(result).toContain('<code class="language-yaml">')
  })

  it("将生成的 HTML 交给白名单清洗器", () => {
    renderMarkdown('[链接](javascript:alert("xss"))<script>alert("xss")</script>')

    expect(sanitize).toHaveBeenCalledOnce()
    expect(sanitize).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        ALLOWED_ATTR: ["class", "href", "start", "title"]
      })
    )
  })
})
