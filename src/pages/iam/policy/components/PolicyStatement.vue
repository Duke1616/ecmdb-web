<template>
  <div class="policy-stmt-card">
    <!-- 头部操作栏 -->
    <div class="stmt-info-bar">
      <div class="identity">
        <span class="index">#{{ index + 1 }}</span>
        <span class="title">{{ stmtTitle }}</span>
      </div>
      <div class="actions">
        <el-button link type="primary" @click="$emit('duplicate', index)">复制</el-button>
        <el-divider direction="vertical" />
        <el-button link type="danger" @click="$emit('remove', index)">删除</el-button>
      </div>
    </div>

    <div class="stmt-body">
      <!-- 1. 效果行 (固定展示) -->
      <div class="stmt-row static-row">
        <div class="row-main-content">
          <div class="icon-fixed" />
          <div class="label-fixed required">效果</div>
          <div class="value-box">
            <el-radio-group :model-value="stmt.effect" @update:model-value="(val: any) => patchStmt({ effect: val })">
              <el-radio label="Allow">允许</el-radio>
              <el-radio label="Deny">拒绝</el-radio>
            </el-radio-group>
          </div>
        </div>
      </div>

      <!-- 2. 服务行 (可折叠) -->
      <div class="stmt-row collapse-row" :class="{ active: expanded.service }">
        <div class="row-header" @click="expanded.service = !expanded.service">
          <div class="icon-fixed">
            <el-icon :class="{ rotated: expanded.service }"><CaretRight /></el-icon>
          </div>
          <div class="label-fixed required">服务</div>
          <div class="summary-box" v-show="!expanded.service">{{ serviceSummary }}</div>
        </div>
        <el-collapse-transition>
          <div v-show="expanded.service" class="detail-box">
            <el-checkbox-group
              :model-value="selectedServiceCodes"
              class="svc-matrix"
              @update:model-value="(val: any) => (selectedServiceCodes = val)"
            >
              <div class="svc-grid">
                <el-checkbox v-for="s in permissionTree" :key="s.code" :label="s.code" class="svc-item">
                  <div class="svc-node">
                    <div class="svc-name">{{ s.name }}</div>
                    <div class="svc-code">{{ s.code }}</div>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 3. 操作行 (可折叠) -->
      <div class="stmt-row collapse-row" :class="{ active: expanded.action }">
        <div class="row-header" @click="expanded.action = !expanded.action">
          <div class="icon-fixed">
            <el-icon :class="{ rotated: expanded.action }"><CaretRight /></el-icon>
          </div>
          <div class="label-fixed required">操作</div>
          <div class="summary-box" v-show="!expanded.action">{{ actionSummary }}</div>
        </div>
        <el-collapse-transition>
          <div v-show="expanded.action" class="detail-box">
            <el-radio-group
              :model-value="actionMode"
              @update:model-value="(val: any) => (actionMode = val)"
              class="action-type-switch"
            >
              <el-radio label="all">全部操作</el-radio>
              <el-radio label="specific" :disabled="selectedServiceCodes.length === 0">指定操作</el-radio>
            </el-radio-group>

            <div v-if="actionMode === 'specific' && activeServices.length > 0" class="matrix-container">
              <div v-for="svc in activeServices" :key="svc.code" class="svc-block">
                <div class="svc-head">
                  <span class="svc-name">{{ svc.name }}</span>
                  <el-checkbox
                    :model-value="getSvcState(svc).all"
                    :indeterminate="getSvcState(svc).some"
                    size="small"
                    @change="toggleSvc(svc)"
                    >全选</el-checkbox
                  >
                </div>
                <div class="grp-list">
                  <div v-for="grp in svc.entries" :key="grp.name" class="grp-row">
                    <div class="grp-label">
                      <el-checkbox
                        :model-value="getGrpState(grp).all"
                        :indeterminate="getGrpState(grp).some"
                        size="small"
                        @change="toggleGrp(grp)"
                        >{{ grp.name }}</el-checkbox
                      >
                    </div>
                    <div class="grp-actions">
                      <el-checkbox
                        v-for="act in grp.actions"
                        :key="act.code"
                        :model-value="stmt.action.includes(act.code)"
                        :label="act.code"
                        class="act-item"
                        @change="(checked: any) => toggleAction(act.code, checked)"
                      >
                        <div class="act-node">
                          <div class="act-name">{{ act.name }}</div>
                          <div class="act-code">{{ act.code }}</div>
                        </div>
                      </el-checkbox>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="actionMode === 'all' && selectedServiceCodes.length > 0" class="wildcards-box">
              <span class="hint">已授予授权范围:</span>
              <el-tag v-for="code in selectedServiceCodes" :key="code" type="info" size="small">{{ code }}:*</el-tag>
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 4. 资源行 (可折叠) -->
      <div class="stmt-row collapse-row" :class="{ active: expanded.resource }">
        <div class="row-header" @click="expanded.resource = !expanded.resource">
          <div class="icon-fixed">
            <el-icon :class="{ rotated: expanded.resource }"><CaretRight /></el-icon>
          </div>
          <div class="label-fixed required">资源</div>
          <div class="summary-box" v-show="!expanded.resource">{{ resourceSummary }}</div>
        </div>
        <el-collapse-transition>
          <div v-show="expanded.resource" class="detail-box">
            <el-radio-group v-model="resourceMode">
              <el-radio label="all">全部资源 (*)</el-radio>
              <el-radio label="specific">特定资源</el-radio>
            </el-radio-group>
            <div v-if="resourceMode === 'specific'" class="resource-input">
              <el-input
                v-model="resourceText"
                type="textarea"
                :rows="3"
                placeholder="格式：urn:ecmdb:iam:user/xxx，每行一个"
              />
            </div>
          </div>
        </el-collapse-transition>
      </div>

      <!-- 5. 条件行 (可折叠) -->
      <div class="stmt-row collapse-row" :class="{ active: expanded.condition }">
        <div class="row-header" @click="expanded.condition = !expanded.condition">
          <div class="icon-fixed">
            <el-icon :class="{ rotated: expanded.condition }"><CaretRight /></el-icon>
          </div>
          <div class="label-fixed">条件</div>
          <div class="summary-box" v-show="!expanded.condition">{{ conditionSummary }}</div>
        </div>
        <el-collapse-transition>
          <div v-show="expanded.condition" class="detail-box">
            <div class="condition-layout">
              <div v-for="(c, i) in stmt.condition" :key="i" class="condition-line">
                <el-input
                  :model-value="c.key"
                  placeholder="Key"
                  size="small"
                  @update:model-value="(v) => updateCondition(i, { key: v })"
                />
                <el-select
                  :model-value="c.operator"
                  size="small"
                  style="width: 140px"
                  @update:model-value="(v) => updateCondition(i, { operator: v })"
                >
                  <el-option label="StringEquals" value="StringEquals" />
                  <el-option label="NumericEquals" value="NumericEquals" />
                </el-select>
                <el-input
                  :model-value="c.value"
                  placeholder="Value"
                  size="small"
                  @update:model-value="(v) => updateCondition(i, { value: v })"
                />
                <el-button
                  link
                  type="danger"
                  :icon="Delete"
                  @click="patchStmt({ condition: stmt.condition?.filter((_, idx) => idx !== i) })"
                />
              </div>
              <el-button link type="primary" :icon="Plus" @click="addCondition" size="small">添加限制条件</el-button>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { Plus, Delete, CaretRight } from "@element-plus/icons-vue"
