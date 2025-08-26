<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/pinia/stores/user'
import { storeToRefs } from 'pinia'
import { 
  ArrowRight 
} from '@element-plus/icons-vue'
import type * as ElementPlusIconsVue from "@element-plus/icons-vue"
type ElementPlusIconsName = keyof typeof ElementPlusIconsVue

interface NavigationCard {
  id: string
  title: string
  description: string
  icon: ElementPlusIconsName
  color: string
  route: string
  permission?: string
}

const router = useRouter()
const userStore = useUserStore()
const { roles } = storeToRefs(userStore)

const navigationCards = ref<NavigationCard[]>([
  {
    id: 'cmdb',
    title: 'CMDB',
    description: '配置管理数据库，管理IT基础设施和配置项',
    icon: 'DataBoard',
    color: '#409EFF',
    route: '/cmdb/dashboard',
    permission: 'cmdb'
  },
  {
    id: 'order',
    title: '工单',
    description: '处理变更申请和工单流程',
    icon: 'Tickets',
    color: '#F56C6C',
    route: '/cmdb/order/start',
    permission: 'order'
  },
  {
    id: 'alert',
    title: '告警平台',
    description: '监控告警管理和处理',
    icon: 'Monitor',
    color: '#E6A23C',
    route: '/alert',
    permission: 'alert'
  },
  {
    id: 'system',
    title: '系统配置',
    description: '用户、角色、权限等系统配置',
    icon: 'Setting',
    color: '#9C27B0',
    route: '/cmdb/system/menu',
    permission: 'system'
  },
  {
    id: 'change',
    title: '变更平台',
    description: 'IT变更管理和审批流程',
    icon: 'Connection',
    color: '#67C23A',
    route: '/cmdb/rota',
    permission: 'change'
  },
  {
    id: 'automation',
    title: '自动化平台',
    description: '自动化任务和流程管理',
    icon: 'List',
    color: '#909399',
    route: '/cmdb/task/codebook',
    permission: 'automation'
  }
])

const filteredCards = computed(() => {
  // 临时显示所有卡片，不进行权限过滤
  return navigationCards.value
  // return navigationCards.value.filter(card => {
  //   if (!card.permission) return true
  //   return roles.value.includes(card.permission)
  // })
})

const handleCardClick = (card: NavigationCard) => {
  router.push(card.route)
}
</script>

<template>
  <div class="navigation-page">
    <div class="navigation-header">
      <h1 class="page-title">IT 运维管理平台</h1>
      <p class="page-subtitle">请选择您要访问的功能模块</p>
    </div>
    
    <div class="navigation-grid">
      <div
        v-for="card in filteredCards"
        :key="card.id"
        class="navigation-card"
        :style="{ '--card-color': card.color }"
        @click="handleCardClick(card)"
      >
        <div class="card-icon">
          <el-icon :size="32">
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-description">{{ card.description }}</p>
        </div>
        <div class="card-arrow">
          <el-icon>
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-page {
  padding: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: calc(100vh - 80px);
}

.navigation-header {
  text-align: center;
  margin-bottom: 60px;
  
  .page-title {
    font-size: 36px;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 16px;
  }
  
  .page-subtitle {
    font-size: 18px;
    color: #7f8c8d;
    margin: 0;
  }
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1;
  overflow-y: auto;
}

.navigation-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  padding-top: 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--card-color);
    border-radius: 16px 16px 0 0;
    transition: height 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
    
    &::before {
      height: 6px;
      border-radius: 16px 16px 0 0;
    }
    
    .card-arrow {
      transform: translateX(8px);
      opacity: 1;
    }
  }
  
  .card-icon {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: var(--card-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .card-content {
    flex: 1;
    
    .card-title {
      font-size: 20px;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 8px 0;
    }
    
    .card-description {
      font-size: 14px;
      color: #7f8c8d;
      margin: 0;
      line-height: 1.5;
    }
  }
  
  .card-arrow {
    flex-shrink: 0;
    color: var(--card-color);
    opacity: 0.6;
    transition: all 0.3s ease;
  }
}

@media (max-width: 768px) {
  .navigation-page {
    padding: 20px;
  }
  
  .navigation-header {
    margin-bottom: 40px;
    
    .page-title {
      font-size: 28px;
    }
    
    .page-subtitle {
      font-size: 16px;
    }
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .navigation-card {
    padding: 24px;
    padding-top: 28px;
    
    .card-icon {
      width: 48px;
      height: 48px;
      
      .el-icon {
        font-size: 24px;
      }
    }
    
    .card-content {
      .card-title {
        font-size: 18px;
      }
      
      .card-description {
        font-size: 13px;
      }
    }
  }
}
</style>
