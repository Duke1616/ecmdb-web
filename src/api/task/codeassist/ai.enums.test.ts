import { describe, expect, it } from "vitest"
import { AIChangeOperation, AIChangeSetStatus } from "./ai.enums"

describe("AI ChangeSet contract", () => {
  it("包含文件重命名、删除和待清理状态", () => {
    expect(AIChangeOperation.RENAME).toBe("RENAME")
    expect(AIChangeOperation.DELETE).toBe("DELETE")
    expect(AIChangeSetStatus.CLEANUP_PENDING).toBe("CLEANUP_PENDING")
  })
})
