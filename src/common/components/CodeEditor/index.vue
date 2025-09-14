<template>
  <div class="code-mirror">
    <editor
      ref="editorRef"
      :config="config"
      :theme="currentTheme"
      :language="getLanguageFunction()"
      :code="props.code || getDefaultCode()"
      :tabSize="props.language === 'shell' ? 2 : 4"
      @update:code="handleCodeUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue"
import Editor from "./editor.vue"
import * as themes from "./themes"
import { useTheme, Theme } from "@@/composables/theme"
import { python } from "@codemirror/lang-python"

// 接收父组建传递
interface Props {
  code: string
  language: string
  isCreate?: boolean
  projectFiles?: any[] // 项目文件信息，用于智能提示
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:code": [code: string]
  "update:language": [language: string]
}>()

const config = reactive({
  disabled: false,
  indentWithTab: true,
  tabSize: 2,
  autofocus: true,
  theme: useTheme().theme.value === Theme.Dark ? "oneDark" : "default"
})

const currentTheme = computed(() => {
  console.log("Current theme:", config.theme)
  console.log("Available themes:", themes)
  if (config.theme !== "default" && themes[config.theme as keyof typeof themes]) {
    return themes[config.theme as keyof typeof themes]
  }
  return undefined
})

const editorRef = ref<InstanceType<typeof Editor>>()

// 处理代码更新
const handleCodeUpdate = (newCode: string) => {
  emit("update:code", newCode)
}

const getCode = () => {
  return editorRef.value?.getCode()
}

const setCode = (code: string) => {
  editorRef.value?.setCode(code)
}

const formatCode = () => {
  editorRef.value?.formatCode()
}

const getLanguageFunction = () => {
  // 根据传入的语言动态获取配置
  const languageConfig = getLanguageConfig(props.language)
  return {
    language: languageConfig.language,
    tabSize: languageConfig.tabSize,
    code: props.code || languageConfig.code
  }
}

// 获取默认代码
const getDefaultCode = () => {
  const languageConfig = getLanguageConfig(props.language)
  return languageConfig.code || ""
}

// 获取语言配置
const getLanguageConfig = (language: string) => {
  // 导入所有语言配置
  const languages = import.meta.glob("./lang-code/*/index.ts", { eager: true })

  // 根据语言名称获取对应的配置
  const languageKey = `./lang-code/${language}/index.ts`
  const languageModule = languages[languageKey] as any

  if (languageModule && languageModule.default) {
    return languageModule.default
  }

  // 如果找不到对应语言，返回默认的 Python 配置
  return {
    language: python,
    tabSize: 4,
    code: ""
  }
}

// 处理主题切换
const handleThemeChange = (theme: string) => {
  console.log("Theme changing from", config.theme, "to", theme)
  config.theme = theme
}

// 外部调用主题切换
const handleExternalThemeChange = (theme: string) => {
  handleThemeChange(theme)
}

defineExpose({ getCode, setCode, formatCode, handleThemeChange: handleExternalThemeChange })
</script>

<style lang="scss" scoped>
.code-mirror {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
