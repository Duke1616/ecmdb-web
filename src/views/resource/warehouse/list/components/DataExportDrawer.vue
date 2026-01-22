<template>
  <Drawer
    v-model="visible"
    title="导出数据"
    subtitle="选择导出条件和字段"
    size="40%"
    direction="rtl"
    :header-icon="Download"
    :show-footer="true"
    cancel-button-text="取消"
    confirm-button-text="开始导出"
    :confirm-loading="exporting"
    @cancel="handleClose"
    @confirm="handleExport"
    @closed="handleClose"
  >
    <div class="export-drawer-content">
      <!-- 导出说明 -->
      <el-alert type="info" :closable="false" class="export-info">
        <template #default>
          <div class="info-text">
            <el-icon class="info-icon"><InfoFilled /></el-icon>
            <span>导出当前模型的资产数据为 Excel 文件</span>
          </div>
        </template>
      </el-alert>

      <!-- 导出选项 - 卡片式布局 -->
      <div class="export-options-grid">
        <!-- 左侧卡片: 导出范围 -->
        <div class="option-card">
          <div class="card-header">
            <el-icon class="header-icon"><Download /></el-icon>
            <h3 class="card-title">导出范围</h3>
          </div>
          <div class="card-body">
            <el-radio-group v-model="exportOptions.scope" class="radio-group">
              <el-radio value="all">全部数据</el-radio>
              <el-radio value="current">当前页数据</el-radio>
              <el-radio value="selected" :disabled="selectedCount === 0">
                已选数据
                <span v-if="selectedCount > 0" class="selected-count">(已选 {{ selectedCount }} 条)</span>
                <span v-else class="selected-hint">(未选择)</span>
              </el-radio>
            </el-radio-group>
          </div>
        </div>

        <!-- 右侧卡片: 筛选条件 -->
        <div class="option-card">
          <div class="card-header">
            <el-icon class="header-icon"><Filter /></el-icon>
            <h3 class="card-title">筛选条件</h3>
          </div>
          <div class="card-body">
            <!-- 筛选条件组列表 -->
            <div v-if="exportOptions.filterGroups.length > 0" class="filter-groups">
              <div v-for="(group, groupIndex) in exportOptions.filterGroups" :key="groupIndex" class="filter-group">
                <div class="group-header">
                  <span class="group-label">条件组 {{ groupIndex + 1 }}</span>
                  <span class="group-logic">组内条件为 AND 关系</span>
                  <el-button
                    v-if="exportOptions.filterGroups.length > 1"
                    :icon="Delete"
                    type="danger"
                    size="small"
                    text
                    @click="removeFilterGroup(groupIndex)"
                  >
                    删除组
                  </el-button>
                </div>

                <!-- 组内筛选条件列表 -->
                <div class="filter-list">
                  <div v-for="(filter, filterIndex) in group.filters" :key="filterIndex" class="filter-item">
                    <el-select v-model="filter.field" placeholder="选择字段" size="small" class="filter-field">
                      <el-option v-for="field in modelFields" :key="field.id" :label="field.name" :value="field.id" />
                    </el-select>

                    <el-select v-model="filter.operator" placeholder="操作符" size="small" class="filter-operator">
                      <el-option label="等于" value="eq" />
                      <el-option label="不等于" value="ne" />
                      <el-option label="包含" value="contains" />
                      <el-option label="大于" value="gt" />
                      <el-option label="小于" value="lt" />
                    </el-select>

                    <!-- 值输入: 根据字段类型动态渲染 -->
                    <template v-if="getFieldType(filter.field) === 'list'">
                      <el-select v-model="filter.value" placeholder="选择值" size="small" class="filter-value">
                        <el-option
                          v-for="option in getFieldOptions(filter.field)"
                          :key="option"
                          :label="option"
                          :value="option"
                        />
                      </el-select>
                    </template>
                    <template v-else>
                      <el-input v-model="filter.value" placeholder="值" size="small" class="filter-value" />
                    </template>

                    <el-button
                      :icon="Delete"
                      type="danger"
                      size="small"
                      circle
                      @click="removeFilter(groupIndex, filterIndex)"
                    />
                  </div>
                </div>

                <!-- 添加条件到当前组 -->
                <el-button :icon="Plus" size="small" text @click="addFilterToGroup(groupIndex)" class="add-filter-btn">
                  添加条件
                </el-button>

                <!-- OR 分隔符 -->
                <div v-if="groupIndex < exportOptions.filterGroups.length - 1" class="or-divider">
                  <span class="or-text">OR</span>
                </div>
              </div>

              <!-- 添加新的筛选组 -->
              <el-button :icon="Plus" size="small" @click="addFilterGroup" class="add-group-btn">
                添加条件组 (OR)
              </el-button>
            </div>

            <!-- 空状态提示 + 添加按钮 -->
            <div v-else class="filter-empty">
              <p class="empty-text">未添加筛选条件,将导出所有数据</p>
              <el-button :icon="Plus" size="small" @click="addFilterGroup">添加筛选条件</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 导出预览 -->
      <div class="export-preview">
        <div class="preview-header">
          <el-icon class="preview-icon"><View /></el-icon>
          <h3 class="preview-title">导出预览</h3>
        </div>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-label">文件名:</span>
            <span class="preview-value">{{ previewFileName }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">导出范围:</span>
            <span class="preview-value">{{ exportScopeText }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">筛选条件:</span>
            <span class="preview-value">{{ filtersText }}</span>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue"
import { Download, InfoFilled, View, Plus, Delete, Filter } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { useDataIO } from "../composables/useDataIO"

// 字段接口
interface ModelField {
  id: string
  name: string
  type?: string
  options?: any // list 类型字段的选项
}

interface Props {
  modelValue: boolean
  modelUid: string
  modelName?: string
  selectedIds?: string[] // 已选数据的 ID 列表
  modelFields?: ModelField[] // 模型字段列表
}

const props = withDefaults(defineProps<Props>(), {
  modelName: "",
  selectedIds: () => [],
  modelFields: () => []
})

const emits = defineEmits<{
  "update:modelValue": [value: boolean]
  "export-success": []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emits("update:modelValue", value)
})

// 已选数据数量
const selectedCount = computed(() => props.selectedIds?.length || 0)

const { exporting, exportData } = useDataIO()

// 筛选条件接口
interface FilterCondition {
  field: string
  operator: string
  value: string
}

// 筛选条件组接口
interface FilterGroup {
  filters: FilterCondition[]
}

// 导出选项
const exportOptions = ref({
  scope: "all", // all | current | selected
  filterGroups: [] as FilterGroup[]
})

// 添加筛选条件组
const addFilterGroup = () => {
  exportOptions.value.filterGroups.push({
    filters: [
      {
        field: "",
        operator: "eq",
        value: ""
      }
    ]
  })
}

// 移除筛选条件组
const removeFilterGroup = (groupIndex: number) => {
  exportOptions.value.filterGroups.splice(groupIndex, 1)
}

// 添加筛选条件到指定组
const addFilterToGroup = (groupIndex: number) => {
  exportOptions.value.filterGroups[groupIndex].filters.push({
    field: "",
    operator: "eq",
    value: ""
  })
}

// 移除筛选条件
const removeFilter = (groupIndex: number, filterIndex: number) => {
  const group = exportOptions.value.filterGroups[groupIndex]
  group.filters.splice(filterIndex, 1)

  // NOTE: 如果组内没有条件了,删除整个组
  if (group.filters.length === 0) {
    exportOptions.value.filterGroups.splice(groupIndex, 1)
  }
}

// 获取字段类型
const getFieldType = (fieldId: string): string | undefined => {
  const field = props.modelFields?.find((f) => f.id === fieldId)
  return field?.type
}

// 获取字段选项 (用于 list 类型)
const getFieldOptions = (fieldId: string): string[] => {
  const field = props.modelFields?.find((f) => f.id === fieldId)
  if (field?.options && Array.isArray(field.options)) {
    return field.options
  }
  return []
}

// 预览文件名
const previewFileName = computed(() => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const name = props.modelName || "data"
  return `${name}_export_${timestamp}.xlsx`
})

