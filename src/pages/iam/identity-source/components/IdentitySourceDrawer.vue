<template>
  <Drawer
    v-model="visible"
    :title="data ? '治理现有身份源' : '集成新企业身份源'"
    :subtitle="
      data ? '调整当前集成协议的连接参数与属性映射逻辑' : '配置基于标准协议的身份提供商，实现企业级 SSO 统一接入'
    "
    size="38%"
    :header-icon="Share"
    :confirm-loading="saving"
    @confirm="submit"
    @cancel="visible = false"
  >
    <div class="identity-source-form">
      <!-- 提供商选择: 采用横向卡片样式 -->
      <div class="mode-selector">
        <div
          v-for="p in providers"
          :key="p.id"
          class="mode-card"
          :class="{ 'is-active': selectedProvider === p.id }"
          @click="selectProvider(p.id)"
        >
          <div class="mode-card__icon">
            <img :src="p.icon" alt="icon" />
          </div>
          <div class="mode-card__body">
            <span class="mode-card__title">{{ p.name }}</span>
            <span class="mode-card__desc">{{ p.desc }}</span>
          </div>
          <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="governance-form">
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><InfoFilled /></el-icon>
              <span>基础核心配置</span>
            </div>
          </div>

          <div class="basic-config-grid">
            <el-form-item label="身份源名称" prop="name" class="name-field">
              <el-input v-model="form.name" placeholder="例如：北京研发中心" />
            </el-form-item>
          </div>
        </div>

        <!-- 动态配置区块 -->
        <div v-if="form.type === IdentitySourceType.LDAP && form.ldap" class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Connection /></el-icon>
              <span>{{ selectedProvider === "ad" ? "域控协议配置" : "目录协议配置" }}</span>
            </div>
          </div>
          <LdapSection v-model="form.ldap" :is-ad="selectedProvider === 'ad'">
            <template #test-connectivity>
              <!-- 连通性测试卡片: 采用紧凑型 Bar 样式 -->
              <div class="test-connection-bar">
                <div class="bar-info">
                  <el-icon><InfoFilled /></el-icon>
                  <span>验证目录服务的连通性，确保配置正确</span>
                </div>
                <el-button :loading="testing" class="premium-test-btn" @click="handleTestConnection">
                  测试连通性
                </el-button>
              </div>
            </template>
          </LdapSection>
        </div>

        <div v-if="form.type === IdentitySourceType.OIDC && form.oidc" class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon">
                <ChatLineRound v-if="selectedProvider === 'feishu'" />
                <Link v-else />
              </el-icon>
              <span>{{ selectedProvider === "feishu" ? "飞书单点登录配置" : "单点登录配置" }}</span>
            </div>
          </div>
          <OidcSection v-model="form.oidc" />
        </div>

        <div v-if="form.type === IdentitySourceType.LOCAL && form.local" class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Lock /></el-icon>
              <span>本地密码安全策略</span>
            </div>
          </div>
          <LocalSection v-model="form.local" />
        </div>

        <div v-if="form.type === IdentitySourceType.PASSKEY && form.passkey" class="form-section">
          <div class="section-title">
            <div class="title-left">
              <el-icon class="section-icon"><Key /></el-icon>
              <span>通行密钥配置</span>
            </div>
          </div>
          <PasskeySection v-model="form.passkey" />
        </div>
      </el-form>
    </div>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import {
  InfoFilled,
  CircleCheckFilled,
  Connection,
  ChatLineRound,
  Link,
  Lock,
  Key,
  Share
} from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { Drawer } from "@@/components/Dialogs"
import { saveIdentitySourceApi, testIdentitySourceApi } from "@/api/iam/identity-source"
import { type IdentitySourceVO, type SaveIdentitySourceReq, IdentitySourceType } from "@/api/iam/identity-source/type"
import {
  createDefaultIdentitySourceForm,
  getProviderConfig,
  getProviderIdFromSource,
  IDENTITY_SOURCE_PROVIDERS,
  type IdentityProviderId
} from "../providerRegistry"

// 导入子区块组件
import LdapSection from "./sections/LdapSection.vue"
import OidcSection from "./sections/OidcSection.vue"
import LocalSection from "./sections/LocalSection.vue"
import PasskeySection from "./sections/PasskeySection.vue"

// NOTE: 该组件为纯 UI 抽屉控制器，使用 defineModel 进行开放/折叠的状态双向绑定
const visible = defineModel<boolean>({ default: false })

const props = defineProps<{
  data?: IdentitySourceVO | null
}>()

const emit = defineEmits<{
  (e: "success"): void
}>()

