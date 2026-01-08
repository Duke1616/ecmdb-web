import type { SvgName } from "~virtual/svg-component"

// 菜单类型枚举
export enum MenuType {
  DIRECTORY = 1, // 目录
  MENU = 2, // 菜单
  BUTTON = 3 // 按钮
}

export interface menu {
  id: number
  pid: number
  type: number
  path: string
  name: string
  icon: string
  component: string
  redirect: string
  status: number
  sort: number
  meta: meta
  endpoints: endpoint[]
  children: menu[]
}

export interface meta {
  title: string
  is_hidden: boolean
  is_affix: boolean
  is_keepalive: boolean
  platforms: string[]
  icon?: SvgName
  buttons: string[]
}

export interface endpoint {
  name: string
  path: string
  method: string
  resource: string
  desc: string
}

export interface createOrUpdateMenuReq {
  id?: number
  pid?: number
  type: number
  name: string
  component: string
  redirect: string
  path: string
  sort: number
  status: number
  meta: meta
  endpoints?: endpoint[]
}

// 动作类型枚举
export enum Action {
  CREATE = 1, // 创建动作，比如 ADMIN 超级管理员自动权限录入
  WRITE = 2, // 写入动作
  DELETE = 3 // 全部删除、重新录入数据
}

// 变更端点请求
export interface ChangeEndpointsReq {
  id: number
  action: Action
  endpoints: endpoint[]
}

// 变更端点响应
export interface ChangeEndpointsResp {
  message: string
}
