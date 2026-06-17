import { computed, ref, watchEffect, type Ref } from "vue"
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

export function useTemplateUsage(allTemplates: Ref<template[]>) {
  const recentIds = ref<number[]>(readRecentIds())
  const templateById = computed(() => new Map(allTemplates.value.map((item) => [item.id, item])))

  const recentTemplates = computed(() => {
    return recentIds.value
      .map((id) => templateById.value.get(id))
      .filter((item): item is template => Boolean(item))
      .slice(0, MAX_RECENT_COUNT)
  })

  const recordTemplateUsage = (id: number) => {
    const nextIds = [id, ...recentIds.value.filter((item) => item !== id)].slice(0, MAX_RECENT_COUNT)
    recentIds.value = nextIds
    writeRecentIds(nextIds)
  }

  watchEffect(() => {
    const validIds = new Set(allTemplates.value.map((item) => item.id))
    const nextIds = recentIds.value.filter((id) => validIds.has(id))
    if (nextIds.length !== recentIds.value.length) {
      recentIds.value = nextIds
      writeRecentIds(nextIds)
    }
  })

  return {
    recentTemplates,
    recordTemplateUsage
  }
}
