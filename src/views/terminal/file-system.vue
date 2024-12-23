<template>
  <div class="wrapper">
    <label for="example"> Example </label>
    <vue-finder
      id="vuefinder"
      :request="request"
      locale="zhCN"
      :full-screen="true"
      :max-file-size="maxFileSize"
      :onError="onError"
      loadingIndicator="linear"
      :select-button="handleSelectButton"
    />
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from "element-plus"
import { ref } from "vue"

interface RequestConfig {
  url: string
  method: string
  headers: Record<string, string>
  params: Record<string, any>
  body: any
}

const request = {
  baseUrl: "http://127.0.0.1:8350/api/finder/index",
  transformRequest: (req: RequestConfig) => {
    switch (req.params.q) {
      case "upload":
        req.url = "http://127.0.0.1:8350/api/finder/upload"
        break
      case "download":
        req.url = "http://127.0.0.1:8350/api/finder/download"
        break
      case "rename":
        req.url = "http://127.0.0.1:8350/api/finder/rename"
        break
      case "newfile":
        req.url = "http://127.0.0.1:8350/api/finder/new_file"
        break
      case "newfolder":
        req.url = "http://127.0.0.1:8350/api/finder/new_folder"
        break
      case "delete":
        req.url = "http://127.0.0.1:8350/api/finder/remove"
        break
      case "subfolders":
        req.url = "http://127.0.0.1:8350/api/finder/subfolders"
        break
      case "move":
        req.url = "http://127.0.0.1:8350/api/finder/move"
        break
      case "archive":
        req.url = "http://127.0.0.1:8350/api/finder/archive"
        break
      case "search":
        req.url = "http://127.0.0.1:8350/api/finder/search"
        break
      case "preview":
        req.url = "http://127.0.0.1:8350/api/finder/preview"
        break
      default:
        break
    }
    return req
  }
}

const onError = (e: any) => {
  const errorMessage = e.message || "未知错误"
  ElMessage.error("错误：" + errorMessage)
}

const maxFileSize = ref("500MB")
const handleSelectButton = {
  active: true,
  multiple: false,
  click: (items: string | any[], event: any) => {
    if (!items.length) {
      alert("No item selected")
      return
    }
    alert("Selected: " + items[0].path)
    console.log(items, event)
  }
}
</script>

<style lang="scss">
body {
  margin: 0;
  background: #eeeeee;
}
.wrapper {
  max-width: 800px;
  margin: 80px auto;
}
.btn {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  outline: none;
}
</style>
