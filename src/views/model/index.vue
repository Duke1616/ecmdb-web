<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="模型管理" subtitle="管理CMDB模型和分组信息" :show-add-button="false" @refresh="getModelsData">
      <template #actions>
        <el-button type="primary" :icon="CirclePlus" class="action-btn" @click="handlerDialogModelCreate">
          新增模型
        </el-button>
        <el-button type="success" :icon="CirclePlus" class="action-btn" @click="handlerDialogModelGroupCreate">
          新建分组
        </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="getModelsData" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-wrapper">
        <el-input
          v-model="searchInput"
          placeholder="搜索模型信息..."
          :suffix-icon="Search"
          class="search-input"
          clearable
          @input="search"
        />
        <el-radio-group v-model="modelStatus" class="status-filter" size="default">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="open">启用中</el-radio-button>
          <el-radio-button value="close">已停用</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-empty v-if="empty === true" :image-size="200" description="暂无数据" />

    <div v-if="empty === false" class="main-content">
      <!-- 同步左侧边栏样式，改进配色方案提高可读性 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>模型分组</h3>
          <div class="total-groups">{{ filterData.length }} 个分组</div>
        </div>
        <div class="group-list">
          <div
            v-for="group in filterData"
            :key="group.group_id"
            class="group-list-item"
            :class="{ 'group-active': String(selectedGroupId) === String(group.group_id) }"
            @click="selectGroup(group.group_id)"
          >
            <div class="group-content">
              <div class="group-title">{{ group.group_name }}</div>
              <div class="group-badge">{{ group.models?.length || 0 }} 个模型</div>
            </div>
            <div class="group-actions">
              <button class="delete-button" @click.stop="handleDeleteModelGroup(group)" title="删除分组">
                <svg viewBox="0 0 24 24" class="delete-icon">
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    stroke="currentColor"
                    stroke-width="2"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>
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

          <!-- 同步模型网格样式，包括Mac屏幕优化和高分辨率适配 -->
          <div class="model-grid">
            <div v-for="model in selectedGroup.models" :key="model.id" class="model-card-wrapper">
              <div class="model-card" @click="handleModelClick(model)">
                <div class="model-header">
                  <div class="model-icon-wrapper">
                    <!-- 判断是否为图片URL还是图标字体类名 -->
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

        <div v-else class="empty-selection">
          <el-empty description="请选择左侧分组查看模型" :image-size="120" />
        </div>
      </div>
    </div>

    <!-- 新增模型 -->
    <FormDialog
      v-model="dialogModelVisible"
      title="新增模型"
      subtitle="创建新的CMDB模型"
      width="500px"
      header-icon="Document"
      @closed="resetForm"
      @confirm="handlerCreateModel"
      @cancel="dialogModelVisible = false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" label-position="top">
        <el-form-item prop="group_id" label="所属分组">
          <el-select v-model="formData.group_id" placeholder="请选择">
            <el-option
              v-for="item in ModelsData"
              :key="item.group_id"
              :label="item.group_name"
              :value="item.group_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="uid" label="唯一标识">
          <el-input v-model="formData.uid" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item prop="name" label="名称">
          <el-input v-model="formData.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item prop="icon" label="图标选择">
          <CustomIconSelect v-model="formData.iconData" iconType="cmdb" @change="handleIconChange" />
        </el-form-item>
      </el-form>
    </FormDialog>
    <!-- 新增分组 -->
    <FormDialog
      v-model="dialogModelGroupVisible"
      title="新增分组"
      subtitle="创建新的模型分组"
      width="500px"
      header-icon="Folder"
      @closed="resetForm"
      @confirm="handlerCreateModelGroup"
      @cancel="dialogModelGroupVisible = false"
    >
      <el-form
        ref="formGroupRef"
        :model="formModelGroupData"
        :rules="{ name: [{ required: true, message: '必须输入名称', trigger: 'blur' }] }"
        label-width="100px"
        label-position="top"
      >
        <el-form-item prop="name" label="名称">
          <el-input v-model="formModelGroupData.name" placeholder="请输入名称" />
        </el-form-item>
      </el-form>
    </FormDialog>
  </PageContainer>
