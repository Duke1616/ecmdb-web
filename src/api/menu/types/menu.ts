export interface menu {
  id: number
  type: number
  name: string
  path: string
  icon: string
  component: string
  Component_path: string
  status: number
  sort: number
  meta: meta
  endpoints: endpoint[]
  children: menu[]
}

export interface meta {
  title: string
  hidden: boolean
  affix: boolean
  keepalive: boolean
  icon: string
}

export interface endpoint {
  id: number
  name: string
  path: string
  desc: string
}

export interface createOrUpdateMenuReq {
  id?: number
  pid?: number
  type: number
  component: string
  Component_path: string
  redirect: string
  name: string
  path: string
  sort: number
  status: number
  meta: meta
  endpoints: endpoint[]
}
