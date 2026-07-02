import prometheusIcon from "@/common/assets/icons/preserve-color/prometheus.svg"
import victoriaMetricsIcon from "@/common/assets/icons/preserve-color/victoria-metrics.svg"
import lokiIcon from "@/common/assets/icons/preserve-color/loki-sm.svg"

const datasourceTypeNameMap: Record<string, string> = {
  PROMETHEUS: "Prometheus",
  VICTORIA_METRICS: "VictoriaMetrics",
  LOKI: "Loki",
  VICTORIA_LOGS: "VictoriaLogs"
}

const datasourceTypeIconMap: Record<string, string> = {
  PROMETHEUS: prometheusIcon,
  VICTORIA_METRICS: victoriaMetricsIcon,
  LOKI: lokiIcon,
  VICTORIA_LOGS: lokiIcon
}

const datasourceTypeTagMap: Record<string, string> = {
  PROMETHEUS: "danger",
  VICTORIA_METRICS: "primary",
  LOKI: "success",
  VICTORIA_LOGS: "warning"
}

export const getDatasourceTypeName = (type?: string) => {
  if (!type) return "-"
  return datasourceTypeNameMap[type] || type
}

export const getDatasourceTypeIcon = (type?: string) => {
  if (!type) return prometheusIcon
  return datasourceTypeIconMap[type] || prometheusIcon
}

export const getDatasourceTypeTagType = (type?: string) => datasourceTypeTagMap[type || ""] || "info"
