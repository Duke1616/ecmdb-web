<template>
  <SectionPanel :label="label" :required="required">
    <template #preview>
      {{
        resourceMode === "all"
          ? "全部资源 (*)"
          : stmt.resource.length > 0
            ? stmt.resource.length + " 个特定的资源实例"
            : "未指定生效对象"
      }}
    </template>

    <div class="resource-panel">
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
  </SectionPanel>
</template>

<script setup lang="ts">
import { computed } from "vue"
import SectionPanel from "./SectionPanel.vue"
import type { StatementVO } from "../../../composables/usePolicyData"

const props = defineProps<{ label: string; stmt: StatementVO; required?: boolean }>()
const emit = defineEmits(["update:stmt"])

const patchStmt = (patch: Partial<StatementVO>) => {
  emit("update:stmt", { ...props.stmt, ...patch })
}

const resourceMode = computed(() => (props.stmt.resource.includes("*") ? "all" : "specific"))

const resourceText = computed(() => props.stmt.resource.filter((r) => r !== "*").join("\n"))

const onResourceModeChange = (val: string | number | boolean | undefined) => {
  if (String(val) === "all") {
    patchStmt({ resource: ["*"] })
  } else {
    patchStmt({ resource: props.stmt.resource.filter((r) => r !== "*") })
  }
}

const onResourceTextUpdate = (text: string) => {
  patchStmt({
    resource: text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
  })
}
</script>

<style lang="scss" scoped>
.resource-panel {
  border: 1px solid #ebeef5;
  .panel-mode-bar {
    padding: 8px 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;
  }
  ::v-deep(.panel-input-area) {
    padding: 16px;
  }
  ::v-deep(.panel-desc-area) {
    padding: 16px;
    font-size: 12px;
    color: #888;
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
