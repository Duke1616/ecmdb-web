<template>
  <div class="plugin-runtime-page">
    <PluginRuntimeWorkspace v-if="useRuntimeWorkspace" :presentation="runtimeView?.presentation">
      <RuntimeContent
        :loading="loading"
        :error="error"
        :runtime-view="runtimeView"
        :component-props="componentProps"
        @retry="void loadRuntimeView()"
      />
    </PluginRuntimeWorkspace>
    <RuntimeContent
      v-else
      :loading="loading"
      :error="error"
      :runtime-view="runtimeView"
      :component-props="componentProps"
      @retry="void loadRuntimeView()"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { getPluginRuntimeViewApi } from "@/api/cmdb/plugin"
import type { PluginRuntimeView } from "@/api/cmdb/plugin/types/plugin"
import { PluginRuntimeWorkspace, RuntimeContent } from "@/common/components/PluginRuntime"

interface RuntimePageProps {
  pluginId?: string
  action?: string
  resourceId?: string | number
}

const props = defineProps<RuntimePageProps>()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)
const runtimeView = ref<PluginRuntimeView | null>(null)

const resolvedPluginId = computed(() => props.pluginId || String(route.query.plugin_id || "").trim())
const resolvedAction = computed(() => props.action || String(route.query.action || "").trim())
const resolvedResourceId = computed(() => {
  const value = props.resourceId ?? route.query.resource_id
  if (value === undefined || value === null || value === "") return 0

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
})

const handleRuntimeActionChange = (payload: { action?: string }) => {
  const action = String(payload.action || "").trim()
  if (!action || action === resolvedAction.value) return

  router.replace({
    path: route.path,
    query: {
      ...route.query,
      action
    }
  })
}

const componentProps = computed(() => {
  if (!runtimeView.value) return {}

  return {
    apiBase: runtimeView.value.runtime.api_base,
    ...runtimeView.value.runtime.props,
    onActionChange: handleRuntimeActionChange
  }
})

const useRuntimeWorkspace = computed(() => {
  if (!runtimeView.value) return false
  return runtimeView.value.presentation.layout === "workspace"
})

const loadRuntimeView = async () => {
  if (!resolvedPluginId.value) {
    runtimeView.value = null
    error.value = "缺少 plugin_id"
    return
  }

  if (!resolvedAction.value) {
    runtimeView.value = null
    error.value = "缺少 action"
    return
  }

  if (!resolvedResourceId.value) {
    runtimeView.value = null
    error.value = "缺少 resource_id"
    return
  }

  loading.value = true
  error.value = null

  try {
    const { data } = await getPluginRuntimeViewApi({
      plugin_id: resolvedPluginId.value,
      action: resolvedAction.value,
      resource_id: resolvedResourceId.value
    })
    runtimeView.value = data
  } catch (err: any) {
    runtimeView.value = null
    error.value = err?.message || "未知加载错误"
    console.error("[PluginRuntimePage] 运行时解析失败:", err)
  } finally {
    loading.value = false
  }
}

watch(
  () => [resolvedPluginId.value, resolvedAction.value, resolvedResourceId.value],
  () => {
    void loadRuntimeView()
  },
  { immediate: true }
)
</script>

<style scoped>
.plugin-runtime-page {
  display: flex;
  width: 100%;
  height: 100vh;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #060b12;
}

.plugin-runtime-page > * {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
