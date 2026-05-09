<script setup lang="ts">
import { ref, reactive, watch } from "vue"
import { Connection, Cpu, Rank, InfoFilled, CircleCheckFilled, Monitor, Link, Iphone } from "@element-plus/icons-vue"
import { IdentitySourceType, type SaveIdentitySourceReq, type IdentitySourceVO } from "@/api/iam/identity-source/type"
import { testIdentitySourceApi, saveIdentitySourceApi } from "@/api/iam/identity-source"
import { ElMessage } from "element-plus"

const props = defineProps<{
  initialData?: IdentitySourceVO
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = ref()
const testing = ref(false)
const submitting = ref(false)

const protocols = [
  { key: "ldap", label: "LDAP / AD", value: IdentitySourceType.LDAP, icon: Monitor, desc: "标准目录服务同步" },
  { key: "oidc", label: "OIDC", value: IdentitySourceType.OIDC, icon: Link, desc: "OAuth 2.0 认证", disabled: true },
  { key: "wechat", label: "WeCom", value: IdentitySourceType.OIDC, icon: Iphone, desc: "企业微信扫码", disabled: true }
]

const form = reactive<SaveIdentitySourceReq>({
  id: props.initialData?.id,
  name: props.initialData?.name || "",
  type: props.initialData?.type || IdentitySourceType.LDAP,
  enabled: props.initialData?.enabled ?? true,
  ldap: props.initialData?.ldap
    ? { ...props.initialData.ldap }
    : {
        url: "",
        base_dn: "",
        bind_dn: "",
        bind_password: "",
        username_attribute: "sAMAccountName",
        mail_attribute: "mail",
        display_name_attribute: "displayName",
        title_attribute: "title",
        user_filter: "(objectClass=user)",
        sync_user_filter: ""
      }
})

// --- 监听初始数据变化 ---
watch(
  () => props.initialData,
  (val) => {
    form.id = val?.id
    form.name = val?.name || ""
    form.type = val?.type || IdentitySourceType.LDAP
    form.enabled = val?.enabled ?? true
    if (val?.ldap) {
      form.ldap = { ...val.ldap }
    } else {
      form.ldap = {
        url: "",
        base_dn: "",
        bind_dn: "",
        bind_password: "",
        username_attribute: "sAMAccountName",
        mail_attribute: "mail",
        display_name_attribute: "displayName",
        title_attribute: "title",
        user_filter: "(objectClass=user)",
        sync_user_filter: ""
      }
    }
  },
  { deep: true }
)

const handleTestConnection = async () => {
  if (!form.ldap?.url) return ElMessage.warning("请先填写 LDAP URL")
  testing.value = true
  try {
    await testIdentitySourceApi(form)
    ElMessage.success("连接测试成功")
  } catch (error) {
    // 错误已由全局拦截器处理
  } finally {
    testing.value = false
  }
}

const submit = async () => {
  submitting.value = true
  try {
    await saveIdentitySourceApi(form)
    ElMessage.success("保存成功")
    emit("success")
  } finally {
    submitting.value = false
  }
}

defineExpose({ submit, testing, submitting })
</script>

<template>
  <el-form ref="formRef" :model="form" label-position="top" class="identity-source-form">
    <!-- 1. 基础核心配置 -->
    <div class="form-section">
      <div class="section-title">
        <div class="title-left">
          <el-icon class="section-icon"><Cpu /></el-icon>
          <span>基础核心配置</span>
        </div>
      </div>

      <div class="section-content">
        <el-form-item label="身份源名称" required>
          <el-input v-model="form.name" placeholder="例如：企业内部 AD 域" class="premium-input" />
        </el-form-item>

        <div class="mode-label">集成协议选择</div>
        <div class="mode-selector">
          <div
            v-for="item in protocols"
            :key="item.key"
            class="mode-card"
            :class="{ 'is-active': form.type === item.value, 'is-disabled': item.disabled }"
            @click="!item.disabled && (form.type = item.value)"
          >
            <div class="mode-card__icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="mode-card__body">
              <span class="mode-card__title">{{ item.label }}</span>
              <span class="mode-card__desc">{{ item.desc }}</span>
            </div>
            <el-icon class="mode-card__check"><CircleCheckFilled /></el-icon>
          </div>
        </div>

        <div class="status-control-row">
          <div class="status-info">
            <span class="status-label">启用身份源集成</span>
            <el-tooltip content="开启后，租户成员可以使用此身份源进行登录认证" placement="top">
              <el-icon class="help-icon"><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
          <el-switch v-model="form.enabled" />
        </div>
      </div>
    </div>

    <!-- 2. LDAP 详细配置 -->
    <template v-if="form.type === IdentitySourceType.LDAP">
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Connection /></el-icon>
            <span>连接与鉴权配置</span>
          </div>
        </div>

        <div class="section-content">
          <el-form-item label="LDAP 服务地址" required>
            <el-input v-model="form.ldap!.url" placeholder="ldap://hostname:389" class="premium-input code-font" />
            <div class="input-tip">通常格式为 ldap://&lt;地址&gt;:&lt;端口&gt;</div>
          </el-form-item>

          <div class="flex-row gap-4">
            <el-form-item label="绑定账号" required class="flex-1">
              <el-input
                v-model="form.ldap!.bind_dn"
                placeholder="cn=admin,dc=example..."
                class="premium-input code-font"
              />
            </el-form-item>
            <el-form-item label="绑定密码" required class="flex-1">
              <el-input
                v-model="form.ldap!.bind_password"
                type="password"
                show-password
                placeholder="******"
                class="premium-input"
              />
            </el-form-item>
          </div>

          <el-form-item label="搜索基准" required>
            <el-input
              v-model="form.ldap!.base_dn"
              placeholder="ou=users,dc=example,dc=com"
              class="premium-input code-font"
            />
          </el-form-item>

          <div class="test-connection-bar">
            <div class="bar-info">
              <el-icon><InfoFilled /></el-icon>
              <span>验证目录服务的连通性</span>
            </div>
            <el-button :loading="testing" class="premium-test-btn" @click="handleTestConnection">
              测试连通性
            </el-button>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Rank /></el-icon>
            <span>属性映射与对象过滤</span>
          </div>
        </div>

        <div class="section-content">
          <div class="mapping-grid">
            <el-form-item label="账号属性">
              <el-input v-model="form.ldap!.username_attribute" class="premium-input" />
            </el-form-item>
            <el-form-item label="邮箱属性">
              <el-input v-model="form.ldap!.mail_attribute" class="premium-input" />
            </el-form-item>
            <el-form-item label="显示名">
              <el-input v-model="form.ldap!.display_name_attribute" class="premium-input" />
            </el-form-item>
          </div>

          <el-form-item label="用户对象过滤器">
            <el-input
              v-model="form.ldap!.user_filter"
              placeholder="(objectClass=person)"
              class="premium-input code-font"
            />
          </el-form-item>
          <el-form-item label="同步范围过滤器 (可选)">
            <el-input
              v-model="form.ldap!.sync_user_filter"
              placeholder="例如: (memberOf=...)"
              class="premium-input code-font"
            />
          </el-form-item>
        </div>
      </div>
    </template>
  </el-form>
</template>

<style lang="scss" scoped>
.identity-source-form {
  padding: 12px 16px;
  background: #fdfdfe;
}

.status-control-row {
  margin-top: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e1;
    background: #f1f5f9;
  }

  .status-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .status-label {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
    }

    .help-icon {
      font-size: 14px;
      color: #94a3b8;
      cursor: help;
      &:hover {
        color: #3b82f6;
      }
    }
  }
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
    gap: 8px;
  }

  .section-icon {
    font-size: 15px;
    color: #3b82f6;
  }

  span {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }
}

