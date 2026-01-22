<template>
  <Drawer
    v-model="visible"
    title="批量导入数据"
    subtitle="按照模板格式批量导入资产数据"
    size="45%"
    direction="rtl"
    :header-icon="Upload"
    :show-footer="true"
    cancel-button-text="取消"
    confirm-button-text="开始导入"
    :confirm-loading="importing"
    :confirm-disabled="!selectedFile"
    @cancel="handleClose"
    @confirm="handleImport"
    @closed="handleClose"
  >
    <div class="import-drawer-content">
      <!-- 步骤指引 -->
      <div class="steps-guide">
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-info">
            <div class="step-title">下载模板</div>
            <div class="step-desc">获取标准导入模板</div>
          </div>
        </div>
        <el-icon class="step-arrow"><Right /></el-icon>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-info">
            <div class="step-title">填写数据</div>
            <div class="step-desc">按格式填写资产信息</div>
          </div>
        </div>
        <el-icon class="step-arrow"><Right /></el-icon>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-info">
            <div class="step-title">上传导入</div>
            <div class="step-desc">上传文件完成导入</div>
          </div>
        </div>
      </div>

      <!-- 融合设计: 左侧按钮 + 右侧上传区域 -->
      <div class="unified-card">
        <!-- 左侧: 下载按钮 -->
        <div class="left-sidebar">
          <div class="download-btn-wrapper" @click="handleDownloadTemplate">
            <el-icon class="download-icon" :class="{ loading: exporting }">
              <Download v-if="!exporting" />
              <Loading v-else />
            </el-icon>
            <span class="download-text">下载模板文件</span>
          </div>
        </div>

        <!-- 右侧: 上传区域 -->
        <div class="right-content">
          <div class="section-header">
            <div class="header-left">
              <el-icon class="section-icon"><UploadFilled /></el-icon>
              <h3 class="section-title">步骤 2-3: 上传填写好的文件</h3>
            </div>
          </div>
          <div class="section-body">
            <!-- 未选择文件: 显示上传区域 -->
            <el-upload
              v-if="!selectedFile"
              ref="uploadRef"
              class="upload-dragger"
              drag
              :auto-upload="false"
              :limit="1"
              :on-change="handleFileChange"
              :on-exceed="handleExceed"
              accept=".xlsx,.xls"
            >
              <div class="upload-content">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <p class="upload-title">点击或拖拽文件到此处</p>
                <p class="upload-hint">支持 .xlsx 或 .xls 格式</p>
              </div>
            </el-upload>

            <!-- 已选择文件: 显示文件信息 -->
            <div v-else class="file-selected">
              <div class="file-info">
                <el-icon class="file-icon"><Document /></el-icon>
                <div class="file-details">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
                    <span class="file-status">
                      <el-icon><CircleCheck /></el-icon>
                      已选择
                    </span>
                  </div>
                </div>
              </div>
              <el-button type="danger" :icon="Delete" circle size="small" @click="handleRemoveFile" />
            </div>
          </div>
        </div>
      </div>

      <!-- 导入说明 -->
      <div class="tips-section">
        <div class="tips-header">
          <el-icon class="tips-icon"><InfoFilled /></el-icon>
          <span class="tips-title">导入说明</span>
        </div>
        <ul class="tips-list">
          <li>请确保 Excel 文件格式正确,字段名称与模板一致</li>
          <li>导入过程中请勿关闭此窗口</li>
        </ul>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import {
  Upload,
  Download,
  Document,
  Delete,
  UploadFilled,
  InfoFilled,
  Right,
  CircleCheck,
  Loading
} from "@element-plus/icons-vue"
import { ElMessage, type UploadFile, type UploadInstance } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { useDataIO } from "../composables/useDataIO"

interface Props {
  modelValue: boolean
  modelUid: string
  modelName?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelName: ""
})

