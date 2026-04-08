import { PromQLExtension } from "codemirror-promql"
import code from "./promql.js?raw"

const promql = new PromQLExtension()

export default {
  language: promql.asExtension(),
  tabSize: 2,
  code
}
