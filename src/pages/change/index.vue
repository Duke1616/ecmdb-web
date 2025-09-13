<template>
  <div class="change-page">
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">变更平台</h1>
          <p class="page-description">变更管理平台正在开发中...</p>
        </div>
        <div class="action-section">
          <el-button 
            type="primary" 
            :icon="ArrowLeft" 
            @click="goToNavigation"
            class="back-button"
          >
            返回平台导航
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="page-content">
      <el-card class="feature-card">
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><Setting /></el-icon>
            <span class="card-title">功能特性</span>
          </div>
        </template>
        
        <div class="feature-list">
          <div class="feature-item">
            <el-icon class="feature-icon"><Document /></el-icon>
            <div class="feature-content">
              <h3>变更申请</h3>
              <p>提交和管理变更申请单</p>
            </div>
          </div>
          
          <div class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <div class="feature-content">
              <h3>审批流程</h3>
              <p>变更审批和流程管理</p>
            </div>
          </div>
          
          <div class="feature-item">
            <el-icon class="feature-icon"><Clock /></el-icon>
            <div class="feature-content">
              <h3>变更执行</h3>
              <p>变更执行和进度跟踪</p>
            </div>
          </div>
          
          <div class="feature-item">
            <el-icon class="feature-icon"><DataAnalysis /></el-icon>
            <div class="feature-content">
              <h3>变更分析</h3>
              <p>变更数据统计和分析</p>
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
          description="变更平台功能正在开发中，敬请期待！"
          show-icon
          :closable="false"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Setting, Document, Check, Clock, DataAnalysis, InfoFilled, ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goToNavigation = () => {
  router.push('/navigation')
}
</script>

<style lang="scss" scoped>
.change-page {
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
    color: var(--el-color-primary);
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
      color: var(--el-color-primary);
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
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .feature-icon {
    font-size: 1.5rem;
    color: var(--el-color-primary);
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
