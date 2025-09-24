<template>
  <div class="code-mirror" :class="{ 'split-mode': showPreview }">
    <div class="editor-panel">
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
    <div v-if="showPreview" class="preview-panel">
      <div class="preview-header">
        <span class="preview-title">预览</span>
      </div>
      <div class="preview-content" v-html="props.previewContent || ''"></div>
    </div>
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
  showPreview?: boolean // 是否显示预览
  previewContent?: string // 预览内容
}

const props = defineProps<Props>()

const emit = defineEmits<{
  "update:code": [code: string]
  "update:language": [language: string]
}>()

// 预览状态 - 使用外部传入的状态
const showPreview = computed(() => props.showPreview || false)

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
  
  &.split-mode {
    flex-direction: row;
    
    .editor-panel {
      flex: 1;
      min-width: 0;
      border-right: 1px solid #e2e8f0;
    }
    
    .preview-panel {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      background: #fafafa;
      
      .preview-header {
        padding: 8px 16px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
      }
      
      .preview-content {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        line-height: 1.6;
        color: #374151;
        
        h1, h2, h3, h4, h5, h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          color: #1f2937;
        }
        
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        
        p {
          margin: 8px 0;
        }
        
        code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
        }
        
        pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 16px 0;
          
          code {
            background: transparent;
            padding: 0;
            color: inherit;
          }
        }
        
        strong {
          font-weight: 600;
        }
        
        em {
          font-style: italic;
        }
        
        a {
          color: #3b82f6;
          text-decoration: none;
          
          &:hover {
            text-decoration: underline;
          }
        }
        
        ul, ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        
        li {
          margin: 4px 0;
        }
      }
    }
  }
  
  .editor-panel {
    flex: 1;
    min-height: 0;
  }
}
</style>
