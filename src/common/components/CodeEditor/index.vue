<template>
  <div class="code-mirror">
    <div class="editor-header">
      <div class="toolbar">
        <toolbar
          :config="config"
          :disabled="loading"
          :themes="Object.keys(themes)"
          :languages="Object.keys(languages)"
          :tabSize="props.language === 'shell' ? 2 : 4"
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
      ref="editorRef"
      :config="config"
      :theme="currentTheme"
      :language="props.language"
      :code="props.code"
      :tabSize="props.language === 'shell' ? 2 : 4"
      :editorPreview="editorPreview"
      :editorUndo="editorUndo"
      :editorRedo="editorRedo"
      @update:code="handleCodeUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, shallowRef, onBeforeMount, ref, watch } from "vue"
import { ElMessage } from "element-plus"
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
const currentTheme = computed(() => {
  return config.theme !== "default" ? (themes as any)[config.theme] : void 0
})


const ensureLanguageCode = async (targetLanguage: string) => {
  config.language = targetLanguage
  loading.value = true

  try {
    const module = await languages[targetLanguage]()
    const result = module.default
    
    langCodeMap.set(targetLanguage, {
      ...result,
      language: result?.language || (() => []),
      code: props.isCreate ? (result?.code || "") : props.code
    })
    
    // 通知父组件更新语言
    emit("update:language", targetLanguage)
    
    // 如果是创建模式且当前代码为空，才更新代码
    if (props.isCreate && (!props.code || props.code.trim() === "")) {
      emit("update:code", result?.code || "")
    }
  } catch (error) {
    console.error("Failed to load language:", error)
    ElMessage.error(`加载语言 ${targetLanguage} 失败`)
  } finally {
    loading.value = false
  }
}

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

const getLanguage = () => {
  return config.language
}

defineExpose({ getCode, setCode, formatCode, getLanguage })

// 初始化加载
onBeforeMount(async () => {
  loading.value = true
  try {
    await ensureLanguageCode(props.language)
  } catch (error) {
    console.error("Failed to initialize language:", error)
  } finally {
    loading.value = false
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
