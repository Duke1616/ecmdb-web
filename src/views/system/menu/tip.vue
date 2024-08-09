<template>
  <div>
    <el-result v-if="!props.empty" icon="info" title="提示" sub-title="从菜单列表中选择一项进行编辑" />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  empty: boolean
}

const props = defineProps<Props>()
</script>
