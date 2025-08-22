<script lang="ts" setup>
import ErrorPageLayout from "./components/Layout.vue"
import Svg404 from "./images/404.svg?component" // vite-svg-loader 插件的功能
</script>

<template>
  <ErrorPageLayout>
    <Svg404 />
  </ErrorPageLayout>
</template>
