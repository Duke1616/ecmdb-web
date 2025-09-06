// import { python } from "@codemirror/lang-python"
import { StreamLanguage } from "@codemirror/language"
import { python } from "@codemirror/legacy-modes/mode/python"
import { autocompletion } from "@codemirror/autocomplete"
import code from "./python.py?raw"

// 写死的简单补全源
const simpleCompletionSource = (context: any) => {
  const word = context.matchBefore(/\w*/)
  if (word?.from === word?.to && !context.explicit) return null

  // 检查是否在 import 或 from 语句中
  const line = context.state.doc.lineAt(context.pos)
  const lineText = line.text
  const isImportContext = /^\s*(import|from)\s+/.test(lineText)

  if (!isImportContext) return null

  const searchText = word?.text.toLowerCase() || ""

  // 写死的模块列表
  const modules = [
    "os",
    "sys",
    "json",
    "datetime",
    "time",
    "math",
    "random",
    "re",
    "utils.helper",
    "utils.validator",
    "config.settings",
    "main"
  ]

  const options = modules
    .filter((module) => module.toLowerCase().includes(searchText))
    .map((module) => ({
      label: module,
      type: "module",
      detail: module.includes(".") ? "项目文件" : "标准库"
    }))

  return {
    from: word?.from || context.pos,
    options: options
  }
}

export default {
  language:  StreamLanguage.define(python),
  tabSize: 4,
  code,
  extensions: [
    autocompletion({
      override: [simpleCompletionSource]
    })
  ]
}
