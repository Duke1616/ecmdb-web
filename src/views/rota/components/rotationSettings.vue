<script setup lang="ts">
import { Calendar, Clock, RefreshRight } from "@element-plus/icons-vue"

const time_duration = defineModel<number>("time_duration")
const time_unit = defineModel<number>("time_unit")
</script>

<template>
  <div class="settings-group">
    <div class="group-title">
      <el-icon><RefreshRight /></el-icon>
      <span>轮换设置</span>
    </div>

    <!-- 轮换周期 -->
    <div class="rotation-period">
      <div class="period-label">轮换周期</div>
      <div class="period-controls">
        <div class="period-slider-container">
          <div class="period-value-display">
            <span class="period-number">{{ time_duration }}</span>
            <span class="period-unit">
              {{ time_unit === 4 ? "天" : "小时" }}
            </span>
          </div>
          <el-slider v-model="time_duration" :min="1" :max="30" :step="1" :show-tooltip="false" />
        </div>
      </div>
      <div class="period-presets">
        <el-button
          v-for="preset in [1, 3, 7, 14, 30]"
          :key="preset"
          size="small"
          :type="time_duration === preset ? 'primary' : 'default'"
          @click="time_duration = preset"
        >
          {{ preset }}
        </el-button>
      </div>
    </div>

    <!-- 时间单位 -->
    <div class="rotation-unit">
      <div class="unit-label">时间单位</div>
      <div class="unit-options">
        <div class="unit-option" :class="{ active: time_unit === 4 }" @click="time_unit = 4">
          <el-icon><Calendar /></el-icon>
          <span>天</span>
        </div>
        <div class="unit-option" :class="{ active: time_unit === 5 }" @click="time_unit = 5">
          <el-icon><Clock /></el-icon>
          <span>小时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 设置组样式 */
.settings-group {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

/* 组标题样式 */
.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;

  .el-icon {
    font-size: 14px;
    color: #3b82f6;
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
  }
}

/* 轮换设置样式 */
.rotation-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rotation-period {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.period-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.period-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-slider-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-value-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.period-number {
  font-size: 24px;
  font-weight: 700;
  color: #3b82f6;
  min-width: 40px;
  text-align: center;
}

.period-unit {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  padding: 4px 8px;
  background: #e5e7eb;
  border-radius: 4px;
}

.period-slider {
  :deep(.el-slider__runway) {
    background: #e5e7eb;
    height: 6px;
    border-radius: 3px;
  }

  :deep(.el-slider__bar) {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
    border-radius: 3px;
  }

  :deep(.el-slider__button) {
    width: 18px;
    height: 18px;
    border: 2px solid #3b82f6;
    background: white;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
    }
  }
}

.period-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  width: 100%;

  // 去掉 Element Plus 按钮的默认间距
  .el-button + .el-button {
    margin-left: 0 !important;
  }
}

.preset-btn {
  width: 100%;
  height: 28px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
  padding: 0 8px;

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-1px);
  }

  &.el-button--primary {
    background: #3b82f6;
    border-color: #3b82f6;
  }
}

.rotation-unit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.unit-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.unit-options {
  display: flex;
  gap: 8px;
}

.unit-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #3b82f6;
    background: #eff6ff;
  }

  &.active {
    border-color: #3b82f6;
    background: #eff6ff;

    .el-icon {
      color: #3b82f6;
    }

    span {
      color: #3b82f6;
      font-weight: 600;
    }
  }

  .el-icon {
    font-size: 14px;
    color: #6b7280;
    transition: color 0.2s ease;
  }

  span {
    font-size: 12px;
    color: #374151;
    transition: all 0.2s ease;
  }
}
</style>
