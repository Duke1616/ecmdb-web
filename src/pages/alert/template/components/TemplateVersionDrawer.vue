<template>
  <CustomDrawer
    v-model="visible"
    title="版本管理"
    :subtitle="`${channelLabel} 渠道模板版本`"
    size="380px"
    :show-footer="false"
    class="template-version-drawer"
  >
    <template #header-icon>
      <el-icon><Collection /></el-icon>
    </template>

    <div class="version-drawer-content">
      <section class="version-section">
        <div class="section-title">
          <el-icon class="section-icon"><Collection /></el-icon>
          <span>当前版本</span>
        </div>

        <div class="version-overview">
          <div class="overview-main">
            <span class="overview-label">查看中</span>
            <strong>{{ draft?.versionName || initialVersionName }}</strong>
          </div>
          <div class="overview-meta">
            <span>{{ draft?.versions.length || 0 }} 个版本</span>
            <span>{{ draft?.templateId ? "已配置模板" : "保存后可创建版本" }}</span>
          </div>
        </div>
      </section>

      <section class="version-section version-list-section">
        <div class="section-title section-title-with-action">
          <span class="section-title-left">
            <el-icon class="section-icon"><Clock /></el-icon>
            <span>版本列表</span>
          </span>
          <el-button
            size="small"
            type="primary"
            :icon="Plus"
            :disabled="!draft?.templateId"
            @click="emit('create-version')"
          >
            新增版本
          </el-button>
        </div>

        <div v-if="draft && draft.versions.length > 0" class="version-list">
          <button
            v-for="version in draft.versions"
            :key="version.id"
            class="version-item"
            :class="{
              'is-active': version.id === draft.activeVersionId,
              'is-viewing': version.id === draft.versionId
            }"
            @click="emit('switch-version', version)"
          >
            <span class="version-main">
              <span class="version-row-top">
                <span class="version-name">{{ version.name }}</span>
                <span class="version-badges">
                  <el-tag v-if="version.id === draft.activeVersionId" type="success" size="small"> 当前使用 </el-tag>
                  <el-tag v-if="version.id === draft.versionId" type="primary" size="small" effect="plain">
                    查看中
                  </el-tag>
                </span>
              </span>
              <span class="version-desc">{{ version.desc || "暂无备注" }}</span>
            </span>

            <span class="version-actions">
              <el-button
                v-if="version.id !== draft.activeVersionId"
                text
                type="primary"
                size="small"
                :disabled="!draft.templateId"
                @click.stop="emit('publish-version', version.id)"
              >
                设为当前
              </el-button>
            </span>
          </button>
        </div>

        <el-empty v-else class="version-empty" description="保存当前渠道后会生成 v1.0.0" :image-size="72">
          <el-button type="primary" :disabled="!draft?.templateId" @click="emit('create-version')"> 新增版本 </el-button>
        </el-empty>
      </section>
    </div>
  </CustomDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { Clock, Collection, Plus } from "@element-plus/icons-vue"
import CustomDrawer from "@@/components/Dialogs/Drawer/index.vue"
import type { TemplateVersion } from "@/api/alert/template/types"
import type { ChannelDraft } from "../composables/useTemplateEditor"

const props = defineProps<{
  modelValue: boolean
  channelLabel: string
  draft?: ChannelDraft
  initialVersionName: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: boolean]
  "create-version": []
  "switch-version": [version: TemplateVersion]
  "publish-version": [versionId: number]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})
</script>

<style lang="scss" scoped>
.version-drawer-content {
  min-height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: #ffffff;
}

.version-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.section-title-with-action {
  justify-content: space-between;
  gap: 12px;
}

.section-title-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: #409eff;
  font-size: 16px;
}

.version-overview {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.overview-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 16px;
    line-height: 1.35;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.overview-label {
  font-size: 12px;
  color: #64748b;
}

.overview-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  span {
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    display: inline-flex;
    align-items: center;
    color: #64748b;
    font-size: 12px;
    line-height: 1;
  }
}

.version-list-section {
  flex: 1;
  min-height: 0;
}

.version-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px 12px 10px;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;

  &:hover,
  &.is-viewing {
    border-color: #3b82f6;
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.08);
  }

  &.is-active {
    border-color: #67c23a;
    background: #f7fff2;
  }
}

.version-main {
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 7px;
}

.version-row-top {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.version-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-badges {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.version-desc {
  min-width: 0;
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  min-height: 22px;
}

.version-empty {
  padding: 32px 0;
}

:global(.template-version-drawer.custom-drawer .drawer-content) {
  border-radius: 0;
  box-shadow: none;
}

:global(.template-version-drawer.custom-drawer .drawer-footer) {
  background: #ffffff;
}
</style>
