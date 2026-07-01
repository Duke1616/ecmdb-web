<template>
  <Drawer
    v-model="visible"
    title="插件详情"
    subtitle="查看绑定、输入树和高级配置"
    :header-icon="Cpu"
    size="40%"
    :show-footer="false"
  >
    <div class="plugin-detail-container">
      <div v-loading="loading" class="detail-drawer">
        <template v-if="pluginDetail">
          <!-- 基础信息 -->
          <div class="detail-section">
            <div class="section-title">
              <div class="title-left">
                <el-icon class="section-icon"><Document /></el-icon>
                <span>基础信息</span>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-card">
                <div class="card-icon-box is-primary">
                  <el-icon><Cpu /></el-icon>
                </div>
                <div class="card-content">
                  <span class="detail-label">插件名称</span>
                  <strong class="detail-value">{{ pluginDetail.plugin.name }}</strong>
                </div>
              </div>

              <div class="detail-card">
                <div class="card-icon-box is-warning">
                  <el-icon><Key /></el-icon>
                </div>
                <div class="card-content">
                  <span class="detail-label">插件 UID</span>
                  <div class="value-with-action">
                    <strong class="detail-value truncate">{{ pluginDetail.plugin.uid }}</strong>
                    <el-button
                      type="primary"
                      link
                      :icon="CopyDocument"
                      class="copy-btn"
                      @click="copyText(pluginDetail.plugin.uid)"
                    />
                  </div>
                </div>
              </div>

              <div class="detail-card">
                <div class="card-icon-box is-success">
                  <el-icon><Collection /></el-icon>
                </div>
                <div class="card-content">
                  <span class="detail-label">插件类型</span>
                  <strong class="detail-value">
                    <el-tag size="small" type="success" effect="light" round>
                      {{ pluginDetail.plugin.type }}
                    </el-tag>
                  </strong>
                </div>
              </div>

              <div class="detail-card">
                <div class="card-icon-box is-info">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="card-content">
                  <span class="detail-label">当前版本</span>
                  <strong class="detail-value">{{ pluginDetail.plugin.version || "-" }}</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- 插件操作 -->
          <div class="detail-section">
            <div class="section-title">
              <div class="title-left">
                <el-icon class="section-icon"><Operation /></el-icon>
                <span>操作列表</span>
              </div>
              <div class="title-right">
                <el-tag effect="plain" type="info" round class="count-tag">
                  {{ pluginDetail.plugin.actions?.length || 0 }} 个操作
                </el-tag>
              </div>
            </div>

            <div v-if="pluginDetail.plugin.actions?.length" class="action-grid">
              <div v-for="action in pluginDetail.plugin.actions" :key="action.action" class="action-card">
                <div class="action-card-left">
                  <div class="action-icon-box">
                    <AppIcon :name="resolveActionIcon(action.icon)" fallback="Box" />
                  </div>
                  <div class="action-info">
                    <span class="action-name">{{ action.name }}</span>
                    <span class="action-code">{{ action.action }}</span>
                  </div>
                </div>
                <div class="action-tags">
                  <el-tag size="small" type="primary" effect="light">
                    {{ uiLabelMap[action.ui] || action.ui }}
                  </el-tag>
                  <el-tag size="small" type="info" effect="plain">
                    {{ placementLabelMap[action.placement] || action.placement }}
                  </el-tag>
                </div>
              </div>
            </div>
            <el-empty v-else description="当前插件没有定义操作" :image-size="110" />
          </div>

          <!-- 输入结构 -->
          <div class="detail-section">
            <div class="section-title">
              <div class="title-left">
                <el-icon class="section-icon"><Share /></el-icon>
                <span>输入结构</span>
              </div>
              <div class="title-right">
                <el-tag effect="plain" type="info" round class="count-tag">
                  {{ pluginDetail.bindings.length }} 个绑定
                </el-tag>
              </div>
            </div>

            <div v-if="pluginDetail.bindings.length" class="binding-list">
              <div v-for="binding in pluginDetail.bindings" :key="binding.uid" class="binding-card">
                <div class="binding-card-header">
                  <div class="binding-header-copy">
                    <div class="binding-title">
                      <span class="binding-caption">挂载模型</span>
                      <div class="model-info">
                        <AppIcon :name="binding.model_icon" fallback="Box" class="model-icon" />
                        <span class="model-name">
                          {{ binding.model_name || binding.model_uid }}
                        </span>
                      </div>
                    </div>
                    <div class="binding-meta">
                      <span class="meta-item">
                        <span class="meta-label">分组:</span>
                        <strong>{{ binding.group_name || "未分组" }}</strong>
                      </span>
                      <span class="meta-divider" />
                      <span class="meta-item">
                        <span class="meta-label">UID:</span>
                        <strong class="uid-text">{{ binding.uid }}</strong>
                      </span>
                    </div>
                  </div>
                  <el-tag :type="binding.enabled ? 'success' : 'info'" effect="light" round>
                    {{ binding.enabled ? "已启用" : "已停用" }}
                  </el-tag>
                </div>

                <!-- 规格树规格节点 -->
                <div v-if="binding.specs.length" class="spec-tree">
                  <div v-for="spec in binding.specs" :key="`${binding.uid}-${spec.name}`" class="spec-tree-item">
                    <div class="spec-node">
                      <div class="spec-node-top">
                        <span class="spec-node-dot" />
                        <span class="spec-node-name">{{ spec.name }}</span>
                        <el-tag size="small" type="info" effect="plain" round>
                          {{ resolveModelName(spec.model_uid) }}
                        </el-tag>
                      </div>
                      <div class="spec-node-tags">
                        <el-tag size="small" :type="spec.direction === 'source' ? 'success' : 'warning'" effect="light">
                          {{ directionLabelMap[spec.direction || ""] || "中心节点" }}
                        </el-tag>
                        <el-tag size="small" type="primary" effect="plain">
                          {{ relationLabelMap[spec.relation_type || ""] || spec.relation_type || "无关联" }}
                        </el-tag>
                        <el-tag size="small" type="info" effect="plain">
                          {{ cardinalityLabelMap[spec.cardinality] || spec.cardinality }}
                        </el-tag>
                      </div>
                    </div>

                    <!-- 子节点展示 -->
                    <div v-if="spec.children?.length" class="spec-children">
                      <div
                        v-for="child in spec.children"
                        :key="`${binding.uid}-${spec.name}-${child.name}`"
                        class="spec-child-item"
                      >
                        <div class="child-left">
                          <span class="child-arrow">└─</span>
                          <span class="child-name">{{ child.name }}</span>
                        </div>
                        <el-tag size="small" type="info" effect="plain" round>
                          {{ resolveModelName(child.model_uid) }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 原始配置折叠 -->
                <div class="binding-advanced">
                  <el-collapse>
                    <el-collapse-item :name="binding.uid">
                      <template #title>
                        <span class="collapse-title">查看原始绑定配置</span>
                      </template>
                      <div class="json-code-wrapper">
                        <div class="code-header">
                          <span>CONFIG JSON</span>
                          <el-button
                            type="primary"
                            link
                            :icon="CopyDocument"
                            size="small"
                            @click="copyText(formatJson(binding))"
                          >
                            复制
                          </el-button>
                        </div>
                        <pre class="json-block">{{ formatJson(binding) }}</pre>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </div>

            <el-empty v-else description="当前插件还没有绑定记录" :image-size="110" />
          </div>
        </template>
      </div>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ElMessage } from "element-plus"
