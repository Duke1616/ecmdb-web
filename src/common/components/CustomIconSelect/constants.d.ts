export interface IconItem {
  value: string
  label: string
}

export interface IconCategory {
  value: string
  label: string
  list: IconItem[]
}

export declare function iconTypeList(): IconItem[]
export declare const commonIconList: string[]
export declare const linearIconList: IconCategory[]
export declare const fillIconList: IconCategory[]
export declare const multicolorIconList: IconCategory[]
