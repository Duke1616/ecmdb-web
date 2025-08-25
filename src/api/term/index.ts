import type * as term from "./types/term"
import instance from "@/common/utils/service"

/** 建立连接 */
export function connectApi(data: term.connectReq) {
  return instance.post<number>({
    url: "term/connect",
    data: data
  })
}