import type { Statement } from "@/api/iam/policy/type"

const props = defineProps<{
  stmt: Statement
  index: number
  permissionTree: any[]
}>()

const emit = defineEmits(["duplicate", "remove", "update:stmt"])

// --- 状态控制 ---
const expanded = reactive({ service: true, action: false, resource: false, condition: false })
const actionMode = ref<"all" | "specific">(props.stmt.action.some((a) => a.endsWith(":*")) ? "all" : "specific")

// --- 核心更新逻辑 (单向数据流) ---
const patchStmt = (patch: Partial<Statement>) => {
  emit("update:stmt", { ...props.stmt, ...patch })
}

const updateCondition = (idx: number, patch: any) => {
  const nextCond = [...(props.stmt.condition || [])]
  nextCond[idx] = { ...nextCond[idx], ...patch }
  patchStmt({ condition: nextCond })
}

// --- 计算属性 (语义化数据) ---
const selectedServiceCodes = computed<string[]>({
  get: () => {
    const codesInAction = props.stmt.action.map((a) => a.split(":")[0])
    return [...new Set(codesInAction)].filter((c) => props.permissionTree.some((s) => s.code === c))
  },
  set: (newVal) => {
    const oldVal = selectedServiceCodes.value
    let nextActions = [...props.stmt.action]

    // 处理移除逻辑：去掉该服务下的所有 action
    if (newVal.length < oldVal.length) {
      const removed = oldVal.filter((v) => !newVal.includes(v))
      removed.forEach((code) => {
        const svc = props.permissionTree.find((s) => s.code === code)
        const toRemove = new Set([
          `${code}:*`,
          ...(svc?.entries?.flatMap((g: any) => g.actions.map((a: any) => a.code)) || [])
        ])
        nextActions = nextActions.filter((a) => !toRemove.has(a))
      })
    }

    // 处理新增逻辑：保证该服务至少有一个占位 action，否则 UI 无法回显选中态
    if (newVal.length > oldVal.length) {
      const added = newVal.filter((v) => !oldVal.includes(v))
      added.forEach((code) => {
        if (!nextActions.some((a) => a.startsWith(`${code}:`))) {
          nextActions.push(`${code}:*`)
        }
      })
    }

    if (actionMode.value === "all") {
      nextActions = newVal.map((c) => `${c}:*`)
    }
    patchStmt({ action: nextActions })
  }
})

