import { describe, expect, it } from "vitest"
import {
  createDefaultProgram,
  createProgramKindOptions,
  ProgramKind,
  resolveCodebookProgramKinds,
  validateProgram
} from "./program"

describe("program helpers", () => {
  it("未声明 Handler 能力时仅兼容 INLINE", () => {
    expect(resolveCodebookProgramKinds()).toEqual([ProgramKind.INLINE])
    expect(resolveCodebookProgramKinds([])).toEqual([ProgramKind.INLINE])
  })

  it("按稳定顺序过滤 Handler 能力", () => {
    expect(resolveCodebookProgramKinds([ProgramKind.PROJECT, ProgramKind.INLINE, ProgramKind.PROJECT])).toEqual([
      ProgramKind.INLINE,
      ProgramKind.PROJECT
    ])
  })

  it("统一构造模式选项和默认配置", () => {
    expect(createProgramKindOptions([ProgramKind.PROJECT])).toEqual([{ value: ProgramKind.PROJECT, label: "完整项目" }])
    expect(createDefaultProgram(ProgramKind.INLINE)).toEqual({
      kind: ProgramKind.INLINE,
      inline: { code: "" }
    })
  })

  it("校验 INLINE 来源互斥和 PROJECT 入口", () => {
    expect(validateProgram({ kind: ProgramKind.INLINE, inline: { code: "echo ok" } })).toBeUndefined()
    expect(validateProgram({ kind: ProgramKind.INLINE, inline: { code: "echo ok", codebook_id: 1 } })).toBe(
      "请填写代码或选择脚本文件"
    )
    expect(validateProgram({ kind: ProgramKind.PROJECT, project: { entry_codebook_id: 0 } })).toBe("请选择项目入口文件")
  })
})
