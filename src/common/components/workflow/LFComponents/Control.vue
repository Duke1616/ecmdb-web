<template>
  <div>
    <el-button-group>
      <el-button plain size="small" @click="getData">查看数据</el-button>
      <el-button plain size="small" @click="download">下载图片</el-button>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
// import { ref } from "vue"

// // 定义props类型接口
// interface Props {
//   lf: any
// }
// const props = defineProps<Props>()
const emit = defineEmits(["getData", "download"])

// const undoDisable = ref(true)
// const redoDisable = ref(true)
// const dataVisible = ref(false)
// const graphData = ref()

const download = () => {
  emit("download")
}

const getData = () => {
  emit("getData")
  // console.log(graphData.value)
}
</script>
<style scoped></style>
