<template>
  <Drawer
    v-model="visible"
    :title="`群聊管理 - ${team?.name || '未知团队'}`"
    subtitle="管理当前团队绑定的通知群聊"
    :header-icon="ChatDotRound"
    size="550px"
    @closed="handleClosed"
  >
    <div class="chat-drawer-container">
      <!-- 操作栏 -->
      <div class="action-bar">
        <h4 class="section-title">已绑定群聊 ({{ team?.chat_groups?.length || 0 }})</h4>
        <el-button type="primary" :icon="Plus" @click="showAddForm = true" v-if="!showAddForm"> 绑定群聊 </el-button>
      </div>

      <!-- 绑定新群聊表单 -->
      <el-collapse-transition>
        <div v-if="showAddForm" class="add-form-card">
          <div class="form-header">
            <span>新增群聊绑定</span>
            <el-button link type="info" :icon="Close" @click="cancelAdd" />
          </div>
          <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="custom-form">
            <el-form-item label="群聊名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入群聊名称" />
            </el-form-item>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="通知渠道" prop="channel">
                  <el-select v-model="form.channel" placeholder="请选择渠道" style="width: 100%">
                    <el-option :label="`飞书卡片 (${CHANNEL_TYPES.LARK_CARD})`" :value="CHANNEL_TYPES.LARK_CARD">
                      <div class="option-item">
                        <el-icon class="feishu-text"><Connection /></el-icon>
                        <span>飞书卡片</span>
                      </div>
                    </el-option>
                    <el-option :label="`企业微信 (${CHANNEL_TYPES.WECHAT})`" :value="CHANNEL_TYPES.WECHAT">
                      <div class="option-item">
                        <el-icon class="wecom-text"><Connection /></el-icon>
                        <span>企业微信</span>
                      </div>
                    </el-option>
                    <el-option :label="`邮件 (${CHANNEL_TYPES.EMAIL})`" :value="CHANNEL_TYPES.EMAIL">
                      <div class="option-item">
                        <el-icon class="dingtalk-text"><Connection /></el-icon>
                        <span>邮件</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="群聊 ID / Webhook" prop="chat_id">
                  <el-input v-model="form.chat_id" placeholder="群聊 ID 或 Webhook" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="form-actions">
              <el-button @click="cancelAdd">取消</el-button>
              <el-button type="primary" :loading="submitting" @click="submitAdd">确认绑定</el-button>
            </div>
          </el-form>
        </div>
      </el-collapse-transition>

      <!-- 群聊列表 -->
      <div class="chat-list" v-if="team?.chat_groups && team.chat_groups.length > 0">
        <div v-for="group in team.chat_groups" :key="group.id" class="chat-item">
          <div class="chat-item-main">
            <div :class="['channel-icon', group.channel]">
              <el-icon v-if="group.channel === CHANNEL_TYPES.LARK_CARD"><Connection /></el-icon>
              <el-icon v-else-if="group.channel === CHANNEL_TYPES.EMAIL"><Connection /></el-icon>
              <el-icon v-else><Connection /></el-icon>
            </div>
            <div class="chat-info">
              <div class="chat-name">{{ group.name }}</div>
              <div class="chat-id-row">
                <el-tag size="small" :type="getChannelTagType(group.channel)" effect="plain" class="channel-tag">
                  {{ group.channel.toUpperCase() }}
                </el-tag>
                <span class="chat-id-text">{{ group.chat_id }}</span>
              </div>
            </div>
          </div>
          <div class="chat-item-actions">
            <el-tooltip content="取消绑定" placement="top">
              <el-button type="danger" link :icon="Delete" @click="handleUnbind(group)" />
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="暂未绑定任何群聊" :image-size="100">
        <template #extra v-if="!showAddForm">
          <el-button type="primary" plain @click="showAddForm = true">立即绑定一个</el-button>
        </template>
      </el-empty>
    </div>

    <!-- 底部按钮覆盖默认 footer -->
    <template #footer>
      <el-button @click="visible = false">关闭窗口</el-button>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue"
