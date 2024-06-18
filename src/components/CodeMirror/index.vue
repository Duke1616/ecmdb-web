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
          @language="ensureLanguageCode"
        />
      </div>
      <div class="preview">
        <PreView @preview="handlePreview" @redo="handleRedo" @undo="handleUndo" />
      </div>
    </div>

    <editor
      v-if="currentLangCode"
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
import { reactive, computed, shallowRef, onBeforeMount, ref } from "vue"
import Toolbar from "./toolbar.vue"
import PreView from "./preview.vue"
import Editor from "./editor.vue"
import * as themes from "./themes"
import languages from "./languages"
import { useTheme, Theme } from "@/composables/theme"

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

const ensureLanguageCode = async (targetLanguage: string) => {
  config.language = targetLanguage
  loading.value = true
  const delayPromise = () => new Promise((resolve) => window.setTimeout(resolve, 0))
  if (langCodeMap.has(targetLanguage)) {
    await delayPromise()
  } else {
    const [result] = await Promise.all([languages[targetLanguage](), delayPromise()])
    langCodeMap.set(targetLanguage, result.default)
  }
  loading.value = false
}

// HACK: Make sure the first screen the user sees is the loading placeholder
loading.value = true
onBeforeMount(() => {
  // init default language & code
  ensureLanguageCode(config.language)
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.editor-header {
  display: flex;
  justify-content: space-between;
}

.example {
  .divider {
    height: 1px;
    background-color: $border-color;
  }

  .loading-box {
    width: 100%;
    min-height: 20rem;
    max-height: 60rem;
    /* loading height = view-height - layout-height - page-height */
    /* navbar + banner + footer */
    $layout-height: $navbar-height + $banner-height + $footbar-height;
    /* single-card-gap * 2 + card-header + editor-header */
    $page-height: 2rem * 2 + 3.2rem + 3rem;
    /* editor-border * 2 */
    height: calc(100vh - $layout-height - $page-height - 2px);
  }
}
</style>