import { Document, Cpu, Key, Collection, Connection, Share, CopyDocument, Operation } from "@element-plus/icons-vue"
import { Drawer } from "@/common/components/Dialogs"
import AppIcon from "@/common/components/AppIcon/index.vue"
import { type PluginDetail, type PluginModelOption } from "@/api/cmdb/plugin/types/plugin"

// NOTE: 该组件为状态型 UI 组件（Drawer），其显隐状态需通过双向绑定与父组件进行同步，符合平台封装规范
const visible = defineModel<boolean>({ default: false })

interface Props {
  loading: boolean
  pluginDetail: PluginDetail | null
  models: PluginModelOption[]
}

const props = defineProps<Props>()

// 关系标签字典映射
const directionLabelMap: Record<string, string> = {
  source: "源端关联",
  target: "目标端关联"
}

const relationLabelMap: Record<string, string> = {
  default: "默认关系",
  group: "分组关系",
  belong: "归属关系",
  run: "运行关系"
}

const cardinalityLabelMap: Record<string, string> = {
  one: "单个资源",
  many: "多个资源"
}

const uiLabelMap: Record<string, string> = {
  "builtin:terminal": "内置终端",
  "builtin:sftp": "内置 SFTP",
  "builtin:web": "网页服务"
}

const placementLabelMap: Record<string, string> = {
  "resource.detail.actions": "资源详情操作"
}

// 格式化 JSON
const formatJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2)

// 解析操作图标名称，与拓扑图转换保持一致
const resolveActionIcon = (icon?: string) => {
  const normalized = String(icon || "")
    .trim()
    .toLowerCase()

  if (normalized === "terminal") return "fa-terminal"
  if (normalized === "folder") return "Folder"
  if (normalized === "connection") return "Connection"
  return icon || "Box"
}

// 一键复制文本
const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success("复制成功")
  } catch (err) {
    ElMessage.error("复制失败")
  }
}

