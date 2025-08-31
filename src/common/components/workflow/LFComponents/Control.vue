<template>
  <div class="control-panel">
    <!-- Redesigned for horizontal top toolbar layout -->
    <div class="control-content">
      <!-- Stats section -->
      <div class="control-stats" v-if="stats">
        <div class="stat-item">
          <span class="stat-label">节点</span>
          <span class="stat-value">{{ stats.nodeCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">连线</span>
          <span class="stat-value">{{ stats.edgeCount || 0 }}</span>
        </div>
      </div>

      <!-- Actions section -->
      <div class="control-actions">
        <button
          type="button"
          @click="undo"
          :disabled="undoDisable"
          class="control-btn control-btn-secondary"
          title="撤销操作"
        >
          <RefreshLeft class="btn-icon" data-icon="undo" />
          撤销
        </button>

        <button
          type="button"
          @click="redo"
          :disabled="redoDisable"
          class="control-btn control-btn-secondary"
          title="重做操作"
        >
          <RefreshRight class="btn-icon" data-icon="redo" />
          重做
        </button>

        <button type="button" @click="getData" class="control-btn control-btn-primary" title="查看当前流程数据">
          <View class="btn-icon" />
          查看数据
        </button>

        <button type="button" @click="download" class="control-btn control-btn-accent" title="下载流程图片">
          <Download class="btn-icon" />
          下载图片
        </button>

        <button
          type="button"
          @click="reposition"
          class="control-btn control-btn-reposition"
          title="重新定位所有节点到画布中心"
        >
          <Location class="btn-icon" />
          重新定位
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { View, Download, RefreshLeft, RefreshRight, Location } from "@element-plus/icons-vue"

interface Props {
  lf?: any // LogicFlow instance
  stats?: {
    nodeCount: number
    edgeCount: number
  }
}

const props = defineProps<Props>()
const emit = defineEmits(["getData", "download"])

const undoDisable = ref(true)
const redoDisable = ref(true)

const updateButtonStates = () => {
  if (props.lf && props.lf.history) {
    undoDisable.value = !props.lf.history.undoAble()
    redoDisable.value = !props.lf.history.redoAble()
  }
}

watch(
  () => props.lf,
  (newLf) => {
    if (newLf) {
      // Update button states based on history
      updateButtonStates()

      // Listen to history changes
      newLf.on("history:change", updateButtonStates)
    }
  },
  { immediate: true }
)

const undo = () => {
  if (props.lf && props.lf.history && props.lf.history.undoAble()) {
    props.lf.undo()
    updateButtonStates()
  }
}

const redo = () => {
  if (props.lf && props.lf.history && props.lf.history.redoAble()) {
    props.lf.redo()
    updateButtonStates()
  }
}

const download = () => {
  emit("download")
}

const getData = () => {
  emit("getData")
}

const reposition = () => {
  if (props.lf) {
    // 重新定位所有节点到画布中心
    props.lf.translateCenter()
  }
}
</script>

<style scoped>
/* Updated control panel for horizontal top toolbar layout */
.control-panel {
  background: transparent;
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  min-width: auto;
  backdrop-filter: none;
  width: 100%;
}

.control-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  width: 100%;
}

.control-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 16px;
  color: #667eea;
  font-weight: 700;
  min-width: 24px;
  text-align: center;
}

.control-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  min-width: 100px;
}

.control-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.control-btn:hover::before {
  left: 100%;
}

.control-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.control-btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.control-btn-secondary {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #64748b;
  border-color: #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.control-btn-secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
}

/* 撤销按钮特殊样式 */
.control-btn-secondary:has(.btn-icon[data-icon="undo"]) {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #374151;
  border-color: #d1d5db;
}

.control-btn-secondary:has(.btn-icon[data-icon="undo"]):hover:not(:disabled) {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #1f2937;
  border-color: #9ca3af;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

/* 重做按钮特殊样式 */
.control-btn-secondary:has(.btn-icon[data-icon="redo"]) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0c4a6e;
  border-color: #7dd3fc;
}

.control-btn-secondary:has(.btn-icon[data-icon="redo"]):hover:not(:disabled) {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0c4a6e;
  border-color: #38bdf8;
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.15);
}

.control-btn-accent {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.control-btn-accent:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.4);
}

.control-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
  background: #f1f5f9 !important;
  color: #9ca3af !important;
  border-color: #e5e7eb !important;
}

/* 撤销按钮禁用状态 */
.control-btn-secondary:has(.btn-icon[data-icon="undo"]):disabled {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
  color: #9ca3af !important;
  border-color: #e5e7eb !important;
  opacity: 0.5;
}

/* 重做按钮禁用状态 */
.control-btn-secondary:has(.btn-icon[data-icon="redo"]):disabled {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  color: #94a3b8 !important;
  border-color: #cbd5e1 !important;
  opacity: 0.5;
}

/* 重新定位按钮特殊样式 */
.control-btn-reposition {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.control-btn-reposition:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
  border-color: #047857;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.control-btn:active {
  transform: translateY(0);
}

.btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
