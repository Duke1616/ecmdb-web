<template>
  <div class="editor">
    <div class="main">
      <codemirror
        v-model="code"
        :style="{
          backgroundColor: '#fff',
          color: '#333'
        }"
        placeholder="Please enter the code."
        :extensions="extensions"
        :autofocus="config.autofocus"
        :disabled="config.disabled"
        :indent-with-tab="config.indentWithTab"
        :tab-size="tabSize"
        @update="handleStateUpdate"
        @ready="handleReady"
        @focus="log('focus', $event)"
        @blur="log('blur', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, shallowRef, computed, watch } from "vue"
import { EditorView, ViewUpdate } from "@codemirror/view"
import { Codemirror } from "vue-codemirror"

interface Props {
  config: {
    indentWithTab: boolean
    disabled: boolean
    autofocus: boolean
  }
  code: string
  theme: any
  language: any
  tabSize: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  "update:code": [code: string]
}>()

const log = console.log
const code = shallowRef(props.code)

const extensions = computed(() => {
  const result = []

  console.log("Editor extensions computed, language:", props.language)

  // 添加语言支持
  if (props.language && props.language.language) {
    console.log("Adding language:", props.language.language)
    try {
      // 检查是否是函数，如果是则调用它
      if (typeof props.language.language === "function") {
        const langExt = props.language.language()
        if (langExt) {
          result.push(langExt)
        }
      } else if (props.language.language && typeof props.language.language === "object") {
        result.push(props.language.language)
      }
    } catch (error) {
      console.error("Error adding language extension:", error)
    }
  }

  // 添加主题
  if (props.theme) {
    try {
      result.push(props.theme)
    } catch (error) {
      console.error("Error adding theme:", error)
    }
  }

  console.log("Final extensions:", result)
  return result
})

const cmView = shallowRef<EditorView>()
const handleReady = ({ view }: any) => {
  cmView.value = view
}

const state = reactive({
  lines: null as null | number,
  cursor: null as null | number,
  selected: null as null | number,
  length: null as null | number
})

const handleStateUpdate = (viewUpdate: ViewUpdate) => {
  // selected
  const ranges = viewUpdate.state.selection.ranges
  state.selected = ranges.reduce((plus, range) => plus + range.to - range.from, 0)
  state.cursor = ranges[0].anchor

  // length
  state.length = viewUpdate.state.doc.length
  state.lines = viewUpdate.state.doc.lines

  // 更新代码并触发事件
  const newCode = viewUpdate.state.doc.toString()
  code.value = newCode
  emit("update:code", newCode)
}

const getCode = () => {
  return code.value
}

const setCode = (newCode: string) => {
  code.value = newCode
  if (cmView.value) {
    cmView.value.dispatch({
      changes: {
        from: 0,
        to: cmView.value.state.doc.length,
        insert: newCode
      }
    })
  }
}

const formatCode = () => {
  // 这里可以添加代码格式化逻辑
  // 目前只是简单的示例
  console.log("Format code functionality")
}

defineExpose({ getCode, setCode, formatCode })

// 监听代码变化 - 只在外部代码变化时更新编辑器
watch(
  () => props.code,
  (newCode) => {
    if (newCode !== code.value && cmView.value) {
      code.value = newCode
      cmView.value.dispatch({
        changes: {
          from: 0,
          to: cmView.value.state.doc.length,
          insert: newCode
        }
      })
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
@import "@@/assets/styles/variables.scss";
@import "@@/assets/styles/iconfont.scss";

.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;

  .main {
    display: flex;
    width: 100%;
    flex: 1;
    min-height: 0;

    :deep(.cm-editor) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
