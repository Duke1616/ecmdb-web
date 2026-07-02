import type * as codebook from "./types/codebook"
import instance from "@@/utils/service"
import { API_SERVICE } from "@@/utils/service"

/** 新增 */
export function createCodebookApi(data: codebook.createOrUpdateCodebookReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/codebook/create`,
    data: data
  })
}

/** 修改 */
export function updateCodebookApi(data: codebook.createOrUpdateCodebookReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/codebook/update`,
    data: data
  })
}

/** 列表 */
export function listCodebookApi(data: codebook.listCodebookReq) {
  return instance.post<codebook.codebooks>({
    url: `${API_SERVICE.TASK}/codebook/list`,
    data: data
  })
}

/** 子节点 */
export function childrenCodebookApi(data: codebook.childrenCodebookReq) {
  return instance.post<codebook.codebooks>({
    url: `${API_SERVICE.TASK}/codebook/children`,
    data: data
  })
}

/** 资源树 */
export function treeCodebookApi(projectId: number) {
  return instance.get<codebook.codebooks>({
    url: `${API_SERVICE.TASK}/codebook/tree/${projectId}`
  })
}

/** 详情 */
export function detailCodebookApi(id: number) {
  return instance.get<codebook.codebook>({
    url: `${API_SERVICE.TASK}/codebook/detail/${id}`
  })
}

/** 排序 */
export function sortCodebookApi(data: codebook.sortCodebookReq) {
  return instance.post<void>({
    url: `${API_SERVICE.TASK}/codebook/sort`,
    data: data
  })
}

/** 创建版本 */
export function createCodebookVersionApi(data: codebook.CreateVersionReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/codebook/version/create`,
    data: data
  })
}

/** 版本列表 */
export function listCodebookVersionsApi(data: codebook.ListVersionsReq) {
  return instance.post<codebook.codebookVersions>({
    url: `${API_SERVICE.TASK}/codebook/version/list`,
    data: data
  })
}

/** 版本详情 */
export function detailCodebookVersionApi(id: number) {
  return instance.get<codebook.CodebookVersion>({
    url: `${API_SERVICE.TASK}/codebook/version/detail/${id}`
  })
}

/** 使用版本 */
export function useCodebookVersionApi(data: codebook.UseVersionReq) {
  return instance.post<void>({
    url: `${API_SERVICE.TASK}/codebook/version/use`,
    data: data
  })
}

/** 删除 */
export function deleteCodebookApi(id: number) {
  return instance.delete<number>({
    url: `${API_SERVICE.TASK}/codebook/delete/${id}`
  })
}

/** 新增项目 */
export function createProjectApi(data: codebook.CreateProjectReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/codebook/project/create`,
    data: data
  })
}

/** 项目列表 */
export function listProjectApi(data: codebook.listCodebookReq) {
  return instance.post<codebook.projects>({
    url: `${API_SERVICE.TASK}/codebook/project/list`,
    data: data
  })
}

/** 修改项目 */
export function updateProjectApi(data: codebook.UpdateProjectReq) {
  return instance.post<number>({
    url: `${API_SERVICE.TASK}/codebook/project/update`,
    data: data
  })
}

/** 删除项目 */
export function deleteProjectApi(id: number) {
  return instance.delete<number>({
    url: `${API_SERVICE.TASK}/codebook/project/delete/${id}`
  })
}
