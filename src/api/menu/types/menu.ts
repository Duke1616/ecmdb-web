export interface menu {
  id: number
  pid: number
  type: number
  path: string
  name: string
  icon: string
  component: string
  redirect: string
  component_path: string
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
  name: string
  component: string
  component_path: string
  redirect: string
  path: string
  sort: number
  status: number
  meta: meta
  endpoints: endpoint[]
}
