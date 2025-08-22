<script lang="ts" setup>
import ErrorPageLayout from "./components/Layout.vue"
import Svg403 from "./images/403.svg?component" // vite-svg-loader 插件的功能
</script>

<template>
  <ErrorPageLayout>
    <Svg403 />
  </ErrorPageLayout>
</template>
