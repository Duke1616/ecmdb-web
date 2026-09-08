<template>
  <div class="form-section">
    <div class="section-title">
      <div class="title-left">
        <el-icon class="section-icon"><DocumentChecked /></el-icon>
        <span>常见系统对接指引</span>
      </div>
    </div>

    <!-- 模式切换卡片组 (统一抽屉卡片选择器) -->
    <div class="system-guide-selector">
      <div
        v-for="guide in guideOptions"
        :key="guide.id"
        class="system-guide-card"
        :class="{ 'is-active': activeGuide === guide.id }"
        @click="activeGuide = guide.id"
      >
        <div class="card-left">
          <span class="guide-title">{{ guide.title }}</span>
          <span class="guide-desc">{{ guide.desc }}</span>
        </div>
        <el-icon class="guide-check"><CircleCheckFilled /></el-icon>
      </div>
    </div>

    <!-- 对应系统的步骤流容器 -->
    <div class="guide-steps-container">
      <!-- GitLab 步骤 -->
      <div v-if="activeGuide === 'gitlab'" class="step-list">
        <div class="guide-step-item">
          <div class="step-badge">1</div>
          <div class="step-detail">
            <div class="step-desc">
              修改 <code>/etc/gitlab/gitlab.rb</code>，在
              <code>gitlab_rails['omniauth_providers']</code> 中追加以下配置段：
            </div>
            <div class="gitlab-code-card">
              <div class="code-card-header">
                <span class="file-name">gitlab.rb</span>
                <el-button link type="primary" size="small" @click="copyField(gitlabConfigSnippet, 'GitLab 配置代码')">
                  <el-icon><CopyDocument /></el-icon>
                  <span>复制代码</span>
                </el-button>
              </div>
              <pre class="code-block mono">{{ gitlabConfigSnippet }}</pre>
            </div>
          </div>
        </div>

        <div class="guide-step-item">
          <div class="step-badge">2</div>
          <div class="step-detail">
            <div class="step-desc">执行命令重载并使配置生效：</div>
            <div class="step-bash-box" @click="copyField('sudo gitlab-ctl reconfigure', '命令')">
              <span class="mono bash-cmd">sudo gitlab-ctl reconfigure</span>
              <el-button link type="primary" class="copy-action-btn">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 阿里云 / 腾讯云 步骤 -->
      <div v-else-if="activeGuide === 'aliyun'" class="step-list">
        <div class="guide-step-item">
          <div class="step-badge">1</div>
          <div class="step-detail">
            <div class="step-desc">下载本站生成的标准 SAML 2.0 EntityDescriptor 元数据文档：</div>
            <div class="step-action-row">
              <el-button size="small" type="primary" :icon="Download" @click="emit('download-metadata')">
                下载元数据 (.xml)
              </el-button>
            </div>
          </div>
        </div>

        <div class="guide-step-item">
          <div class="step-badge">2</div>
          <div class="step-detail">
            <div class="step-desc">
              登录云控制台，进入
              <strong>【访问控制 (RAM)】&gt;【SSO 管理】&gt;【角色 SSO / 用户 SSO】</strong>，选择新建并上传上述
              <code>.xml</code> 文件。
            </div>
          </div>
        </div>

        <div class="guide-step-item">
          <div class="step-badge">3</div>
          <div class="step-detail">
            <div class="step-desc">
              云端将自动解析本站的公钥证书与 SSO 登录地址，开启单点登录后即可分配 RAM 角色权限进行免密登录。
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { DocumentChecked, CircleCheckFilled, CopyDocument, Download } from "@element-plus/icons-vue"
import { copyToClipboard } from "@@/utils/clipboard"
import type { Application, SamlDescriptorResp } from "@/api/iam/idp/type"

interface Props {
  descriptor: SamlDescriptorResp
  displayDescriptor: {
    entity_id: string
    sso_url: string
    metadata_url: string
  }
  app?: Application | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: "download-metadata"): void
}>()

const activeGuide = ref("gitlab")

const guideOptions = [
  { id: "gitlab", title: "GitLab 极狐", desc: "OmniAuth SAML 2.0 互信模版" },
  { id: "aliyun", title: "阿里云 / 腾讯云", desc: "基于标准 XML 元数据的角色 SSO 联邦" }
]

/** 针对 GitLab 自动组装代入当前环境真实参数的配置段代码 */
const gitlabConfigSnippet = computed(() => {
  const acs = props.app?.redirect_uris?.[0] || "https://gitlab.example.com/users/auth/saml/callback"
  const fp = props.descriptor.certificate_fingerprint || "--"
  const sso = props.displayDescriptor.sso_url || "--"
  const clientId = props.app?.client_id || "gitlab"

  return `gitlab_rails['omniauth_providers'] = [
  {
    name: 'saml',
    label: 'ECMDB 单点登录',
    args: {
      assertion_consumer_service_url: '${acs}',
      idp_cert_fingerprint: '${fp}',
      idp_sso_target_url: '${sso}',
      issuer: '${clientId}',
      name_identifier_format: 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified'
    }
  }
]`
})

const copyField = (text?: string, title = "内容") => {
  if (!text) return
  copyToClipboard(text, `已复制 ${title} 到剪贴板`)
}
</script>

<style lang="scss" scoped>
.form-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 22px;
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

/* 下游系统对接选择卡片组 (统一抽屉卡片选择器) */
.system-guide-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;

  .system-guide-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 10px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;

    &:hover {
      border-color: #93c5fd;
      background: #f8fafc;
    }

    &.is-active {
      border-color: #3b82f6;
      background: #eff6ff;

      .guide-title {
        color: #1d4ed8;
      }

      .guide-check {
        opacity: 1;
        color: #3b82f6;
      }
    }

    .card-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;

      .guide-title {
        font-size: 12px;
        font-weight: 600;
        color: #334155;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .guide-desc {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .guide-check {
      font-size: 14px;
      opacity: 0;
      flex-shrink: 0;
      margin-left: 4px;
      transition: opacity 0.2s ease;
    }
  }
}

/* 对接步骤流容器 */
.guide-steps-container {
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  .step-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .guide-step-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    .step-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: #eff6ff;
      color: #2563eb;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .step-detail {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .step-desc {
      font-size: 12px;
      color: #334155;
      line-height: 1.5;

      strong {
        color: #0f172a;
        font-weight: 600;
      }

      code {
        padding: 1px 4px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 3px;
        font-size: 11px;
        color: #0f172a;
        font-family: ui-monospace, monospace;
      }
    }
  }

  .step-bash-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 12px;
    background: #0f172a;
    color: #38bdf8;
    border-radius: 6px;
    font-size: 11px;
    width: 100%;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: #1e293b;

      .copy-action-btn {
        color: #ffffff;
      }
    }

    .bash-cmd {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .copy-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      padding: 0;
      flex-shrink: 0;
      color: #94a3b8;
    }
  }
}

.gitlab-code-card {
  display: flex;
  flex-direction: column;
  border-radius: 6px;
  overflow: hidden;
  background: #0f172a;
  border: 1px solid #1e293b;

  .code-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #1e293b;
    border-bottom: 1px solid #334155;

    .file-name {
      font-size: 11px;
      color: #94a3b8;
      font-family: ui-monospace, monospace;
    }
  }

  .code-block {
    margin: 0;
    padding: 10px 14px;
    color: #38bdf8;
    font-size: 11px;
    line-height: 1.5;
    max-height: 280px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-all;
    background: #090d16;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
