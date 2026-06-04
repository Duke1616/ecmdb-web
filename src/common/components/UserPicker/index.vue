<template>
  <GenericPicker
    v-model="model"
    :placeholder="placeholder"
    search-placeholder="搜索用户..."
    :multiple="multiple"
    :variant="variant"
    :search-api="searchApi"
    :resolve-api="resolveApi"
    key-field="username"
    label-field="nickname"
    :fallback-builder="fallbackBuilder"
  >
    <!-- 多选 Tag 的定制渲染 -->
    <template #tag="{ item }">
      <div class="user-avatar size-tag" :style="{ background: generateUserColor(item.username || '') }">
        {{ (item.nickname || item.username || "").charAt(0) }}
      </div>
      <span class="user-name">{{ item.nickname || item.username }}</span>
    </template>

    <!-- 单选显示区的定制渲染 -->
    <template #single="{ item }">
      <div class="user-avatar size-single" :style="{ background: generateUserColor(item.username || '') }">
        {{ (item.nickname || item.username || "").charAt(0) }}
      </div>
      <span class="user-name">{{ item.nickname || item.username }}</span>
    </template>

    <!-- 下拉选项的定制渲染 -->
    <template #item="{ item }">
      <div class="user-avatar size-item" :style="{ background: generateUserColor(item.username || '') }">
        {{ (item.nickname || item.username || "").charAt(0) }}
      </div>
      <div class="user-info">
        <div class="user-name">{{ item.nickname || item.username }}</div>
        <div class="user-username">@{{ item.username }}</div>
      </div>
    </template>
  </GenericPicker>
</template>

<script lang="ts" setup>
import { watch } from "vue"
import { listUsersApi as listIamUsersApi } from "@/api/iam/user"
import type { User as IIamUser } from "@/api/iam/user/type"
import { useUserStore } from "@/pinia/stores/user"
import GenericPicker from "@/common/components/GenericPicker/index.vue"

interface IUserPickerProps {
  placeholder?: string
  defaultToCurrentUser?: boolean
  multiple?: boolean
  variant?: "fancy" | "simple"
}

const props = withDefaults(defineProps<IUserPickerProps>(), {
  placeholder: "选择用户",
  defaultToCurrentUser: true,
  multiple: false,
  variant: "fancy"
})

// NOTE: 这里的 model 绑定为选中用户的主键（username），通过 defineModel 与父组件的表单状态同步
const model = defineModel<string | string[]>({ default: "" })

const userStore = useUserStore()

/**
 * 包装模糊搜索 API，以满足 GenericPicker 的强类型约束
 */
const searchApi = async (params: { keyword: string; offset: number; limit: number }) => {
  const { data } = await listIamUsersApi({
    keyword: params.keyword,
    offset: params.offset,
    limit: params.limit
  })
  return {
    total: data.total || 0,
    data: data.users || []
  }
}

/**
 * 包装详情查询 API
 */
const resolveApi = async (username: string): Promise<IIamUser | null> => {
  return await userStore.resolveUser(username)
}

/**
 * 当详情查询失败时的强类型降级生成器
 */
const fallbackBuilder = (username: string): IIamUser => {
  return {
    id: 0,
    username: username,
    nickname: username,
    email: "",
    avatar: "",
    job_title: "",
    phone: "",
    source: "",
    ctime: 0,
    utime: 0,
    last_login_at: 0,
    console_login: false,
    mfa_bound: false,
    mfa_type: "",
    status: "",
    identities: []
  }
}

/**
 * 设置默认用户为当前登录用户
 */
const setDefaultToCurrentUser = async () => {
  await userStore.getInfo()
  if (userStore.username) {
    model.value = userStore.username
  }
}

// 自动对齐“默认设为当前用户”的业务属性
watch(
  () => model.value,
  async (newValue) => {
    if (!props.multiple && props.defaultToCurrentUser) {
      if (newValue === undefined || newValue === null || newValue === "") {
        await setDefaultToCurrentUser()
      }
    }
  },
  { immediate: true }
)

/**
 * 基于用户名生成随机漂亮的背景色
 */
const generateUserColor = (username: string) => {
  const colors = [
    "#667eea", // 蓝紫色
    "#764ba2", // 紫色
    "#f093fb", // 粉色
    "#f5576c", // 红色
    "#4facfe", // 蓝色
    "#00f2fe", // 青色
    "#43e97b", // 绿色
    "#38f9d7", // 青绿色
    "#fa709a", // 粉红色
    "#fee140", // 黄色
    "#a8edea", // 浅青色
    "#fed6e3", // 浅粉色
    "#ffecd2", // 浅橙色
    "#fcb69f", // 浅红色
    "#ff9a9e", // 浅粉红
    "#a18cd1", // 浅紫色
    "#fbc2eb", // 浅粉紫
    "#ffecd2", // 浅橙黄
    "#fcb69f", // 浅橙红
    "#ff9a9e" // 浅粉红
  ]

  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}
</script>

<style lang="scss" scoped>
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  border-radius: 50%;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
}

/* Fancy 风格尺寸 */
.size-single {
  width: 28px;
  height: 28px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.size-tag {
  width: 18px;
  height: 18px;
  font-size: 9px;
  box-shadow: none;
}

.size-item {
  width: 32px;
  height: 32px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.user-name {
  color: #1e293b;
  font-size: 13px;
  font-weight: 500;
}

.user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-info .user-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.user-username {
  font-size: 11px;
  color: #6b7280;
  font-weight: 400;
}

/* Simple 风格尺寸与样式覆盖 */
:deep(.variant-simple) {
  .size-single {
    width: 16px;
    height: 16px;
    font-size: 8px;
    box-shadow: none;
  }
  .size-tag {
    width: 14px;
    height: 14px;
    font-size: 8px;
    box-shadow: none;
  }
  .user-name {
    font-size: 13px;
    color: #606266;
    font-weight: normal;
  }
}
</style>
