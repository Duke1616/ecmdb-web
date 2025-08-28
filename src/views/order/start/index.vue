<template>
  <div class="app-container">
    <!-- 空状态优化设计 -->
    <div v-if="empty === true" class="empty-state">
      <el-empty :image-size="200" description="暂无模板数据">
        <el-button type="primary" @click="listTemplateCombinations">刷新数据</el-button>
      </el-empty>
    </div>

    <!-- 重新设计为左右布局，带侧边栏导航 -->
    <div v-if="empty === false" class="main-layout">
      <!-- 左侧边栏 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h2 class="sidebar-title">工单模板</h2>
          <span class="total-count">{{ getTotalTemplateCount() }} 个模板</span>
        </div>

        <!-- 添加可滚动的导航区域 -->
        <div class="category-nav-container">
          <div class="category-nav">
            <!-- 添加"全部工单"选项 -->
            <div
              class="category-item"
              :class="{ active: selectedCategory === 'all' }"
              @click="selectedCategory = 'all'"
            >
              <div class="category-icon">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="category-info">
                <span class="category-name">全部工单</span>
                <span class="category-count">{{ getTotalTemplateCount() }}</span>
              </div>
            </div>

            <div
              v-for="item in templateCombinations"
              :key="item.id"
              class="category-item"
              :class="{ active: selectedCategory === item.id }"
              @click="selectedCategory = item.id"
            >
              <div class="category-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="category-info">
                <span class="category-name">{{ item.name }}</span>
                <span class="category-count">{{ item.templates.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-area">
        <div class="content-header">
          <h3 class="content-title">
            {{ selectedCategory === "all" ? "全部工单模板" : getSelectedCategoryName() }}
          </h3>
          <p class="content-subtitle">选择模板快速创建工单</p>
        </div>

        <!-- 添加调试信息和修复数据显示逻辑 -->
        <div class="templates-container">
          <!-- 调试信息 -->
          <div v-if="debugMode" class="debug-info">
            <p>模板组合数量: {{ templateCombinations.length }}</p>
            <p>选中分类: {{ selectedCategory }}</p>
            <p>过滤后模板数量: {{ getFilteredTemplates().length }}</p>
          </div>

          <!-- 当选择"全部工单"时显示分组模板 -->
          <div v-if="selectedCategory === 'all'" class="grouped-templates">
            <div v-for="category in templateCombinations" :key="category.id" class="template-group">
              <div class="group-header">
                <div class="group-title">
                  <el-icon class="group-icon"><Folder /></el-icon>
                  <span>{{ category.name }}</span>
                  <span class="group-count">({{ category.templates.length }})</span>
                </div>
              </div>
              <div class="templates-grid">
                <div
                  v-for="template in category.templates"
                  :key="template.id"
                  class="template-card"
                  @click="handleDetail(template.id)"
                >
                  <div class="template-card-header">
                    <div class="template-icon-wrapper">
                      <e-icon :icon-name="template.icon" class="template-icon" />
                    </div>
                    <div class="template-badge">模板</div>
                  </div>
                  <div class="template-card-body">
                    <h4 class="template-name">{{ template.name }}</h4>
                    <p class="template-description">点击创建新的工单</p>
                  </div>
                  <div class="template-card-footer">
                    <span class="action-text">立即创建</span>
                    <div class="template-arrow">
                      <el-icon><ArrowRight /></el-icon>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 显示单个分类的模板 -->
          <div v-else class="templates-grid">
            <div
              v-for="template in getFilteredTemplates()"
              :key="template.id"
              class="template-card"
              @click="handleDetail(template.id)"
            >
              <div class="template-card-header">
                <div class="template-icon-wrapper">
                  <e-icon :icon-name="template.icon" class="template-icon" />
                </div>
                <div class="template-badge">模板</div>
              </div>
              <div class="template-card-body">
                <h4 class="template-name">{{ template.name }}</h4>
                <p class="template-description">点击创建新的工单</p>
              </div>
              <div class="template-card-footer">
                <span class="action-text">立即创建</span>
                <div class="template-arrow">
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 修复对话框关闭和滚动问题 -->
    <el-dialog
      v-model="dialogVisible"
      @closed="onClosed"
      width="500px"
      class="create-order-dialog"
      :close-on-click-modal="true"
      :modal-class="'dialog-modal'"
      :lock-scroll="true"
      :close-on-press-escape="true"
      align-center
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <div class="dialog-header-content">
            <!-- 使用模板 icon -->
            <div class="dialog-icon">
              <e-icon :icon-name="currentTemplate?.icon || 'DocumentAdd'" class="template-icon" />
            </div>
            <div class="dialog-title-section">
              <!-- 使用模板 name -->
              <h3 class="dialog-title">创建工单 - {{ currentTemplate?.name || "未命名模板" }}</h3>
              <p class="dialog-subtitle">填写以下信息完成工单创建</p>
            </div>
          </div>
        </div>
      </template>

      <div class="dialog-body">
        <FormCreate v-if="dialogVisible" :rule="rule" :option="options" v-model="data" v-model:api="fApi" />
      </div>

      <!-- 添加取消按钮 -->
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-buttons">
            <el-button @click="handleCloseDialog" size="large" :disabled="isSubmitting" class="cancel-button">
              取消
            </el-button>
            <el-button
              type="primary"
              @click="handleFormSubmit"
              size="large"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="submit-button"
            >
              <template #loading>
                <div class="loading-content">
                  <span>提交中...</span>
                </div>
              </template>
              {{ isSubmitting ? "" : "提交工单" }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { pipelineGroupApi } from "@/api/template"
import { templateCombination } from "@/api/template/types/template"
import { onMounted, ref, watch, onUnmounted } from "vue"

import { detailTemplateApi } from "@/api/template"
import { Api, FormRule, Options } from "@form-create/element-ui"
import formCreate from "@form-create/element-ui"

// 获取 FormCreate 组件, 最新版本
const FormCreate = formCreate.$form()

import { ElMessage } from "element-plus"
import { createOrderApi } from "@/api/order"
import { createOrderReq } from "@/api/order/types/order"
import { cloneDeep } from "lodash-es"
import { ArrowRight, Grid, Folder } from "@element-plus/icons-vue"

const currentTemplate = ref<{ id: number; name: string; icon: string } | null>(null)
// 对话框显示状态
const dialogVisible = ref<boolean>(false)
// 空状态标识
const empty = ref<boolean>(false)

// 当前选中的分类，默认显示全部
const selectedCategory = ref<number | "all">("all")

// 表单相关的响应式变量
const fApi = ref<Api>()
const rule = ref<FormRule[]>()
const options = ref<Options>()
const data = ref<any>()

// 调试模式
const debugMode = ref<boolean>(false) // 设置为 true 可以看到调试信息

// 表单验证状态
const isSubmitting = ref<boolean>(false)
const validationErrors = ref<string[]>([])

const currentSubmitHandler = ref<(() => void) | null>(null)

watch(dialogVisible, (newVal) => {
  if (newVal) {
    // 对话框打开时禁止页面滚动
    document.body.style.overflow = "hidden"
  } else {
    // 对话框关闭时恢复页面滚动
    document.body.style.overflow = ""
  }
})

// 获取模板总数
const getTotalTemplateCount = () => {
  return templateCombinations.value.reduce((total, item) => total + item.templates.length, 0)
}

// 获取选中分类的名称
const getSelectedCategoryName = () => {
  const category = templateCombinations.value.find((item) => item.id === selectedCategory.value)
  return category ? category.name : ""
}

const getFilteredTemplates = () => {
  console.log("[v0] 当前选中分类:", selectedCategory.value)
  console.log("[v0] 模板组合数据:", templateCombinations.value)

  if (selectedCategory.value === "all") {
    // 当选择全部时，返回所有模板的扁平化数组
    const allTemplates = templateCombinations.value.flatMap((item) => item.templates || [])
    console.log("[v0] 全部模板数量:", allTemplates.length)
    return allTemplates
  }

  // 返回特定分类的模板
  const category = templateCombinations.value.find((item) => item.id === selectedCategory.value)
  const templates = category ? category.templates || [] : []
  console.log("[v0] 分类模板数量:", templates.length)
  return templates
}

// 处理模板详情点击事件
const handleDetail = async (id: number) => {
  try {
    const res = await detailTemplateApi(id)

    // 记录当前模板ID用于删除功能
    currentTemplateId.value = id
    currentTemplate.value = {
      id,
      name: res.data.name,
      icon: res.data.icon
    }

    options.value = {
      ...formCreate.parseJson(res.data.options),
      submitBtn: false
    } as Options

    currentSubmitHandler.value = handleSubmit(res.data)
    options.value.onSubmit = currentSubmitHandler.value
    rule.value = formCreate.parseJson(res.data.rules)

    dialogVisible.value = true
  } catch (error) {
    console.log("获取详情时出错:", error)
  }
}

// 默认表单数据结构
const DEFAULT_FORM_DATA: createOrderReq = {
  workflow_id: 0,
  template_id: 0,
  data: {}
}
const formData = ref<createOrderReq>(cloneDeep(DEFAULT_FORM_DATA))

const validateFormData = async (): Promise<boolean> => {
  validationErrors.value = []

  if (!fApi.value) {
    validationErrors.value.push("表单未正确初始化")
    return false
  }

  try {
    const valid = await fApi.value.validate()
    if (valid === true) {
      return true
    } else {
      validationErrors.value.push("请检查表单中的必填项和格式要求")
      return false
    }
  } catch (err: any) {
    console.error("[v0] 表单验证失败:", err)
    validationErrors.value.push("表单验证失败，请检查输入内容")
    return false
  }
}

const handleCloseDialog = () => {
  dialogVisible.value = false
}

const handleSubmit = (resData: any) => {
  return async () => {
    // 防止重复提交
    if (isSubmitting.value) {
      return
    }

    isSubmitting.value = true

    try {
      const isValid = await validateFormData()
      if (!isValid) {
        ElMessage.error(validationErrors.value[0] || "表单验证失败")
        return // 验证失败，直接返回，不继续提交
      }

      // 封装提交数据的逻辑
      formData.value = {
        data: data.value,
        template_id: resData.id,
        workflow_id: resData.workflow_id
      }

      console.log("[v0] 提交表单数据:", formData.value)

      await createOrderApi(formData.value)
      onClosed()
      ElMessage.success("工单创建成功")
    } catch (error) {
      console.log("提交失败", error)
      ElMessage.error("提交失败，请重试")
    } finally {
      isSubmitting.value = false
    }
  }
}

const handleFormSubmit = async () => {
  if (currentSubmitHandler.value) {
    await currentSubmitHandler.value()
  }
}

// 模板组合数据
const templateCombinations = ref<templateCombination[]>([])

// 查询模板组合列表
const listTemplateCombinations = () => {
  console.log("[v0] 开始获取模板数据...")

  pipelineGroupApi()
    .then(({ data }) => {
      console.log("[v0] 获取到的数据:", data)
      templateCombinations.value = data.template_combinations || []

      if (templateCombinations.value.length === 0) {
        empty.value = true
        console.log("[v0] 没有模板数据，显示空状态")
      } else {
        empty.value = false
        console.log("[v0] 成功加载", templateCombinations.value.length, "个模板分类")
      }
    })
    .catch((error) => {
      console.log("[v0] 获取模板数据失败:", error)
      templateCombinations.value = []
      empty.value = true
    })
    .finally(() => {
      console.log("[v0] 模板数据加载完成")
    })
}

const onClosed = () => {
  dialogVisible.value = false
  currentTemplateId.value = null
  currentSubmitHandler.value = null
  isSubmitting.value = false
  validationErrors.value = []
  reset()
}

const currentTemplateId = ref<number | null>(null)

// 组件挂载时获取数据
onMounted(() => {
  listTemplateCombinations()
})

onUnmounted(() => {
  document.body.style.overflow = ""
})

// 重置表单数据
const reset = () => {
  rule.value = []
  options.value = {}
  data.value = {}
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

/* Updated sidebar with scrollable navigation */
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  max-height: calc(100vh - 4rem);

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    max-height: none;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  @media (min-width: 1280px) and (max-width: 1440px) {
    width: 220px;
    height: calc(100vh - 3rem);
    max-height: calc(100vh - 3rem);
  }
}

:deep(.el-dialog__body) {
  max-height: 60vh; /* 高度最多占视口 60% */
  overflow-y: auto; /* 超出出现滚动条 */
  padding: 1rem; /* 保持间距 */
}

.sidebar-header {
  padding: 1.25rem;
  margin-bottom: 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 1rem;
  }
}

.category-nav-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.25rem 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem 1.5rem;
    overflow-y: visible;
  }
}

