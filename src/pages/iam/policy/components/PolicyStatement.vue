<template>
  <div class="ali-policy-card" :class="stmt.effect.toLowerCase()">
    <div class="side-indicator" />

    <div class="card-main">
      <header class="card-header">
        <div class="header-info">
          <span class="idx-tag">#{{ index + 1 }}</span>
          <span class="summary">{{ summaryText }}</span>
        </div>
        <div class="header-actions">
          <el-button link @click="$emit('duplicate', index)"
            ><el-icon><CopyDocument /></el-icon> 复制</el-button
          >
          <el-button link @click="$emit('remove', index)"
            ><el-icon><Delete /></el-icon> 移除</el-button
          >
        </div>
      </header>

      <main class="card-body">
        <!-- 效果 (Effect) -->
        <section class="config-row">
          <label class="row-label">授权效能</label>
          <div class="row-content">
            <el-radio-group :model-value="stmt.effect" @change="onEffectChange">
              <el-radio label="Allow">允许 (Allow)</el-radio>
              <el-radio label="Deny">拒绝 (Deny)</el-radio>
            </el-radio-group>
          </div>
        </section>

        <!-- 操作 (Action) -->
        <section class="config-row collapsible" :class="{ is_open: expanded.orchestrator }">
          <div class="row-label clickable" @click="toggleExpanded('orchestrator')">
            <el-icon class="arrow-icon" :class="{ rot: expanded.orchestrator }"><CaretRight /></el-icon>
            授权操作
          </div>
          <div class="row-content">
            <div class="preview-link" @click="toggleExpanded('orchestrator')">
              <template v-if="selectedServiceCodes.length > 0">
                {{ selectedServiceCodes.length }} 个模块 /
                {{ actionMode === "all" ? "全部 API" : stmt.action.length + " 个特定操作" }}
              </template>
              <span v-else class="placeholder-text">点击配置模块权限...</span>
            </div>

            <el-collapse-transition>
              <div v-show="expanded.orchestrator" class="embedded-panel orchestrator-panel">
                <div class="dual-pane-layout">
                  <aside class="pane-nav">
                    <div class="pane-title">业务模块</div>
                    <div class="pane-list scroll-area">
                      <el-checkbox-group :model-value="selectedServiceCodes" @update:model-value="onServiceChange">
                        <div
                          v-for="s in permissionManifest"
                          :key="s.code"
                          class="svc-item-check"
                          :class="{ is_active: selectedServiceCodes.includes(s.code) }"
                        >
                          <el-checkbox :label="s.code">
                            <span class="name">{{ s.name }}</span>
                            <span class="code">{{ s.code }}</span>
                          </el-checkbox>
                        </div>
                      </el-checkbox-group>
                    </div>
                  </aside>
                  <main class="pane-content">
                    <div class="pane-header">
                      <span class="title">操作项配置</span>
                      <el-radio-group :model-value="actionMode" size="small" @update:model-value="onActionModeChange">
                        <el-radio-button label="all">全部</el-radio-button>
                        <el-radio-button label="specific">精细化</el-radio-button>
                      </el-radio-group>
                    </div>
                    <div class="pane-body scroll-area">
                      <PermissionMatrix
                        v-if="actionMode === 'specific' && activeServices.length > 0"
                        :active-services="activeServices"
                        :selected-actions="stmt.action"
                        @toggle-action="onActionToggle"
                        @update-actions="onActionsUpdate"
                      />
                      <div v-else class="empty-placeholder">
                        <el-icon><Pointer /></el-icon>
                        <p>
                          {{
                            selectedServiceCodes.length === 0 ? "从左侧选择业务模块" : "当前已选择整模块全量权限接入"
                          }}
                        </p>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </section>

        <!-- 资源 (Resource) -->
        <section class="config-row collapsible" :class="{ is_open: expanded.resource }">
          <div class="row-label clickable" @click="toggleExpanded('resource')">
            <el-icon class="arrow-icon" :class="{ rot: expanded.resource }"><CaretRight /></el-icon>
            目标资源
          </div>
          <div class="row-content">
            <div class="preview-link" @click="toggleExpanded('resource')">
              {{
                resourceMode === "all"
                  ? "全部资源 (*)"
                  : stmt.resource.length > 0
                    ? stmt.resource.length + " 个特定的资源实例"
                    : "未指定生效对象"
              }}
            </div>
            <el-collapse-transition>
              <div v-show="expanded.resource" class="embedded-panel resource-panel">
                <div class="panel-mode-bar">
                  <el-radio-group :model-value="resourceMode" size="small" @change="onResourceModeChange">
                    <el-radio label="all">全部资源</el-radio>
                    <el-radio label="specific">指定资源</el-radio>
                  </el-radio-group>
                </div>
                <div v-if="resourceMode === 'specific'" class="panel-input-area">
                  <el-input
                    :model-value="resourceText"
                    type="textarea"
                    :rows="4"
                    placeholder="每行输入一个资源标识符"
                    class="flat-textarea"
                    @update:model-value="onResourceTextUpdate"
                  />
                </div>
                <div v-else class="panel-desc-area">已选择对所有符合条件的资源对象生效。</div>
              </div>
            </el-collapse-transition>
          </div>
        </section>

        <!-- 条件 (Condition) -->
        <section class="config-row collapsible no-border" :class="{ is_open: expanded.condition }">
          <div class="row-label clickable" @click="toggleExpanded('condition')">
            <el-icon class="arrow-icon" :class="{ rot: expanded.condition }"><CaretRight /></el-icon>
            限制条件
          </div>
          <div class="row-content">
            <div class="preview-link" @click="toggleExpanded('condition')">
              {{
                stmt.condition && Object.keys(stmt.condition).length > 0
                  ? Object.keys(stmt.condition).length + " 条环境限制规则"
                  : "无特定约束条件"
              }}
            </div>
            <el-collapse-transition>
              <div v-show="expanded.condition" class="embedded-panel condition-panel">
                <ConditionEditor :stmt="stmt" @update:stmt="patchStmt" />
              </div>
            </el-collapse-transition>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CopyDocument, Delete, CaretRight, Pointer } from "@element-plus/icons-vue"
