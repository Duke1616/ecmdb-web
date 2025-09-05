<template>
  <el-popover v-model:visible="visible" placement="bottom" :width="450" trigger="click">
    <template #reference>
      <div class="custom-icon-select-trigger">
        <!-- 显示当前选中的图标 -->
        <img
          v-if="isImageUrl(currentIconValue)"
          :src="currentIconValue"
          class="trigger-icon-img"
          @error="handleImageError"
        />
        <i
          v-else-if="currentIconValue && !isImageUrl(currentIconValue)"
          :class="getIconClass(currentIconValue)"
          :style="{ color: modelValue.color || '' }"
        />
        <el-icon v-else class="trigger-icon-default"><Picture /></el-icon>
        <span class="trigger-text">{{ getDisplayText() }}</span>
      </div>
    </template>

    <div class="custom-icon-select-content">
      <!-- 图标类型选择 -->
      <div class="icon-type-tabs">
        <el-radio-group v-model="currentIconType" @change="handleIconTypeChange">
          <el-radio-button label="0">常用</el-radio-button>
          <el-radio-button label="1">线性</el-radio-button>
          <el-radio-button label="2">实底</el-radio-button>
          <el-radio-button label="3">多色</el-radio-button>
          <el-radio-button label="4">图片地址</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 图片地址输入 -->
      <div v-if="currentIconType === '4'" class="image-url-input">
        <el-input
          v-model="imageUrl"
          placeholder="请输入图片地址或base64数据"
          type="textarea"
          :rows="3"
          @input="handleImageUrlChange"
        />
        <div class="image-preview" v-if="imageUrl">
          <img :src="imageUrl" class="preview-img" @error="handlePreviewError" @load="handlePreviewLoad" />
          <span class="preview-status" :class="{ error: previewError }">
            {{ previewError ? "图片加载失败" : "预览正常" }}
          </span>
        </div>
      </div>

      <!-- 图标列表 -->
      <div class="icon-list">
        <!-- 常用图标 -->
        <template v-if="currentIconType === '0'">
          <div class="icon-category">
            <h4 class="category-title">常用图标</h4>
            <div class="icon-grid1">
              <div
                v-for="iconName in commonIconList"
                :key="iconName"
                :class="['icon-item', { selected: modelValue.name === iconName }]"
                @click="selectIcon(iconName)"
              >
                <i :class="['iconfont', iconName]" :title="iconName" />
                <span class="icon-label">{{ getIconDisplayName(iconName) }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 其他图标类型 -->
        <template v-else-if="currentIconType !== '4'">
          <div v-for="category in iconList" :key="category.value" class="icon-category">
            <h4 class="category-title">{{ category.label }}</h4>
            <div class="icon-grid1">
              <div
                v-for="icon in category.list"
                :key="icon.value"
                :class="['icon-item', { selected: modelValue.name === icon.value }]"
                @click="selectIcon(icon.value)"
              >
                <i :class="['iconfont', icon.value]" />
                <span class="icon-label">{{ icon.label }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 图片地址输入模式不显示图标列表 -->
        <template v-else>
          <div class="image-url-tips">
            <p>支持以下格式的图片：</p>
            <ul>
              <li>HTTP/HTTPS 图片链接</li>
              <li>Base64 编码的图片数据</li>
              <li>相对路径的图片文件</li>
            </ul>
          </div>
        </template>
      </div>

      <!-- 颜色选择器 -->
      <div v-if="!['0', '3', '4'].includes(currentIconType)" class="color-picker">
        <el-divider />
        <div class="color-picker-content">
          <span>图标颜色：</span>
          <el-color-picker v-model="selectedColor" @change="handleColorChange" />
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { Picture } from "@element-plus/icons-vue"
import { commonIconList, linearIconList, fillIconList, multicolorIconList } from "./constants"

// 定义 props
interface IconData {
  name: string
  color: string
  id?: string
  url?: string
}

interface Props {
  modelValue: IconData
  iconType?: string
}

interface Emits {
  (e: "update:modelValue", value: IconData): void
  (e: "change", value: IconData): void
}

const props = withDefaults(defineProps<Props>(), {
  iconType: "cmdb"
})

const emit = defineEmits<Emits>()

// 响应式数据
const visible = ref(false)
const currentIconType = ref("0") // 默认显示常用图标
const selectedColor = ref("")
const imageUrl = ref("")
const previewError = ref(false)

// 计算当前图标值
const currentIconValue = computed(() => {
  return props.modelValue.url || props.modelValue.name || ""
})

// 计算属性
const iconList = computed(() => {
  switch (currentIconType.value) {
    case "0": // 常用
      return [] // 常用图标单独处理
    case "1": // 线性
      return linearIconList
    case "2": // 实底
      return fillIconList
    case "3": // 多色
      return multicolorIconList
    case "4": // 自定义
      return []
    default:
      return linearIconList
  }
})

// 方法
const handleIconTypeChange = (type: string | number | boolean | undefined) => {
  if (type !== undefined) {
    currentIconType.value = String(type)
    // 切换到图片地址模式时，初始化输入框
    if (type === "4") {
      imageUrl.value = currentIconValue.value
    }
  }
}

const getIconDisplayName = (iconName: string) => {
  if (!iconName) return ""
  // 从图标名称中提取显示名称
  const parts = iconName.split("-")
  if (parts.length > 1) {
    return parts[parts.length - 1] || parts[1]
  }
  return iconName
}

// 判断是否为图片URL
const isImageUrl = (icon: string): boolean => {
  if (!icon) return false
  // 检查是否为HTTP/HTTPS URL
  if (icon.startsWith("http://") || icon.startsWith("https://")) {
    return true
  }
  // 检查是否为base64图片
  if (icon.startsWith("data:image/")) {
    return true
  }
  // 检查是否为相对路径的图片文件
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"]
  return imageExtensions.some((ext) => icon.toLowerCase().endsWith(ext))
}

// 获取图标类名
const getIconClass = (iconName: string): string[] => {
  if (!iconName) return ["iconfont"]

  // 如果已经包含 iconfont 类，直接返回
  if (iconName.includes("iconfont")) {
    return iconName.split(" ")
  }

  // 否则添加 iconfont 基础类
  return ["iconfont", iconName]
}

// 获取显示文本
const getDisplayText = (): string => {
  const value = currentIconValue.value
  if (!value) return "选择图标"

  if (isImageUrl(value)) {
    if (value.startsWith("data:image/")) {
      return "Base64图片"
    } else if (value.startsWith("http")) {
      return "网络图片"
    } else {
      return "本地图片"
    }
  } else {
    return getIconDisplayName(value)
  }
}

// 处理图片地址变化
const handleImageUrlChange = (value: string) => {
  previewError.value = false
  if (value.trim()) {
    const newValue = {
      name: "",
      color: "",
      url: value.trim()
    }
    emit("update:modelValue", newValue)
    emit("change", newValue)
  }
}

// 处理预览图片错误
const handlePreviewError = () => {
  previewError.value = true
}

// 处理预览图片加载成功
const handlePreviewLoad = () => {
  previewError.value = false
}

// 处理触发器图片错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.warn("图片加载失败:", target.src)
  target.style.display = "none"
}

const selectIcon = (iconName: string) => {
  const newValue = {
    ...props.modelValue,
    name: iconName,
    color: selectedColor.value
  }
  emit("update:modelValue", newValue)
  emit("change", newValue)
  // 延迟关闭弹窗，避免闪退
  setTimeout(() => {
    visible.value = false
  }, 100)
}

const handleColorChange = (color: string | null) => {
  if (color) {
    selectedColor.value = color
    if (props.modelValue.name) {
      const newValue = {
        ...props.modelValue,
        color
      }
      emit("update:modelValue", newValue)
      emit("change", newValue)
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化时根据当前值设置图标类型
  const value = currentIconValue.value
  if (value) {
    if (isImageUrl(value)) {
      currentIconType.value = "4"
      imageUrl.value = value
    } else {
      // 根据图标名称判断类型
      if (commonIconList.includes(value)) {
        currentIconType.value = "0"
      } else if (value.includes("-line")) {
        currentIconType.value = "1"
      } else if (value.includes("-fill")) {
        currentIconType.value = "2"
      } else if (value.includes("-color")) {
        currentIconType.value = "3"
      }
    }
  }

  // 初始化颜色
  if (props.modelValue.color) {
    selectedColor.value = props.modelValue.color
  }
})

onBeforeUnmount(() => {
  // 清理工作
})
</script>

<style scoped>
.custom-icon-select-trigger {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: #fff;
  transition: border-color 0.2s;
}

.custom-icon-select-trigger:hover {
  border-color: #409eff;
}

.custom-icon-select-trigger i {
  font-size: 16px;
  margin-right: 4px;
}

.trigger-icon-img {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  object-fit: contain;
}

.trigger-icon-default {
  font-size: 16px;
  margin-right: 4px;
  color: #c0c4cc;
}

.trigger-text {
  margin-left: 8px;
  color: #606266;
}

.custom-icon-select-content {
  padding: 16px;
}

.icon-type-tabs {
  margin-bottom: 16px;
}

.image-url-input {
  margin-bottom: 16px;
}

.image-preview {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fafafa;
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: white;
}

.preview-status {
  font-size: 12px;
  color: #67c23a;
}

.preview-status.error {
  color: #f56c6c;
}

.image-url-tips {
  padding: 16px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  margin-bottom: 16px;
}

.image-url-tips p {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #409eff;
}

.image-url-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #606266;
}

.image-url-tips li {
  margin-bottom: 4px;
  font-size: 13px;
}

.icon-list {
  max-height: 300px;
  overflow-y: auto;
}

.icon-category {
  margin-bottom: 16px;
}

.category-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.icon-grid1 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.icon-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.icon-item i {
  font-size: 20px;
  margin-bottom: 4px;
  color: #606266;
}

.custom-icon-img {
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
}

.icon-label {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
}

.color-picker {
  margin-top: 16px;
}

.color-picker-content {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
