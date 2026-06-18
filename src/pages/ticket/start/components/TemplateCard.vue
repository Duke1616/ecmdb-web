<template>
  <div class="template-card" :class="{ 'is-disabled': disabled }" @click="handleClick">
    <div class="template-card-header">
      <div class="template-icon-wrapper">
        <AppIcon :name="template.icon || 'Document'" class="template-icon" />
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
import AppIcon from "@/common/components/AppIcon/index.vue"

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
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
    border-color: #bfdbfe;

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
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
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
  gap: 12px;
  min-width: 0;
  margin-bottom: 18px;
}

.template-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.template-icon {
  font-size: 17px;
  color: #64748b;
  transition: all 0.2s ease;
}

.template-badge {
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
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
  min-width: 0;
  margin-bottom: 18px;
}

.template-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
  overflow: hidden;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-description {
  display: -webkit-box;
  overflow: hidden;
  font-size: 13px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.template-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.action-text {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.template-arrow {
  flex-shrink: 0;
  color: #94a3b8;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 14px;
  }
}
</style>
