import type * as template from "./types/template"
import instance from "@/utils/hy_service"

/** 新增模版 */
export function createTemplateApi(data: template.createTemplateReq) {
  return instance.post<number>({
    url: "template/create",
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
export function listTemplateApi(data: template.listTemplateReq) {
  return instance.post<template.templates>({
    url: "template/list",
    data: data
  })
}
