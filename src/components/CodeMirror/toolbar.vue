<template>
  <div class="toolbar">
    <el-form :model="localConfig" class="form-inline" style="max-width: 800px">
      <el-form-item label="语言">
        <el-select
          name="language"
          id="language"
          v-model="localConfig.language"
          :disabled="disabled"
          placeholder="选择语言"
          size="default"
          @change="handleSelectLanguage"
        >
          <el-option v-for="option in languages" :key="option" :label="option" :value="option" />
        </el-select>
      </el-form-item>
      <el-form-item label="主题">
        <el-select v-model="localConfig.theme" :disabled="disabled" placeholder="Select" size="default">
          <el-option v-for="option in ['default', ...themes]" :key="option" :label="option" :value="option" />
        </el-select>
      </el-form-item>
      <el-form-item label="高度">
        <el-select v-model="localConfig.height" :disabled="disabled" placeholder="Select" size="default">
          <el-option
            v-for="option in ['auto', '500px', '550px', '600px', '650px', '700px', '750px', '800px']"
            :key="option"
            :label="option"
            :value="option"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="禁止输入">
        <el-switch v-model="localConfig.disabled" size="default" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { PropType, ref, watch } from "vue"

interface Config {
  language: string
  theme: string
  disabled: boolean // 禁用输入
  autofocus: boolean // 自动聚焦
  indentWithTab: boolean // 使用制表符缩进
  tabSize: number // TODO 暂未实现，tabSize 用于控制缩进的空格数
  height: string
}

// 定义 Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object as PropType<Config>,
    required: true
  },
  languages: {
    type: Array as PropType<Array<string>>,
    required: true
  },
  themes: {
    type: Array as PropType<Array<string>>,
    required: true
  }
})

const localConfig = ref<Config>(props.config)

watch(
  () => props.config,
  () => {
    localConfig.value = props.config
  },
  { immediate: true }
)

// 定义 Emits
const emit = defineEmits(["language"])

// 处理语言选择事件
const handleSelectLanguage = () => {
  emit("language", props.config.language)
}

// const handleSelectLanguage = (event: Event) => {
//   const target = event.target as HTMLSelectElement

//   emit("language", target.value)
// }
</script>

<style lang="scss" scoped>
.form-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  justify-content: center;
  align-items: center;
  align-items: center;
  align-content: center;
}

.el-form-item {
  flex: 1;
  min-width: 150px;
  justify-content: center;
  align-items: center;
  align-items: center;
  align-content: center;
}
</style>
