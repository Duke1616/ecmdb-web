<template>
  <div class="resource-desc-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 详情内容 -->
    <div v-else-if="resourceData" class="content-container">
      <!-- 按分组展示字段 -->
      <div v-for="group in attributeGroupsData" :key="group.group_id" class="desc-section">
        <div class="section-title">
          <el-icon class="section-icon"><Setting /></el-icon>
          <span>{{ group.group_name }}</span>
          <el-tag size="small" type="info">{{ group.attributes?.length || 0 }} 个字段</el-tag>
        </div>

        <!-- 字符串和列表字段 - 六列布局 -->
        <el-row :gutter="8">
          <el-col
            :span="4"
            v-for="(item, index) of getNonFileFields(group.attributes || [])"
            :key="index"
            style="margin-bottom: 16px"
          >
            <div class="field-row">
              <div class="field-label">{{ item.field_name }}</div>
              <div class="field-content">
                <!-- 安全字段 -->
                <template v-if="item.secure">
                  <SecureFieldView
                    :content="resourceData.data[item.field_uid]"
                    :is-displaying="!!resourceData.data[`${item.field_uid}_secure_display`]"
                    :show-content="false"
                    @view-click="handleSecureClick(item)"
                    @display-change="(isDisplaying) => handleSecureDisplayChange(item, isDisplaying)"
                    @copy="(content) => handleCopySecureContent(content)"
                  />
                </template>

                <!-- 链接字段 -->
                <template v-else-if="item.link">
                  <el-button type="primary" text :icon="Link" @click="openNewPage(resourceData.data[item.field_uid])">
                    {{ resourceData.data[item.field_uid] }}
                  </el-button>
                </template>

                <!-- 普通字段 -->
                <template v-else>
                  <span class="field-text">
                    {{ resourceData.data[item.field_uid] || "暂无数据" }}
                  </span>
                </template>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 多行文本字段 - 独占一行 -->
        <el-row :gutter="16">
          <el-col
            :span="24"
            v-for="(item, index) of getMultilineFields(group.attributes || [])"
            :key="index"
            style="margin-bottom: 16px"
          >
            <div class="field-row">
              <div class="field-label">{{ item.field_name }}</div>
              <div class="field-content">
                <div class="multiline-content">
                  {{ resourceData.data[item.field_uid] || "暂无内容" }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 文件字段 - 独占一行 -->
        <el-row :gutter="8" v-if="getFileFields(group.attributes || []).length > 0" class="file-fields-row">
          <el-col
            :span="24"
            v-for="(item, index) of getFileFields(group.attributes || [])"
            :key="index"
            class="file-field-col"
            style="margin-bottom: 16px"
          >
            <div class="field-row file-field-row">
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
                    type="primary"
                    size="small"
                    text
                    :icon="Download"
                    @click="handleDownload(file)"
                    title="下载文件"
                  />
                </div>
                <el-empty v-if="!resourceData.data[item.field_uid]?.length" description="暂无文件" :image-size="60" />
              </div>
            </div>
          </el-col>
        </el-row>
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
import { onMounted, ref } from "vue"
import { Download, Link, Setting, Document } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { getModelAttributesWithGroupsApi } from "@/api/attribute"
import { type Attribute } from "@/api/attribute/types/attribute"
import { detailResourceApi, findSecureData } from "@/api/resource"
import { type Resource } from "@/api/resource/types/resource"
import { getMinioPresignedUrl } from "@/api/tools"
import { getLocalMinioUrl, decodedUrlPath } from "@/common/utils/url"
import SecureFieldView from "@/common/components/SecureFieldView/index.vue"

interface Props {
  modelUid: string
  resourceId: string
}

const props = defineProps<Props>()
const attributeFiledsData = ref<Attribute[]>([])
const attributeGroupsData = ref<any[]>([])
const resourceData = ref<Resource>()
const loading = ref(false)

// 按分组过滤字段的方法
const getNonFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type !== "file" && item.field_type !== "multiline")
}

const getFileFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "file")
}

const getMultilineFields = (fields: Attribute[]) => {
  return fields.filter((item) => item.field_type === "multiline")
}