const emits = defineEmits<{
  "update:modelValue": [value: boolean]
  "import-success": [count: number]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

const { exporting, importing, exportTemplate, importData } = useDataIO()

const uploadRef = ref<UploadInstance>()
const selectedFile = ref<File | null>(null)

// 下载模板
const handleDownloadTemplate = async () => {
  await exportTemplate(props.modelUid, props.modelName)
}

// 文件选择变化
const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    selectedFile.value = uploadFile.raw
  }
}

// 文件超出限制
const handleExceed = () => {
  ElMessage.warning("只能上传一个文件,请先移除已选择的文件")
}

// 移除文件
const handleRemoveFile = () => {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

// 开始导入
const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning("请先选择要导入的文件")
    return
  }

  try {
    const count = await importData(selectedFile.value, props.modelUid)
    emits("import-success", count)
    handleClose()
  } catch (error) {
    console.error("导入失败:", error)
  }
}

// 关闭抽屉
const handleClose = () => {
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  visible.value = false
}
</script>

<style lang="scss" scoped>
.import-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px; // 添加左右和上下 padding
}

// 步骤指引
.steps-guide {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 12px;

  .step-item {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .step-info {
      .step-title {
        font-size: 14px;
        font-weight: 600;
        color: #1e40af;
        line-height: 1.2;
      }

      .step-desc {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }
    }
  }

  .step-arrow {
    color: #3b82f6;
    font-size: 18px;
    margin: 0 4px;
    flex-shrink: 0;
  }
}

// 融合卡片设计
.unified-card {
  display: flex;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  // 左侧边栏 - 下载按钮
  .left-sidebar {
    display: flex;
    align-items: stretch;
    background: white; // 与右侧一致
    border-right: 1px solid #e5e7eb; // 改为灰色边框
    padding: 16px 12px;

    .download-btn-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px 10px;
      background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%); // 清新的青色
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 56px;
      min-height: 180px;
      box-shadow: 0 2px 8px rgba(6, 182, 212, 0.25);

      &:hover {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
        background: linear-gradient(180deg, #0891b2 0%, #0e7490 100%);
      }

      &:active {
        transform: scale(0.98);
      }

      .download-icon {
        font-size: 26px;
        color: white;
        flex-shrink: 0;

        &.loading {
          animation: rotate 1s linear infinite;
        }
      }

      .download-text {
        writing-mode: vertical-rl;
        text-orientation: upright;
        font-size: 13px;
        font-weight: 600;
        color: white;
        letter-spacing: 3px;
        line-height: 1;
      }
    }
  }

  // 右侧内容区域
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .section-icon {
          font-size: 16px;
          color: #10b981;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }
      }
    }

    .section-body {
      padding: 16px;
      flex: 1;
    }
  }
}

// 上传区域
.upload-dragger {
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    min-height: 180px;
    border: 2px dashed #d1d5db;
    border-radius: 10px;
    background: #fafafa;
    transition: all 0.3s ease;
    padding: 24px;

    &:hover {
      border-color: #3b82f6;
      background: #f0f9ff;
    }
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .upload-title {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin: 0 0 6px 0;
    }

    .upload-hint {
      font-size: 12px;
      color: #9ca3af;
      margin: 0;
    }
  }
}

// 已选择文件
.file-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  border-radius: 10px;

  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .file-icon {
      font-size: 32px;
      color: #10b981;
      flex-shrink: 0;
    }

    .file-details {
      flex: 1;
      min-width: 0;

      .file-name {
        font-size: 14px;
        font-weight: 600;
        color: #065f46;
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;

        .file-size {
          color: #059669;
        }

        .file-status {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #10b981;
          font-weight: 500;
        }
      }
    }
  }
}

// 提示区块
.tips-section {
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;

  .tips-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;

    .tips-icon {
      font-size: 16px;
      color: #f59e0b;
    }

    .tips-title {
      font-size: 13px;
      font-weight: 600;
      color: #92400e;
    }
  }

  .tips-list {
    margin: 0;
    padding-left: 20px;
    font-size: 12px;
    color: #78350f;

    li {
      margin: 6px 0;
      line-height: 1.5;
    }
  }
}

// 旋转动画
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
