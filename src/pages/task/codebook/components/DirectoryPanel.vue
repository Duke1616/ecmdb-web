<template>
  <section class="directory-view">
    <div class="panel-heading">
      <div class="directory-title">
        <el-icon class="directory-title-icon"><FolderOpened /></el-icon>
        <div class="directory-title-text">
          <div class="directory-title-row">
            <h3>{{ activeDirectory.name || "全部资源" }}</h3>
            <el-tooltip v-if="isReadonly" content="系统资源，只读" placement="top" :show-after="300">
              <el-icon class="readonly-lock"><Lock /></el-icon>
            </el-tooltip>
            <span class="directory-kind">Directory</span>
          </div>
          <p>{{ isReadonly ? "系统资源只读，暂不支持变更" : `${directoryChildren.length} 个子资源` }}</p>
        </div>
      </div>
      <div class="panel-actions">
        <AuthButton
          v-if="!isReadonly"
          :capability="capabilities.Codebook.Add"
          disableMode
          size="small"
          :icon="FolderAdd"
          @click="$emit('create-directory')"
          >目录</AuthButton
        >
        <AuthButton
          v-if="!isReadonly"
          :capability="capabilities.Codebook.Add"
          disableMode
          size="small"
          type="primary"
          :icon="DocumentAdd"
          @click="$emit('create-file')"
          >脚本</AuthButton
        >
        <AuthButton
          v-if="activeDirectory.id && !isReadonly"
          :capability="capabilities.Codebook.Delete"
          disableMode
          size="small"
          type="danger"
          plain
          :icon="Delete"
          @click="$emit('delete', activeDirectory)"
          >删除</AuthButton
        >
      </div>
    </div>

    <VueDraggable
      v-model="localChildren"
      :animation="200"
      item-key="id"
      class="resource-grid"
      v-loading="childrenLoading"
      :disabled="isReadonly || !hasPermission(capabilities.Codebook.Sort)"
      @end="onDragEnd"
    >
      <button
        v-for="item in localChildren"
        :key="item.id"
        class="resource-item"
        type="button"
        @click="$emit('select', item)"
      >
        <span class="resource-icon" :class="item.kind.toLowerCase()">
          <SvgIcon v-if="item.kind === 'FILE'" :name="getFileIconName(item.name)" size="20px" class="file-icon" />
          <el-icon v-else>
            <Folder />
          </el-icon>
        </span>
        <span class="resource-meta">
          <strong>{{ item.name }}</strong>
          <small>{{ item.kind === "DIRECTORY" ? "目录" : inferLanguage(item.name) }}</small>
        </span>
        <el-tooltip v-if="isSystemCodebook(item)" content="系统资源，只读" placement="top" :show-after="300">
          <el-icon class="resource-readonly-lock"><Lock /></el-icon>
        </el-tooltip>
        <el-tag v-if="item.kind === 'FILE'" size="small" effect="plain">{{ getFileExt(item.name) || "file" }}</el-tag>
      </button>
      <template #header>
        <div v-if="!childrenLoading && localChildren.length === 0" class="resource-empty">
          <el-empty :image-size="130" description="当前目录暂无资源" />
        </div>
      </template>
    </VueDraggable>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { VueDraggable } from "vue-draggable-plus"
import { Delete, DocumentAdd, Folder, FolderAdd, FolderOpened, Lock } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { TASK_CAPABILITIES } from "@/common/auth/capability"
import { usePermission } from "@/common/composables/usePermission"
import { getFileExt, getFileIconName, inferLanguage } from "../composables/useCodebookFile"
import { isSystemCodebook } from "../composables/useCodebookTree"
import type { codebook } from "@/api/task/codebook/types/codebook"

const { hasPermission } = usePermission()
const capabilities = TASK_CAPABILITIES

const props = defineProps<{
  activeDirectory: codebook
  directoryChildren: codebook[]
  childrenLoading: boolean
  readonly?: boolean
}>()

const emit = defineEmits<{
  (e: "create-directory"): void
  (e: "create-file"): void
  (e: "delete", row: codebook): void
  (e: "select", row: codebook): void
  (e: "sort", id: number, targetPosition: number): void
}>()

const localChildren = ref<codebook[]>([])
const isReadonly = computed(() => props.readonly || isSystemCodebook(props.activeDirectory))

watch(
  () => props.directoryChildren,
  (newVal) => {
    localChildren.value = [...newVal]
  },
  { immediate: true, deep: true }
)

const onDragEnd = (evt: any) => {
  const { newIndex } = evt
  if (newIndex === undefined) return
  const movedItem = localChildren.value[newIndex]
  if (movedItem) {
    emit("sort", movedItem.id, newIndex)
  }
}
</script>

<style lang="scss" scoped>
.directory-view {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 8px 18px;
  box-sizing: border-box;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.directory-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.directory-title-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 6px;
}

.directory-title-text {
  min-width: 0;

  p {
    margin: 3px 0 0;
    color: #64748b;
    font-size: 12px;
  }
}

.directory-title-row {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;

  h3 {
    margin: 0;
    overflow: hidden;
    color: #0f172a;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.directory-kind {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.readonly-lock,
.resource-readonly-lock {
  flex-shrink: 0;
  color: #94a3b8;
  font-size: 13px;
}

.panel-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;

  :deep(.el-button) {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
  }
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  flex: 1;
  align-content: start;
  min-height: 0;
  overflow: auto;
  padding: 18px;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  height: 68px;
  padding: 0 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: #bfdbfe;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
  }
}

.resource-empty {
  display: grid;
  grid-column: 1 / -1;
  min-height: 360px;
  place-items: center;
}

.resource-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  color: #2563eb;
  background: #eff6ff;
  border-radius: 8px;

  &.directory {
    color: #d97706;
    background: #fffbeb;
  }
}

.resource-meta {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 3px;

  strong,
  small {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong {
    color: #111827;
    font-size: 14px;
  }

  small {
    color: #64748b;
    font-size: 12px;
  }
}
</style>
