<template>
  <Drawer
    v-model="visible"
    title="SAML 2.0 身份提供商接入中心"
    subtitle="提供企业级 SAML 互信端点、签名证书导出与下游系统接入指引"
    size="600px"
    :header-icon="Document"
    :show-confirm-button="false"
    cancel-button-text="关闭"
    @cancel="visible = false"
  >
    <div v-loading="loading" class="saml-drawer-container">
      <!-- 1. 凭据导出与签名证书 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Key /></el-icon>
            <span>凭据导出与签名证书</span>
          </div>
          <div class="title-right">
            <el-tag size="small" :type="certStatusInfo.type" effect="light">{{ certStatusInfo.text }}</el-tag>
          </div>
        </div>

        <div class="credential-cards-row">
          <!-- 证书卡片 -->
          <div class="hub-card">
            <div class="card-header">
              <div class="card-icon-wrap">
                <el-icon class="card-icon"><Key /></el-icon>
              </div>
              <div class="card-title-group">
                <div class="card-title-row">
                  <span class="card-title">X.509 签名证书</span>
                </div>
                <div class="card-sub-info">
                  用于下游 SP 校验 SAML 登录断言数字签名 · 有效期至 {{ formatCertDate(descriptor.not_after) }}
                </div>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" :icon="Download" @click="handleDownloadCert">
                下载证书 (.crt)
              </el-button>
              <el-button link type="primary" size="small" @click="handleOpenCertDialog"> 查看明文 </el-button>
            </div>
          </div>

          <!-- 元数据卡片 -->
          <div class="hub-card">
            <div class="card-header">
              <div class="card-icon-wrap">
                <el-icon class="card-icon"><DocumentCopy /></el-icon>
              </div>
              <div class="card-title-group">
                <div class="card-title-row">
                  <span class="card-title">SAML 元数据文档</span>
                </div>
                <div class="card-sub-info">标准 EntityDescriptor，支持云厂商一键导入</div>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" :icon="Download" @click="handleDownloadMetadata">
                下载元数据 (.xml)
              </el-button>
              <el-button link type="primary" size="small" @click="handleOpenXmlDialog"> 在线预览 </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. IdP 服务端点参数 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <el-icon class="section-icon"><Connection /></el-icon>
            <span>IdP 服务端点参数</span>
          </div>
          <div class="title-right">
            <span class="title-tip">点击卡槽快速复制</span>
          </div>
        </div>

        <div class="endpoint-params-group">
          <!-- 1. IdP 实体标识 (全宽展示，避免截断) -->
          <div class="endpoint-field-item">
            <div class="field-label-bar">
              <span class="field-label-text">IdP 实体标识</span>
              <span class="field-label-code mono">EntityID / Issuer</span>
            </div>
            <div class="field-input-box" @click="copyField(displayDescriptor.entity_id, 'IdP 实体标识')">
              <span class="field-val-text mono" :title="displayDescriptor.entity_id">
                {{ displayDescriptor.entity_id || "--" }}
              </span>
              <el-button link type="primary" class="field-copy-btn">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>

          <!-- 2. 单点登录服务地址 (全宽展示) -->
          <div class="endpoint-field-item">
            <div class="field-label-bar">
              <span class="field-label-text">单点登录服务地址</span>
              <span class="field-label-code mono">Single Sign-On (SSO) URL</span>
            </div>
            <div class="field-input-box" @click="copyField(displayDescriptor.sso_url, 'SSO 服务地址')">
              <span class="field-val-text mono" :title="displayDescriptor.sso_url">
                {{ displayDescriptor.sso_url || "--" }}
              </span>
              <el-button link type="primary" class="field-copy-btn">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>

          <!-- 3. 证书指纹 (全宽单行，完整展示 SHA-256 哈希) -->
          <div class="endpoint-field-item">
            <div class="field-label-bar">
              <span class="field-label-text">证书指纹 (SHA-256)</span>
              <span class="field-label-code mono">Fingerprint</span>
            </div>
            <div class="field-input-box" @click="copyField(descriptor.certificate_fingerprint, '证书指纹')">
              <span class="field-val-text mono hash-text" :title="descriptor.certificate_fingerprint">
                {{ descriptor.certificate_fingerprint || "--" }}
              </span>
              <el-button link type="primary" class="field-copy-btn">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>

          <!-- 4. NameID 格式 -->
          <div class="endpoint-field-item">
            <div class="field-label-bar">
              <span class="field-label-text">NameID 格式</span>
              <span class="field-label-code mono">NameIDFormat</span>
            </div>
            <div class="field-input-box" @click="copyField(descriptor.name_id_format, 'NameID 格式')">
              <span class="field-val-text mono" :title="descriptor.name_id_format">
                {{ descriptor.name_id_format || "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified" }}
              </span>
              <el-button link type="primary" class="field-copy-btn">
                <el-icon><CopyDocument /></el-icon>
                <span>复制</span>
              </el-button>
            </div>
          </div>

          <!-- 5. 当前对接应用 SP 专属参数卡片 -->
          <div v-if="app" class="sp-binding-section">
            <div class="sp-section-header">
              <div class="sp-header-left">
                <span class="sp-badge">SP 参数</span>
                <span class="sp-app-name">{{ app.name }}</span>
              </div>
              <span class="sp-header-tip">当前对接应用配置</span>
            </div>

            <div class="sp-fields-grid">
              <div class="endpoint-field-item">
                <div class="field-label-bar">
                  <span class="field-label-text">SP 实体标识</span>
                  <span class="field-label-code mono">EntityID / Audience</span>
                </div>
                <div class="field-input-box" @click="copyField(app.client_id, 'SP 实体标识')">
                  <span class="field-val-text mono">{{ app.client_id }}</span>
                  <el-button link type="primary" class="field-copy-btn">
                    <el-icon><CopyDocument /></el-icon>
                    <span>复制</span>
                  </el-button>
                </div>
              </div>

              <div class="endpoint-field-item">
                <div class="field-label-bar">
                  <span class="field-label-text">断言消费地址</span>
                  <span class="field-label-code mono">ACS URL</span>
                </div>
                <div class="field-input-box" @click="copyField(app.redirect_uris?.[0], 'ACS 地址')">
                  <span class="field-val-text mono" :title="app.redirect_uris?.[0]">
                    {{ app.redirect_uris?.[0] || "--" }}
                  </span>
                  <el-button v-if="app.redirect_uris?.[0]" link type="primary" class="field-copy-btn">
                    <el-icon><CopyDocument /></el-icon>
                    <span>复制</span>
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 下游系统对接指引 (抽离为高内聚子组件) -->
      <SamlSystemGuides
        :descriptor="descriptor"
        :display-descriptor="displayDescriptor"
        :app="app"
        @download-metadata="handleDownloadMetadata"
      />
    </div>
  </Drawer>

  <!-- 代码明文与 XML 在线预览弹窗 (抽离为高内聚子组件) -->
  <SamlCodePreviewDialog
    v-model="previewVisible"
    :type="previewType"
    :content="previewType === 'cert' ? descriptor.certificate_pem : metadataXmlContent"
    :loading="previewType === 'xml' && xmlLoading"
    :rotating="rotating"
    @rotate-cert="handleRotateCert"
    @download-cert="handleDownloadCert"
    @download-metadata="handleDownloadMetadata"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed, h } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { Document, Download, DocumentCopy, CopyDocument, Key, Connection } from "@element-plus/icons-vue"
