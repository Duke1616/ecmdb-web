<template>
  <div class="alert-page">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">告警平台</h1>
          <p class="page-description">告警管理平台正在开发中...</p>
        </div>
        <div class="action-section">
          <el-button type="primary" :icon="ArrowLeft" @click="goToNavigation" class="back-button">
            返回平台导航
          </el-button>
        </div>
      </div>
    </div>

    <div class="page-content">
      <el-card class="feature-card">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><Warning /></el-icon>
            <span class="card-title">功能特性</span>
          </div>
        </template>

        <div class="feature-list">
          <div class="feature-item">
            <el-icon class="feature-icon"><Bell /></el-icon>
            <div class="feature-content">
              <h3>告警监控</h3>
              <p>实时监控和告警检测</p>
            </div>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Filter /></el-icon>
            <div class="feature-content">
              <h3>告警规则</h3>
              <p>告警规则配置和管理</p>
            </div>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Message /></el-icon>
            <div class="feature-content">
              <h3>通知管理</h3>
              <p>告警通知和消息推送</p>
            </div>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><TrendCharts /></el-icon>
            <div class="feature-content">
              <h3>告警分析</h3>
              <p>告警趋势分析和统计</p>
            </div>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Tools /></el-icon>
            <div class="feature-content">
              <h3>告警处理</h3>
              <p>告警处理和工单关联</p>
            </div>
          </div>

          <div class="feature-item">
            <el-icon class="feature-icon"><Setting /></el-icon>
            <div class="feature-content">
              <h3>系统配置</h3>
              <p>告警系统参数配置</p>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="status-card">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><InfoFilled /></el-icon>
            <span class="card-title">开发状态</span>
          </div>
        </template>

        <el-alert
          title="开发中"
          type="info"
          description="告警平台功能正在开发中，敬请期待！"
          show-icon
          :closable="false"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Warning,
  Bell,
  Filter,
  Message,
  TrendCharts,
  Tools,
  Setting,
  InfoFilled,
  ArrowLeft
} from "@element-plus/icons-vue"
import { useRouter } from "vue-router"

const router = useRouter()

const goToNavigation = () => {
  router.push("/navigation")
}
</script>

<style lang="scss" scoped>
.alert-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 3rem;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .title-section {
    flex: 1;
    text-align: left;
  }

  .action-section {
    flex-shrink: 0;
  }

  .page-title {
    font-size: 2.5rem;
    font-weight: 600;
    color: var(--el-color-danger);
    margin-bottom: 1rem;
  }

  .page-description {
    font-size: 1.1rem;
    color: var(--el-text-color-regular);
  }

  .back-button {
    font-size: 1rem;
    padding: 0.75rem 1.5rem;
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .title-section {
      text-align: center;
    }
  }
}

.page-content {
  display: grid;
  gap: 2rem;
  grid-template-columns: 2fr 1fr;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.feature-card,
.status-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .card-icon {
      font-size: 1.2rem;
      color: var(--el-color-danger);
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
    }
  }
}

.feature-list {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-danger);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 1.5rem;
    color: var(--el-color-danger);
    margin-top: 0.25rem;
  }

  .feature-content {
    flex: 1;

    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      font-size: 0.9rem;
      color: var(--el-text-color-regular);
      line-height: 1.4;
    }
  }
}

.status-card {
  .el-alert {
    border: none;
  }
}
</style>