const activeServices = computed(() => props.permissionTree.filter((s) => selectedServiceCodes.value.includes(s.code)))

// --- 摘要逻辑 ---
const serviceSummary = computed(() => activeServices.value.map((s) => s.name).join(" / ") || "未选择服务")
const actionSummary = computed(() => {
  if (actionMode.value === "all") return "全部操作"
  const count = props.stmt.action.filter((a) => !a.endsWith(":*")).length
  return count ? `${count} 个操作` : "未选择操作"
})
const resourceSummary = computed(() =>
  props.stmt.resource[0] === "*" ? "全部资源 (*)" : `特定资源 (${props.stmt.resource.length})`
)
const conditionSummary = computed(() =>
  props.stmt.condition?.length ? `${props.stmt.condition.length} 个条件` : "未配置"
)
const stmtTitle = computed(() => {
  const svcPrefix = activeServices.value.length ? activeServices.value.map((s) => s.name).join("/") : "新语句"
  return `${svcPrefix} / ${actionSummary.value}`
})

// --- 矩阵逻辑辅助 ---
const getGrpActions = (grp: any): string[] => grp.actions.map((a: any) => a.code)
const getGrpState = (grp: any) => {
  const codes = getGrpActions(grp)
  const sel = codes.filter((c: string) => props.stmt.action.includes(c)).length
  return { all: sel === codes.length, some: sel > 0 && sel < codes.length }
}
const toggleGrp = (grp: any) => {
  const codes = getGrpActions(grp)
  const { all } = getGrpState(grp)
  const nextActions = all
    ? props.stmt.action.filter((a) => !codes.includes(a))
    : [...new Set([...props.stmt.action, ...codes])]
  patchStmt({ action: nextActions })
}
const getSvcState = (svc: any) => {
  const codes = svc.entries.flatMap(getGrpActions)
  const sel = codes.filter((c: string) => props.stmt.action.includes(c)).length
  return { all: sel === codes.length, some: sel > 0 && sel < codes.length }
}
const toggleSvc = (svc: any) => {
  const codes = svc.entries.flatMap(getGrpActions)
  const { all } = getSvcState(svc)
  const nextActions = all
    ? props.stmt.action.filter((a) => !codes.includes(a))
    : [...new Set([...props.stmt.action, ...codes])]
  patchStmt({ action: nextActions })
}

const toggleAction = (code: string, checked: boolean) => {
  const nextActions = checked ? [...new Set([...props.stmt.action, code])] : props.stmt.action.filter((a) => a !== code)
  patchStmt({ action: nextActions })
}

