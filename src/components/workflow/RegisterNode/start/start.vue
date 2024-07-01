<template>
  <div class="node-title" ref="myNode">
    <span class="node-icon">
      <SvgIcon name="start" icon-class="start" />
    </span>
    <span class="node-name"><span /></span>
  </div>
</template>

<script setup lang="ts">
import variables from "@/assets/styles/variables.module.scss"
import { ref, onMounted } from "vue"
import SvgIcon from "@/components/SvgIcon/index.vue"
const props = defineProps({
  properties: {
    type: Object,
    default: null
  }
})
const myNode = ref()

onMounted(() => {
  let borderColor = variables.dragNodeBorderColor
  if (props.properties.frontend_status == "0") {
    borderColor = variables.dangerColor
  }
  myNode.value.style.border = `1px solid ${borderColor}`
})
</script>

<style scoped lang="scss">
.node-icon {
  color: #6bd452;
  font-size: 17px;
}
</style>
