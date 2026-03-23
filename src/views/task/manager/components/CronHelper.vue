<template>
  <el-popover ref="popoverRef" placement="bottom-end" :width="300" trigger="click" popper-class="cron-popover">
    <template #reference>
      <el-button link type="primary" class="cron-helper-trigger">
        <el-icon><MagicStick /></el-icon>
        <span class="ml-1">调度助手</span>
      </el-button>
    </template>

    <div class="cron-helper-content">
      <div class="helper-header">
        {{ type === TaskType.RECURRING ? "周期性任务预设" : "延时单次触发预设" }}
      </div>
      <div class="helper-grid">
        <div v-for="p in currentPresets" :key="p.label" class="helper-item" @click="selectPreset(p.value)">
          <div class="helper-top">
            <el-icon class="m-icon"><Timer /></el-icon>
            <span class="helper-label">{{ p.label }}</span>
          </div>
          <span class="helper-value">{{ p.value }}</span>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { MagicStick, Timer } from "@element-plus/icons-vue"
import { TaskType } from "@/api/etask/manager/type"

interface Props {
  type: TaskType
}

const props = defineProps<Props>()
const emit = defineEmits(["select"])

const popoverRef = ref()

const selectPreset = (val: string) => {
  emit("select", val)
  popoverRef.value?.hide()
}

// 动态生成基于当前时间的预设 (面向业务逻辑)
const currentPresets = computed(() => {
  if (props.type === TaskType.RECURRING) {
    return [
      { label: "每 5 秒 (极速监控)", value: "*/5 * * * * *" },
      { label: "每 1 分钟 (标准轮询)", value: "0 * * * * *" },
      { label: "每 5 分钟 (常规检查)", value: "0 */5 * * * *" },
      { label: "每 10 分钟 (业务批处理)", value: "0 */10 * * * *" },
      { label: "每小时 (整点任务)", value: "0 0 * * * *" },
      { label: "每天 0 点 (日终清理)", value: "0 0 0 * * *" },
      { label: "每周日 0 点 (数据归档)", value: "0 0 0 * * 0" }
    ]
  } else {
    // 单次触发: 计算相对于“现在”的未来时间点
    const now = new Date()

    const fmt = (d: Date) => `0 ${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth() + 1} *`

    const oneHour = new Date(now.getTime() + 60 * 60 * 1000)
    const threeHours = new Date(now.getTime() + 180 * 60 * 1000)

    // 明天凌晨
    const tomorrow00 = new Date(now)
    tomorrow00.setDate(now.getDate() + 1)
    tomorrow00.setHours(0, 0, 0, 0)

    return [
      { label: "立即执行", value: fmt(now) },
      { label: "5 分钟后执行", value: fmt(new Date(now.getTime() + 5 * 60 * 1000)) },
      { label: "1 小时后执行", value: fmt(oneHour) },
      { label: "3 小时后执行", value: fmt(threeHours) },
      { label: "明天凌晨 00:00", value: fmt(tomorrow00) }
    ]
  }
})
</script>

<style lang="scss">
/* 注意：由于 Popover 挂载在 body 之下，样式不能使用 scoped，或者使用 :deep 配合 popper-class */
.cron-popover {
  padding: 0 !important;
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid #e2e8f0 !important;

  .cron-helper-content {
    .helper-header {
      padding: 10px 16px;
      background: #f8fafc;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #f1f5f9;
    }

    .helper-grid {
      max-height: 320px;
      overflow-y: auto;
    }

    .helper-item {
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s;
      border-bottom: 1px solid #f8fafc;

      &:hover {
        background: #eff6ff;
        .m-icon {
          color: #3b82f6;
        }
        .helper-label {
          color: #1e40af;
        }
      }

      &:last-child {
        border-bottom: none;
      }

      .helper-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .m-icon {
          font-size: 14px;
          color: #94a3b8;
          transition: inherit;
        }

        .helper-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          transition: inherit;
        }
      }

      .helper-value {
        font-family: "Fira Code", monospace;
        font-size: 11px;
        color: #94a3b8;
        padding-left: 22px;
      }
    }
  }
}

.cron-helper-trigger {
  padding: 0 6px 0 0;
  height: 32px;
  font-size: 13px;

  .el-icon {
    font-size: 15px;
    margin-right: 2px;
  }
}
</style>
