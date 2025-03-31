import type * as template from "./types/template"
import instance from "@/utils/hy_service"

/** 新增模版 */
export function createTemplateApi(data: template.createOrUpdateTemplateReq) {
  return instance.post<number>({
    url: "template/create",
    data: data
  })
}

/** 修改模版 */
export function updateTemplateApi(data: template.createOrUpdateTemplateReq) {
  return instance.post<number>({
    url: "template/update",
    data: data
  })
}

/** 查看模版详情 */
export function detailTemplateApi(id: number) {
  return instance.post<template.template>({
    url: "template/detail",
    data: { id: id }
  })
}

/** 根据模版列表 */
export function listTemplateApi(data: template.PageReq) {
  return instance.post<template.templates>({
    url: "template/list",
    data: data
  })
}

/** 删除模版 */
export function deleteTemplateApi(id: number) {
  return instance.post<number>({
    url: "template/delete",
    data: { id: id }
  })
}

/** 新增模版分组 */
export function createTemplateGroupApi(data: template.createTemplateGroupReq) {
  return instance.post<number>({
    url: "template/group/create",
    data: data
  })
}

/** 根据模版列表 */
export function listTemplateGroupApi(data: template.PageReq) {
  return instance.post<template.templateGroups>({
    url: "template/group/list",
    data: data
  })
}

/** 聚合组数据查看 */
export function pipelineGroupApi() {
  return instance.post<template.templateCombinations>({
    url: "template/list/pipeline"
  })
}

/** 根据流程ID获取所有模版 */
export function getTemplateByWorkflowIdApi(workflow_id: number) {
  return instance.post<template.templates>({
    url: "template/get_by_workflow_id",
    data: { workflow_id: workflow_id }
  })
}

/** 根据流程ID获取所有模版的Rule信息 */
export function getTemplateRulesByWorkflowIdApi(workflow_id: number) {
  return instance.post<template.templateRules>({
    url: "template/rules/by_workflow_id",
    data: { workflow_id: workflow_id }
  })
}

/** 根据 ids 获取模版组 */
export function getTemplateGroupsByIdsApi(ids: number[]) {
  return instance.post<template.templateGroups>({
    url: "template/group/by_ids",
    data: { ids: ids }
  })
}
