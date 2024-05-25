<template>
  <div class="centered-container">
    <el-input clearable v-model="input" placeholder="请输入搜索内容">
      <template #append>
        <el-button type="primary" @click="search">搜索</el-button>
      </template>
    </el-input>
    <div class="search-title">
      <h3>搜索</h3>
      <el-button type="primary" text class="button-clear" @click="removeHistory">清除历史记录</el-button>
    </div>
    <div class="tag-container">
      <el-button v-for="(history, index) in searchHistory" :key="index">{{ history }}</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
const router = useRouter()

const input = ref("")
const searchHistory = ref<string[]>([
  "张三",
  "李四",
  "王五",
  "张三",
  "李四",
  "王五",
  "张三",
  "李四",
  "王五",
  "张三",
  "李四",
  "王五",
  "张三",
  "李四",
  "王五",
  "张三"
])
console.log(input.value)

const search = () => {
  if (input.value.trim() !== "") {
    searchHistory.value.push(input.value.trim())
  }

  if (input.value.trim() === "") {
    return
  }

  router.push({
    path: "/dashboard/search",
    query: { text: input.value }
  })
  input.value = ""
}

const removeHistory = () => {
  searchHistory.value = []
}
</script>

<style scoped>
.centered-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* 容器高度设置为视口高度 */
  position: relative; /* 设置为相对定位 */
}

.centered-container::before {
  content: ""; /* 伪元素需要内容 */
  display: block;
  height: 0; /* 伪元素高度设置为0 */
}

.el-input {
  width: 40%; /* 根据需要调整宽度 */
  height: 40px;
  position: absolute; /* 绝对定位脱离文档流 */
  top: 25%; /* 大约1/3的位置 */
  transform: translateY(-50%); /* 垂直方向上移动自身高度的50%来居中 */
}

.search-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 40%; /* 根据需要调整宽度 */
  height: 40px;
  position: absolute; /* 绝对定位脱离文档流 */
  top: 27%; /* 大约1/3的位置 */
  margin-top: 15px;
}

.tag-container {
  width: 40%; /* 根据需要调整宽度 */
  height: 40px;
  position: absolute; /* 绝对定位脱离文档流 */
  top: 27%; /* 大约1/3的位置 */
  margin-top: 60px;
}

.tag-container .el-button {
  margin: 2px; /* 每个按钮周围有边距 */
}

/* 每个按钮除了最后一个都应用左边距 */
.tag-container .el-button:not(:last-child) {
  margin-right: 10px;
}

.button-clear {
  padding: 0px;
}
</style>
