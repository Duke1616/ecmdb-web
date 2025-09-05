<template>
  <div class="editor">
    <div class="main">
      <codemirror
        v-model="code"
        :style="{
          width: preview ? '50%' : '100%',
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
      <pre v-if="preview" class="code" :style="{ width: preview ? '50%' : '0px' }">{{
        code
      }}</pre>
    </div>
    <div class="divider" />
    <div class="footer">
      <div class="buttons" />
      <div class="infos">
        <!-- 移除了多余的统计信息显示 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, shallowRef, computed, watch, onMounted } from "vue"
import { EditorView, ViewUpdate } from "@codemirror/view"
import { redo, undo } from "@codemirror/commands"
import { Codemirror } from "vue-codemirror"

interface Props {
  config: {
    indentWithTab: boolean
    disabled: boolean
    autofocus: boolean
  }
  code: string
  theme: [Object, Array<string>]
  language: string | (() => any)
  tabSize: number
  editorPreview: boolean
  editorUndo: boolean
  editorRedo: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  "update:code": [code: string]
}>()

const log = console.log
const code = shallowRef(props.code)

const extensions = computed(() => {
  const result = []
  if (props.language && typeof props.language === 'function') {
    result.push(props.language())
  }
  if (props.theme) {
    result.push(props.theme)
  }
  return result
})

const preview = shallowRef(false)

const cmView = shallowRef<EditorView>()
const handleReady = ({ view }: any) => {
  cmView.value = view
}

const handleUndo = () => {
  undo({
    state: cmView.value!.state,
    dispatch: cmView.value!.dispatch
  })
}

const handleRedo = () => {
  redo({
    state: cmView.value!.state,
    dispatch: cmView.value!.dispatch
  })
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

watch(
  () => props.editorPreview,
  (value: boolean) => {
    preview.value = value
  },
  { immediate: true }
)

watch(
  () => props.editorUndo,
  (val: boolean) => {
    if (val) {
      handleUndo()
    }
  }
)

watch(
  () => props.editorRedo,
  (val: boolean) => {
    if (val) {
      handleRedo()
    }
  }
)

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

  .divider {
    height: 1px;
    background-color: $border-color;
  }

  .main {
    display: flex;
    width: 100%;
    flex: 1;
    min-height: 0;

    .code {
      width: 30%;
      height: 100px;
      margin: 0;
      padding: 0.4em;
      overflow: scroll;
      border-left: 1px solid $border-color;
      font-family: monospace;
    }
  }


  .footer {
    height: 3rem;
    padding: 0 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 90%;

    .infos {
      .item {
        margin-left: 2em;
        display: inline-block;
        font-feature-settings: "tnum";
      }
    }
  }
}
</style>
