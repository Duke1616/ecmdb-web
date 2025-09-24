<template>
  <div class="workspace-overview">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon alerts">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ alertStats.total }}</div>
          <div class="stat-label">总告警数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon critical">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ alertStats.critical }}</div>
          <div class="stat-label">严重告警</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rules">
          <el-icon><Setting /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ alertStats.rules }}</div>
          <div class="stat-label">告警规则</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon noise-rules">
          <el-icon><Filter /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ alertStats.noiseRules }}</div>
          <div class="stat-label">降噪规则</div>
        </div>
      </div>
    </div>

    <div class="recent-activity">
      <h3>最近活动</h3>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            <el-icon><component :is="activity.icon" /></el-icon>
          </div>
          <div class="activity-content">
            <div class="activity-text">{{ activity.text }}</div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Warning, WarningFilled, Setting, Filter } from "@element-plus/icons-vue"

// 统计数据
const alertStats = ref({
  total: 156,
  critical: 8,
  rules: 24,
  noiseRules: 12
})

// 最近活动
const recentActivities = ref([
  {
    id: 1,
    type: "alert",
    icon: "Warning",
    text: "CPU使用率超过80%的告警触发",
    time: "2分钟前"
  },
  {
    id: 2,
    type: "rule",
    icon: "Setting",
    text: "新增了内存使用率告警规则",
    time: "1小时前"
  },
  {
    id: 3,
    type: "member",
    icon: "User",
    text: "李四加入了告警工作空间",
    time: "1天前"
  },
  {
    id: 4,
    type: "update",
    icon: "Edit",
    text: "更新了降噪规则配置",
    time: "2天前"
  },
  {
    id: 5,
    type: "project",
    icon: "Folder",
    text: "创建了新的告警项目",
    time: "3天前"
  }
])

// 刷新数据
const refresh = () => {
  // TODO: 实现数据刷新逻辑
  console.log("刷新工作台数据")
}

// 暴露方法给父组件
defineExpose({
  refresh
})
</script>

<style lang="scss" scoped>
.workspace-overview {
  height: 100%;
  overflow-y: auto;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;

    .stat-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #ffffff;

        &.alerts {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        &.critical {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        &.rules {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        &.noise-rules {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }
      }
    }
  }

  .recent-activity {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 24px;

    h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .activity-list {
      .activity-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;

        &:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #ffffff;

          &.alert {
            background: #f59e0b;
          }

          &.rule {
            background: #3b82f6;
          }

          &.member {
            background: #10b981;
          }

          &.update {
            background: #f59e0b;
          }

          &.project {
            background: #3b82f6;
          }
        }

        .activity-content {
          flex: 1;

          .activity-text {
            font-size: 14px;
            color: #1f2937;
            margin-bottom: 4px;
          }

          .activity-time {
            font-size: 12px;
            color: #6b7280;
          }
        }
      }
    }
  }
}
</style>
