<template>
  <Drawer
    v-model="visible"
    title="导出数据"
    subtitle="选择导出条件和字段"
    size="35%"
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
              <el-radio :value="ExportScope.ALL">全部数据</el-radio>
              <el-radio :value="ExportScope.CURRENT">当前页数据</el-radio>
              <el-radio :value="ExportScope.SELECTED" :disabled="selectedCount === 0">
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
                      <el-option
                        v-for="op in getOperators(filter.field)"
                        :key="op.value"
                        :label="op.label"
                        :value="op.value"
                      />
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

      <!-- 导出字段选择 -->
      <div class="option-card full-width">
        <div class="card-header">
          <el-icon class="header-icon"><List /></el-icon>
          <h3 class="card-title">导出字段</h3>
          <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" class="select-all-checkbox">
            全选
          </el-checkbox>
        </div>
        <div class="card-body">
          <el-checkbox-group v-model="exportOptions.fields" class="field-checkbox-group">
            <el-checkbox v-for="field in modelFields" :key="field.id" :value="field.id">
              {{ field.name }}
            </el-checkbox>
          </el-checkbox-group>
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
import { ref, computed, type PropType } from "vue"
import { Download, InfoFilled, View, Plus, Delete, Filter, List } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { useDataIO } from "@/common/composables/useDataIO"
import { type ExportReq, ExportScope, ExportOperator } from "@/api/resource/dataio/types"

// 字段接口
interface ModelField {
  id: string
  name: string
  type?: string
  options?: any // list 类型字段的选项
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  modelUid: {
    type: String,
    required: true
  },
  modelName: {
    type: String,
    default: ""
  },
  modelFields: {
    type: Array as PropType<ModelField[]>,
    default: () => []
  },
  selectedIds: {
    type: Array as PropType<number[]>,
    default: () => []
  },
  currentIds: {
    type: Array as PropType<number[]>,
    default: () => []
  }
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
  operator: ExportOperator
  value: string
}

// 筛选条件组接口
interface FilterGroup {
  filters: FilterCondition[]
}

// 导出选项
const exportOptions = ref({
  scope: ExportScope.ALL,
  filterGroups: [] as FilterGroup[],
  fields: [] as string[]
})

// 全选状态
const isIndeterminate = computed(() => {
  const selectedCount = exportOptions.value.fields.length
  const totalCount = props.modelFields.length
  return selectedCount > 0 && selectedCount < totalCount
})

const checkAll = computed({
  get: () => exportOptions.value.fields.length === props.modelFields.length && props.modelFields.length > 0,
  set: (val) => {
    exportOptions.value.fields = val ? props.modelFields.map((f) => f.id) : []
  }
})

// 初始化字段选择 (默认全选)
watch([() => props.modelValue, () => props.modelFields], ([val, fields]) => {
  if (val && fields && fields.length > 0) {
    // 仅在字段列表为空时才初始化全选，保留用户可能的修改（如果未关闭 Drawer）
    // 或者每次打开都重置？通常重置更好
    exportOptions.value.fields = fields.map((f) => f.id)
  }
})

// 添加筛选条件组
const addFilterGroup = () => {
  exportOptions.value.filterGroups.push({
    filters: [
      {
        field: "",
        operator: ExportOperator.EQ,
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
    operator: ExportOperator.EQ,
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

// 操作符选项
const operatorOptions = {
  common: [
    { label: "等于", value: ExportOperator.EQ },
    { label: "不等于", value: ExportOperator.NE }
  ],
  string: [{ label: "包含", value: ExportOperator.CONTAINS }],
  number: [
    { label: "大于", value: ExportOperator.GT },
    { label: "小于", value: ExportOperator.LT }
  ]
}

// 获取字段可用的操作符
const getOperators = (fieldId: string) => {
  const type = getFieldType(fieldId)
  let ops = [...operatorOptions.common]

  if (!type || type === "string" || type === "text") {
    ops = [...ops, ...operatorOptions.string]
  } else if (["integer", "float", "number", "datetime", "date"].includes(type)) {
    ops = [...ops, ...operatorOptions.number]
  }

  return ops
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
    case ExportScope.ALL:
      return "全部数据"
    case ExportScope.CURRENT:
      return "当前页数据"
    case ExportScope.SELECTED:
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
    const req: ExportReq = {
      model_uid: props.modelUid,
      scope: exportOptions.value.scope,
      fields: exportOptions.value.fields,
      filter_groups: []
    }

    // 设置导出范围相关参数
    if (req.scope === ExportScope.SELECTED) {
      req.resource_ids = props.selectedIds
    } else if (req.scope === ExportScope.CURRENT) {
      req.resource_ids = props.currentIds
    }

    // 处理筛选条件 (适用于 ALL 和 CURRENT)
    if (req.scope === ExportScope.ALL || req.scope === ExportScope.CURRENT) {
      if (exportOptions.value.filterGroups.length > 0) {
        req.filter_groups = exportOptions.value.filterGroups.map((group) => ({
          filters: group.filters.map((f) => ({
            field_uid: f.field,
            operator: f.operator,
            value: f.value
          }))
        }))
      }
    }

    await exportData(req, previewFileName.value)
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

    // 导出字段选择
    .field-checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;

      :deep(.el-checkbox) {
        margin-right: 0;

        .el-checkbox__label {
          font-size: 13px;
          color: #4b5563;
        }
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