const formRef = ref<FormInstance>()
const testing = ref(false)
const saving = ref(false)
const selectedProvider = ref<IdentityProviderId>("ad")
const providers = IDENTITY_SOURCE_PROVIDERS
const form = ref<SaveIdentitySourceReq>(createDefaultIdentitySourceForm("ad"))

const isEdit = computed(() => !!props.data)

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  "ldap.url": [{ required: true, message: "请输入服务器地址", trigger: "blur" }],
  "oidc.client_id": [{ required: true, message: "请输入客户端标识", trigger: "blur" }],
  "oidc.client_secret": [{ required: true, message: "请输入客户端密钥", trigger: "blur" }],
  "oidc.auth_url": [{ required: true, message: "请输入授权端点", trigger: "blur" }],
  "oidc.token_url": [{ required: true, message: "请输入令牌端点", trigger: "blur" }],
  "passkey.rp_id": [{ required: true, message: "请输入信赖方标识", trigger: "blur" }],
  "passkey.rp_name": [{ required: true, message: "请输入应用名称", trigger: "blur" }]
}

const selectProvider = (pid: IdentityProviderId) => {
  if (isEdit.value) return
  selectedProvider.value = pid
  Object.assign(form.value, getProviderConfig(pid))
}

const handleTestConnection = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    testing.value = true
    await testIdentitySourceApi(form.value)
    ElMessage.success("连接测试成功")
  } catch (error: any) {
    ElMessage.error(`测试失败: ${error.message || "请检查配置"}`)
  } finally {
    testing.value = false
  }
}

const submit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  saving.value = true
  try {
    await saveIdentitySourceApi(form.value)
    ElMessage.success(isEdit.value ? "更新成功" : "集成成功")
    visible.value = false
    emit("success")
  } catch (error) {
    console.error("保存身份源配置失败:", error)
  } finally {
    saving.value = false
  }
}

// 监听 visible 与 props.data 的变动组合，彻底消除由于接口异步返回滞后带来的数据未渲染 Bug
watch(
  [visible, () => props.data],
  ([isOpen, currentData]) => {
    if (!isOpen) return

    if (currentData) {
      form.value = JSON.parse(JSON.stringify(currentData))
      selectedProvider.value = getProviderIdFromSource(form.value)
    } else {
      selectedProvider.value = "ad"
      form.value = createDefaultIdentitySourceForm("ad")
      nextTick(() => {
        formRef.value?.clearValidate()
      })
    }
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.identity-source-form {
  padding: 8px 18px 16px;
  background: #ffffff;
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 10px;
  width: 100%;
  margin-bottom: 14px;

  .mode-card {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 70px;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
    position: relative;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f8fbff;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 6px 14px rgba(59, 130, 246, 0.08);

      .mode-card__icon {
        background: #ffffff;
        border-color: #bfdbfe;
      }

      .mode-card__title {
        color: #1d4ed8;
      }

      .mode-card__check {
        opacity: 1;
        transform: scale(1);
      }
    }

    &__icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s ease;

      img {
        width: 23px;
        height: 23px;
        object-fit: contain;
      }
    }

    &__body {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
      text-align: left;
    }

    &__title {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      line-height: 1.2;
    }

    &__desc {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__check {
      position: absolute;
      top: 7px;
      right: 7px;
      font-size: 15px;
      opacity: 0;
      color: #3b82f6;
      transform: scale(0.8);
      transition: all 0.2s ease;
    }
  }
}

.governance-form {
  .form-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
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

    .test-connection-bar {
      margin-top: 16px;
      padding: 10px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .bar-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        .el-icon {
          color: #3b82f6;
          font-size: 15px;
        }
      }

      .premium-test-btn {
        background: #ffffff;
        border: 1px solid #d1d5db;
        color: #475569;
        font-weight: 700;
        font-size: 12px;
        border-radius: 6px;
        height: 30px;
        &:hover {
          border-color: #3b82f6;
          color: #3b82f6;
          background: #eff6ff;
        }
      }
    }

    .basic-config-grid {
      display: block;
    }

    .name-field {
      margin-bottom: 0;
    }

    :deep(.section-header) {
      display: none; // 隐藏旧的子组件内部 header
    }

    :deep(.section-divider) {
      height: 1px;
      background: linear-gradient(to right, #f1f5f9, transparent);
      margin: 24px 0;
    }

    :deep(.item-tip) {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #475569;
  padding-bottom: 4px !important;
  font-size: 13px;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  background: #fff;
  height: 36px;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 0 0 1px #cbd5e1 inset;
  }
  &.is-focus {
    box-shadow: 0 0 0 1px #3b82f6 inset !important;
  }
}

@media (max-width: 980px) {
  .mode-selector {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
