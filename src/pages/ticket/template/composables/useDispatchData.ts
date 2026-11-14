import { computed, ref } from "vue"
import type { ComputedRef } from "vue"
import { listRunnerByCodebookIdApi, listRunnerByIdsApi } from "@/api/task/runner/index.js"
import { listDispatchByTemplateIdApi } from "@/api/ticket/dispatch"
import { getAutomationNodesApi } from "@/api/ticket/workflow/workflow"
import type { runner } from "@/api/task/runner/types/runner.js"
import type { dispatch } from "@/api/ticket/dispatch/types/dispatch"
import type { template } from "@/api/ticket/template/types/template.js"
import type { AutomationNode } from "@/api/ticket/workflow/types/workflow"
import { collectFieldMap } from "../utils/dispatchFields"
import type { AutomationDispatchRow } from "../types"

export function useDispatchData(canView: ComputedRef<boolean>) {
  const templateData = ref<template>()
  const automationNodes = ref<AutomationNode[]>([])
  const workflowRunners = ref<runner[]>([])
  const dispatches = ref<dispatch[]>([])
  const fieldMap = new Map<string, string>()
  const loading = ref(false)

  const getCompatibleRunners = (node: AutomationNode) =>
    workflowRunners.value.filter((item) => item.codebook_id === node.codebook_id)

  const automationRows = computed<AutomationDispatchRow[]>(() =>
    automationNodes.value.flatMap((node) => {
      const runners = getCompatibleRunners(node)
      const nodeDispatches = dispatches.value
        .filter((item) => item.automation_node_id === node.id)
        .sort((left, right) => right.priority - left.priority || left.id - right.id)
      return nodeDispatches.map((dispatch) => ({
        id: `${node.id}:${dispatch.id}`,
        automationNodeId: node.id,
        dispatchId: dispatch.id,
        dispatch,
        nodeName: node.name,
        runner: workflowRunners.value.find((item) => item.id === dispatch.runner_id),
        runners
      }))
    })
  )

  const unconfiguredNodeCount = computed(() => {
    const configuredNodeIds = new Set(dispatches.value.map((item) => item.automation_node_id))
    return automationNodes.value.filter((node) => !configuredNodeIds.has(node.id)).length
  })

  const dispatchSummary = computed(() => {
    const summary = `${automationNodes.value.length} 个自动化节点 · ${dispatches.value.length} 条条件规则`
    return unconfiguredNodeCount.value > 0 ? `${summary} · ${unconfiguredNodeCount.value} 个节点未配置` : summary
  })

  const getTableSpan = ({ rowIndex, columnIndex }: { rowIndex: number; columnIndex: number }) => {
    if (columnIndex !== 0) return [1, 1]

    const rows = automationRows.value
    const currentNodeId = rows[rowIndex]?.automationNodeId
    if (!currentNodeId) return [1, 1]
    if (rowIndex > 0 && rows[rowIndex - 1]?.automationNodeId === currentNodeId) return [0, 0]

    let rowspan = 1
    while (rows[rowIndex + rowspan]?.automationNodeId === currentNodeId) rowspan += 1
    return [rowspan, 1]
  }

  const fetchAutomationNodes = async (): Promise<boolean> => {
    if (!templateData.value?.workflow_id) {
      return false
    }

    try {
      const { data } = await getAutomationNodesApi(templateData.value.workflow_id)
      automationNodes.value = (data.automation_nodes || []).filter((node) => node.id && node.codebook_id > 0)
      return automationNodes.value.length > 0
    } catch {
      automationNodes.value = []
      return false
    }
  }

  const listRunnersByAutomationNodes = async (): Promise<boolean> => {
    const runnerIds = Array.from(new Set(automationNodes.value.map((node) => node.runner_id).filter((id) => id > 0)))

    try {
      const defaultRunners = runnerIds.length > 0 ? (await listRunnerByIdsApi(runnerIds)).data.runners || [] : []
      const codebookIds = Array.from(
        new Set(automationNodes.value.map((node) => node.codebook_id).filter((id) => id > 0))
      )
      const responses = await Promise.all(codebookIds.map((codebookId) => listRunnerByCodebookIdApi(codebookId)))
      const candidates = responses.flatMap(({ data }) => data.runners || [])
      const uniqueRunners = new Map<number, runner>()
      for (const item of [...defaultRunners, ...candidates]) {
        uniqueRunners.set(item.id, item)
      }

      workflowRunners.value = Array.from(uniqueRunners.values())
      return workflowRunners.value.length > 0
    } catch {
      workflowRunners.value = []
      return false
    }
  }

  const listDispatchesByTemplate = async (): Promise<boolean> => {
    if (!templateData.value?.id) {
      dispatches.value = []
      return false
    }

    try {
      const { data } = await listDispatchByTemplateIdApi({
        template_id: templateData.value.id,
        offset: 0,
        limit: 1000
      })
      dispatches.value = data.dispatches || []
      return dispatches.value.length > 0
    } catch {
      dispatches.value = []
      return false
    }
  }

  const loadAutomationDispatchData = async () => {
    if (!templateData.value || !canView.value) return

    loading.value = true
    try {
      const hasAutomationNodes = await fetchAutomationNodes()
      if (hasAutomationNodes) {
        await listRunnersByAutomationNodes()
        await listDispatchesByTemplate()
      } else {
        workflowRunners.value = []
        dispatches.value = []
      }
    } catch {
      automationNodes.value = []
      workflowRunners.value = []
      dispatches.value = []
    } finally {
      loading.value = false
    }
  }

  const setForm = (row: template) => {
    templateData.value = row
    collectFieldMap(row.rules, fieldMap)
    loadAutomationDispatchData()
  }

  return {
    templateData,
    automationNodes,
    workflowRunners,
    fieldMap,
    loading,
    automationRows,
    dispatchSummary,
    getTableSpan,
    setForm,
    loadAutomationDispatchData
  }
}