.category-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }

  &.active {
    background: #eff6ff;
    border: 1px solid #dbeafe;

    .category-name {
      color: #1d4ed8;
      font-weight: 600;
    }

    .category-icon {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }
}

.category-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s ease;
}

.category-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.category-count {
  font-size: 0.75rem;
  color: #9ca3af;
  background: #f9fafb;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
}

/* Updated content area with scrollable container */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 4rem);
  max-height: calc(100vh - 4rem);

  @media (max-width: 768px) {
    height: auto;
    max-height: none;
  }

  @media (min-width: 1280px) and (max-width: 1440px) {
    height: calc(100vh - 3rem);
    max-height: calc(100vh - 3rem);
  }
}

.content-header {
  padding: 1.25rem 1.25rem 0;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 1rem 1rem 0;
  }
}

.templates-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.25rem 0.75rem;
  scroll-behavior: smooth;

  @media (max-width: 768px) {
    padding: 1rem 1rem 2rem;
    overflow-y: visible;
  }
}

/* Added styles for grouped templates display */
.grouped-templates {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 1rem;
}

.template-group {
  .group-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 2px solid #f1f5f9;
  }

  .group-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;

    .group-icon {
      color: #3b82f6;
      font-size: 1.25rem;
    }

    .group-count {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 400;
    }
  }
}