// 筛选条件文本
const filtersText = computed(() => {
  const groupCount = exportOptions.value.filterGroups.length
  if (groupCount === 0) return "无筛选条件"

  const totalFilters = exportOptions.value.filterGroups.reduce((sum, group) => sum + group.filters.length, 0)

  if (groupCount === 1) {
    return `${totalFilters} 个筛选条件`
  }

  return `${groupCount} 个条件组 (共 ${totalFilters} 个条件)`
})

// 导出范围文本
const exportScopeText = computed(() => {
  switch (exportOptions.value.scope) {
    case "all":
      return "全部数据"
    case "current":
      return "当前页数据"
    case "selected":
      return `已选数据 (${selectedCount.value} 条)`
    default:
      return "全部数据"
  }
})

// 开始导出
const handleExport = async () => {
  // 验证筛选条件完整性
  for (const group of exportOptions.value.filterGroups) {
    for (const filter of group.filters) {
      if (!filter.field || !filter.operator || !filter.value) {
        ElMessage.warning("请完善筛选条件")
        return
      }
    }
  }

  try {
    // NOTE: 导出选项暂时不传递给 API,等待后端支持
    // TODO: 后续需要将 exportOptions 传递给后端进行筛选
    await exportData(props.modelUid, props.modelName)
    emits("export-success")
    handleClose()
  } catch (error) {
    console.error("导出失败:", error)
  }
}

