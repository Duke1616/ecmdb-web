<template>
  <div ref="triggerRef" class="custom-icon-select-trigger">
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

  <!-- Tippy 弹窗内容 -->
  <div v-show="false">
    <div ref="contentRef" class="custom-icon-select-content">
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
        <el-divider style="margin: 0 0 8px 0" />
        <div class="color-picker-content">
          <span>图标颜色：</span>
          <el-color-picker
            v-model="selectedColor"
            :teleported="true"
            popper-class="icon-select-color-popper"
            @change="handleColorChange"
          />
        </div>
      </div>

      <!-- 图标信息栏 -->
      <div v-if="currentIconValue && !isImageUrl(currentIconValue)" class="icon-info-bar">
        <el-divider style="margin: 0 0 8px 0" />
        <div class="icon-info-content">
          <span class="info-label">图标类名：</span>
          <code class="icon-class-name">{{ currentIconValue }}</code>
          <el-button size="small" type="primary" link @click="copyIconName" style="margin-left: 8px"> 复制 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue"
import { Picture } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { commonIconList, linearIconList, fillIconList, multicolorIconList } from "./constants"
import tippy, { type Instance as TippyInstance } from "tippy.js"
import "tippy.js/dist/tippy.css"
import "tippy.js/themes/light.css"

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
const triggerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
let tippyInstance: TippyInstance | null = null

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
    // 如果从图片地址模式切换出去，且有输入内容，保存图片地址
    if (currentIconType.value === "4" && imageUrl.value.trim()) {
      const newValue = {
        name: "",
        color: "",
        url: imageUrl.value.trim()
      }
      emit("update:modelValue", newValue)
      emit("change", newValue)
    }

    currentIconType.value = String(type)
    // 切换到图片地址模式时，初始化输入框
    if (type === "4") {
      imageUrl.value = currentIconValue.value
    }
  }
}

// 图标名称到中文的映射表
const iconNameMap: Record<string, string> = {
  // 常用图标
  "caise-computer": "服务器/计算机",
  "caise-database": "数据库",
  "caise-network": "网络",
  "caise-public_cloud": "云服务",
  "monitor-host": "监控",
  "ops-setting-basic": "设置",
  "ops-setting-user": "用户",
  "ops-oneterm-gateway": "网关",
  "ops-oneterm-login": "登录网关",
  "caise-folder": "文件夹",
  file: "文件",
  "caise-data_center": "数据中心"
}

