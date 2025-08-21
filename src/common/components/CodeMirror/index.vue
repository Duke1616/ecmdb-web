<template>
  <div class="code-mirror">
    <div class="editor-header">
      <div class="toolbar">
        <toolbar
          v-if="currentLangCode"
          :config="config"
          :disabled="loading"
          :themes="Object.keys(themes)"
          :languages="Object.keys(languages)"
          :tabSize="currentLangCode.tabSize"
          :createOrUpdate="props.createOrUpdate"
          :language="props.language"
          @language="ensureLanguageCode"
        />
      </div>
      <div class="preview">
        <PreView @preview="handlePreview" @redo="handleRedo" @undo="handleUndo" />
      </div>
    </div>
    <editor
      v-if="currentLangCode"
      ref="editorRef"
      :config="config"
      :theme="currentTheme"
      :language="currentLangCode.language"
      :code="currentLangCode.code"
      :tabSize="currentLangCode.tabSize"
      :editorPreview="editorPreview"
      :editorUndo="editorUndo"
      :editorRedo="editorRedo"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, shallowRef, onBeforeMount, ref, watch } from "vue"
import Toolbar from "./toolbar.vue"
import PreView from "./preview.vue"
import Editor from "./editor.vue"
import * as themes from "./themes"
import languages from "./languages"
import { useTheme, Theme } from "@@/composables/theme"

// 接收父组建传递
interface Props {
  createOrUpdate: string
  code: string
  language: string
}

const props = defineProps<Props>()

const editorPreview = ref<boolean>(false)
const editorUndo = ref<boolean>(false)
const editorRedo = ref<boolean>(false)
const handlePreview = (value: boolean) => {
  editorPreview.value = value
}

const handleRedo = () => {
  editorRedo.value = !editorRedo.value
}

const handleUndo = () => {
  editorUndo.value = !editorUndo.value
}

const config = reactive({
  disabled: false,
  indentWithTab: true,
  tabSize: 2,
  autofocus: true,
  height: "auto",
  language: "python",
  theme: useTheme().theme.value === Theme.Dark ? "oneDark" : "default"
})

const loading = shallowRef(false)
const langCodeMap = reactive(new Map<string, { code: string; language: () => any; tabSize: number }>())
const currentLangCode = computed(() => langCodeMap.get(config.language)!)

const currentTheme = computed(() => {
  return config.theme !== "default" ? (themes as any)[config.theme] : void 0
})

// const ensureLanguageCode = async (targetLanguage: string) => {
//   config.language = targetLanguage
//   loading.value = true
//   const delayPromise = () => new Promise((resolve) => window.setTimeout(resolve, 0))
//   if (langCodeMap.has(targetLanguage)) {
//     const [result] = await Promise.all([languages[targetLanguage](), delayPromise()])
//     // await delayPromise()
//     if (props.createOrUpdate === "create") {
//       langCodeMap.set(targetLanguage, result.default)
//     } else {
//       langCodeMap.set(targetLanguage, {
//         code: props.code,
//         language: result.default.language,
//         tabSize: result.default.tabSize
//       })
//     }
//     // console.log("你猜呀", result)
//   } else {
//     const [result] = await Promise.all([languages[targetLanguage](), delayPromise()])
//     if (props.createOrUpdate === "create") {
//       langCodeMap.set(targetLanguage, result.default)
//     } else {
//       langCodeMap.set(targetLanguage, {
//         code: props.code,
//         language: result.default.language,
//         tabSize: result.default.tabSize
//       })
//     }
//   }
//   loading.value = false
// }

const ensureLanguageCode = async (targetLanguage: string) => {
  config.language = targetLanguage
  loading.value = true

  try {
    const result = await languages[targetLanguage]() // 假设这是异步操作

    if (props.createOrUpdate === "create") {
      langCodeMap.set(targetLanguage, result?.default ?? {})
    } else {
      langCodeMap.set(targetLanguage, {
        ...(result?.default ?? {}),
        code: props.code
      })
    }
  } catch (error) {
    console.error("Error in ensureLanguageCode:", error)
  } finally {
    loading.value = false
  }
}

const editorRef = ref<InstanceType<typeof Editor>>()
const getCode = () => {
  return editorRef.value?.getCode()
}

const getLanguage = () => {
  return config.language
}

defineExpose({ getCode, getLanguage })
loading.value = true

onBeforeMount(() => {
  watch(
    () => props.createOrUpdate,
    () => {
      ensureLanguageCode(props.language)
    }
  )

  ensureLanguageCode(config.language)
})
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
