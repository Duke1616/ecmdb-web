<template>
  <Drawer
    v-model="visible"
    :title="id ? '编辑接入应用' : '新建接入应用'"
    :subtitle="id ? '修改客户端回调配置与授权策略' : '配置基于 OIDC / OAuth2 协议的应用单点登录客户端'"
    size="600px"
    :header-icon="Connection"
    :confirm-loading="saving"
    @confirm="handleSubmit"
    @cancel="visible = false"
  >
    <div v-loading="detailLoading" class="client-form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="client-form"
        :validate-on-rule-change="false"
      >
        <!-- 1. 基本配置 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Setting /></el-icon>
              <span>基本配置</span>
            </div>
          </div>

          <el-form-item label="应用名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入应用名称，如 GitLab / Grafana"
              size="large"
              maxlength="50"
              show-word-limit
              class="premium-input"
            />
          </el-form-item>

          <!-- 客户端类型卡片选择器 -->
          <div class="mode-selector">
            <div class="mode-card" :class="{ 'is-active': !formData.is_public }" @click="formData.is_public = false">
              <div class="mode-card__icon">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="mode-card__body">
                <span class="mode-card__title">机密客户端</span>
                <span class="mode-card__desc">含后端服务的系统 (如 GitLab)</span>
              </div>
              <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
            </div>

            <div class="mode-card" :class="{ 'is-active': formData.is_public }" @click="formData.is_public = true">
              <div class="mode-card__icon">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="mode-card__body">
                <span class="mode-card__title">公共客户端</span>
                <span class="mode-card__desc">纯前端 SPA 或移动端 (PKCE)</span>
              </div>
              <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
            </div>
          </div>

          <div class="form-row-grid">
            <el-form-item label="客户端标识 (Client ID)" prop="client_id" class="flex-1">
              <el-input
                v-model="formData.client_id"
                :disabled="!!id"
                placeholder="留空系统将自动生成"
                size="large"
                class="mono premium-input"
              >
                <template #prefix>
                  <el-icon><Key /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="应用图标 (Logo URL)" prop="logo" class="flex-1">
              <el-input
                v-model="formData.logo"
                placeholder="https://.../logo.png (选填)"
                size="large"
                class="premium-input"
              >
                <template #prefix>
                  <el-icon><Picture /></el-icon>
                </template>
                <template #suffix v-if="formData.logo">
                  <el-avatar :size="22" :src="formData.logo" shape="square" class="logo-preview-avatar" />
                </template>
              </el-input>
            </el-form-item>
          </div>
        </div>

        <!-- 2. 回调地址 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Position /></el-icon>
              <span>回调地址</span>
            </div>
          </div>

          <div class="uri-list-wrapper">
            <div v-for="(uri, index) in formData.redirect_uris" :key="index" class="uri-item">
              <el-input
                v-model="formData.redirect_uris[index]"
                placeholder="https://gitlab.example.com/oauth/callback"
                size="large"
                class="mono premium-input flex-1"
              >
                <template #prefix>
                  <el-icon><Link /></el-icon>
                </template>
              </el-input>
              <el-button
                v-if="formData.redirect_uris.length > 1"
                type="danger"
                link
                class="uri-del-btn"
                @click="removeUri(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>

            <div class="uri-actions">
              <el-button type="primary" link size="small" class="add-uri-btn" @click="addUri">
                <el-icon><Plus /></el-icon> 添加地址
              </el-button>

              <div class="uri-quick-tags">
                <span class="quick-pill" @click="fillQuickUri('http://localhost:3000/api/auth/callback')">
                  + 示例: 本地调试 (localhost:3000)
                </span>
              </div>
            </div>

            <div class="field-sub-tip">
              认证成功后的重定向白名单，支持 http://、https:// 或自定义 Scheme，禁止包含 # 片段
            </div>
          </div>
        </div>

        <!-- 3. 授权策略 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><UserFilled /></el-icon>
              <span>免确认授权</span>
            </div>
            <div class="title-right">
              <el-switch v-model="formData.auto_consent" inline-prompt active-text="开启" inactive-text="关闭" />
            </div>
          </div>

          <div class="policy-note">
            开启后跳过用户手动确认授权页，登录后直接重定向至目标系统（建议企业内部第一方系统开启）
          </div>
        </div>
      </el-form>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { ElMessage } from "element-plus"