.footer-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  align-items: center;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: 0.75rem;

    .el-button {
      width: 100%;
    }
  }

  /* Enhanced cancel button styling */
  .cancel-button {
    min-width: 100px;
    height: 44px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 0.9rem;
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    color: #6b7280;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  /* Enhanced submit button styling */
  .submit-button {
    min-width: 120px;
    height: 44px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    color: #ffffff;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }

    &:hover:not(:disabled):not(.is-loading) {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);

      &::before {
        left: 100%;
      }
    }

    &:active:not(:disabled):not(.is-loading) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    &.is-loading {
      background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
      cursor: not-allowed;

      .loading-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    &:disabled:not(.is-loading) {
      background: #9ca3af;
      box-shadow: none;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

/* Added loading spinner animation */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Enhanced dialog footer responsive design */
:deep(.create-order-dialog) {
  .el-dialog__footer {
    padding: 0;
    background: transparent;
  }
}

.dialog-footer {
  padding: 1rem;
  border-top: 1px solid #f1f5f9;

  @media (max-width: 768px) {
    padding: 1.25rem;
  }
}

.template-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  @media (min-width: 1280px) and (max-width: 1440px) {
    padding: 1rem;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;

    .template-icon {
      transform: scale(1.05);
      color: #3b82f6;
    }

    .template-arrow {
      transform: translateX(4px);
    }

    .action-text {
      color: #3b82f6;
    }
  }

  &:active {
    transform: translateY(0);
  }
}

.template-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.template-icon-wrapper {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.template-icon {
  font-size: 20px;
  color: #64748b;
  transition: all 0.2s ease;
}

.template-badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.template-card-body {
  flex: 1;
  margin-bottom: 1rem;
}

.template-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.template-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.template-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.action-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  transition: color 0.2s ease;
}

.template-arrow {
  color: #94a3b8;
  transition: all 0.2s ease;

  .el-icon {
    font-size: 16px;
  }
}

/* Completely redesigned dialog styles */
:deep(.create-order-dialog) {
  .el-dialog {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid #e2e8f0;

    @media (max-width: 768px) {
      margin: 1rem;
      width: calc(100% - 2rem) !important;
      max-width: none !important;
    }

    @media (min-width: 1280px) and (max-width: 1440px) {
      width: 480px !important;
    }
  }

  .el-dialog__body {
    padding: 0;
  }

  .el-dialog__footer {
    padding: 0;
  }
}

:deep(.dialog-modal) {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  /* Added positioning to ensure header stays at top */
  position: relative;
  z-index: 1;
}

.dialog-header-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

/* Added styles for better title display */
.dialog-title-section {
  flex: 1;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.5;
}

.dialog-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.dialog-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  color: #4f46e5;
  flex-shrink: 0;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.dialog-close:hover {
  background: #f3f4f6;
  color: #374151;
}

/* 修复主布局在移动端的显示 */
.main-layout {
  display: flex;
  gap: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    border-radius: 12px;
  }
}

/* 优化网格布局尺寸 */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  @media (min-width: 1280px) and (max-width: 1440px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
}
</style>
