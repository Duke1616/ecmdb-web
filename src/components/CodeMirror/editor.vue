<template>
  <div class="editor">
    <div class="main">
      <codemirror
        v-model="code"
        :style="{
          width: preview ? '50%' : '100%',
          height: config.height,
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
      <pre v-if="preview" class="code" :style="{ height: config.height, width: preview ? '50%' : '0px' }">{{
        code
      }}</pre>
    </div>
    <div class="divider" />
    <div class="footer">
      <div class="buttons">
        <button class="item" @click="togglePreview">
          <span>Preview</span>
          <i class="iconfont" :class="preview ? 'icon-eye' : 'icon-eye-close'" />
        </button>
        <button class="item" @click="handleUndo">Undo</button>
        <button class="item" @click="handleRedo">Redo</button>
      </div>
      <div class="infos">
        <span class="item">Spaces: {{ tabSize }}</span>
        <span class="item">Length: {{ state.length }}</span>
        <span class="item">Lines: {{ state.lines }}</span>
        <span class="item">Cursor: {{ state.cursor }}</span>
        <span class="item">Selected: {{ state.selected }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, shallowRef, computed, watch, onMounted } from "vue"
import { EditorView, ViewUpdate } from "@codemirror/view"
import { redo, undo } from "@codemirror/commands"
import { Codemirror } from "vue-codemirror"

// const code = ref(`console.log('Hello, world!')`)
interface Props {
  config: {
    height: string
    indentWithTab: boolean
    disabled: boolean
    autofocus: boolean
  }
  code: string
  theme: [Object, Array<string>]
  language: Function
  tabSize: number
  editorPreview: boolean
  editorUndo: boolean
  editorRedo: boolean
}
const props = defineProps<Props>()
const log = console.log
const code = shallowRef(props.code)
const extensions = computed(() => {
  const result = []
  if (props.language) {
    result.push(props.language())
  }
  if (props.theme) {
    result.push(props.theme)
  }
  return result
})

const preview = shallowRef(false)
const togglePreview = () => {
  preview.value = !preview.value
}

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
  // log('viewUpdate', viewUpdate)
}

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
  },
  { immediate: true }
)

watch(
  () => props.editorRedo,
  (val: boolean) => {
    if (val) {
      handleRedo()
    }
  },
  { immediate: true }
)

onMounted(() => {
  watch(
    () => props.code,
    (_code) => {
      code.value = _code
    }
  )
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/iconfont.scss";

.editor {
  .divider {
    height: 1px;
    background-color: $border-color;
  }

  .main {
    display: flex;
    width: 100%;

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

    .buttons {
      .item {
        margin-right: 1em;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background-color: transparent;
        border: 1px dashed $border-color;
        font-size: $font-size-small;
        color: $text-secondary;
        cursor: pointer;
        .iconfont {
          margin-left: $xs-gap;
        }
        &:hover {
          color: $text-color;
          border-color: $text-color;
        }
      }
    }

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