import {
  Connection,
  Setting,
  Position,
  Lock,
  Monitor,
  CircleCheckFilled,
  Key,
  UserFilled,
  Picture,
  Link,
  Plus,
  Delete
} from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { createOAuthClientApi, updateOAuthClientApi, getOAuthClientDetailApi } from "@/api/iam/idp"
import type { OAuthClient, CreateOAuthClientReq, UpdateOAuthClientReq } from "@/api/iam/idp/type"

// NOTE: 该组件为抽屉状态控制器，使用 defineModel 进行开放/折叠的双向状态同步
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  id?: number | null
}>()

const emit = defineEmits<{
  (e: "success", client?: OAuthClient): void
}>()

const formRef = ref<FormInstance>()
const saving = ref(false)
const detailLoading = ref(false)

// 平台默认支持的全量标准 OIDC 授权范围
const DEFAULT_OIDC_SCOPES = ["openid", "profile", "email", "phone", "roles"]

const getInitialData = () => ({
  name: "",
  client_id: "",
  logo: "",
  redirect_uris: [""],
  scopes: [...DEFAULT_OIDC_SCOPES],
  auto_consent: true,
  is_public: false
})

const formData = reactive(getInitialData())

const addUri = () => {
  formData.redirect_uris.push("")
}

const removeUri = (index: number) => {
  if (formData.redirect_uris.length > 1) {
    formData.redirect_uris.splice(index, 1)
  }
}

const fillQuickUri = (uri: string) => {
  if (formData.redirect_uris.length === 1 && !formData.redirect_uris[0].trim()) {
    formData.redirect_uris[0] = uri
  } else if (!formData.redirect_uris.includes(uri)) {
    formData.redirect_uris.push(uri)
  }
  ElMessage.success("已添加示例回调地址")
}

const validateClientId = (_rule: any, value: string, callback: any) => {
  if (!value) return callback()
  const reg = /^[a-zA-Z0-9_-]{3,64}$/
  if (!reg.test(value)) {
    return callback(new Error("Client ID 须为 3-64 位的英文字母、数字、下划线或连字符"))
  }
  callback()
}

const validateLogoUrl = (_rule: any, value: string, callback: any) => {
  if (!value) return callback()
  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return callback(new Error("图标地址须以 http:// 或 https:// 开头"))
  }
  callback()
}

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: "请输入应用名称", trigger: "blur" },
    { min: 2, max: 50, message: "应用名称长度需在 2 到 50 个字符之间", trigger: "blur" }
  ],
  client_id: [{ validator: validateClientId, trigger: "blur" }],
  logo: [{ validator: validateLogoUrl, trigger: "blur" }]
})

