<template>
  <div class="model-catalog-panel">
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

          <div class="group-actions">
            <el-tooltip v-if="canDeleteModelGroup" content="删除分组">
              <AuthButton
                class="delete-button"
                type="danger"
                :icon="Delete"
                circle
                text
                :capability="CMDB_CAPABILITIES.Model.GroupDelete"
                @click.stop="emit('delete-group', group)"
              />
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div v-if="selectedGroup && selectedGroup.models && selectedGroup.models.length > 0" class="models-section">
        <div class="section-header">
          <h2 class="section-title">{{ selectedGroup.group_name }}</h2>
          <div class="section-count">{{ selectedGroup.models?.length || 0 }} 个模型</div>
        </div>

        <div class="model-grid">
          <div v-for="model in selectedGroup.models" :key="model.id" class="model-card-wrapper">
            <div
              class="model-card"
              :class="{ 'is-clickable': canViewModelDetail, 'is-disabled': !canViewModelDetail }"
              @click="emit('model-click', model)"
            >
              <div class="model-header">
                <div class="model-icon-wrapper">
                  <img
                    v-if="isImageUrl(model.icon)"
                    :src="model.icon"
                    :alt="model.name"
                    class="model-icon"
                    @error="handleImageError"
                  />
                  <i v-else-if="model.icon" :class="getIconClass(model.icon)" class="model-icon-font" />
                  <el-icon v-else class="model-icon-default">
                    <Document />
                  </el-icon>
                </div>
              </div>

              <div class="model-info">
                <h3 class="model-name">{{ model.name }}</h3>
                <div class="model-uid">{{ model.uid }}</div>
              </div>

              <div class="model-count">{{ model.total }}</div>
              <el-tag v-if="getModelStatus(model) !== 'unknown'" class="model-status" size="small" effect="plain">
                {{ getModelStatus(model) === "open" ? "启用" : "停用" }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="selectedGroup && (!selectedGroup.models || selectedGroup.models.length === 0)"
        class="empty-selection"
      >
        <el-empty description="该分组暂无模型" :image-size="120" />
      </div>

      <div v-else-if="groups.length === 0" class="empty-selection">
        <el-empty description="未找到匹配的模型" :image-size="120" />
      </div>

      <div v-else class="empty-selection">
        <el-empty description="请选择左侧分组查看模型" :image-size="120" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete, Document } from "@element-plus/icons-vue"
import type { Model, Models } from "@/api/model/types/model"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { CMDB_CAPABILITIES } from "@/common/auth/capability"
import { getIconClass, getModelStatus, isImageUrl } from "../utils/modelDisplay"

defineProps<{
  groups: Models[]
  selectedGroup: Models | null
  canViewModelDetail: boolean
  canDeleteModelGroup: boolean
}>()

const emit = defineEmits<{
  "select-group": [groupId: number]
  "delete-group": [group: Models]
  "model-click": [model: Model]
}>()

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.warn("图片加载失败:", target.src)
  target.style.display = "none"
}
</script>

<style lang="scss" scoped>
.model-catalog-panel {
  display: flex;
  flex: 1;
  width: 100%;
  min-height: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 292px;
  min-width: 292px;
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
  min-height: 68px;
  padding: 18px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.sidebar-header h3,
.section-title {
  margin: 0;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
}

.total-groups,
.section-count,
.model-count {
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

.section-count,
.model-count {
  color: #075985;
  background: #e0f2fe;
  border: 1px solid #bae6fd;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
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

    .group-actions {
      opacity: 1;
    }
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

.group-actions {
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.delete-button {
  width: 28px;
  height: 28px;
  color: #dc2626;

  &:hover {
    background: #fee2e2;
  }
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
  grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
  align-content: start;
  gap: 14px;
  min-height: 0;
  padding: 18px;
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

.model-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.model-icon-font {
  color: #0284c7;
  font-family: "iconfont" !important;
  font-size: 22px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.model-icon-default {
  color: #94a3b8;
  font-size: 22px;
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

.model-status {
  flex-shrink: 0;
  height: 22px;
  border-radius: 999px;
  font-weight: 700;
}

@media (min-width: 1440px) {
  .sidebar {
    width: 320px;
    min-width: 320px;
  }

  .model-grid {
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  }
}

@media (max-width: 768px) {
  .model-catalog-panel {
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
    overflow-x: auto;
  }

  .group-list-item {
    min-width: 180px;
    margin-bottom: 0;
  }

  .group-actions {
    opacity: 1;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
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
