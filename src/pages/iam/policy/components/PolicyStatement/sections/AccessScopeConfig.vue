<template>
  <SectionPanel :label="label" :required="required || configurable" :disabled="disabled" no-arrow>
    <template #preview>
      <div class="scope-editor">
        <template v-if="configurable && currentTemplate !== 'custom'">
          <div class="scope-context">
            <div class="scope-target">
              <span class="scope-target-label">适用操作</span>
              <strong>{{ scopedActionSummary }}</strong>
              <el-tooltip
                :content="scopedActionNames.join('、')"
                placement="top"
                :show-after="300"
                :disabled="scopedActionNames.length === 0"
              >
                <el-icon class="scope-info" aria-label="查看适用操作"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-tag v-if="!stmt.access_scope_configured" size="small" type="warning" effect="plain">待配置</el-tag>
          </div>

          <el-radio-group
            :model-value="selectedTemplate"
            size="small"
            class="scope-segments"
            @update:model-value="selectTemplate"
          >
            <el-tooltip
              v-for="option in availableTemplates"
              :key="option.id"
              :content="option.description"
              placement="top"
              :show-after="350"
            >
              <el-radio-button :value="option.id" :class="{ 'is-unrestricted': option.id === 'none' }">
                {{ option.label }}
              </el-radio-button>
            </el-tooltip>
          </el-radio-group>
        </template>

        <div v-else-if="stmt.access_scope" class="custom-scope">
          <el-tag size="small" :type="configurable ? 'info' : 'warning'" effect="plain">
            {{ configurable ? "自定义范围" : "范围不兼容" }}
          </el-tag>
          <span>{{ formatAccessScope(stmt.access_scope) }}</span>
        </div>

        <span v-else class="scope-hint">{{ hintText }}</span>
      </div>
    </template>
  </SectionPanel>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { InfoFilled } from "@element-plus/icons-vue"
import SectionPanel from "./SectionPanel.vue"
import { getActionDisplayNames, type ManifestService, type StatementVO } from "../../../composables/usePolicyData"
import {
  createAccessScopeFromTemplate,
  detectAccessScopeTemplate,
  formatAccessScope,
  getAccessScopeTemplatesForSelection,
  getSelectedAccessScopeActions
} from "../../../utils/accessScope"

const props = defineProps<{
  label: string
  stmt: StatementVO
  permissionManifest: ManifestService[]
  required?: boolean
  disabled?: boolean
}>()
const emit = defineEmits(["apply-scope"])

const hasActions = computed(() => (props.stmt.action || []).length > 0)
const selectedScopeActions = computed(() =>
  getSelectedAccessScopeActions(props.stmt.action || [], props.permissionManifest)
)
const availableTemplates = computed(() =>
  getAccessScopeTemplatesForSelection(props.stmt.action || [], props.permissionManifest)
)
const configurable = computed(() => selectedScopeActions.value.length > 0 && availableTemplates.value.length > 0)
const currentTemplate = computed(() => detectAccessScopeTemplate(props.stmt.access_scope, availableTemplates.value))
const selectedTemplate = computed(() => (props.stmt.access_scope_configured ? currentTemplate.value : ""))
const scopedActionNames = computed(() => getActionDisplayNames(selectedScopeActions.value, props.permissionManifest))
const scopedActionSummary = computed(() => `${selectedScopeActions.value.length} 项操作`)
const hasWildcard = computed(() =>
  (props.stmt.action || []).some((action) => action.includes("*") || action.includes("?"))
)
const hintText = computed(() => {
  if (!hasActions.value) return "选择授权操作后，可在这里设置允许访问的数据"
  if (hasWildcard.value) return "整模块授权无法设置数据限制，请使用精细化操作"
  if (props.permissionManifest.length === 0) return "权限清单加载中"
  if (selectedScopeActions.value.length === 0) return "所选操作不需要额外的数据限制"
  return "所选操作没有可共同使用的数据范围"
})

const selectTemplate = (value: string | number | boolean | undefined) => {
  const template = String(value)
  if (!availableTemplates.value.some((option) => option.id === template)) return
  emit("apply-scope", createAccessScopeFromTemplate(template, availableTemplates.value))
}
</script>

<style lang="scss" scoped>
:deep(.preview-link) {
  width: 100%;
}

:deep(.preview-container) {
  height: auto !important;
  min-height: 32px;
}

.scope-editor {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
}

.scope-context {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.scope-target {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #334155;

  strong {
    font-size: 13px;
    font-weight: 600;
  }
}

.scope-target-label {
  flex-shrink: 0;
  color: #64748b;
}

.scope-info {
  flex-shrink: 0;
  color: #94a3b8;
  cursor: help;
  font-size: 14px;
}

.scope-segments {
  display: grid;
  width: min(100%, 590px);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 3px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;

  :deep(.el-radio-button) {
    width: 100%;
  }

  :deep(.el-radio-button__inner) {
    width: 100%;
    padding: 7px 13px;
    border: 0 !important;
    border-radius: 4px !important;
    background: transparent;
    box-shadow: none !important;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }

  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: #fff;
    color: #2563eb;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12) !important;
  }

  :deep(.is-unrestricted .el-radio-button__original-radio:checked + .el-radio-button__inner) {
    color: #b45309;
  }
}

.custom-scope {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 13px;

  span:last-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.scope-hint {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 400;
}

@media (max-width: 760px) {
  .scope-segments {
    width: 100%;
    grid-template-columns: 1fr;
  }

  .scope-segments :deep(.el-radio-button__inner) {
    padding-inline: 10px;
  }
}
</style>
