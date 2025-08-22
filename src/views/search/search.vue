<template>
  <div class="centered-container">
    <el-input clearable v-model="inputSearch" placeholder="请输入搜索内容">
      <template #append>
        <el-button type="primary" @click="search">搜索</el-button>
      </template>
    </el-input>
    <div class="search-title">
      <h4>搜索历史</h4>
      <el-button type="primary" text class="button-clear" @click="removeHistory">清除历史记录</el-button>
    </div>
    <div class="tag-container">
      <el-button v-for="(history, index) in searchHistory" :key="index" @click="handlerTagClick(history)">{{
        history
      }}</el-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useSearchStore } from "@/pinia/stores/search"

const router = useRouter()
const inputSearch = ref("")
const searchHistory = computed(() => useSearchStore().historySearchData)

const search = () => {
  if (inputSearch.value.trim() === "") {
    ElMessage.error("搜索内容不成为空")
    return
  }

  useSearchStore().addHistorySearch(inputSearch.value.trim())
  router.push({
    path: "/cmdb/dashboard/search",
    query: { text: inputSearch.value }
  })
}

const removeHistory = () => {
  useSearchStore().clearHistorySearch()
}

const handlerTagClick = (history: string) => {
  router.push({
    path: "/cmdb/dashboard/search",
    query: { text: history }
  })
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
