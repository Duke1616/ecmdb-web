<template>
  <Drawer
    v-model="visible"
    :title="`群聊管理 - ${team?.name || '未知团队'}`"
    :subtitle="`管理团队绑定的群组`"
    :header-icon="Connection"
    size="560px"
    @closed="handleClosed"
  >
    <div class="chat-manager" v-loading="loading">
      <!-- 列表头部：统计与新增切换 -->
      <div class="list-header">
        <div class="stats">
          已绑定 <span class="count">{{ chatGroups.length }}</span> 个群聊
        </div>
        <el-button v-if="!showAddForm" type="primary" size="small" :icon="Plus" plain @click="showAddForm = true">
          新增绑定
        </el-button>
      </div>

      <!-- 新增窗格 -->
      <el-collapse-transition>
        <div v-if="showAddForm" class="add-form-panel">
          <div class="panel-title">
            <span>新增群聊配置</span>
            <el-button link :icon="Close" @click="cancelAdd" />
          </div>
          <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="default">
            <el-form-item label="群聊名称" prop="name">
              <el-input v-model="form.name" placeholder="建议包含环境或功能描述" />
            </el-form-item>
            <el-form-item label="通知渠道" prop="channel">
              <el-select v-model="form.channel" placeholder="请选择渠道" style="width: 100%">
                <el-option v-for="(cfg, key) in CHANNEL_CONFIG" :key="key" :label="cfg.label" :value="key">
                  <div class="option-item">
                    <el-icon :style="{ color: cfg.color }"><component :is="cfg.icon" /></el-icon>
                    <span>{{ cfg.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="群聊 ID" prop="chat_id">
              <el-input v-model="form.chat_id" placeholder="群聊 ID 或 Webhook 链接" />
            </el-form-item>
            <el-form-item label-width="0">
              <div class="form-footer">
                <el-button @click="cancelAdd">取消</el-button>
                <el-button type="primary" :loading="committing" @click="submitAdd">确认绑定</el-button>
              </div>
            </el-form-item>
          </el-form>
        </div>
      </el-collapse-transition>

      <!-- 群聊列表 -->
      <div class="chat-list" v-if="chatGroups.length > 0">
        <div v-for="group in chatGroups" :key="group.id" class="chat-item">
          <div class="item-main">
            <div class="channel-icon" :style="{ color: getChannelRes(group.channel).color }">
              <el-icon><component :is="getChannelRes(group.channel).icon" /></el-icon>
            </div>
            <div class="item-body">
              <div class="row-top">
                <span class="name">{{ group.name }}</span>
                <el-tag size="small" :type="getChannelRes(group.channel).type" effect="light">
                  {{ getChannelRes(group.channel).label }}
                </el-tag>
              </div>
              <div class="row-bottom">
                <el-icon><Link /></el-icon>
                <span class="id-text" :title="group.chat_id">{{ group.chat_id }}</span>
              </div>
            </div>
          </div>
          <div class="item-ops">
            <el-popconfirm title="确定解除此群聊绑定吗？" @confirm="handleUnbind(group)">
              <template #reference>
                <el-button type="danger" link :icon="Delete">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else-if="!loading" description="暂未绑定任何群聊" :image-size="100" />
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue"
import { Plus, Delete, Close, Cellphone, Message, ChatRound, Link, Connection } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { Team, ChatGroup, BindChatGroupReq } from "@/api/alert/team/types"
import { bindChatGroupApi, unbindChatGroupApi, getChatGroupsByTeamIdApi } from "@/api/alert/team"
import { CHANNEL_TYPES } from "@/api/alert/template/types"

const props = defineProps<{ team: Team | null }>()
const emits = defineEmits<{ refresh: [] }>()
const visible = defineModel<boolean>({ default: false })

// NOTE: 该组件为对话框/抽屉类 UI 组件，需要双向同步可见性状态
const CHANNEL_CONFIG: Record<
  string,
  { label: string; icon: any; type: "primary" | "success" | "info" | "warning" | "danger" | undefined; color: string }
> = {
  [CHANNEL_TYPES.LARK_CARD]: {
    label: "飞书卡片",
    icon: Cellphone,
    type: "primary",
    color: "#409eff"
  },
  [CHANNEL_TYPES.WECHAT]: {
    label: "企业微信",
    icon: ChatRound,
    type: "success",
    color: "#67c23a"
  },
  [CHANNEL_TYPES.EMAIL]: {
    label: "邮件通知",
    icon: Message,
    type: "info",
    color: "#909399"
  }
}

const chatGroups = ref<ChatGroup[]>([])
const loading = ref(false)
const showAddForm = ref(false)
const committing = ref(false)
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
  channel: [{ required: true, message: "请选择渠道", trigger: "change" }],
  chat_id: [{ required: true, message: "请输入群聊 ID", trigger: "blur" }]
})

/**
 * 获取渠道相关配置
 * @param channel 渠道类型
 */
const getChannelRes = (channel: string) => {
  return CHANNEL_CONFIG[channel] || { label: channel, icon: Connection, type: undefined, color: "#909399" }
}

/**
 * 获取群聊列表
 */
const fetchChatGroups = async () => {
  if (!props.team?.id) return
  loading.value = true
  try {
    const { data } = await getChatGroupsByTeamIdApi(props.team.id)
    chatGroups.value = data || []
  } catch (e) {
    console.error("[ChatGroupDrawer] fetch error:", e)
  } finally {
    loading.value = false
  }
}

/**
 * 监听可见性和团队 ID 变化
 */
watch(
  [visible, () => props.team?.id],
  ([v, id]) => {
    if (v && id) fetchChatGroups()
  },
  { immediate: true }
)

/**
 * 取消新增
 */
const cancelAdd = () => {
  showAddForm.value = false
  formRef.value?.resetFields()
}

/**
 * 提交新增绑定
 */
const submitAdd = async () => {
  if (!formRef.value || !props.team) return
  const valid = await formRef.value.validate()
  if (!valid) return
  committing.value = true
  try {
    await bindChatGroupApi({ ...form, team_id: props.team.id })
    ElMessage.success("绑定成功")
    showAddForm.value = false
    await fetchChatGroups()
    emits("refresh")
  } catch (e) {
    // 错误已由拦截器处理
  } finally {
    committing.value = false
  }
}

/**
 * 解绑群聊
 * @param group 群聊信息
 */
const handleUnbind = async (group: ChatGroup) => {
  if (!group.id) return
  try {
    await unbindChatGroupApi(group.id)
    ElMessage.success("解绑成功")
    await fetchChatGroups()
    emits("refresh")
  } catch (e) {
    ElMessage.error("操作失败")
  }
}

/**
 * 关闭后的回调
 */
const handleClosed = () => {
  showAddForm.value = false
  formRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.chat-manager {
  padding: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  .stats {
    font-size: 13px;
    color: #909399;
    .count {
      font-weight: 600;
      color: #303133;
      margin: 0 2px;
    }
  }
}

.add-form-panel {
  background: #fcfcfc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;

  .panel-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .form-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    width: 100%;
    margin-top: 8px;
  }
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
  .el-icon {
    font-size: 16px;
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
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .item-main {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .channel-icon {
      font-size: 20px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fa;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .item-body {
      flex: 1;
      min-width: 0;
      .row-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        .name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
      .row-bottom {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #909399;
        .id-text {
          font-family:
            ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .item-ops {
    margin-left: 16px;
    flex-shrink: 0;
  }
}
</style>