watch(
  () => visible.value,
  async (val) => {
    if (!val) {
      Object.assign(formData, getInitialData())
      nextTick(() => formRef.value?.clearValidate())
      return
    }

    Object.assign(formData, getInitialData())
    nextTick(() => formRef.value?.clearValidate())

    if (props.id) {
      detailLoading.value = true
      try {
        const res = await getOAuthClientDetailApi(props.id)
        const data = res.data
        formData.name = data.name || ""
        formData.client_id = data.client_id || ""
        formData.logo = data.logo || ""
        formData.redirect_uris = data.redirect_uris && data.redirect_uris.length > 0 ? [...data.redirect_uris] : [""]
        formData.scopes = data.scopes && data.scopes.length > 0 ? data.scopes : ["openid", "profile", "email"]
        formData.auto_consent = data.auto_consent
        formData.is_public = data.is_public
      } catch (err: any) {
        ElMessage.error(err.message || "获取应用详情失败")
      } finally {
        detailLoading.value = false
      }
    }
  }
)

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    // 回调地址校验
    const validUris = formData.redirect_uris.map((u) => u.trim()).filter(Boolean)
    if (validUris.length === 0) {
      ElMessage.warning("请至少填写一个有效的回调地址")
      return
    }

    for (const line of validUris) {
      if (line.includes("#")) {
        ElMessage.warning(`回调地址严禁包含 '#' 片段标识: ${line}`)
        return
      }

      try {
        const url = new URL(line)
        if (!url.protocol || !url.host) {
          ElMessage.warning(`回调地址格式不完整: ${line}`)
          return
        }
      } catch {
        if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(line)) {
          ElMessage.warning(`回调地址协议或格式不合法: ${line}`)
          return
        }
      }
    }

    const redirectUris = Array.from(new Set(validUris))
    const scopes = Array.from(new Set(["openid", ...formData.scopes]))

    saving.value = true
    try {
      if (props.id) {
        const updateReq: UpdateOAuthClientReq = {
          id: props.id,
          name: formData.name.trim(),
          logo: formData.logo.trim() || undefined,
          redirect_uris: redirectUris,
          scopes,
          auto_consent: formData.auto_consent,
          is_public: formData.is_public
        }
        await updateOAuthClientApi(updateReq)
        ElMessage.success("应用配置更新成功")
        emit("success")
      } else {
        const createReq: CreateOAuthClientReq = {
          name: formData.name.trim(),
          client_id: formData.client_id.trim() || undefined,
          logo: formData.logo.trim() || undefined,
          redirect_uris: redirectUris,
          scopes,
          auto_consent: formData.auto_consent,
          is_public: formData.is_public
        }
        const res = await createOAuthClientApi(createReq)
        ElMessage.success("接入应用创建成功")
        emit("success", res.data)
      }
      visible.value = false
    } catch (err: any) {
      ElMessage.error(err.message || "保存应用失败")
    } finally {
      saving.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.client-form-container {
  padding: 12px 16px;
  background: #fdfdfe;
}

.form-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
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

.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;

  .mode-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fafafa;
    position: relative;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f0f7ff;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);

      .mode-card__icon {
        background: #3b82f6;
        .el-icon {
          color: #fff;
        }
      }

      .mode-card__title {
        color: #1d4ed8;
      }

      .mode-card__check {
        opacity: 1;
        color: #3b82f6;
      }
    }

    &__icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;

      .el-icon {
        font-size: 17px;
        color: #64748b;
      }
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      line-height: 1.2;
    }

    &__desc {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.3;
    }

    &__check {
      font-size: 18px;
      opacity: 0;
      flex-shrink: 0;
      transition: opacity 0.2s ease;
    }
  }
}

.uri-list-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .uri-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .uri-del-btn {
    font-size: 16px;
    padding: 0 4px;
    height: 38px;
    color: #94a3b8;
    transition: color 0.15s;

    &:hover {
      color: #ef4444;
    }
  }

  .uri-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 2px;
  }

  .add-uri-btn {
    font-weight: 500;
  }

  .uri-quick-tags {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .quick-pill {
    font-size: 11px;
    color: #3b82f6;
    background: #eff6ff;
    border: 1px solid #dbeafe;
    padding: 2px 8px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;

    &:hover {
      background: #dbeafe;
      border-color: #93c5fd;
      color: #1d4ed8;
    }
  }
}

.form-row-grid {
  display: flex;
  gap: 14px;

  .flex-1 {
    flex: 1;
    min-width: 0;
  }
}

.logo-preview-avatar {
  border: 1px solid #e2e8f0;
  background: #ffffff;
}

.field-sub-tip {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 8px;
}

.policy-note {
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.gov-textarea {
  :deep(.el-textarea__inner) {
    background: #f8fafc;
    border-color: #e2e8f0;
    border-radius: 8px;
    font-size: 12px;
    line-height: 1.6;
    transition: all 0.2s;

    &:focus {
      background: #ffffff;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
