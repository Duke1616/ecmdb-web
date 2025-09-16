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
import { PrefixConfig } from "./index.vue"

const props = withDefaults(
  defineProps<{
    resource_id: string
    prefix: PrefixConfig | undefined
  }>(),
  {
    resource_id: "1"
  }
)

interface RequestConfig {
  url: string
  method: string
  headers: Record<string, string>
  params: Record<string, any>
  body: any
}

const request = {
  // baseUrl: `http://127.0.0.1:8005`,
  baseUrl: `${props.prefix?.prefix}/api/cmdb/finder/index`,
  params: { id: Number(props.resource_id) },
  transformRequest: (req: RequestConfig) => {
    switch (req.params.q) {
      case "upload":
        req.url = `${props.prefix?.prefix}/api/finder/upload`
        break
      case "download":
        req.url = `${props.prefix?.prefix}/api/finder/download`
        break
      case "rename":
        req.url = `${props.prefix?.prefix}/api/finder/rename`
        break
      case "newfile":
        req.url = `${props.prefix?.prefix}/api/finder/new_file`
        break
      case "newfolder":
        req.url = `${props.prefix?.prefix}/api/finder/new_folder`
        break
      case "delete":
        req.url = `${props.prefix?.prefix}/api/finder/remove`
        break
      case "subfolders":
        req.url = `${props.prefix?.prefix}/api/finder/subfolders`
        break
      case "move":
        req.url = `${props.prefix?.prefix}/api/finder/move`
        break
      case "archive":
        req.url = `${props.prefix?.prefix}/api/finder/archive`
        break
      case "search":
        req.url = `${props.prefix?.prefix}/api/finder/search`
        break
      case "preview":
        req.url = `${props.prefix?.prefix}/api/finder/preview`
        break
      case "save":
        req.url = `${props.prefix?.prefix}/api/finder/save`
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
