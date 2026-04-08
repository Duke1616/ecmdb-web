import { PromQLExtension } from "@prometheus-io/codemirror-promql"
import code from "./promql.txt?raw"

const promql = new PromQLExtension()

export default {
  language: promql.asExtension(),
  tabSize: 2,
  code
}
