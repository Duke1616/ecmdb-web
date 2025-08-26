<script lang="ts" setup>
import { useTheme } from "@/common/composables/useTheme"
import zhCn from "element-plus/es/locale/lang/zh-cn"
import { useGreyAndColorWeakness } from "@@/composables/useGreyAndColorWeakness"
const { initGreyAndColorWeakness } = useGreyAndColorWeakness()
const { initTheme } = useTheme()

/** 初始化主题 */
initTheme()

// 初始化灰色模式和色弱模式
initGreyAndColorWeakness()
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
