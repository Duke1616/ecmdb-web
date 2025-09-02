<template>
  <div class="preview">
    <div class="footer">
      <div class="buttons">
        <button class="item preview-btn" type="button" @click.prevent="handlerPreview" :class="{ active: preview }">
          <i class="iconfont" :class="preview ? 'icon-eye' : 'icon-eye-close'" />
          <span>{{ preview ? '隐藏' : '预览' }}</span>
        </button>
        <button class="item undo-btn" type="button" @click.prevent="handleUndo" title="撤销 (Ctrl+Z)">
          <i class="iconfont icon-arrow-up" style="transform: rotate(180deg);"></i>
          <span>撤销</span>
        </button>
        <button class="item redo-btn" type="button" @click.prevent="handleRedo" title="重做 (Ctrl+Y)">
          <i class="iconfont icon-arrow-up"></i>
          <span>重做</span>
        </button>
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
@import "@@/assets/styles/variables.scss";
@import "@@/assets/styles/iconfont.scss";

.iconfont {
  padding-left: 4px;
}
.footer {
  height: 3rem;
  padding: 0 1em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 90%;

  .buttons {
    display: flex;
    gap: 8px;
    
    .item {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background-color: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      font-size: 12px;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 60px;
      
      .iconfont {
        font-size: 14px;
        transition: transform 0.2s ease;
      }
      
      &:hover {
        background-color: #e9ecef;
        border-color: #dee2e6;
        color: #495057;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      &.active {
        background-color: #007bff;
        border-color: #007bff;
        color: white;
        
        &:hover {
          background-color: #0056b3;
          border-color: #0056b3;
        }
      }
      
      &.preview-btn {
        &.active {
          background-color: #28a745;
          border-color: #28a745;
          
          &:hover {
            background-color: #1e7e34;
            border-color: #1e7e34;
          }
        }
      }
      
      &.undo-btn {
        &:hover {
          background-color: #fff3cd;
          border-color: #ffeaa7;
          color: #856404;
          
          .iconfont {
            transform: rotate(180deg) scale(1.1);
            animation: undo-pulse 0.6s ease-in-out;
          }
        }
      }
      
      &.redo-btn {
        &:hover {
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
          
          .iconfont {
            transform: rotate(0deg) scale(1.1);
            animation: redo-pulse 0.6s ease-in-out;
          }
        }
      }
    }
  }
}

// 添加回滚动画
@keyframes undo-pulse {
  0% { transform: rotate(180deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(180deg) scale(1.1); }
}

@keyframes redo-pulse {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(0deg) scale(1.2); }
  100% { transform: rotate(0deg) scale(1.1); }
}
</style>