const getIconDisplayName = (iconName: string) => {
  if (!iconName) return ""

  // 优先从映射表中获取中文名称
  if (iconNameMap[iconName]) {
    return iconNameMap[iconName]
  }

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
  // 只更新本地状态，不立即 emit
  imageUrl.value = value
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

// 复制图标类名
const copyIconName = async () => {
  const text = currentIconValue.value
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      ElMessage.success("图标类名已复制到剪贴板")
    } else {
      // 降级方案：使用传统方法
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textarea)

      if (successful) {
        ElMessage.success("图标类名已复制到剪贴板")
      } else {
        throw new Error("execCommand failed")
      }
    }
  } catch (err) {
    console.error("复制失败:", err)
    ElMessage.error("复制失败，请手动复制")
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
      } else if (value.includes("xianxing")) {
        currentIconType.value = "1"
      } else if (value.includes("shidi")) {
        currentIconType.value = "2"
      } else if (value.includes("caise")) {
        currentIconType.value = "3"
      }
    }
  }

  // 初始化颜色
  if (props.modelValue.color) {
    selectedColor.value = props.modelValue.color
  }

  // 初始化 tippy.js
  if (triggerRef.value && contentRef.value) {
    tippyInstance = tippy(triggerRef.value, {
      content: contentRef.value,
      placement: "bottom-start",
      trigger: "click",
      interactive: true,
      arrow: true,
      theme: "light",
      maxWidth: "none", // 使用 CSS 中定义的固定宽度
      appendTo: () => document.body,
      animation: "shift-away",
      hideOnClick: false, // 点击内容时不关闭
      interactiveBorder: 30, // 增加交互边界，防止鼠标移出时立即关闭
      interactiveDebounce: 100, // 添加防抖延迟
      // 使用 fixed 定位策略，配置 Popper.js 修饰符以优化定位
      popperOptions: {
        strategy: "fixed",
        modifiers: [
          {
            name: "flip",
            options: {
              // 当底部空间不足时，自动翻转到顶部
              fallbackPlacements: ["top-start", "top", "bottom", "left", "right"],
              padding: 8
            }
          },
          {
            name: "preventOverflow",
            options: {
              // 防止弹窗溢出视口
              padding: 8,
              tether: false, // 禁用束缚，允许弹窗完全脱离触发器
              altAxis: true // 允许在另一个轴上调整位置
            }
          }
        ]
      },
      onShow() {
        // 弹窗显示时的回调
      },
      onHide() {
        // 弹窗隐藏时的回调
      },
      // 只在点击外部区域时关闭
      onClickOutside(instance, event) {
        // 检查点击是否在颜色选择器的弹窗上
        const target = event.target as HTMLElement
        const colorPopper = document.querySelector(".icon-select-color-popper")
        if (colorPopper && colorPopper.contains(target)) {
          return // 如果点击在颜色选择器上，不关闭
        }
        instance.hide()
      }
    })
  }
})

onBeforeUnmount(() => {
  // 清理 tippy 实例
  if (tippyInstance) {
    tippyInstance.destroy()
    tippyInstance = null
  }
})
</script>

<style>
/* Tippy 主题自定义 */
.tippy-box[data-theme~="light"] {
  background-color: white;
  border-radius: 12px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.tippy-box[data-theme~="light"][data-placement^="top"] > .tippy-arrow::before {
  border-top-color: white;
}

.tippy-box[data-theme~="light"][data-placement^="bottom"] > .tippy-arrow::before {
  border-bottom-color: white;
}

.tippy-box[data-theme~="light"][data-placement^="left"] > .tippy-arrow::before {
  border-left-color: white;
}

.tippy-box[data-theme~="light"][data-placement^="right"] > .tippy-arrow::before {
  border-right-color: white;
}

/* 颜色选择器 Popper 样式 - 确保在最上层 */
.icon-select-color-popper {
  z-index: 10000 !important;
}

.icon-select-color-popper .el-color-dropdown {
  border-radius: 8px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 4px 8px rgba(0, 0, 0, 0.08);
}
</style>

<style scoped>
/* 触发器样式 - 表单风格设计 */
.custom-icon-select-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  min-width: 120px;
  height: 40px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: #ffffff;
  transition: all 0.2s ease;
  user-select: none;
  font-size: 14px;
  color: #606266;
}

.custom-icon-select-trigger:hover {
  border-color: #409eff;
}

.custom-icon-select-trigger:focus {
  border-color: #409eff;
  outline: none;
}

.custom-icon-select-trigger i {
  font-size: 18px;
  color: #606266;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.custom-icon-select-trigger:hover i {
  color: #409eff;
}

.trigger-icon-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.trigger-icon-default {
  font-size: 18px;
  color: #c0c4cc;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.trigger-icon-default :deep(svg) {
  width: 18px;
  height: 18px;
}

.custom-icon-select-trigger:hover .trigger-icon-default {
  color: #409eff;
}

.trigger-text {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

/* 弹窗内容样式 */
.custom-icon-select-content {
  padding: 0;
  background: #f8fafc;
  border-radius: 8px;
  width: 480px;
  height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 图标类型选择标签 */
.icon-type-tabs {
  padding: 16px;
  margin-bottom: 0;
  background: white;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}

.icon-type-tabs :deep(.el-radio-group) {
  display: flex;
  width: 100%;
  gap: 8px;
}

.icon-type-tabs :deep(.el-radio-button) {
  flex: 1;
  margin: 0;
}

.icon-type-tabs :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 10px 8px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 13px;
  border: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.icon-type-tabs :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 6px;
}

.icon-type-tabs :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 6px;
}

