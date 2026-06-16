<template>
  <div class="resource-desc-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 详情内容 -->
    <div v-else-if="resourceData" class="content-container">
      <!-- 按分组展示字段 -->
      <div v-for="group in attributeGroups" :key="group.group_id" class="desc-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>{{ group.group_name }}</span>
          <el-tag size="small" type="info">{{ group.attributes?.length || 0 }} 个字段</el-tag>
        </div>

        <div v-if="getNonFileFields(group.attributes || []).length" class="field-grid">
          <div v-for="(item, index) of getNonFileFields(group.attributes || [])" :key="index" class="field-row">
            <div class="field-label">{{ item.field_name }}</div>
            <div class="field-content">
              <SecureFieldView
                v-if="item.secure"
                :content="resourceData.data[item.field_uid]"
                :is-displaying="!!resourceData.data[`${item.field_uid}_secure_display`]"
                :show-content="false"
                :compact="true"
                @view-click="handleSecureClick(item)"
                @display-change="(isDisplaying) => handleSecureDisplayChange(item, isDisplaying)"
                @copy="(content) => handleCopySecureContent(content)"
              />
              <el-button
                v-else-if="item.link"
                type="primary"
                text
                :icon="Link"
                @click="openNewPage(resourceData.data[item.field_uid])"
              >
                {{ resourceData.data[item.field_uid] }}
              </el-button>
              <span v-else class="field-text">
                {{ resourceData.data[item.field_uid] || "暂无数据" }}
              </span>
            </div>
          </div>
        </div>

        <!-- 多行文本字段 - 独占一行 -->
        <div v-if="getMultilineFields(group.attributes || []).length" class="field-stack">
          <div v-for="(item, index) of getMultilineFields(group.attributes || [])" :key="index" class="field-row is-wide">
              <div class="field-label">{{ item.field_name }}</div>
              <div class="field-content">
                <div class="multiline-content">
                  <SecureFieldView
                    v-if="item.secure"
                    class="multiline-secure-view"
                    :content="resourceData.data[item.field_uid]"
                    :is-displaying="!!resourceData.data[`${item.field_uid}_secure_display`]"
                    :inline-content="true"
                    :auto-close-time="8"
                    @view-click="handleSecureClick(item)"
                    @display-change="(isDisplaying) => handleSecureDisplayChange(item, isDisplaying)"
                    @copy="(content) => handleCopySecureContent(content)"
                  />
                  <template v-else>{{ resourceData.data[item.field_uid] || "暂无内容" }}</template>
                </div>
              </div>
            </div>
        </div>

        <!-- 文件字段 - 独占一行 -->
        <div v-if="getFileFields(group.attributes || []).length > 0" class="field-stack">
          <div v-for="(item, index) of getFileFields(group.attributes || [])" :key="index" class="field-row is-wide">
              <div class="field-label">{{ item.field_name }}</div>
              <div class="file-list">
                <div
                  v-for="(file, fileIndex) in resourceData.data[item.field_uid] || []"
                  :key="fileIndex"
                  class="file-item"
                >
                  <el-icon class="file-icon"><Document /></el-icon>
                  <span class="file-name">{{ file.name }}</span>
                  <el-button
                    size="small"
                    :icon="Download"
                    class="file-download-button"
                    @click="handleDownload(file)"
                    title="下载文件"
                  />
                </div>
                <el-empty v-if="!resourceData.data[item.field_uid]?.length" description="暂无文件" :image-size="60" />
              </div>
            </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <el-empty description="暂无数据" :image-size="120">
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, Link, Setting, Document } from "@element-plus/icons-vue"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"
import { useResourceDescription } from "../../composables/detail/useResourceDescription"

interface Props {
  modelUid: string
  resourceId: string
}

const props = defineProps<Props>()
const {
  attributeGroups,
  loading,
  resourceData,
  getFileFields,
  getMultilineFields,
  getNonFileFields,
  handleCopySecureContent,
  handleDownload,
  handleSecureClick,
  handleSecureDisplayChange,
  openNewPage,
  refreshData
} = useResourceDescription(props)
</script>

<style lang="scss" scoped>
.resource-desc-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.loading-container {
  padding: 40px 0;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 16px;

  .desc-section {
    margin-bottom: 22px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 15px;
      font-weight: 600;
      color: #374151;

      .section-icon {
        color: #3b82f6;
        font-size: 16px;
      }
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: #ffffff;
    }

    .field-row {
      min-height: 64px;
      padding: 10px 14px;
      background: #ffffff;
      border-right: 1px solid #edf0f5;
      border-bottom: 1px solid #edf0f5;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;

      &:hover {
        background: #fafcff;
      }

      .field-label {
        font-weight: 600;
        color: #64748b;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: "";
          width: 2px;
          height: 12px;
          background: #3b82f6;
          border-radius: 1px;
        }
      }

      .field-content {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        overflow: hidden;
        min-width: 0;

        .field-text {
          color: #1f2937;
          font-weight: 500;
          font-size: 13px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }

      &.is-wide {
        min-height: auto;
        margin-top: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
    }
  }
}

.field-stack {
  margin-top: 12px;
}

.file-list {
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  min-width: 0;
  padding: 4px 0;

  /* 自定义滚动条 */
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

  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    transition: all 0.2s ease;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f9fafb;
      border-color: #3b82f6;
    }

    .file-icon {
      color: #3b82f6;
      font-size: 18px;
      flex-shrink: 0;
    }

    .file-name {
      flex: 1;
      font-size: 13px;
      color: #1f2937;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.5;
    }

    .file-download-button {
      --el-button-hover-bg-color: #eff6ff;
      --el-button-hover-border-color: #bfdbfe;
      --el-button-hover-text-color: #2563eb;
      --el-button-active-bg-color: #dbeafe;
      --el-button-active-border-color: #93c5fd;
      --el-button-active-text-color: #1d4ed8;

      padding: 6px;
      min-height: 28px;
      width: 28px;
      border-radius: 6px;
      background: #ffffff;
      border: 1px solid #dbe3ef;
      color: #64748b;
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;

      &:hover {
        background: #eff6ff;
        border-color: #bfdbfe;
        color: #2563eb;
      }

      .el-icon {
        font-size: 14px;
        color: currentColor;
      }
    }
  }
}

.multiline-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
  width: 100%;
  color: #374151;
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  min-height: 60px;
}

.field-content {
  color: #374151;
  font-weight: 500;
}

.empty-container {
  padding: 60px 0;
  text-align: center;
}
</style>
