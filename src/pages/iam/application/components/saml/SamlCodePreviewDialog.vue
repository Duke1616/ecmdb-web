<template>
  <FormDialog
    v-model="visible"
    :title="dialogTitle"
    :subtitle="dialogSubtitle"
    :width="type === 'cert' ? '760px' : '840px'"
    :header-icon="headerIcon"
    :confirm-text="type === 'cert' ? '下载证书 (.crt)' : '下载元数据 (.xml)'"
    :full-height="true"
    :show-footer-info="true"
    :footer-info-text="footerInfoText"
    @confirm="handleDownload"
    @cancel="visible = false"
  >
    <div v-loading="loading" class="code-dialog-body">
      <div class="code-toolbar">
        <span class="file-tag mono">{{ fileName }}</span>
        <div class="toolbar-actions">
          <!-- 证书特有：重新生成 -->
          <el-button
            v-if="type === 'cert'"
            type="danger"
            link
            size="small"
            :icon="Refresh"
            :loading="rotating"
            @click="emit('rotate-cert')"
          >
            重新生成证书
          </el-button>
          <!-- XML 特有：新窗口查看 -->
          <el-button
            v-else-if="type === 'xml'"
            type="primary"
            link
            size="small"
            :icon="TopRight"
            @click="handleOpenNewTab"
          >
            新窗口查看
          </el-button>

          <el-button type="primary" link size="small" :icon="CopyDocument" @click="handleCopy">
            {{ type === "cert" ? "复制证书明文" : "复制元数据 XML" }}
          </el-button>
        </div>
      </div>

      <div class="code-pre-container">
        <pre class="code-pre mono">{{ content || (type === "cert" ? "--" : "正在加载元数据 XML...") }}</pre>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { CopyDocument, Refresh, TopRight, Key, DocumentCopy } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"
import { copyToClipboard } from "@@/utils/clipboard"

// NOTE: 该组件为纯 UI 弹窗组件，显示状态由父组件统一管理
const visible = defineModel<boolean>({ default: false })

interface Props {
  type: "cert" | "xml"
  content: string
  loading?: boolean
  rotating?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rotating: false
})

const emit = defineEmits<{
  (e: "rotate-cert"): void
  (e: "download-cert"): void
  (e: "download-metadata"): void
}>()

const dialogTitle = computed(() => {
  return props.type === "cert" ? "X.509 签名证书明文" : "SAML 2.0 元数据文档在线预览"
})

const dialogSubtitle = computed(() => {
  return props.type === "cert"
    ? "用于下游 SP 校验 SAML 登录断言签名的 X.509 PKIX PEM 格式公钥证书"
    : "包含 EntityID、SSO 登录端点及签名证书的标准 EntityDescriptor 规范契约"
})

const headerIcon = computed(() => {
  return props.type === "cert" ? Key : DocumentCopy
})

const fileName = computed(() => {
  return props.type === "cert" ? "idp-certificate.crt (X.509 PKIX PEM)" : "EntityDescriptor.xml"
})

const footerInfoText = computed(() => {
  return props.type === "cert"
    ? "可一键复制证书明文，或点击右侧导出为 .crt 证书文件"
    : "可一键复制 XML 内容、新窗口预览原生树，或点击右侧下载本地文件"
})

const handleCopy = () => {
  if (!props.content) return
  copyToClipboard(props.content, props.type === "cert" ? "证书明文" : "元数据 XML")
}

const handleDownload = () => {
  if (props.type === "cert") {
    emit("download-cert")
  } else {
    emit("download-metadata")
  }
}

const handleOpenNewTab = () => {
  if (!props.content) return
  const blob = new Blob([props.content], { type: "text/xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  window.open(url, "_blank")
}
</script>

<style lang="scss" scoped>
.code-dialog-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 12px;
  padding: 16px 20px;

  .code-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    flex-shrink: 0;

    .file-tag {
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .code-pre-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 6px;
    overflow: hidden;

    .code-pre {
      margin: 0;
      padding: 14px 16px;
      color: #38bdf8;
      font-size: 11px;
      line-height: 1.6;
      flex: 1;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
