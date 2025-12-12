export type TimeUnix = number

export interface QueryRange {
  datasource_id: number
  query: string
  start_time: TimeUnix
  end_time: TimeUnix
  step: number
}

export interface RetrieveResult {
  metrics: Metric[]
}

export interface Metric {
  labels: Record<string, string>
  points: Point[]
}

export interface Point {
  timestamp: number
  value: number
}
