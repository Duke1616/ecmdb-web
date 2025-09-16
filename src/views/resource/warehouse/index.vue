<template>
  <div class="app-container">
    <!-- 空状态显示 -->
    <div v-if="empty" class="empty-state">
      <el-empty :image-size="160" description="暂无模型数据" class="custom-empty">
        <template #image>
          <div class="empty-icon">
            <svg viewBox="0 0 64 64" width="64" height="64">
              <circle cx="32" cy="32" r="20" fill="#f0f2f5" stroke="#d9d9d9" stroke-width="2" />
              <path d="M32 24v16M24 32h16" stroke="#bfbfbf" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
        </template>
      </el-empty>
    </div>

    <!-- 左右分栏布局 -->
    <div v-else class="main-layout">
      <!-- 左侧分组列表 -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>模型分组</h3>
          <div class="total-groups">{{ groupModelsData.length }} 个分组</div>
        </div>
        <div class="groups-list">
          <div
            v-for="group in groupModelsData"
            :key="`group-${group.group_id}`"
            class="group-list-item"
            :class="{ 'group-active': String(selectedGroupId) === String(group.group_id) }"
            @click="selectGroup(group.group_id)"
          >
            <div class="group-content">
              <div class="group-title">{{ group.group_name }}</div>
              <div class="group-badge">{{ group.models?.length || 0 }} 个模型</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧模型展示区域 -->
      <div class="content-area">
        <div v-if="selectedGroup" class="models-section">
          <div class="section-header">
            <h2 class="section-title">{{ selectedGroup.group_name }}</h2>
            <div class="section-count">{{ selectedGroup.models?.length || 0 }} 个模型</div>
          </div>

          <!-- 模型网格 -->
          <div v-if="selectedGroup.models && selectedGroup.models.length > 0" class="models-grid">
            <div
              v-for="model in selectedGroup.models"
              :key="model.id"
              class="model-card-wrapper"
              @click="handleModelClick(model)"
            >
              <div class="model-card">
                <div class="model-icon-wrapper">
                  <img :src="model.icon" class="model-icon" alt="模型图标" />
                </div>
                <div class="model-info">
                  <h3 class="model-name">{{ model.name }}</h3>
                  <div class="model-uid">{{ model.uid }}</div>
                </div>
                <div class="model-count">{{ model.total }}</div>
              </div>
            </div>
          </div>

          <!-- 分组内空状态 -->
          <div v-else class="group-empty">
            <el-empty :image-size="120" description="该分组暂无模型" />
          </div>
        </div>

        <!-- 未选择分组时的提示 -->
        <div v-else class="no-selection">
          <el-empty :image-size="140" description="请选择一个分组查看模型" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router"
import { type Model, type Models } from "@/api/model/types/model"
import { ref, computed } from "vue"
import { useModelStore } from "@/pinia/stores/model"

const router = useRouter()
const empty = ref<boolean>(false)
const selectedGroupId = ref<string | number>("")

const groupModelsData = ref<Models[]>([])

const selectedGroup = computed(() => {
  return groupModelsData.value.find((group) => String(group.group_id) === String(selectedGroupId.value))
})

const selectGroup = (groupId: string | number) => {
  selectedGroupId.value = groupId
}

const getModelsData = () => {
  useModelStore()
    .ListModelsByGroup()
    .then(({ data }) => {
      groupModelsData.value = data.mgs
      if (groupModelsData.value.length === 0) {
        empty.value = true
      } else {
        selectedGroupId.value = groupModelsData.value[0].group_id
      }
    })
    .catch(() => {
      groupModelsData.value = []
    })
    .finally(() => {})
}

const handleModelClick = (model: Model) => {
  router.push({
    path: "/cmdb/resource/list",
    query: { uid: model.uid, name: model.name }
  })
}

// Ensure hooks are called at the top level
const useModelData = () => {
  getModelsData()
}

useModelData()
</script>

<style scoped>
.app-container {
  height: calc(100vh - 40px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

/* 压缩头部区域空间占用 */
.header-section {
  text-align: center;
  margin-bottom: 20px;
  padding: 12px 0;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #718096;
  margin: 0;
  font-weight: 400;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.custom-empty {
  padding: 40px;
}

.empty-icon {
  margin-bottom: 16px;
}

/* 修复左右两栏间隙问题，设置统一背景色并保留边框间隔 */
.main-layout {
  display: flex;
  gap: 0;
  background: #f8fafc; /* 设置与header相同的背景色，覆盖所有间隙 */
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  flex: 1;
  min-height: 0;
  align-items: stretch;
  justify-content: flex-start;
  border: 1px solid #e2e8f0;
}

/* 同步左侧边栏样式，改进配色方案并保留右边框 */
.sidebar {
  width: 280px;
  min-width: 280px;
  background: white; /* 保持白色背景 */
  border-right: 1px solid #e2e8f0; /* 保留右边框作为间隔 */
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
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
}

.total-groups {
  background: #e2e8f0;
  color: #4a5568;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.groups-list {
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
}

.group-list-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e0;
  transform: translateX(2px);
}

.group-list-item.group-active {
  background: #3182ce !important;
  color: white !important;
  border-color: #2c5aa0;
  box-shadow: 0 2px 8px rgba(49, 130, 206, 0.3);
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

.group-list-item.group-active .group-title {
  color: white !important;
}

.group-list-item.group-active .group-badge {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* 移除可能冲突的旧样式类 */
.group-item {
  display: none !important;
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

/* 同步模型网格样式，包括Mac屏幕优化和高分辨率适配 */
.models-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  align-content: start;
}

.model-card-wrapper {
  cursor: pointer;
  transition: all 0.3s ease;
}

.model-card-wrapper:hover {
  transform: translateY(-3px);
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
}

.model-card::before {
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

.model-card:hover {
  border-color: #3182ce;
  box-shadow: 0 6px 20px rgba(49, 130, 206, 0.15);
}

.model-card:hover::before {
  transform: scaleX(1);
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
  flex-shrink: 0;
}

.model-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
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

.no-selection,
.group-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
