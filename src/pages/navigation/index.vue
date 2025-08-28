<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { ArrowRight } from "@element-plus/icons-vue"
import type * as ElementPlusIconsVue from "@element-plus/icons-vue"

const router = useRouter()

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

const navigationCards = ref<NavigationCard[]>([
  {
    id: "cmdb",
    title: "CMDB",
    description: "配置管理数据库，管理IT基础设施和配置项",
    icon: "DataBoard",
    color: "#3B82F6", // 更现代的蓝色
    route: "/cmdb/dashboard",
    permission: "cmdb"
  },
  {
    id: "order",
    title: "工单",
    description: "处理变更申请和工单流程",
    icon: "Tickets",
    color: "#EF4444", // 更现代的红色
    route: "/cmdb/order/start",
    permission: "order"
  },
  {
    id: "alert",
    title: "告警平台",
    description: "监控告警管理和处理",
    icon: "Monitor",
    color: "#F59E0B", // 更现代的橙色
    route: "/alert",
    permission: "alert"
  },
  {
    id: "system",
    title: "系统配置",
    description: "用户、角色、权限等系统配置",
    icon: "Setting",
    color: "#8B5CF6", // 更现代的紫色
    route: "/cmdb/system/menu",
    permission: "system"
  },
  {
    id: "change",
    title: "变更平台",
    description: "IT变更管理和审批流程",
    icon: "Connection",
    color: "#10B981", // 更现代的绿色
    route: "/cmdb/rota",
    permission: "change"
  },
  {
    id: "automation",
    title: "自动化平台",
    description: "自动化任务和流程管理",
    icon: "List",
    color: "#6B7280", // 更现代的灰色
    route: "/cmdb/task/codebook",
    permission: "automation"
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
    <!-- 优化了标题的视觉层次和间距 -->
    <div class="navigation-header">
      <h1 class="page-title">IT 运维管理平台</h1>
      <p class="page-subtitle">统一管理您的IT基础设施和运维流程</p>
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
          <el-icon :size="28">
            <component :is="card.icon" />
          </el-icon>
        </div>
        <div class="card-content">
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-description">{{ card.description }}</p>
        </div>
        <div class="card-arrow">
          <el-icon :size="20">
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-page {
  padding: 2.5rem;
  /* 使用更现代的渐变背景 */
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
  position: relative;
  height: 100%;

  /* 添加微妙的纹理效果 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
    pointer-events: none;
  }
}

.navigation-header {
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
  z-index: 1;

  .page-title {
    /* 改进了字体大小和权重 */
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 1rem;
    /* 添加文字阴影增强可读性 */
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.025em;
  }

  .page-subtitle {
    font-size: 1.125rem;
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }
}

.navigation-grid {
  display: grid;
  /* 优化了网格布局，更好的响应式设计 */
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.navigation-card {
  background: rgba(255, 255, 255, 0.95);
  /* 更现代的圆角和阴影效果 */
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  /* 更流畅的过渡动画 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  /* 添加边框增强视觉效果 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);

  /* 更精致的顶部装饰条 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--card-color), color-mix(in srgb, var(--card-color) 80%, white));
    transition: all 0.4s ease;
  }

  /* 添加微妙的光泽效果 */
  &::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: rotate(45deg);
    transition: all 0.6s ease;
    opacity: 0;
  }

  &:hover {
    /* 更明显的悬停效果 */
    transform: translateY(-8px) scale(1.02);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border-color: rgba(255, 255, 255, 0.4);

    &::before {
      height: 6px;
    }

    &::after {
      opacity: 1;
      transform: rotate(45deg) translate(50%, 50%);
    }

    .card-icon {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }

    .card-arrow {
      transform: translateX(8px);
      opacity: 1;
      color: var(--card-color);
    }
  }

  .card-icon {
    flex-shrink: 0;
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    /* 使用渐变背景增强视觉效果 */
    background: linear-gradient(135deg, var(--card-color), color-mix(in srgb, var(--card-color) 85%, black));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    /* 添加过渡动画 */
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .card-content {
    flex: 1;

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
      /* 改进字体渲染 */
      letter-spacing: -0.025em;
    }

    .card-description {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      line-height: 1.6;
      font-weight: 400;
    }
  }

  .card-arrow {
    flex-shrink: 0;
    color: #94a3b8;
    opacity: 0.7;
    /* 更流畅的箭头动画 */
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* 优化移动端响应式设计 */
@media (max-width: 768px) {
  .navigation-page {
    padding: 1.5rem;
    height: 100%;
  }

  .navigation-header {
    margin-bottom: 2.5rem;

    .page-title {
      font-size: 2rem;
    }

    .page-subtitle {
      font-size: 1rem;
    }
  }

  .navigation-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .navigation-card {
    padding: 1.5rem;
    gap: 1rem;

    .card-icon {
      width: 3rem;
      height: 3rem;
    }

    .card-content {
      .card-title {
        font-size: 1.125rem;
      }

      .card-description {
        font-size: 0.8125rem;
      }
    }
  }
}

/* 添加暗色模式支持 */
@media (prefers-color-scheme: dark) {
  .navigation-page {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  }

  .navigation-header {
    .page-title {
      color: #f1f5f9;
    }

    .page-subtitle {
      color: #94a3b8;
    }
  }

  .navigation-card {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);

    .card-content {
      .card-title {
        color: #f1f5f9;
      }

      .card-description {
        color: #94a3b8;
      }
    }

    .card-arrow {
      color: #64748b;
    }
  }
}
</style>
