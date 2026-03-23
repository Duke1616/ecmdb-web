import { json, jsonParseLinter } from "@codemirror/lang-json"
import { linter, lintGutter } from "@codemirror/lint"
import code from "./json.json?raw"

export default {
  language: () => [json(), linter(jsonParseLinter()), lintGutter()],
  tabSize: 2,
  code
}
