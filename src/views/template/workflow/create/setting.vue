<template>
  <div class="setting-button">
    <el-button @click="previous">上一步</el-button>
    <el-button @click="save" type="primary">保存</el-button>
    <el-button @click="onClosed">取消</el-button>
  </div>
</template>

<script setup lang="ts">
const emits = defineEmits(["previous", "save", "close"])
const save = () => {
  emits("save")
}

const previous = () => {
  emits("previous")
}

const onClosed = () => {
  emits("close")
}
</script>

<style lang="scss" scoped>
.setting-button {
  margin-left: 50px;
  margin-top: 12px;
}
</style>