// 关闭抽屉
const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.export-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

// 导出说明
.export-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;

  :deep(.el-alert__content) {
    padding: 0;
  }

  .info-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #0c4a6e;

    .info-icon {
      font-size: 16px;
      color: #0891b2;
    }
  }
}

// 卡片式布局
.export-options-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 选项卡片
.option-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
    border-bottom: 1px solid #e5e7eb;

    .header-icon {
      font-size: 16px;
      color: #0891b2;
    }

    .card-title {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
  }

  .card-body {
    padding: 16px;

    .radio-group {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 20px;

      :deep(.el-radio) {
        margin-right: 0;
        height: auto;

        .el-radio__label {
          font-size: 13px;
          color: #4b5563;
        }

        &.is-disabled {
          .el-radio__label {
            color: #d1d5db;
          }
        }
      }

      .selected-count {
        font-size: 12px;
        color: #0891b2;
        font-weight: 600;
        margin-left: 4px;
      }

      .selected-hint {
        font-size: 12px;
        color: #9ca3af;
        margin-left: 4px;
      }
    }

    // 筛选条件组
    .filter-groups {
      display: flex;
      flex-direction: column;
      gap: 0; // 间距由 or-divider 控制
    }

    .filter-group {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      position: relative;
      transition: all 0.2s ease;

      &:hover {
        border-color: #cbd5e0;
        background: #f1f5f9;
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px dashed #e2e8f0;

        .group-label {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }

        .group-logic {
          font-size: 12px;
          color: #a0aec0;
          background: #edf2f7;
          padding: 2px 6px;
          border-radius: 4px;
        }

        :deep(.el-button) {
          margin-left: auto;
          padding: 0;
          height: auto;
          font-size: 12px;
        }
      }

      .add-filter-btn {
        margin-top: 8px;
        padding-left: 0;
        font-size: 12px;
        color: #3182ce;

        &:hover {
          color: #2c5aa0;
        }
      }
    }

    // OR 分隔符
    .or-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 16px 0;
      position: relative;
      height: 20px;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 50%;
        height: 1px;
        background: #e2e8f0;
        z-index: 0;
      }

      .or-text {
        position: relative;
        z-index: 1;
        background: white;
        padding: 0 12px;
        color: #f59e0b;
        font-weight: 600;
        font-size: 12px;
        border: 1px solid #fcd34d;
        border-radius: 12px;
        background: #fffbeb;
      }
    }

    .add-group-btn {
      width: 100%;
      border-style: dashed;
      margin-top: 8px;
      color: #718096;

      &:hover {
        color: #3182ce;
        border-color: #3182ce;
        background: #ebf8ff;
      }
    }

    // 筛选条件列表
    .filter-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 0; // 去除底部边距，交给 add-filter-btn
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s ease;

      &:hover {
        background: #f5f5f5;
        border-color: #d1d5db;
      }

      .filter-field {
        flex: 1.2;
        min-width: 100px;
      }

      .filter-operator {
        width: 100px;
      }

      .filter-value {
        flex: 1.5;
      }

      :deep(.el-button.is-circle) {
        flex-shrink: 0;
      }
    }

    // 空状态
    .filter-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px dashed #d1d5db;

      .empty-text {
        margin: 0;
        font-size: 13px;
        color: #9ca3af;
        text-align: center;
      }
    }

    // 继续添加按钮
    .add-more-btn {
      width: 100%;
      margin-top: 0;
    }
  }
}

// 导出预览
.export-preview {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;

    .preview-icon {
      font-size: 18px;
      color: #d97706;
    }

    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin: 0;
    }
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .preview-item {
      display: flex;
      align-items: flex-start;
      font-size: 13px;
      line-height: 1.6;

      .preview-label {
        color: #92400e;
        font-weight: 500;
        min-width: 90px;
        flex-shrink: 0;
      }

      .preview-value {
        color: #78350f;
        font-weight: 600;
        word-break: break-all;
      }
    }
  }
}
</style>
