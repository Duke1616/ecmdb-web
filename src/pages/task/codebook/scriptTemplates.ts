import type { ScriptFileType } from "./composables/useCodebookFile"

const shellTemplate = [
  "#!/usr/bin/env bash",
  "",
  "set -Eeuo pipefail",
  "",
  'args=$(<"$ETASK_ARGS_FILE")',
  "",
  "# Runner 变量已注入当前进程环境，可直接通过 $VARIABLE_NAME 读取。",
  'result_helper="${ETASK_SYSTEM_ROOT:-}/third_party/utils/want_result.sh"',
  'if [[ -f "$result_helper" ]]; then',
  '    source "$result_helper"',
  "fi",
  "",
  "main() {",
  '    echo "开始执行任务"',
  "",
  "    # TODO: 在这里编写脚本逻辑。",
  "    # 如需返回结构化结果，可在 want_result 可用时调用：",
  "    # if declare -F want_result >/dev/null; then",
  '    #     want_result "任务ID" "123"',
  "    # fi",
  "}",
  "",
  "main",
  ""
].join("\n")

const pythonTemplate = [
  "#!/usr/bin/env python3",
  "# -*- coding: utf-8 -*-",
  "",
  "import json",
  "import os",
  "",
  "from etask.third_party.base.want_result import want_result",
  "",
  "",
  "def load_json(env_name):",
  '    with open(os.environ[env_name], encoding="utf-8") as file:',
  "        return json.load(file)",
  "",
  "",
  "def main():",
  '    args = load_json("ETASK_ARGS_FILE")',
  '    variable_items = load_json("ETASK_VARIABLES_FILE")',
  '    variables = {item["key"]: item["value"] for item in variable_items}',
  "",
  '    print("开始执行任务")',
  "",
  "    # TODO: 在这里编写脚本逻辑。",
  "    # print(args)",
  '    # print(variables.get("EXAMPLE"))',
  "",
  '    want_result(status="success", message="任务执行完成")',
  "",
  "",
  'if __name__ == "__main__":',
  "    main()",
  ""
].join("\n")

const templates: Partial<Record<ScriptFileType, string>> = {
  sh: shellTemplate,
  py: pythonTemplate
}

export function getDefaultScriptCode(type: ScriptFileType) {
  return templates[type] || ""
}

export function isReplaceableScriptCode(code: string) {
  const normalized = String(code || "").trim()
  return !normalized || Object.values(templates).some((template) => template?.trim() === normalized)
}
