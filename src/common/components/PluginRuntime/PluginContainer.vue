<template>
  <div class="plugin-container">
    <div v-if="loading" class="plugin-loading-container">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="error" class="plugin-error-container">
      <el-result icon="error" title="插件加载失败" :sub-title="error">
        <template #extra>
          <el-button type="primary" @click="init">重试</el-button>
        </template>
      </el-result>
    </div>

    <div v-else class="plugin-component-host">
      <!-- 动态挂载并渲染已被解析的 UMD 组件 -->
      <component :is="resolvedComponent" v-bind="componentProps" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue"
import { usePluginLoader } from "./usePluginLoader"

// NOTE: 该组件为通用插件运行容器，负责调度 Composable 进行资源加载与组件动态挂载
interface PluginContainerProps {
  jsUrl: string // 插件 JS 地址
  cssUrl?: string // 插件 CSS 地址（可选）
  globalName: string // 插件在 window 上注册的全局变量名，例如 'EcmdbPluginSsh'
  componentName: string // 要渲染的子组件名，例如 'SshIndex'
  componentProps?: any // 传给插件组件的参数
}

const props = defineProps<PluginContainerProps>()

const { loading, error, resolvedComponent, load } = usePluginLoader()

const init = () => {
  load(props.jsUrl, props.cssUrl, props.globalName, props.componentName)
}

onMounted(init)

// 监听 UMD 配置的变化，实现动态热重载与无缝切换
watch(() => [props.jsUrl, props.componentName], init)
</script>

<style scoped>
.plugin-container {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.plugin-loading-container {
  display: flex;
  flex: 1;
  align-items: center;
  padding: 20px;
  min-width: 0;
  min-height: 0;
}

.plugin-error-container {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 40px;
  min-width: 0;
  min-height: 0;
  text-align: center;
}

.plugin-component-host {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.plugin-component-host > :deep(*) {
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}
</style>