import { ChatDotRound, Plus, Delete, Close, Connection } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { Team, ChatGroup, BindChatGroupReq } from "@/api/alert/team/types"
import { bindChatGroupApi, unbindChatGroupApi } from "@/api/alert/team"
import { CHANNEL_TYPES } from "@/api/alert/template/types"

interface Props {
  modelValue: boolean
  team: Team | null
}

const props = defineProps<Props>()
const emits = defineEmits<{
  "update:modelValue": [value: boolean]
  refresh: []
}>()

// NOTE: 该组件为纯 UI 控制组件，状态需由父组件统一管理
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emits("update:modelValue", val)
})

const showAddForm = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive<BindChatGroupReq>({
  team_id: 0,
  name: "",
  channel: CHANNEL_TYPES.LARK_CARD,
  chat_id: "",
  is_temporary: false
})

const rules = reactive<FormRules>({
  name: [{ required: true, message: "请输入群聊名称", trigger: "blur" }],
  channel: [{ required: true, message: "请选择通知渠道", trigger: "change" }],
  chat_id: [{ required: true, message: "请输入群聊 ID 或 Webhook", trigger: "blur" }]
})

const getChannelTagType = (channel: string): "primary" | "success" | "warning" | "info" | "danger" => {
  switch (channel) {
    case CHANNEL_TYPES.LARK_CARD:
      return "primary"
    case CHANNEL_TYPES.EMAIL:
      return "info"
    case CHANNEL_TYPES.WECHAT:
      return "success"
    default:
      return "info"
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) formRef.value.resetFields()
  form.name = ""
  form.chat_id = ""
  form.channel = CHANNEL_TYPES.LARK_CARD
}

const submitAdd = async () => {
  if (!formRef.value || !props.team) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await bindChatGroupApi({
          ...form,
          team_id: props.team!.id
        })
        ElMessage.success("群聊绑定成功")
        showAddForm.value = false
        resetForm()
        emits("refresh")
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleUnbind = (group: ChatGroup) => {
  ElMessageBox.confirm(`确定要取消绑定群聊 "${group.name}" 吗？`, "风险提示", {
    confirmButtonText: "确定取消",
    cancelButtonText: "手滑了",
    type: "warning",
    confirmButtonClass: "el-button--danger"
  })
    .then(async () => {
      try {
        if (group.id) {
          await unbindChatGroupApi(group.id)
          ElMessage.success("解绑成功")
          emits("refresh")
        }
      } catch (error) {
        ElMessage.error("解绑操作失败")
      }
    })
    .catch(() => {})
}

const handleClosed = () => {
  showAddForm.value = false
  resetForm()
}
</script>

<style lang="scss" scoped>
.chat-drawer-container {
  padding: 24px;
  height: 100%;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-form-card {
  background: #fdf2f2; // 设计系统背景色
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    font-weight: 600;
    color: #7f1d1d; // 设计系统文字颜色
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 12px;
  }
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;

  &:hover {
    border-color: #dc2626; // 设计系统主色
    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
    transform: translateY(-2px);
  }

  .chat-item-main {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .channel-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;

    &.LARK_CARD {
      background: rgba(59, 130, 246, 0.1);
      color: #2563eb;
    }
    &.EMAIL {
      background: rgba(107, 114, 128, 0.1);
      color: #4b5563;
    }
    &.WECHAT {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }
  }

  .chat-info {
    .chat-name {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .chat-id-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .channel-tag {
      font-weight: 700;
      font-family: "Fira Code", monospace;
      font-size: 10px;
    }

    .chat-id-text {
      font-size: 12px;
      color: #6b7280;
      font-family: "Fira Code", monospace;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .chat-item-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .chat-item-actions {
    opacity: 1;
  }
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feishu-text {
  color: #2563eb;
}
.dingtalk-text {
  color: #4b5563;
}
.wecom-text {
  color: #059669;
}

:deep(.custom-form) {
  .el-form-item__label {
    padding-bottom: 4px;
    font-weight: 500;
    color: #4b5563;
  }

  .el-input__wrapper {
    box-shadow: 0 0 0 1px #e5e7eb inset;
    &:hover,
    &.is-focus {
      box-shadow: 0 0 0 1px #dc2626 inset;
    }
  }
}
</style>