import { Drawer } from "@@/components/Dialogs"
import { copyToClipboard } from "@@/utils/clipboard"
import { getSamlDescriptorApi, rotateSamlCertificateApi } from "@/api/iam/idp"
import type { Application, SamlDescriptorResp } from "@/api/iam/idp/type"
import SamlCodePreviewDialog from "./saml/SamlCodePreviewDialog.vue"
import SamlSystemGuides from "./saml/SamlSystemGuides.vue"

// NOTE: 该组件为纯 UI 引导与凭据导出控制器，状态由父组件统一管理
const visible = defineModel<boolean>({ default: false })

defineProps<{
  app?: Application | null
}>()

// 弹窗预览控制
const previewVisible = ref(false)
const previewType = ref<"cert" | "xml">("cert")
const xmlLoading = ref(false)

const loading = ref(false)
const rotating = ref(false)
const metadataXmlContent = ref("")

/** 证书有效天数与状态计算 */
const certStatusInfo = computed(() => {
  if (!descriptor.value.not_after) return { days: 0, text: "未知", type: "info" as const }
  const expireTime = new Date(descriptor.value.not_after).getTime()
  const now = Date.now()
  const diffDays = Math.ceil((expireTime - now) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) {
    return { days: 0, text: "已过期", type: "danger" as const }
  }
  if (diffDays <= 30) {
    return { days: diffDays, text: `即将到期 (剩余 ${diffDays} 天)`, type: "warning" as const }
  }
  return { days: diffDays, text: `正常 (剩余 ${diffDays} 天)`, type: "success" as const }
})

