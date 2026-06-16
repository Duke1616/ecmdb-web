export interface Column {
  prop: string
  label: string
  type?: string
  flex?: number
  width?: string | number
  minWidth?: string | number
  fixed?: "left" | "right" | boolean
  align?: "left" | "center" | "right"
  showOverflowTooltip?: boolean
  slot?: string
  formatter?: (row: any, column: any, cellValue: any) => string
}

export interface Action {
  key: string
  label: string
  type?: "primary" | "success" | "warning" | "danger" | "info" | "" | "text"
  plain?: boolean
  size?: "small" | "default" | "large"
  icon?: any
  loading?: (row: any) => boolean
  disabled?: (row: any) => boolean
}
