<script setup lang="ts">
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { ArrowRight } from "@element-plus/icons-vue"
import type * as ElementPlusIconsVue from "@element-plus/icons-vue"
import { getNavigationCards } from "@/common/constants/platforms"
import { useSidebarStore } from "@/pinia/stores/sidebar"
import { usePermissionStore } from "@/pinia/stores/permission"

const router = useRouter()
const sidebarStore = useSidebarStore()
const permissionStore = usePermissionStore()

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

const navigationCards = ref<NavigationCard[]>(getNavigationCards())

const filteredCards = computed(() => {
  return navigationCards.value.filter((card) => {
    // 检查用户是否有该平台的路由权限
    return hasPlatformRoutes(card.id)
  })
})

// 检查用户是否有指定平台的路由权限
const hasPlatformRoutes = (platformId: string): boolean => {
  if (!permissionStore.routes || permissionStore.routes.length === 0) {
    return false
  }
  
  // 递归检查路由中是否有该平台的路由
  const checkRoutes = (routes: any[]): boolean => {
    for (const route of routes) {
      // 检查当前路由是否属于该平台
      if (route.meta?.platforms?.includes(platformId)) {
        return true
      }
      // 递归检查子路由
      if (route.children && checkRoutes(route.children)) {
        return true
      }
    }
    return false
  }
  
  return checkRoutes(permissionStore.routes)
}

const handleCardClick = (card: NavigationCard) => {
  // 直接使用卡片ID作为平台标识
  if (card.id) {
    // 标记为来自 navigation 跳转
    sidebarStore.setPlatformFilter(card.id, permissionStore.routes, true)
  }

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
  /* 使用 clamp 函数精确控制尺寸范围 */
  padding: clamp(1rem, 2.5vw, 3rem);
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
  /* 使用 clamp 精确控制间距 */
  margin-bottom: clamp(1.5rem, 4vw, 4rem);
  position: relative;
  z-index: 1;

  .page-title {
    /* 使用 clamp 控制字体大小范围 */
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 700;
    color: #1e293b;
    margin-bottom: clamp(0.5rem, 1.5vw, 1.5rem);
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: -0.025em;
  }

  .page-subtitle {
    font-size: clamp(0.8rem, 2vw, 1.2rem);
    color: #64748b;
    margin: 0;
    font-weight: 500;
  }
}

.navigation-grid {
  display: grid;
  /* 固定3列布局，确保每行显示3个卡片 */
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(1rem, 2.5vw, 2.5rem);
  max-width: clamp(800px, 90vw, 1400px);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.navigation-card {
  background: rgba(255, 255, 255, 0.95);
  /* 使用 clamp 精确控制圆角和内边距 */
  border-radius: clamp(0.5rem, 1.5vw, 1.5rem);
  padding: clamp(1rem, 2.5vw, 2.5rem);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  /* 使用 clamp 控制间距 */
  gap: clamp(0.8rem, 2vw, 2rem);
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
    /* 使用 clamp 精确控制图标尺寸 */
    width: clamp(2.5rem, 5vw, 4rem);
    height: clamp(2.5rem, 5vw, 4rem);
    border-radius: clamp(0.4rem, 1vw, 1rem);
    background: linear-gradient(135deg, var(--card-color), color-mix(in srgb, var(--card-color) 85%, black));
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .card-content {
    flex: 1;

    .card-title {
      /* 使用 clamp 精确控制字体大小 */
      font-size: clamp(0.9rem, 2.5vw, 1.4rem);
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 clamp(0.3rem, 0.8vw, 0.8rem) 0;
      letter-spacing: -0.025em;
    }

    .card-description {
      /* 使用 clamp 精确控制字体大小 */
      font-size: clamp(0.7rem, 1.8vw, 1rem);
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

/* 优化移动端响应式设计 - 进一步减少差异 */
@media (max-width: 1024px) {
  .navigation-grid {
    /* 中等屏幕下使用2列布局 */
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .navigation-page {
    padding: clamp(0.8rem, 3vw, 1.5rem);
  }

  .navigation-grid {
    /* 小屏幕下使用单列布局，保持一致的间距 */
    grid-template-columns: 1fr;
    gap: clamp(1rem, 3vw, 2rem);
  }
}

/* 针对超小屏幕的额外优化 */
@media (max-width: 480px) {
  .navigation-header {
    margin-bottom: clamp(1rem, 5vw, 2rem);

    .page-title {
      font-size: clamp(1.2rem, 6vw, 1.8rem);
    }

    .page-subtitle {
      font-size: clamp(0.7rem, 3vw, 1rem);
    }
  }

  .navigation-card {
    padding: clamp(0.8rem, 4vw, 1.5rem);
    gap: clamp(0.6rem, 3vw, 1.2rem);

    .card-icon {
      width: clamp(2rem, 8vw, 3rem);
      height: clamp(2rem, 8vw, 3rem);
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