.icon-type-tabs :deep(.el-radio-button__inner:hover) {
  border-color: #3182ce;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(49, 130, 206, 0.15);
}

.icon-type-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #3182ce 0%, #2563eb 100%);
  border-color: #3182ce;
  color: white;
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
  transform: translateY(-1px);
}

.icon-type-tabs :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner:hover) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

/* 图片地址输入 */
.image-url-input {
  padding: 0 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.image-preview {
  margin-top: 12px;
  padding: 16px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.image-preview:hover {
  border-color: #3182ce;
  box-shadow: 0 2px 8px rgba(49, 130, 206, 0.1);
}

.preview-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  background-color: white;
  padding: 4px;
  transition: transform 0.3s ease;
}

.preview-img:hover {
  transform: scale(1.05);
}

.preview-status {
  font-size: 13px;
  font-weight: 500;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 4px;
}

.preview-status.error {
  color: #ef4444;
}

.image-url-tips {
  padding: 20px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  margin: 0 0 16px 0;
}

.image-url-tips p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #1e40af;
  font-size: 14px;
}

.image-url-tips ul {
  margin: 0;
  padding-left: 20px;
  color: #1e3a8a;
}

.image-url-tips li {
  margin-bottom: 6px;
  font-size: 13px;
  line-height: 1.6;
}

/* 图标列表 */
.icon-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
  min-height: 0;

  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #e2e8f0;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
    transition: background 0.3s ease;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #64748b;
  }
}

.icon-category {
  margin-bottom: 20px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.category-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  padding-bottom: 8px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-title::before {
  content: "";
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #3182ce 0%, #60a5fa 100%);
  border-radius: 2px;
}

/* 图标网格 - 更大更易点击 */
.icon-grid1 {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 8px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
  min-height: 70px;
}

.icon-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(49, 130, 206, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.icon-item:hover {
  border-color: #3182ce;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 16px rgba(49, 130, 206, 0.2);
}

.icon-item:hover::before {
  opacity: 1;
}

.icon-item.selected {
  border-color: #3182ce;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
}

.icon-item.selected::after {
  content: "✓";
  position: absolute;
  top: 4px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: #3182ce;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(49, 130, 206, 0.3);
}

.icon-item i {
  font-size: 24px;
  margin-bottom: 6px;
  color: #475569;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.icon-item:hover i {
  color: #3182ce;
  transform: scale(1.15);
}

.icon-item.selected i {
  color: #1e40af;
  transform: scale(1.1);
}

.custom-icon-img {
  width: 24px;
  height: 24px;
  margin-bottom: 6px;
  object-fit: contain;
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
}

.icon-item:hover .custom-icon-img {
  transform: scale(1.15);
}

.icon-label {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
  font-weight: 500;
  position: relative;
  z-index: 1;
  transition: color 0.3s ease;
}

.icon-item:hover .icon-label {
  color: #1e40af;
}

.icon-item.selected .icon-label {
  color: #1e40af;
  font-weight: 600;
}

/* 颜色选择器 */
.color-picker {
  margin-top: 0;
  padding: 8px 16px;
  background: white;
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;
}

.color-picker-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.color-picker-content span {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

/* 图标信息栏 */
.icon-info-bar {
  margin-top: 0;
  padding: 8px 16px;
  background: white;
  border-radius: 0 0 8px 8px;
  flex-shrink: 0;
}

.icon-info-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.info-label {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.icon-class-name {
  flex: 1;
  font-size: 13px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", "Consolas", "source-code-pro", monospace;
  color: #1e40af;
  background: #dbeafe;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
  word-break: break-all;
}
</style>
