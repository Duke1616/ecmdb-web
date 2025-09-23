<template>
  <div class="noise-page">
    <div class="noise-header">
      <h3>降噪配置</h3>
      <p class="noise-description">配置告警降噪策略，减少重复告警和噪音</p>
    </div>

    <div class="noise-content" v-loading="loading">
      <!-- 分组聚合规则 -->
      <AggregateRules
        :workspace-id="workspaceId"
        :aggregate-rule="noiseConfig?.aggregate_rule"
        @refresh="loadNoiseConfig"
      />

      <!-- 抑制规则（全局） -->
      <InhibitRules :inhibit-rules="noiseConfig?.inhibit_rules" />

      <!-- 降噪统计 -->
      <div class="noise-section">
        <div class="section-header">
          <h4>降噪统计</h4>
        </div>
        <div class="section-content">
          <div class="noise-stats">
            <div class="stat-item">
              <div class="stat-number">{{ noiseStats.totalAlerts }}</div>
              <div class="stat-label">总告警数</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ noiseStats.filteredAlerts }}</div>
              <div class="stat-label">已过滤</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ noiseStats.noiseRatio }}%</div>
              <div class="stat-label">降噪率</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ noiseStats.effectiveAlerts }}</div>
              <div class="stat-label">有效告警</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { ElMessage } from "element-plus"
import AggregateRules from "./aggregate_rules.vue"
import InhibitRules from "./inhibit_rules.vue"
import { getNoiseConfigApi } from "@/api/noise"
import type { RetrieveNoiseConfig } from "@/api/noise/types"

// 接收工作空间ID
const props = defineProps<{
  workspaceId: number
}>()

// 降噪配置数据
const noiseConfig = ref<RetrieveNoiseConfig | null>(null)
const loading = ref(false)

// 降噪统计
const noiseStats = ref({
  totalAlerts: 1256,
  filteredAlerts: 342,
  noiseRatio: 27,
  effectiveAlerts: 914
})

// 加载降噪配置
const loadNoiseConfig = async () => {
  try {
    loading.value = true
    const { data } = await getNoiseConfigApi({ workspace_id: props.workspaceId })
    // 如果 data.data 存在，使用 data.data；否则直接使用 data
    noiseConfig.value = data
  } catch (error) {
    console.error("加载降噪配置失败:", error)
    ElMessage.error("加载降噪配置失败")
  } finally {
    loading.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadNoiseConfig()
})
</script>

<style lang="scss" scoped>
.noise-page {
  height: 100%;
  display: flex;
  flex-direction: column;

  .noise-header {
    margin-bottom: 24px;
    flex-shrink: 0;

    h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .noise-description {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }
  }

  .noise-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;

    // 自定义滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;

      &:hover {
        background: #94a3b8;
      }
    }

    .noise-section {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;

        h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
      }

      .section-content {
        padding: 20px;

        .noise-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;

          .stat-item {
            text-align: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e5e7eb;

            .stat-number {
              font-size: 24px;
              font-weight: 600;
              color: #8b5cf6;
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}
</style>
