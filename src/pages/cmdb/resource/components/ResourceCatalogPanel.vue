<template>
  <div class="resource-catalog-panel">
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>模型分组</h3>
        <div class="total-groups">{{ groups.length }} 个分组</div>
      </div>

      <div class="group-list">
        <div
          v-for="group in groups"
          :key="group.group_id"
          class="group-list-item"
          :class="{ 'group-active': selectedGroup?.group_id === group.group_id }"
          @click="emit('select-group', group.group_id)"
        >
          <div class="group-content">
            <div class="group-title">{{ group.group_name }}</div>
            <div class="group-badge">{{ group.models?.length || 0 }} 个模型</div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div v-if="selectedGroup && selectedGroup.models && selectedGroup.models.length > 0" class="models-section">
        <div class="section-header">
          <div>
            <h2 class="section-title">{{ selectedGroup.group_name }}</h2>
            <p class="section-subtitle">选择模型进入对应资产列表</p>
          </div>
          <div class="section-count">{{ selectedGroup.models?.length || 0 }} 个模型</div>
        </div>

        <div class="model-grid">
          <div v-for="model in selectedGroup.models" :key="model.id" class="model-card-wrapper">
            <div
              class="model-card"
              :class="{ 'is-clickable': canViewResources, 'is-disabled': !canViewResources }"
              @click="emit('model-click', model)"
            >
              <div class="model-header">
                <div class="model-icon-wrapper">
                  <AppIcon :name="model.icon" fallback="Box" class="model-app-icon" />
                </div>
              </div>

              <div class="model-info">
                <h3 class="model-name">{{ model.name }}</h3>
                <div class="model-uid">{{ model.uid }}</div>
              </div>

              <div class="asset-count" :class="{ 'is-empty': Number(model.resource_count || 0) === 0 }">
                {{ Number(model.resource_count || 0) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="selectedGroup && (!selectedGroup.models || selectedGroup.models.length === 0)"
        class="empty-selection"
      >
        <el-empty description="该分组暂无匹配模型" :image-size="120" />
      </div>

      <div v-else-if="groups.length === 0" class="empty-selection">
        <el-empty description="未找到匹配的资产模型" :image-size="120" />
      </div>

      <div v-else class="empty-selection">
        <el-empty description="请选择左侧分组查看资产模型" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Model } from "@/api/cmdb/model/types/model"
import type { ModelGroupView } from "@/common/utils/model"
import AppIcon from "@/common/components/AppIcon/index.vue"

defineProps<{
  groups: ModelGroupView[]
  selectedGroup: ModelGroupView | null
  canViewResources: boolean
}>()

const emit = defineEmits<{
  "select-group": [groupId: number]
  "model-click": [model: Model]
}>()

</script>

<style lang="scss" scoped>
.resource-catalog-panel {
  --catalog-sidebar-width: clamp(292px, 18vw, 320px);
  --catalog-panel-gap: clamp(12px, 1vw, 18px);
  --catalog-panel-pad: clamp(14px, 1.1vw, 18px);

  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: var(--catalog-sidebar-width);
  min-width: var(--catalog-sidebar-width);
  overflow: hidden;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
}

.sidebar-header,
.section-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  min-height: 56px;
  padding: 0 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.sidebar-header h3,
.section-title {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
}

.section-subtitle {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.3;
}

.total-groups,
.section-count,
.asset-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.total-groups {
  color: #475569;
  background: #e2e8f0;
}

.section-count {
  color: #075985;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

.asset-count {
  flex-shrink: 0;
  color: #075985;
  background: #e0f2fe;
  border: 1px solid #bae6fd;

  &.is-empty {
    color: #64748b;
    background: #f1f5f9;
    border-color: #e2e8f0;
  }
}

.group-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  overflow-y: auto;
}

.group-list-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 72px;
  padding: 14px 14px 14px 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &::before {
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 0;
    width: 3px;
    content: "";
    background: transparent;
    border-radius: 0 999px 999px 0;
  }

  &:hover {
    background: #f8fafc;
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }

  &.group-active {
    background: #eff6ff;
    border-color: #93c5fd;
    box-shadow: 0 8px 18px rgba(14, 165, 233, 0.12);

    &::before {
      background: #0ea5e9;
    }

    .group-title {
      color: #0f172a;
    }

    .group-badge {
      color: #0369a1;
    }
  }
}

.group-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 5px;
}

.group-title {
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-badge {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
}

.content-area {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: #ffffff;
}

.models-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.empty-selection {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  background: #ffffff;
}

.model-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-content: start;
  gap: var(--catalog-panel-gap);
  min-height: 0;
  padding: var(--catalog-panel-pad);
  overflow-y: auto;
}

.model-card-wrapper {
  min-width: 0;
}

.model-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 78px;
  padding: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    content: "";
    background: #0ea5e9;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &.is-clickable {
    cursor: pointer;

    &:hover {
      border-color: #7dd3fc;
      box-shadow: 0 10px 24px rgba(14, 165, 233, 0.13);
      transform: translateY(-2px);

      &::before {
        opacity: 1;
      }
    }
  }

  &.is-disabled {
    cursor: default;

    .model-name,
    .model-uid {
      color: #94a3b8;
    }
  }
}

.model-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.model-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.model-app-icon {
  width: 22px;
  height: 22px;
  font-size: 22px;
  color: #0284c7;
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  margin: 0 0 4px;
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-uid {
  margin: 0;
  overflow: hidden;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1440px) {
  .model-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .model-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .resource-catalog-panel {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: 0;
    max-height: 220px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .group-list {
    display: flex;
    gap: 10px;
    flex-direction: row;
    padding: 14px;
    overflow-x: auto;
  }

  .group-list-item {
    min-width: 180px;
    margin-bottom: 0;
    border-radius: 8px;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    height: auto;
    min-height: 56px;
    padding: 10px 20px;
  }
}

@media (max-width: 480px) {
  .model-grid {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .model-card {
    padding: 14px;
  }
}
</style>
