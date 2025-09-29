<template>
  <div>
    <el-result v-if="!props.empty" icon="info" title="提示" sub-title="从部门列表中选择一项获取用户数据" />
  </div>
</template>

<script lang="ts" setup>
interface Props {
  empty: boolean
}

const props = defineProps<Props>()
</script>