// --- 资源配置 ---
const resourceMode = computed({
  get: () => (props.stmt.resource[0] === "*" ? "all" : "specific"),
  set: (v) => patchStmt({ resource: v === "all" ? ["*"] : [] })
})
const resourceText = computed({
  get: () => props.stmt.resource.filter((r) => r !== "*").join("\n"),
  set: (v) =>
    patchStmt({
      resource: v
        .split("\n")
        .map((r) => r.trim())
        .filter(Boolean)
    })
})

const addCondition = () => {
  const nextCond = [...(props.stmt.condition || []), { key: "", operator: "StringEquals", value: "" }]
  patchStmt({ condition: nextCond })
}

watch(actionMode, (val) => {
  if (val === "all") patchStmt({ action: selectedServiceCodes.value.map((c) => `${c}:*`) })
  else patchStmt({ action: props.stmt.action.filter((a) => !a.endsWith(":*")) })
})
</script>

<style lang="scss" scoped>
.policy-stmt-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 24px;
  background: #fff;

  .stmt-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: #fcfcfc;
    border-bottom: 1px solid #f0f0f0;
    .index {
      color: #333;
      font-weight: bold;
      margin-right: 12px;
      font-size: 15px;
    }
    .title {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }
  }
}

.stmt-body {
  display: block;
  width: 100%;
}

.stmt-row {
  display: block;
  width: 100%;
  border-bottom: 1px solid #f0f0f0;
  &:last-child {
    border-bottom: none;
  }

  &.active {
    background: #fafafa;
  }
}

/* 统一行首结构：图标(40px) + 标签(100px) */
.row-main-content,
.row-header {
  display: flex;
  align-items: center;
  min-height: 52px; /* 稍微增加行高 */
  padding: 0 16px;
}

.row-header {
  cursor: pointer;
  user-select: none;
  &:hover {
    background: #f5f7fa;
  }
}

.icon-fixed {
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  color: #909399;
  font-size: 14px;
  .el-icon {
    transition: transform 0.3s;
    &.rotated {
      transform: rotate(90deg);
    }
  }
}

.label-fixed {
  width: 100px;
  font-size: 13px;
  font-weight: 500;
  color: #909399; /* 浅灰色标签 */
  flex-shrink: 0;
  &.required::after {
    content: " *";
    color: #f56c6c;
  }
}

.value-box,
.summary-box {
  flex: 1;
  display: flex;
  align-items: center;
  color: #337ecc; /* 匹配截图中的深蓝色文字 */
}

.summary-box {
  font-size: 13px;
  color: #0070cc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-box {
  padding: 8px 20px 24px 160px;
  background: #fcfcfc;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
}

/* 内部矩阵样式 */
.svc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.svc-item {
  margin-right: 0;
  height: auto;
  .svc-node {
    .svc-name {
      font-size: 13px;
      line-height: 1.4;
      color: #333;
    }
    .svc-code {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }
  }
}

.action-type-switch {
  margin-bottom: 16px;
  display: block;
}
.wildcards-box {
  padding: 12px;
  background: #f8fafb;
  border-radius: 4px;
  .hint {
    font-size: 12px;
    color: #999;
    margin-right: 8px;
  }
  .el-tag {
    margin-right: 6px;
  }
}

.matrix-container {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  .svc-head {
    padding: 10px 16px;
    background: #f8fafb;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    .svc-name {
      font-weight: 600;
      font-size: 13px;
      color: #0070cc;
    }
  }
}

.grp-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  &:last-child {
    border-bottom: none;
  }
  .grp-label {
    width: 140px;
    padding: 12px 16px;
    background: #fafafa;
    border-right: 1px solid #f5f5f5;
    flex-shrink: 0;
  }
  .grp-actions {
    flex: 1;
    padding: 12px 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }
}

.act-item {
  margin-right: 0;
  height: auto;
  .act-node {
    .act-name {
      font-size: 12px;
      line-height: 1.4;
      color: #333;
    }
    .act-code {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }
  }
}

.resource-input {
  margin-top: 12px;
  max-width: 600px;
}
.condition-layout {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 6px;
  .condition-line {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }
}
</style>
