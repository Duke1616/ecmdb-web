<template>
  <div class="matcher-item">
    <el-input v-model="matcher.name" placeholder="标签名" :size="size" />
    <el-select v-model="matcher.type" placeholder="类型" :size="size">
      <el-option v-for="option in matchTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
    <el-input v-model="matcher.value" placeholder="标签值" :size="size" :disabled="!isValueRequired(matcher.type)" />
    <el-button type="text" @click="handleRemove" class="matcher-remove"> 删除 </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useMatcher } from "@@/composables/useMatcher"
import type { Matcher } from "@@/types/matcher"
import type { MatchType } from "@@/constants/match-type"

interface Props {
  modelValue: Matcher
  size?: "large" | "default" | "small"
  includeTypes?: MatchType[] // 包含的匹配类型，如果为空则显示所有类型
}

interface Emits {
  (e: "update:modelValue", value: Matcher): void
  (e: "remove"): void
}

const props = withDefaults(defineProps<Props>(), {
  size: "default"
})

const emit = defineEmits<Emits>()

const { getMatchTypeOptions, isValueRequired } = useMatcher()

const matcher = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

const matchTypeOptions = computed(() => getMatchTypeOptions(props.includeTypes))

const handleRemove = () => {
  emit("remove")
}
</script>

<style lang="scss" scoped>
.matcher-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 6px;
  width: 100%;

  &:last-child {
    margin-bottom: 0;
  }

  .el-input {
    &:first-child {
      flex: 0 0 140px;
      min-width: 140px;
    }

    &:last-of-type {
      flex: 1;
      min-width: 150px;
    }
  }

  .el-select {
    flex: 0 0 100px;
    min-width: 100px;
  }

  .matcher-remove {
    flex: 0 0 auto;
    margin-left: auto;
    color: #ef4444;

    &:hover {
      color: #dc2626;
    }
  }
}
</style>