/** 管理员重新生成/续期证书 */
const handleRotateCert = () => {
  ElMessageBox.confirm(
    h("div", { style: "line-height: 1.6;" }, [
      h(
        "div",
        {
          style: "font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); margin-bottom: 6px;"
        },
        "当前证书将立即失效并被替换。"
      ),
      h(
        "div",
        {
          style: "font-size: 13px; color: var(--el-text-color-secondary);"
        },
        "所有已对接的应用需重新导入新证书，否则单点登录验证将立即中断。"
      )
    ]),
    "重新生成证书？",
    {
      confirmButtonText: "确认重新生成",
      cancelButtonText: "取消",
      type: "warning",
      confirmButtonClass: "el-button--danger",
      autofocus: false
    }
  )
    .then(async () => {
      rotating.value = true
      try {
        const res = await rotateSamlCertificateApi()
        descriptor.value = res.data
        ElMessage.success("SAML 证书已重新生成")
      } catch (err: any) {
        ElMessage.error(err.message || "重新生成证书失败")
      } finally {
        rotating.value = false
      }
    })
    .catch(() => {})
}

const descriptor = ref<SamlDescriptorResp>({
  entity_id: "",
  sso_url: "",
  metadata_url: "",
  certificate_url: "",
  certificate_pem: "",
  certificate_fingerprint: "",
  certificate_subject: "",
  not_before: "",
  not_after: "",
  name_id_format: ""
})

/**
 * 依据浏览器当前实际访问地址（协议 + Host/端口）动态组装对外服务公开端点
 * 参考 websocket 等网络连接策略，避免因后端静态配置（如开发机硬编码 8080）导致预览 404
 */
const resolveEndpointUrl = (url?: string, defaultPath = ""): string => {
  const origin = `${window.location.protocol}//${window.location.host}`
  if (!url) {
    return defaultPath ? `${origin}${defaultPath}` : ""
  }
  try {
    const parsed = new URL(url)
    return `${origin}${parsed.pathname}${parsed.search}`
  } catch {
    return url.startsWith("/") ? `${origin}${url}` : url
  }
}

/** 动态自适应当前前端访问域名的端点描述符 */
const displayDescriptor = computed(() => {
  const d = descriptor.value
  return {
    ...d,
    entity_id: resolveEndpointUrl(d.entity_id, "/saml/metadata"),
    sso_url: resolveEndpointUrl(d.sso_url, "/saml/sso"),
    metadata_url: resolveEndpointUrl(d.metadata_url, "/saml/metadata"),
    certificate_url: resolveEndpointUrl(d.certificate_url, "/saml/certificate")
  }
})

/** 获取 SAML IdP 接入元数据及证书信息 */
const loadDescriptor = async () => {
  loading.value = true
  try {
    const res = await getSamlDescriptorApi()
    descriptor.value = res.data
  } catch (err: any) {
    ElMessage.error(err.message || "获取 SAML 接入配置失败")
  } finally {
    loading.value = false
  }
}

watch(
  () => visible.value,
  (val) => {
    if (val) {
      previewVisible.value = false
      loadDescriptor()
    }
  }
)

const copyField = (text?: string, title = "内容") => {
  if (!text) return
  copyToClipboard(text, `已复制 ${title} 到剪贴板`)
}

