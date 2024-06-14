<template>
  <div>
    <div class="mx-4">
      <el-tabs v-model="activeName" @tab-change="handleTabClick">
        <el-tab-pane v-for="(item, index) in modeList" :name="item.lan" :key="index" />
      </el-tabs>
      <codemirror
        v-model="code"
        placeholder="Code gose here..."
        theme="one-dark"
        :lineNumbers="false"
        :style="{ height: '400px' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tabSize="2"
        :extensions="extensions"
        @ready="log('ready')"
        @change="log('change')"
        @focus="log('focus')"
        @blur="log('blur')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Codemirror } from "vue-codemirror"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
import { ref } from "vue"
// require styles
// require("codemirror/lib/codemirror.css")
// import "codemirror/addon/fold/brace-fold"
// import "codemirror/addon/fold/foldcode"
// import "codemirror/addon/fold/foldgutter"
// import "codemirror/addon/fold/foldgutter.css"
// import "codemirror/lib/codemirror.css"
// import "codemirror/mode/javascript/javascript"
// // JSON错误检查
// import "codemirror/addon/lint/lint.css"
// import "codemirror/addon/lint/lint.js"
// // 需要依赖全局的jsonlint，不是很优雅
// import "codemirror/addon/lint/json-lint.js"
// import "codemirror/addon/lint/yaml-lint.js"
// //及时自动更新，配置里面也需要设置autoRefresh为true
// import "codemirror/addon/display/autorefresh"
// // 支持括号自动匹配
// import "codemirror/addon/edit/closebrackets.js"
// import "codemirror/addon/edit/matchbrackets.js"
// // 引入dark主题
// import "codemirror/theme/duotone-dark.css"

// // 全屏
// import "codemirror/addon/display/fullscreen"

// import "codemirror/lib/codemirror.css"
// import "codemirror/theme/monokai.css"

const modeList = [{ lan: "python", ex: python() }]
const code = ref(`console.log('Hello, world!')`)
const extensions = ref<any>([python(), oneDark])

function log(str: string) {
  console.log(str)
}

const activeName = ref<number>(0)
const handleTabClick = () => {
  extensions.value = [modeList[activeName.value].ex, oneDark]
}
</script>
