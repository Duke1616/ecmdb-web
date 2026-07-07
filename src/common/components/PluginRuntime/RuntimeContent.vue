<template>
  <div class="runtime-content">
    <div v-if="loading" class="runtime-loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="error" class="runtime-error-container">
      <el-result icon="error" title="插件运行时解析失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="$emit('retry')">重试</el-button>
        </template>
      </el-result>
    </div>
    <div v-else-if="runtimeView" class="runtime-plugin-host">
      <PluginContainer
        :js-url="runtimeView.entry.js_url"
        :css-url="runtimeView.entry.css_url"
        :global-name="runtimeView.entry.global_name"
        :component-name="runtimeView.entry.component_name"
        :component-props="componentProps"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import PluginContainer from "./PluginContainer.vue"
import type { PluginRuntimeView } from "@/api/cmdb/plugin/types/plugin"

defineEmits<{
  retry: []
}>()

defineProps<{
  loading: boolean
  error: string | null
  runtimeView: PluginRuntimeView | null
  componentProps: Record<string, any>
}>()
</script>

<style scoped>
.runtime-content {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.runtime-loading-container {
  display: flex;
  flex: 1;
  align-items: center;
  padding: 20px;
  min-width: 0;
  min-height: 0;
}

.runtime-error-container {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-width: 0;
  min-height: 0;
  text-align: center;
}

.runtime-plugin-host {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>
