<template>
  <div class="template-card" :class="{ 'is-disabled': disabled }" @click="handleClick">
    <div class="template-card-header">
      <div class="template-icon-wrapper">
        <!-- 如果 icon 包含空格或 eiconfont 关键字，说明是 iconfont 类名 -->
        <i
          v-if="template.icon?.includes(' ') || template.icon?.startsWith('e-')"
          :class="template.icon"
          class="template-icon"
        />
        <e-icon v-else :icon-name="template.icon || 'Document'" class="template-icon" />
      </div>
      <div class="template-actions">
        <div class="template-badge">模板</div>
        <div v-if="canFavorite" class="favorite-btn" @click.stop="(e) => $emit('toggle-favorite', template.id, e)">
          <el-icon :class="{ 'is-favorite': isFavorite }">
            <StarFilled v-if="isFavorite" />
            <Star v-else />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="template-card-body">
      <h4 class="template-name">{{ template.name || "未命名模板" }}</h4>
      <p class="template-description">{{ template.desc || "点击创建新的工单" }}</p>
    </div>
    <div class="template-card-footer">
      <span class="action-text">{{ disabled ? "暂无权限" : "立即创建" }}</span>
      <div class="template-arrow">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Star, StarFilled } from "@element-plus/icons-vue"

const props = withDefaults(
  defineProps<{
    template: { id: number; name: string; icon: string; [key: string]: any }
    isFavorite: boolean
    disabled?: boolean
    canFavorite?: boolean
  }>(),
  {
    disabled: false,
    canFavorite: true
  }
)

const emit = defineEmits<{
  (e: "click"): void
  (e: "toggle-favorite", id: number, event: Event): void
}>()

const handleClick = () => {
  if (props.disabled) return
  emit("click")
}
</script>

<style lang="scss" scoped>
.template-card {
  background: white;
  border-radius: calc(0.5rem + 0.1vw);
  padding: calc(0.8rem + 0.2vw);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (min-width: 1280px) and (max-width: 1440px) {
    padding: calc(0.6rem + 0.1vw);
  }

  &:hover {
    transform: translateY(calc(-0.1rem + 0.05vw));
    box-shadow: 0 calc(0.5rem + 0.2vw) calc(1.5rem + 0.3vw) rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;

    .template-icon {
      transform: scale(1.05);
      color: #3b82f6;
    }

    .template-arrow {
      transform: translateX(calc(0.2rem + 0.1vw));
    }

    .action-text {
      color: #3b82f6;
    }
  }

  &:active {
    transform: translateY(0);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.72;

    &:hover {
      transform: none;
      box-shadow: 0 calc(0.1rem + 0.05vw) calc(0.2rem + 0.1vw) rgba(0, 0, 0, 0.1);
      border-color: #e2e8f0;
    }

    .template-icon,
    .template-arrow,
    .action-text {
      color: #94a3b8;
      transform: none;
    }
  }
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: calc(0.6rem + 0.1vw);
}

.template-icon-wrapper {
  width: calc(2.4rem + 0.3vw);
  height: calc(2.4rem + 0.3vw);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: calc(0.5rem + 0.1vw);
  border: 1px solid #e2e8f0;
}

.template-icon {
  font-size: calc(1rem + 0.1vw);
  color: #64748b;
  transition: all 0.2s ease;
}

.template-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: calc(0.15rem + 0.05vw) calc(0.3rem + 0.1vw);
  border-radius: calc(0.3rem + 0.1vw);
  font-size: calc(0.6rem + 0.1vw);
  font-weight: 500;
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #94a3b8;
  background: #f1f5f9;
  transition: all 0.2s;
  z-index: 2;

  &:hover {
    background: #e2e8f0;
    color: #64748b;
  }

  .el-icon {
    font-size: 16px;
    transition: all 0.2s;

    &.is-favorite {
      color: #f59e0b; /* Amber 500 */
    }
  }

  &:hover .el-icon.is-favorite {
    color: #d97706; /* Amber 600 */
  }
}

.template-card-body {
  flex: 1;
  margin-bottom: calc(0.6rem + 0.1vw);
}

.template-name {
  font-size: calc(0.8rem + 0.1vw);
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 calc(0.3rem + 0.05vw) 0;
  line-height: 1.4;
}

.template-description {
  font-size: calc(0.7rem + 0.1vw);
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.template-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: calc(0.5rem + 0.1vw);
  border-top: 1px solid #f1f5f9;
}

.action-text {
  font-size: calc(0.7rem + 0.1vw);
  font-weight: 500;
  color: #64748b;
  transition: color 0.2s ease;
}

.template-arrow {
  color: #94a3b8;
  transition: all 0.2s ease;

  .el-icon {
    font-size: calc(0.8rem + 0.1vw);
  }
}
</style>
