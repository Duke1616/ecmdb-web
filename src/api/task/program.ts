export enum ProgramKind {
  INLINE = "INLINE",
  PROJECT = "PROJECT"
}

export const PROGRAM_KINDS = [ProgramKind.INLINE, ProgramKind.PROJECT] as const

const PROGRAM_KIND_LABELS: Record<ProgramKind, string> = {
  [ProgramKind.INLINE]: "当前脚本",
  [ProgramKind.PROJECT]: "完整项目"
}

export interface ProgramSpec {
  kind: ProgramKind
  inline?: InlineProgramSpec
  project?: ProjectProgramSpec
}

export interface InlineProgramSpec {
  code?: string
  codebook_id?: number
}

export interface ProjectProgramSpec {
  entry_codebook_id: number
}

/** 返回程序模式对应的界面文案。 */
export const getProgramKindLabel = (kind: ProgramKind): string => PROGRAM_KIND_LABELS[kind]

/** 将程序模式转换为选择器选项。 */
export const createProgramKindOptions = (kinds: readonly ProgramKind[]) =>
  kinds.map((kind) => ({ value: kind, label: getProgramKindLabel(kind) }))

/** 读取 Codebook 执行的程序能力；旧 Handler 未声明时按 INLINE 兼容。 */
export const resolveCodebookProgramKinds = (kinds?: readonly ProgramKind[]): ProgramKind[] => {
  if (!kinds?.length) return [ProgramKind.INLINE]
  const declared = new Set(kinds)
  return PROGRAM_KINDS.filter((kind) => declared.has(kind))
}

/** 创建指定模式的空程序配置。 */
export const createDefaultProgram = (kind: ProgramKind): ProgramSpec =>
  kind === ProgramKind.PROJECT ? { kind, project: { entry_codebook_id: 0 } } : { kind, inline: { code: "" } }

/** 校验程序配置并返回可直接展示的错误文案。 */
export const validateProgram = (program?: ProgramSpec): string | undefined => {
  if (!program) return "请选择代码来源"
  if (program.kind === ProgramKind.INLINE) {
    const hasCode = !!program.inline?.code?.trim()
    const hasFile = Number(program.inline?.codebook_id) > 0
    return hasCode === hasFile ? "请填写代码或选择脚本文件" : undefined
  }
  if (program.kind === ProgramKind.PROJECT && Number(program.project?.entry_codebook_id) <= 0) {
    return "请选择项目入口文件"
  }
  return undefined
}