</template>

<script lang="ts" setup>
import { h, ref, computed, onMounted, onUnmounted } from "vue"
import { CirclePlus, Search, Document, RefreshRight } from "@element-plus/icons-vue"
import { CreateModelApi, CreateModelGroupApi, deleteModelGroupApi } from "@/api/model"
import { type FormInstance, type FormRules, ElMessage, ElMessageBox } from "element-plus"
import { type Models, type Model, type CreateModelReq, type CreateModelGroupReq } from "@/api/model/types/model"
import CustomIconSelect from "@/common/components/CustomIconSelect/index.vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import { FormDialog } from "@@/components/Dialogs"

import { cloneDeep } from "lodash-es"
import { useRouter } from "vue-router"
import { useModelStore } from "@/pinia/stores/model"

const searchInput = ref("")
const modelStatus = ref<"all" | "open" | "close">("all")
const router = useRouter()

const empty = ref<boolean>(false)
const selectedGroupId = ref<number | null>(null)

const selectGroup = (groupId: number) => {
  selectedGroupId.value = groupId
}

const selectedGroup = computed(() => {
  if (!selectedGroupId.value) return null
  return filterData.value.find((group) => group.group_id === selectedGroupId.value)
})

const handleDeleteModelGroup = (item: any) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除模型: "),
      h("i", { style: "color: red" }, `${item.group_name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteModelGroupApi(item.group_id).then(() => {
      ElMessage.success("删除成功")
      if (selectedGroupId.value === item.group_id) {
        selectedGroupId.value = null
      }
      getModelsData()
    })
  })
}

interface IconData {
  name: string
  color: string
  id?: string
  url?: string
}

interface ExtendedCreateModelReq extends CreateModelReq {
  iconData: IconData
}

const DEFAULT_FORM_DATA: ExtendedCreateModelReq = {
  name: "",
  group_id: undefined,
  icon: "",
  uid: "",
  iconData: { name: "", color: "", id: "", url: "" }
}

const DEFAULT_MODEL_GROUP_DATA: CreateModelGroupReq = {
  name: ""
}

const dialogModelVisible = ref<boolean>(false)
const dialogModelGroupVisible = ref<boolean>(false)
const formData = ref<ExtendedCreateModelReq>(cloneDeep(DEFAULT_FORM_DATA))
const formModelGroupData = ref<CreateModelGroupReq>(cloneDeep(DEFAULT_MODEL_GROUP_DATA))
const formRef = ref<FormInstance | null>(null)
const formGroupRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  group_id: [{ required: true, message: "必须输入所在组", trigger: "blur" }],
  uid: [
    { required: true, message: "必须输入唯一标识", trigger: "blur" },
    { type: "string", pattern: /^[A-Za-z]+$/, message: "只能输入英文字母", trigger: "blur" }
  ],
  name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
  icon: [{ required: true, message: "必须选择图标", trigger: "change" }]
}

const handlerDialogModelCreate = () => {
  dialogModelVisible.value = true
}
const handlerDialogModelGroupCreate = () => {
  dialogModelGroupVisible.value = true
}

const handleIconChange = (iconData: IconData) => {
  // 优先使用 url（图片地址），其次使用 name（图标字体）
  if (iconData.url) {
    formData.value.icon = iconData.url
  } else if (iconData.name) {
    formData.value.icon = iconData.name
  }

  // 更新 iconData 以保持数据同步
  formData.value.iconData = {
    name: iconData.name || "",
    color: iconData.color || "",
    id: iconData.id || "",
    url: iconData.url || ""
  }

  // 手动触发表单验证
  formRef.value?.validateField("icon")
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formGroupRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  formModelGroupData.value = cloneDeep(DEFAULT_MODEL_GROUP_DATA)
}

// ** 创建模型分组 */
const handlerCreateModelGroup = () => {
  formGroupRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)
    CreateModelGroupApi(formModelGroupData.value)
      .then(() => {
        ElMessage.success("操作成功")
        dialogModelGroupVisible.value = false
        getModelsData()
      })
      .catch((error) => {
        console.error("创建分组失败:", error)
        ElMessage.error("创建分组失败")
      })
  })
}

// ** 创建模型 */
const handlerCreateModel = () => {
  formRef.value?.validate((valid: boolean, fields) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 只发送API需要的字段
    const apiData: CreateModelReq = {
      name: formData.value.name,
      icon: formData.value.icon,
      group_id: formData.value.group_id,
      uid: formData.value.uid
    }

    CreateModelApi(apiData)
      .then(() => {
        ElMessage.success("操作成功")
        dialogModelVisible.value = false
        getModelsData()
      })
      .catch((error) => {
        console.error("创建模型失败:", error)
        ElMessage.error("创建模型失败")
      })
  })
}

const ModelsData = ref<Models[]>([])
const filterData = ref<Models[]>([])
// ** 获取数据 */
const getModelsData = () => {
  useModelStore()
    .ListModelsByGroup()
    .then(({ data }) => {
      ModelsData.value = data.mgs
      filterData.value = data.mgs

      // 调试：打印图标数据
      if (data.mgs && data.mgs.length > 0) {
        console.log("模型数据示例:", data.mgs[0])
        if (data.mgs[0].models && data.mgs[0].models.length > 0) {
          console.log("模型图标示例:", data.mgs[0].models[0].icon)
        }
      }

      if (ModelsData.value.length > 0 && !selectedGroupId.value) {
        selectedGroupId.value = ModelsData.value[0].group_id
      }

      if (ModelsData.value.length === 0) {
        empty.value = true
      }
    })
    .catch(() => {
      ModelsData.value = []
    })
}

const handleModelClick = (model: Model) => {
  console.log(model)
  router.push({
    path: "/cmdb/model/info",
    query: { uid: model.uid, name: model.name }
  })
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

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  console.warn("图片加载失败:", target.src)
  // 可以设置默认图片或隐藏图片
  target.style.display = "none"
}

const search = () => {
  filterData.value = ModelsData.value
  // 如果搜索关键词为空，不执行过滤
  if (!searchInput.value.trim()) {
    return
  }

  const foundModels: Models[] = []
  ModelsData.value.forEach((group) => {
    if (Array.isArray(group.models)) {
      const matchingModels = group.models.filter(
        (model) =>
          model.uid.toLowerCase().includes(searchInput.value.trim().toLowerCase()) ||
          model.name.toLowerCase().includes(searchInput.value.trim().toLowerCase())
      )
      if (matchingModels.length > 0) {
        // 构造一个虚拟的包含匹配模型的组数据
        foundModels.push({
          group_id: group.group_id,
          group_name: group.group_name,
          models: matchingModels
        })
      }
    }
  })

  filterData.value = foundModels
}

// Ensure all hooks are called at the top level
onMounted(() => {
  getModelsData()
})
onUnmounted(() => {
  // Cleanup code here if needed
})
</script>

<style lang="scss" scoped>
/* 搜索区域样式 */
.search-section {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.search-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
}

.search-input {
  flex: 1;
  max-width: 300px;
}

.status-filter {
  flex-shrink: 0;
}

/* 主内容区域 */
.main-content {
  display: flex;
  gap: 0;
  background: #f8fafc;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex: 1;
  min-height: 0;
  align-items: stretch;
  justify-content: flex-start;
  border: 1px solid #e2e8f0;
  margin-top: 20px;
}

/* 同步左侧边栏样式，改进配色方案 */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: white; /* 保持白色背景 */
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 确保与右侧section-header高度一致 */
  min-height: 72px;
  box-sizing: border-box;

  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #2d3748;
  }
}

.total-groups {
  background: #e2e8f0;
  color: #4a5568;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.group-list {
  padding: 12px;
  overflow-y: auto;
  flex: 1;
}

/* 同步分组项样式，确保显示为正常列表 */
.group-list-item {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  width: 100% !important;
  padding: 14px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
  background: #fafbfc;
  box-sizing: border-box;
  position: relative;

  &:hover {
    background: #f1f5f9;
    border-color: #cbd5e0;
    transform: translateX(2px);

    .group-actions {
      opacity: 1;
    }
  }

  &.group-active {
    background: #3182ce !important;
    color: white !important;
    border-color: #2c5aa0;
    box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);

    .group-title {
      color: white !important;
    }

    .group-badge {
      color: rgba(255, 255, 255, 0.85) !important;
    }
  }
}

.group-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.group-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2d3748;
  line-height: 1.3;
}

.group-badge {
  font-size: 0.8rem;
  color: #718096;
  font-weight: 500;
}

.group-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 8px;
}

.group-list-item:hover .group-actions {
  opacity: 1;
}

/* 改进删除按钮样式，使用更美观的设计 */
.delete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #94a3b8;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.delete-icon {
  width: 16px;
  height: 16px;
  transition: all 0.2s ease;
}

/* 同步右侧内容区域样式 */
.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white; /* 设置白色背景 */
}

.models-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  flex-shrink: 0;
  min-height: 72px;
  box-sizing: border-box;
}

.section-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
}

.section-count {
  background: #3182ce;
  color: white;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}

.empty-selection {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 300px;
}

/* 同步模型网格样式，包括Mac屏幕优化和高分辨率适配 */
.model-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-content: start;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px;
  }

  @media (min-width: 640px) and (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
    padding: 18px;
  }

  @media (min-width: 1440px) {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 18px;
    padding: 22px;
  }

  @media (min-width: 1920px) {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

.model-card-wrapper {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
  }
}

/* 同步现代化模型卡片设计 */
.model-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 18px;
  height: 100%;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #3182ce 0%, #2c5aa0 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    border-color: #3182ce;
    box-shadow: 0 6px 20px rgba(49, 130, 206, 0.15);

    &::before {
      transform: scaleX(1);
    }
  }
}

.model-header {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.model-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f7fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    width: 32px;
    height: 32px;
  }
}

.model-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    width: 20px;
    height: 20px;
  }
}

.model-icon-font {
  font-size: 22px;
  color: #3182ce;
  font-family: "iconfont" !important;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    font-size: 20px;
  }
}

.model-icon-default {
  font-size: 22px;
  color: #94a3b8;

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    font-size: 20px;
  }
}

.model-info {
  flex: 1;
  min-width: 0;
}

.model-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 2px 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* Mac屏幕优化 */
  @media (min-width: 1280px) and (max-width: 1439px) {
    font-size: 0.9rem;
  }
}

.model-uid {
  color: #718096;
  font-size: 0.8rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-count {
  background: #3182ce;
  color: white;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 36px;
  text-align: center;
  flex-shrink: 0;
}

/* 同步响应式设计优化 */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    gap: 0;
    height: auto;
    flex: 1;
    min-height: 0;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
    max-height: 180px;
    min-height: 150px;
  }

  .group-list {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 12px;
  }

  .group-list-item {
    min-width: 180px;
    margin-bottom: 0;
  }

  .content-area {
    flex: 1;
    min-height: 0;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 16px;
    padding: 16px;

    .section-title {
      font-size: 1.1rem;
    }
  }

  .empty-selection {
    min-height: 200px;
  }
}

@media (max-width: 480px) {
  .search-wrapper {
    gap: 12px;
  }

  .sidebar {
    max-height: 160px;
  }

  .group-list-item {
    min-width: 140px;
  }

  .model-card {
    padding: 14px;
  }
}

/* 添加高分辨率显示器优化 */
@media (min-width: 1440px) {
  .sidebar {
    width: 320px;
    min-width: 320px;
  }
}
</style>
