<template>
  <div>
    <vue-json-pretty :path="'res'" :data="props.graph" />
  </div>
</template>
<script setup lang="ts">
import VueJsonPretty from "vue-json-pretty"
import "vue-json-pretty/lib/styles.css"

// // 定义props类型接口
interface Props {
  graph: any
}
const props = defineProps<Props>()
</script>
<style scoped></style>
