<template>
  <section class="directory-view">
    <div class="panel-heading">
      <div class="directory-title">
        <el-icon class="directory-title-icon"><FolderOpened /></el-icon>
        <div class="directory-title-text">
          <div class="directory-title-row">
            <h3>{{ activeDirectory.name || "全部资源" }}</h3>
            <span class="directory-kind">Directory</span>
          </div>
          <p>{{ directoryChildren.length }} 个子资源</p>
        </div>
      </div>
      <div class="panel-actions">
        <el-button size="small" :icon="FolderAdd" @click="$emit('create-directory')">目录</el-button>
        <el-button size="small" type="primary" :icon="DocumentAdd" @click="$emit('create-file')">脚本</el-button>
        <el-button
          v-if="activeDirectory.id"
          size="small"
          type="danger"
          plain
          :icon="Delete"
          @click="$emit('delete', activeDirectory)"
          >删除</el-button
        >
      </div>
    </div>

    <div class="resource-grid" v-loading="childrenLoading">
      <button
        v-for="item in directoryChildren"
        :key="item.id"
        class="resource-item"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="resource-icon" :class="item.kind.toLowerCase()">
          <SvgIcon v-if="item.kind === 'FILE'" :name="getFileIconName(item.name)" size="20px" class="file-icon" />
          <el-icon v-else>
            <Folder />
          </el-icon>
        </span>
        <span class="resource-meta">
          <strong>{{ item.name }}</strong>
          <small>{{ item.kind === "DIRECTORY" ? "目录" : inferLanguage(item.name) }}</small>
        </span>
        <el-tag v-if="item.kind === 'FILE'" size="small" effect="plain">{{ getFileExt(item.name) || "file" }}</el-tag>
      </button>
      <div v-if="!childrenLoading && directoryChildren.length === 0" class="resource-empty">
        <el-empty :image-size="130" description="当前目录暂无资源" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Delete, DocumentAdd, Folder, FolderAdd, FolderOpened } from "@element-plus/icons-vue"
import { getFileExt, getFileIconName, inferLanguage } from "../composables/useCodebookFile"
import type { codebook } from "@/api/task/codebook/types/codebook"

defineProps<{
  activeDirectory: codebook
  directoryChildren: codebook[]
  childrenLoading: boolean
}>()

defineEmits<{
  (e: "create-directory"): void
  (e: "create-file"): void
  (e: "delete", row: codebook): void
  (e: "select", row: codebook): void
}>()
</script>

<style lang="scss" scoped>
.directory-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 8px 18px;
  box-sizing: border-box;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.directory-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.directory-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
}

.directory-title-text {
  min-width: 0;

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.directory-title-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;

  h3 {
    margin: 0;
    overflow: hidden;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.directory-kind {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.panel-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;

  :deep(.el-button) {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
  }
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  flex: 1;
  align-content: start;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 68px;
  padding: 0 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
  }
}

.resource-empty {
  display: grid;
  grid-column: 1 / -1;
  min-height: 360px;
  place-items: center;
}

.resource-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;

  &.directory {
    color: #d97706;
    background: #fffbeb;
  }
}

.resource-meta {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #111827;
    font-size: 14px;
  }

  small {
    color: #64748b;
    font-size: 12px;
  }
}
</style>
