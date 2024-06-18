<template>
  <div class="preview">
    <div class="footer">
      <div class="buttons">
        <button class="item" @click="handlerPreview">
          <span>Preview</span>
          <i class="iconfont" :class="preview ? 'icon-eye' : 'icon-eye-close'" />
        </button>
        <button class="item" @click="handleUndo">Undo</button>
        <button class="item" @click="handleRedo">Redo</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
const emit = defineEmits(["preview", "redo", "undo"])
const preview = ref<boolean>(false)
// 展示按钮点击事件
const handlerPreview = () => {
  preview.value = !preview.value
  emit("preview", preview.value)
}

// redo 点击事件
const handleRedo = () => {
  emit("redo", true)
}

// undo 点击事件
const handleUndo = () => {
  emit("undo", true)
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";
@import "@/styles/iconfont.scss";

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
}
</style>