import PermissionMatrix from "./PolicyStatement/PermissionMatrix.vue"
import ConditionEditor from "./PolicyStatement/ConditionEditor.vue"
import { useStatementLogic } from "./PolicyStatement/useStatementLogic"
import type { Statement } from "@/api/iam/policy/type"
import type { ManifestService } from "../types"

const props = defineProps<{
  stmt: Statement
  index: number
  permissionManifest: ManifestService[]
}>()

const emit = defineEmits(["duplicate", "remove", "update:stmt"])

const {
  expanded,
  toggleExpanded,
  selectedServiceCodes,
  actionMode,
  resourceMode,
  resourceText,
  activeServices,
  summaryText,
  onEffectChange,
  onServiceChange,
  onActionModeChange,
  onResourceModeChange,
  onResourceTextUpdate,
  onActionsUpdate,
  onActionToggle,
  patchStmt
} = useStatementLogic(props, emit)
</script>

<style lang="scss" scoped>
.ali-policy-card {
  display: flex;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  margin-bottom: 24px;
  position: relative;
  .side-indicator {
    width: 4px;
    flex-shrink: 0;
  }
  &.allow .side-indicator {
    background: #52c41a;
  }
  &.deny .side-indicator {
    background: #ff4d4f;
  }
  .card-main {
    flex: 1;
    min-width: 0;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: #fbfbfb;
    border-bottom: 1px solid #ebeef5;
    .idx-tag {
      font-weight: bold;
      color: #333;
      font-size: 13px;
      font-family: ui-monospace, mono;
    }
    .summary {
      font-size: 13px;
      color: #8c8c8c;
      font-weight: 500;
      margin-left: 10px;
    }
    .header-actions .el-button {
      font-size: 12px;
      color: #8c8c8c;
      &:hover {
        color: #0070cc;
      }
    }
  }
  .card-body {
    padding: 4px 0;
  }
  .config-row {
    display: flex;
    align-items: flex-start;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    &.no-border {
      border-bottom: none;
    }
    .row-label {
      width: 100px;
      flex-shrink: 0;
      font-size: 13px;
      color: #333;
      padding-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      .arrow-icon {
        color: #bfbfbf;
        transition: transform 0.2s;
        &.rot {
          transform: rotate(90deg);
          color: #0070cc;
        }
      }
      &.clickable {
        cursor: pointer;
        &:hover {
          color: #0070cc;
        }
      }
    }
    .row-content {
      flex: 1;
      min-width: 0;
      padding-left: 8px;
    }
  }
  .preview-link {
    display: inline-block;
    font-size: 13px;
    color: #0070cc;
    cursor: pointer;
    padding: 4px 0;
    &:hover {
      color: #00559e;
    }
    .placeholder-text {
      color: #ccc;
      font-style: italic;
    }
  }
  .embedded-panel {
    margin-top: 12px;
    border: 1px solid #ebeef5;
    border-radius: 2px;
    overflow: hidden;
    &.condition-panel {
      margin-top: 16px;
      border: none;
    }
  }
  .orchestrator-panel {
    .dual-pane-layout {
      display: flex;
      height: 480px;
      .pane-nav {
        width: 220px;
        border-right: 1px solid #f0f0f0;
        display: flex;
        flex-direction: column;
      }
      .pane-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .pane-title,
      .pane-header {
        padding: 8px 12px;
        background: #fafafa;
        border-bottom: 1px solid #f0f0f0;
        font-size: 12px;
        font-weight: bold;
        color: #999;
      }
      .pane-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .scroll-area {
        flex: 1;
        overflow-y: auto;
      }
      .svc-item-check {
        padding: 6px 12px;
        cursor: pointer;
        &:hover {
          background: #f5f5f5;
        }
        &.is_active {
          background: #e6f7ff;
          .name {
            color: #1890ff;
          }
        }
        :deep(.el-checkbox) {
          width: 100%;
          display: flex;
          align-items: center;
          .el-checkbox__label {
            flex: 1;
            padding-left: 10px;
          }
        }
        .name {
          font-size: 12px;
          font-weight: 600;
          display: block;
          color: #262626;
        }
        .code {
          font-size: 10px;
          color: #bfbfbf;
          font-family: mono;
        }
      }
      .empty-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ccc;
        i {
          font-size: 40px;
        }
      }
    }
  }
  .resource-panel {
    .panel-mode-bar {
      padding: 8px 16px;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
    }
    .panel-input-area {
      padding: 16px;
    }
    .panel-desc-area {
      padding: 16px;
      font-size: 12px;
      color: #888;
    }
  }
}
:deep(.flat-textarea) {
  .el-textarea__inner {
    border-radius: 2px;
    box-shadow: 0 0 0 1px #dcdfe6 inset !important;
    padding: 10px;
    font-family: ui-monospace, mono;
    font-size: 12px;
    &:focus {
      box-shadow: 0 0 0 1px #0070cc inset !important;
    }
  }
}
</style>
