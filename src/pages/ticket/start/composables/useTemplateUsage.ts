import { onMounted, ref, watch } from "vue"
import { findByTemplateIdsApi } from "@/api/ticket/template"
import type { template } from "@/api/ticket/template/types/template"

const STORAGE_KEY = "ticket:start:recent-template-ids"
const MAX_RECENT_COUNT = 8

const readRecentIds = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids.filter((id) => Number.isFinite(Number(id))).map(Number) : []
  } catch {
    return []
  }
}

const writeRecentIds = (ids: number[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_RECENT_COUNT)))
}

export function useTemplateUsage() {
  const recentIds = ref<number[]>(readRecentIds())
  const recentTemplates = ref<template[]>([])

  const syncRecentTemplates = async () => {
    if (recentIds.value.length === 0) {
      recentTemplates.value = []
      return
    }

    try {
      const { data } = await findByTemplateIdsApi(recentIds.value)
      const templateMap = new Map((data.templates || []).map((item) => [item.id, item]))
      recentTemplates.value = recentIds.value
        .map((id) => templateMap.get(id))
        .filter((item): item is template => Boolean(item))
    } catch {
      recentTemplates.value = []
    }
  }

  const recordTemplateUsage = (id: number) => {
    const nextIds = [id, ...recentIds.value.filter((item) => item !== id)].slice(0, MAX_RECENT_COUNT)
    recentIds.value = nextIds
    writeRecentIds(nextIds)
  }

  watch(recentIds, syncRecentTemplates)

  onMounted(syncRecentTemplates)

  return {
    recentTemplates,
    recordTemplateUsage
  }
}
