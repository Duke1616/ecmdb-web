<template>
  <el-form :model="form" label-width="auto" style="width: 600px">
    <el-form-item label="流程名称">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-form-item label="图标">
      <el-input v-model="form.desc" />
    </el-form-item>
    <el-form-item label="负责人">
      <el-input v-model="form.desc" />
    </el-form-item>
    <el-form-item label="流程说明">
      <el-input v-model="form.desc" type="textarea" d />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onActive">下一步</el-button>
      <el-button @click="close">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { reactive } from "vue"

const emits = defineEmits(["next", "close"])
const onActive = () => {
  emits("next")
}

const close = () => {
  emits("close")
}

// do not use same name with ref
const form = reactive({
  name: "",
  region: "",
  date1: "",
  date2: "",
  delivery: false,
  type: [],
  resource: "",
  desc: ""
})
</script>
