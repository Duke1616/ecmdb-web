import Anser from "anser"
import { RangeSetBuilder, type Extension } from "@codemirror/state"
import { Decoration, EditorView, type DecorationSet } from "@codemirror/view"
import stripAnsi from "strip-ansi"

export interface AnsiSpan {
  from: number
  to: number
  style: string
}

export interface ParsedAnsiText {
  text: string
  spans: AnsiSpan[]
}

const palette: Record<string, string> = {
  "0, 0, 0": "#282c34",
  "187, 0, 0": "#e06c75",
  "0, 187, 0": "#98c379",
  "187, 187, 0": "#e5c07b",
  "0, 0, 187": "#61afef",
  "187, 0, 187": "#c678dd",
  "0, 187, 187": "#56b6c2",
  "255,255,255": "#abb2bf",
  "85, 85, 85": "#5c6370",
  "255, 85, 85": "#e06c75",
  "0, 255, 0": "#98c379",
  "255, 255, 85": "#e5c07b",
  "85, 85, 255": "#61afef",
  "255, 85, 255": "#c678dd",
  "85, 255, 255": "#56b6c2",
  "255, 255, 255": "#ffffff"
}

const resolveColor = (value: string) => palette[value] || `rgb(${value})`

export function parseAnsiText(value: string): ParsedAnsiText {
  const tokens = Anser.ansiToJson(value, { remove_empty: true })
  const spans: AnsiSpan[] = []
  let text = ""

  tokens.forEach((token) => {
    const content = stripAnsi(token.content)
    if (!content) return

    const from = text.length
    text += content
    const style = tokenStyle(token)
    if (style) spans.push({ from, to: text.length, style })
  })

  return { text, spans }
}

export function createAnsiDecorations(spans: AnsiSpan[]): Extension {
  const builder = new RangeSetBuilder<Decoration>()
  spans.forEach(({ from, to, style }) => {
    if (from < to) builder.add(from, to, Decoration.mark({ attributes: { style } }))
  })
  const decorations: DecorationSet = builder.finish()
  return EditorView.decorations.of(decorations)
}

function tokenStyle(token: Anser.AnserJsonEntry): string {
  const styles: string[] = []
  let foreground = token.fg_truecolor || token.fg
  let background = token.bg_truecolor || token.bg
  const inverted = Boolean((token as Anser.AnserJsonEntry & { isInverted?: boolean }).isInverted)
  if (inverted) [foreground, background] = [background || "171, 178, 191", foreground || "40, 44, 52"]

  if (foreground) styles.push(`color:${resolveColor(foreground)}`)
  if (background) styles.push(`background-color:${resolveColor(background)}`)
  if (token.decorations.includes("bold")) styles.push("font-weight:700")
  if (token.decorations.includes("dim")) styles.push("opacity:0.65")
  if (token.decorations.includes("italic")) styles.push("font-style:italic")

  const textDecorations: string[] = []
  if (token.decorations.includes("underline")) textDecorations.push("underline")
  if (token.decorations.includes("strikethrough")) textDecorations.push("line-through")
  if (textDecorations.length) styles.push(`text-decoration:${textDecorations.join(" ")}`)
  if (token.decorations.includes("hidden")) styles.push("visibility:hidden")
  return styles.join(";")
}