/** 触发下载 IdP X.509 证书 */
const handleDownloadCert = () => {
  if (!descriptor.value.certificate_pem) {
    ElMessage.warning("未拉取到有效的证书内容")
    return
  }
  const blob = new Blob([descriptor.value.certificate_pem], { type: "application/x-x509-ca-cert" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "idp-certificate.crt"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success("已下载 IdP 公钥证书 (idp-certificate.crt)")
}

/** 异步拉取元数据 XML 内容 */
const fetchMetadataXml = async () => {
  if (metadataXmlContent.value) return metadataXmlContent.value
  if (!displayDescriptor.value.metadata_url) return ""
  try {
    const res = await fetch(displayDescriptor.value.metadata_url)
    const text = await res.text()
    metadataXmlContent.value = text
    return text
  } catch (err: any) {
    ElMessage.error("拉取元数据文档失败：" + (err.message || "网络异常"))
    return ""
  }
}

/** 打开证书明文预览弹窗 */
const handleOpenCertDialog = () => {
  previewType.value = "cert"
  previewVisible.value = true
}

/** 打开 SAML 元数据 XML 预览 BaseDialog 弹窗 */
const handleOpenXmlDialog = async () => {
  previewType.value = "xml"
  previewVisible.value = true
  if (!metadataXmlContent.value) {
    xmlLoading.value = true
    try {
      await fetchMetadataXml()
    } finally {
      xmlLoading.value = false
    }
  }
}

/** 触发下载 IdP 元数据 XML */
const handleDownloadMetadata = async () => {
  try {
    const xml = await fetchMetadataXml()
    if (!xml) return
    const blob = new Blob([xml], { type: "application/samlmetadata+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "idp-metadata.xml"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success("已下载 SAML 元数据文档 (idp-metadata.xml)")
  } catch {
    if (displayDescriptor.value.metadata_url) {
      window.open(displayDescriptor.value.metadata_url, "_blank")
    }
  }
}

const formatCertDate = (d?: string) => {
  if (!d) return "--"
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
}
</script>

<style lang="scss" scoped>
.saml-drawer-container {
  display: flex;
  flex-direction: column;
  padding: 12px 16px 24px;
  background: #fdfdfe;
}

.form-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 6px 10px;
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

  .title-tip {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 400;
  }
}

/* 凭据双卡片 */
.credential-cards-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.hub-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: #cbd5e1;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;

    .card-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: #eff6ff;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .card-icon {
        font-size: 16px;
      }
    }

    .card-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;

      .card-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .card-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }
      }

      .card-sub-info {
        font-size: 11px;
        color: #64748b;
        line-height: 1.4;
      }
    }
  }

  .card-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 8px;
    border-top: 1px dashed #f1f5f9;
  }
}

/* 端点参数列表 (Top-Label 现代化全宽卡槽) */
.endpoint-params-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.endpoint-field-item {
  display: flex;
  flex-direction: column;
  gap: 5px;

  .field-label-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .field-label-text {
      font-size: 12px;
      font-weight: 600;
      color: #334155;
    }

    .field-label-code {
      font-size: 11px;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
    }
  }

  .field-input-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0 10px;
    transition: all 0.15s ease;
    cursor: pointer;

    &:hover {
      border-color: #93c5fd;
      background: #f8fafc;
      box-shadow: 0 1px 4px rgba(59, 130, 246, 0.08);

      .field-copy-btn {
        color: #1d4ed8;
      }
    }

    .field-val-text {
      flex: 1;
      min-width: 0;
      font-size: 12px;
      color: #0f172a;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      user-select: text;

      &.hash-text {
        font-size: 11px;
        letter-spacing: 0.3px;
      }
    }

    .field-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      flex-shrink: 0;
      margin-left: 8px;
      padding: 0;
      font-size: 11px;
      color: #3b82f6;
    }
  }
}

/* SP 专属参数卡片 */
.sp-binding-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 4px;

  .sp-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .sp-header-left {
      display: flex;
      align-items: center;
      gap: 6px;

      .sp-badge {
        font-size: 11px;
        font-weight: 600;
        color: #2563eb;
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        padding: 1px 6px;
        border-radius: 4px;
      }

      .sp-app-name {
        font-size: 12px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .sp-header-tip {
      font-size: 11px;
      color: #94a3b8;
    }
  }

  .sp-fields-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