.section-content {
  padding: 0 4px;
}

.mode-label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.mode-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;

  .mode-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 2px solid #f1f5f9;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #ffffff;
    position: relative;

    &:hover:not(.is-disabled) {
      border-color: #93c5fd;
      background: #f0f7ff;
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
      background: #f8fafc;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);

      .mode-card__icon {
        background: #3b82f6;
        color: #fff;
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
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #64748b;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: left;
    }

    &__title {
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      line-height: 1.2;
    }

    &__desc {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__check {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 12px;
      opacity: 0;
    }
  }
}

.test-connection-bar {
  margin-top: 20px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .bar-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    .el-icon {
      color: #3b82f6;
      font-size: 14px;
    }
  }

  .premium-test-btn {
    background: #ffffff;
    border: 1px solid #d1d5db;
    color: #374151;
    font-weight: 700;
    font-size: 11px;
    border-radius: 6px;
    height: 32px;
    &:hover {
      border-color: #3b82f6;
      color: #3b82f6;
      background: #eff6ff;
    }
  }
}

.mapping-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.input-tip {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 4px;
  font-weight: 500;
}

.code-font :deep(.el-input__inner) {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.flex-row {
  display: flex;
  align-items: center;
}
.gap-4 {
  gap: 12px;
}
.flex-1 {
  flex: 1;
}
.mt-4 {
  margin-top: 12px;
}

/* Premium Input Styling */
:deep(.premium-input) {
  .el-input__wrapper {
    box-shadow: 0 0 0 1px #e2e8f0 inset;
    border-radius: 6px;
    transition: all 0.2s;
    background: #ffffff;
    padding: 4px 10px;
    &.is-focus {
      box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.1),
        0 0 0 1px #3b82f6 inset;
    }
    .el-input__inner {
      font-size: 13px;
      height: 32px;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px !important;
}
</style>
