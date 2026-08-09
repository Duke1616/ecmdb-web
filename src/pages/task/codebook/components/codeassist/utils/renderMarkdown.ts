import DOMPurify from "dompurify"
import { marked } from "marked"

const allowedTags = [
  "a",
  "blockquote",
  "br",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "li",
  "ol",
  "p",
  "pre",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul"
]

export function renderMarkdown(content: string) {
  if (!content) return ""

  const html = marked.parse(content, {
    async: false,
    breaks: true,
    gfm: true
  }) as string

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: ["class", "href", "start", "title"]
  })
}