// ** 获取资产字段信息 */
const listAttributeFields = () => {
  getModelAttributesWithGroupsApi(props.modelUid)
    .then(({ data }) => {
      // 保存分组数据
      attributeGroupsData.value = data.attribute_groups

      // 将分组数据转换为平铺的字段列表
      const allFields: Attribute[] = []
      data.attribute_groups.forEach((group) => {
        if (group.attributes) {
          allFields.push(...group.attributes)
        }
      })
      attributeFiledsData.value = allFields
    })
    .catch(() => {
      attributeFiledsData.value = []
      attributeGroupsData.value = []
    })
}

// ** 获取资产详细信息 */
const descResource = () => {
  loading.value = true
  detailResourceApi({
    id: parseInt(props.resourceId, 10),
    model_uid: props.modelUid
  })
    .then(({ data }) => {
      resourceData.value = data
    })
    .catch(() => {
      resourceData.value = undefined
    })
    .finally(() => {
      loading.value = false
    })
}

// 刷新数据
const refreshData = () => {
  listAttributeFields()
  descResource()
}

// 安全字段点击处理
const handleSecureClick = (item: Attribute) => {
  if (!resourceData.value) return

  findSecureData({
    id: resourceData.value.id,
    field_uid: item.field_uid
  })
    .then((data) => {
      resourceData.value!.data[item.field_uid] = data.data
      resourceData.value!.data[`${item.field_uid}_secure_display`] = true
    })
    .catch(() => {
      ElMessage.error("获取安全数据失败")
    })
}

// 安全字段显示状态变化
const handleSecureDisplayChange = (item: Attribute, isDisplaying: boolean) => {
  if (resourceData.value) {
    resourceData.value.data[`${item.field_uid}_secure_display`] = isDisplaying
  }
}

// 复制安全内容
const handleCopySecureContent = (content: string) => {
  console.log("复制内容:", content)
}

// 下载文件
const handleDownload = (file: any) => {
  if (!file?.url) {
    ElMessage.error("文件链接无效")
    return
  }

  getMinioPresignedUrl(decodedUrlPath(file.url))
    .then((res: any) => {
      window.open(getLocalMinioUrl(res.data), "_blank")
    })
    .catch(() => {
      ElMessage.error("下载失败")
    })
}

// 打开新页面
const openNewPage = (url: string) => {
  if (url) {
    window.open(url, "_blank")
  }
}

onMounted(() => {
  listAttributeFields()
  descResource()
})
</script>

<style lang="scss" scoped>
.resource-desc-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-container {
  padding: 40px 0;
}

.content-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 0px 12px;

  .desc-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
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

    .field-row {
      margin-bottom: 16px;
      padding: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      transition: all 0.2s ease;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .field-label {
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        &::before {
          content: "";
          width: 2px;
          height: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-radius: 1px;
        }
      }

      .field-content {
        flex: 1;
        display: flex;
        align-items: center;
        overflow: hidden;

        .field-text {
          color: #374151;
          font-weight: 500;
          font-size: 12px;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
      }
    }

    &.file-field-row {
      height: auto;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      padding: 16px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }

      .field-label {
        margin-bottom: 12px;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: flex;
        align-items: center;
        gap: 6px;

        &::before {
          content: "📁";
          font-size: 14px;
        }
      }
    }
  }
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
    padding: 12px 16px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: #f9fafb;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-1px);
    }

    .file-icon {
      color: #3b82f6;
      font-size: 18px;
      flex-shrink: 0;
      filter: drop-shadow(0 1px 2px rgba(59, 130, 246, 0.2));
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

    .el-button {
      padding: 6px;
      min-height: 28px;
      width: 28px;
      border-radius: 6px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      transition: all 0.2s ease;

      &:hover {
        background: #3b82f6;
        border-color: #3b82f6;
        transform: scale(1.05);
      }

      .el-icon {
        font-size: 14px;
        color: #6b7280;
      }

      &:hover .el-icon {
        color: #ffffff;
      }
    }
  }
}

.file-fields-row {
  .file-field-col {
    margin-bottom: 16px;
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
