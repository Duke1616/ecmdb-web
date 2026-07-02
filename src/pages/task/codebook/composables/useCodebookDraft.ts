import type {
  codebook,
  CodebookKind,
  CodebookScope,
  createOrUpdateCodebookReq
} from "@/api/task/codebook/types/codebook"
import { pick } from "lodash-es"

type DraftOptions = {
  projectID: number
  parentID: number
  scope: CodebookScope
  kind: CodebookKind
}

export function createCodebookDraft(options: DraftOptions): createOrUpdateCodebookReq {
  return {
    project_id: options.projectID,
    name: "",
    owner: "",
    code: "",
    parent_id: options.parentID,
    scope: options.scope,
    kind: options.kind,
    version_no: options.kind === "FILE" ? 1 : undefined,
    sort_no: 0
  }
}

export function draftToCodebook(req: createOrUpdateCodebookReq, root: codebook, fallbackProjectID: number): codebook {
  return {
    ...root,
    ...pick(req, ["name", "owner", "code", "sort_no"]),
    id: req.id ?? 0,
    project_id: req.project_id || fallbackProjectID,
    parent_id: req.parent_id ?? 0,
    scope: (req.scope || "TENANT") as CodebookScope,
    kind: (req.kind || "FILE") as CodebookKind,
    sort_no: req.sort_no ?? 0
  }
}

export function codebookToMetaPayload(row: codebook, projectID: number): createOrUpdateCodebookReq {
  return {
    ...pick(row, ["name", "owner", "code", "parent_id", "scope", "kind", "sort_no"]),
    id: row.id || undefined,
    project_id: row.project_id || projectID
  }
}

export function activeFileToPayload(row: codebook, projectID: number): createOrUpdateCodebookReq {
  return {
    ...pick(row, ["name", "owner", "code", "parent_id", "scope", "sort_no"]),
    id: row.id || undefined,
    project_id: projectID,
    kind: "FILE",
    version_no: row.id ? undefined : 1
  }
}
