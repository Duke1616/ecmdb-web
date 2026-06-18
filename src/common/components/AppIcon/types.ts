export type AppIconSource = "element" | "font-awesome" | "iconfont" | "image" | "e-icon" | "empty"
export type SelectableAppIconSource = Exclude<AppIconSource, "empty" | "e-icon" | "image">

export interface AppIconOption {
  label: string
  value: string
  source: SelectableAppIconSource
  keywords?: string[]
}

export interface AppIconSourceOption {
  label: string
  value: SelectableAppIconSource | "image"
}
