<template>
  <aside class="channel-rail">
    <div
      v-for="channel in channels"
      :key="channel.code"
      class="channel-item"
      :class="{ 'is-active': activeChannel === channel.code }"
    >
      <button type="button" class="channel-select" @click="emit('select', channel.code)">
        <span class="channel-icon-wrap">
          <img class="channel-icon" :src="channel.icon" :alt="channel.label" />
        </span>
        <span class="channel-main">
          <span class="channel-name">{{ channel.label }}</span>
          <span class="channel-state">{{ getChannelState(channel.code) }}</span>
        </span>
      </button>
      <el-tooltip content="清空渠道模板" placement="top">
        <AuthButton
          class="channel-delete"
          :icon="Delete"
          text
          type="danger"
          :loading="deletingChannel === channel.code"
          :disabled="readonly || !canDelete(channel.code)"
          :capability="ALERT_CAPABILITIES.TemplateSet.TemplateClear"
          disable-mode
          @click.stop="emit('delete', channel.code)"
        />
      </el-tooltip>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { Delete } from "@element-plus/icons-vue"
import AuthButton from "@/common/components/Auth/AuthButton.vue"
import { ALERT_CAPABILITIES } from "@/common/auth/capability"
import type { EditableChannel, TemplateChannelOption } from "../composables/useTemplateEditor"

const props = withDefaults(
  defineProps<{
    channels: TemplateChannelOption[]
    activeChannel: EditableChannel
    getChannelState: (channel: EditableChannel) => string
    canDeleteChannel?: (channel: EditableChannel) => boolean
    deletingChannel?: EditableChannel | null
    readonly?: boolean
  }>(),
  {
    deletingChannel: null,
    readonly: false
  }
)

const emit = defineEmits<{
  select: [channel: EditableChannel]
  delete: [channel: EditableChannel]
}>()

const canDelete = (channel: EditableChannel) => Boolean(props.canDeleteChannel?.(channel))
</script>

<style lang="scss" scoped>
.channel-rail {
  min-height: 0;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  overflow-y: auto;
}

.channel-item {
  width: 100%;
  min-height: 72px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 32px;
  align-items: center;
  gap: 8px;
  text-align: left;

  &:hover,
  &.is-active {
    background: #f8fafc;
    border-color: #bfdbfe;
  }
}

.channel-select {
  min-width: 0;
  min-height: 70px;
  border: 0;
  background: transparent;
  padding: 12px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  text-align: left;
  cursor: pointer;
}

.channel-delete {
  width: 28px;
  height: 28px;
  margin-right: 8px;
}

.channel-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.channel-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.channel-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.channel-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.channel-state {
  font-size: 12px;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .channel-rail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
