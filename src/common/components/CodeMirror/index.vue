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
          :tabSize="currentLangCode?.tabSize || 2"
          :language="props.language"
          :is-create="props.isCreate"
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
      :tabSize="currentLangCode?.tabSize || 2"
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
  code: string
  language: string
  isCreate?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:code": [code: string]
  "update:language": [language: string]
}>()

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
  language: "shell",
  theme: useTheme().theme.value === Theme.Dark ? "oneDark" : "default"
})

const loading = shallowRef(false)
const langCodeMap = reactive(new Map<string, { code: string; language: () => any; tabSize: number }>())
const currentLangCode = computed(() => {
  const langCode = langCodeMap.get(config.language)
  if (!langCode) {
    // 返回默认的语言配置，使用空的语言扩展
    return {
      code: "",
      language: () => [], // 返回空数组作为默认扩展
      tabSize: 2
    }
  }
  return langCode
})

const currentTheme = computed(() => {
  return config.theme !== "default" ? (themes as any)[config.theme] : void 0
})


const ensureLanguageCode = async (targetLanguage: string) => {
  config.language = targetLanguage
  loading.value = true

  try {
    console.log("Available languages:", Object.keys(languages))
    console.log("Target language:", targetLanguage)
    console.log("Language function:", languages[targetLanguage])
    
    const module = await languages[targetLanguage]()
    console.log("Module structure:", module)
    const result = module.default
    console.log("Result structure:", result)
    if (props.isCreate) {
      // 创建模式：使用默认代码模板
      const defaultCode = result?.code || ""
      console.log("Loading default code for", targetLanguage, ":", defaultCode)
      
      langCodeMap.set(targetLanguage, {
        ...result,
        language: result?.language || (() => []),
        code: defaultCode
      })
      
      // 通知父组件更新代码和语言
      emit("update:language", targetLanguage)
      emit("update:code", defaultCode)
    } else {
      // 编辑模式：保持原有代码
      langCodeMap.set(targetLanguage, {
        ...result,
        language: result?.language || (() => []),
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
    () => props.isCreate,
    () => {
      ensureLanguageCode(props.language)
    }
  )

  // 监听语言变化，确保页面切换时重新加载模板代码
  watch(
    () => props.language,
    (newLanguage) => {
      if (newLanguage && newLanguage !== config.language) {
        // 只有在创建模式且当前代码为空时才加载默认模板
        if (props.isCreate && (!props.code || props.code.trim() === '')) {
          ensureLanguageCode(newLanguage)
        } else {
          // 否则只更新语言配置，不清空用户代码
          config.language = newLanguage
          const existingLangCode = langCodeMap.get(newLanguage)
          if (!existingLangCode) {
            ensureLanguageCode(newLanguage)
          }
        }
      }
    },
    { immediate: true }
  )

  // 确保在创建模式下正确初始化默认代码
  if (props.isCreate) {
    ensureLanguageCode(props.language)
  } else {
    ensureLanguageCode(config.language)
  }
})
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
