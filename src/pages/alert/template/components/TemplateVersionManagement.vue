<template>
  <el-card class="version-management-card">
    <template #header>
      <div class="card-header">
        <h3>版本管理</h3>
        <div class="header-actions">
          <span class="version-count">{{ templateVersions.length }} 个版本</span>
          <el-button size="small" type="primary" @click="handleCreateVersion"> 新增版本 </el-button>
        </div>
      </div>
    </template>

    <div class="version-list" v-if="hasVersions">
      <div
        v-for="version in templateVersions"
        :key="version.id"
        class="version-item"
        :class="{ active: version.id === template?.activeVersionId }"
        @click="handleSwitchVersion(version)"
      >
        <div class="version-main">
          <div class="version-title">
            <span class="version-name">{{ version.name }}</span>
            <div class="version-badges">
              <el-tag v-if="version.id === template?.activeVersionId" type="success" size="small">当前使用</el-tag>
              <el-tag v-if="version.id === currentVersionId" type="primary" size="small">查看中</el-tag>
              <span
                v-if="version.id !== template?.activeVersionId && version.id !== currentVersionId"
                class="version-badge-placeholder"
              />
            </div>
          </div>
          <div class="version-meta">
            <div class="version-remark">{{ version.remark || "无备注" }}</div>
            <div class="version-time">{{ formatTimestamp(version.ctime) }}</div>
          </div>
        </div>
        <div class="version-actions">
          <el-button
            v-if="version.id !== template?.activeVersionId"
            size="small"
            type="primary"
            @click.stop="handleSetActiveVersion(version.id)"
          >
            设为当前
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="version-empty">
      <el-empty description="暂无版本" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { ChannelTemplate, TemplateVersion } from "@/api/alert/template/types"
import { formatTimestamp } from "../utils"

interface Props {
  template: ChannelTemplate | null
  templateVersions: TemplateVersion[]
  currentVersionId: number | null
  hasVersions: boolean
}

interface Emits {
  (e: "create-version"): void
  (e: "switch-version", version: TemplateVersion): void
  (e: "set-active-version", versionId: number): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleCreateVersion = () => {
  emit("create-version")
}

const handleSwitchVersion = (version: TemplateVersion) => {
  emit("switch-version", version)
}

const handleSetActiveVersion = (versionId: number) => {
  emit("set-active-version", versionId)
}
</script>

<style lang="scss" scoped>
.version-management-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .version-count {
      font-size: 12px;
      color: #6b7280;
    }
  }
}

// 版本管理样式
.version-list {
  max-height: 400px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.version-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: border-color 0.2s;

  &:hover {
    border-color: #3b82f6;
  }

  &.active {
    border-color: #10b981;
  }
}

.version-main {
  flex: 1;
  min-width: 0;
}

.version-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.version-name {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.version-badges {
  display: flex;
  gap: 4px;
  align-items: center;
  min-height: 20px;
}

.version-badge-placeholder {
  display: inline-block;
  width: 0;
  height: 20px;
}

.version-meta {
  font-size: 12px;
  color: #6b7280;
}

.version-remark {
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-time {
  color: #9ca3af;
}

.version-actions {
  flex-shrink: 0;
  margin-left: 8px;
}

.version-empty {
  text-align: center;
  padding: 20px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 响应式设计
@media (max-width: 1024px) {
  .version-list {
    max-height: none;
  }
}
</style>