// 构建模型 UID -> 模型中文名的映射映射表，以期做到组件的高内聚
const modelNameMap = computed(() => {
  const map = new Map<string, string>()

  if (props.models) {
    for (const model of props.models) {
      if (model.uid) {
        map.set(model.uid, model.name || model.uid)
      }
    }
  }

  if (props.pluginDetail?.bindings) {
    for (const binding of props.pluginDetail.bindings) {
      if (binding.model_uid) {
        map.set(binding.model_uid, binding.model_name || binding.model_uid)
      }
    }
  }

  return map
})

const resolveModelName = (modelUid?: string) => {
  if (!modelUid) return "-"
  return modelNameMap.value.get(modelUid) || modelUid
}
</script>

<style lang="scss" scoped>
.plugin-detail-container {
  padding: 12px 16px;
  background: #fdfdfe;
  min-height: 100%;
}

.detail-drawer {
  display: flex;
  flex-direction: column;
}

.detail-section {
  margin-bottom: 24px;
}

// 统一的 Section 标题样式（参照 TaskDrawer.vue 保持全平台一致）
.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #3b82f6;
  justify-content: space-between;

  .title-left {
    display: flex;
    align-items: center;
  }

  .section-icon {
    margin-right: 6px;
    font-size: 16px;
    color: #3b82f6;
  }

  span {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }
}

// 基础信息网格
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.detail-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  }

  .card-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    font-size: 18px;

    &.is-primary {
      background: #eff6ff;
      color: #3b82f6;
    }

    &.is-warning {
      background: #fffbeb;
      color: #d97706;
    }

    &.is-success {
      background: #f0fdf4;
      color: #16a34a;
    }

    &.is-info {
      background: #f1f5f9;
      color: #475569;
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .detail-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .detail-value {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;

    &.truncate {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .value-with-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 0;

    .copy-btn {
      padding: 0;
      height: auto;
      font-size: 14px;
      color: #94a3b8;

      &:hover {
        color: #6366f1;
      }
    }
  }
}

// 操作网格
.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
  }

  .action-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
  }

  .action-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #eef2ff;
    color: #6366f1;
    font-size: 16px;
  }

  .action-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;

    .action-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .action-code {
      font-family: Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      color: #94a3b8;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .action-tags {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    flex-shrink: 0;
  }
}

// 绑定模型卡片列表
.binding-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.binding-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.binding-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 14px;

  .binding-header-copy {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .binding-title {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .binding-caption {
    font-size: 10px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .model-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .model-icon {
      font-size: 16px;
      color: #6366f1;
    }

    .model-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
  }

  .binding-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    .meta-item {
      font-size: 12px;
      color: #64748b;

      .meta-label {
        margin-right: 4px;
      }

      strong {
        color: #334155;
        font-weight: 600;
      }

      .uid-text {
        font-family: Menlo, Monaco, Consolas, monospace;
        font-size: 11px;
      }
    }

    .meta-divider {
      width: 4px;
      height: 4px;
      background: #cbd5e1;
      border-radius: 50%;
    }
  }
}

// 规格树节点设计
.spec-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-tree-item {
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}

.spec-node {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .spec-node-top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    .spec-node-dot {
      width: 6px;
      height: 6px;
      background: #6366f1;
      border-radius: 50%;
    }

    .spec-node-name {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
  }

  .spec-node-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    padding-left: 14px;
  }
}

.spec-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  padding-left: 14px;
  border-left: 2px dashed #cbd5e1;
}

.spec-child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0 4px 8px;

  .child-left {
    display: flex;
    align-items: center;
    gap: 6px;

    .child-arrow {
      color: #94a3b8;
      font-family: monospace;
    }

    .child-name {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
    }
  }
}

// JSON 折叠面板代码框优化
.binding-advanced {
  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item__header) {
    border: none;
    height: 36px;
    line-height: 36px;
    background: transparent;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
    background: transparent;
  }

  .collapse-title {
    font-size: 12px;
    font-weight: 600;
    color: #6366f1;
    cursor: pointer;

    &:hover {
      color: #4f46e5;
    }
  }
}

.json-code-wrapper {
  margin-top: 8px;
  border: 1px solid #0f172a;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #1e293b;
    padding: 8px 16px;
    border-bottom: 1px solid #334155;
    color: #94a3b8;
    font-family: Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    font-weight: 700;
  }

  .json-block {
    margin: 0;
    padding: 16px;
    max-height: 260px;
    overflow-y: auto;
    color: #e2e8f0;
    background: #0f172a;
    font-family:
      Menlo,
      Monaco,
      Fira Code,
      Consolas,
      monospace;
    font-size: 12px;
    line-height: 1.6;
    text-align: left;
  }
}

@media (max-width: 640px) {
  .plugin-detail-container {
    padding: 12px 12px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .action-tags {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
    }
  }

  .binding-card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    .el-tag {
      align-self: flex-start;
    }
  }
}
</style>
