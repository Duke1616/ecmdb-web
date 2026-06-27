<template>
  <CustomDrawer
    v-model="visible"
    :title="isEdit ? '编辑数据源' : '新增数据源'"
    :subtitle="isEdit ? '修改数据源配置信息' : '添加新的监控数据源'"
    size="35%"
    :before-close="handleBeforeClose"
    @cancel="handleClose"
    @closed="handleClosed"
  >
    <template #header-icon>
      <el-icon><Setting /></el-icon>
    </template>

    <div class="drawer-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        label-width="auto"
        class="datasource-form"
      >
        <!-- 基础信息 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><Setting /></el-icon>
            <span>基础信息</span>
          </div>

          <div class="form-row">
            <el-form-item prop="enabled" class="form-item">
              <div class="status-row">
                <div>
                  <strong>启用数据源</strong>
                  <span>关闭后该数据源将不参与告警查询</span>
                </div>
                <el-switch v-model="formData.enabled" />
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="name" label="数据源名称" class="form-item">
              <el-input v-model="formData.name" placeholder="请输入数据源名称" size="large" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="type" label="数据源类型" class="form-item">
              <div class="type-selector">
                <div
                  v-for="type in datasourceTypes"
                  :key="type.type"
                  class="type-card"
                  :class="{ active: formData.type === type.type }"
                  @click="handleTypeSelect(type.type)"
                >
                  <div class="type-icon">
                    <img :src="getTypeLogo(type.type)" :alt="type.name" class="type-logo" />
                  </div>
                  <div class="type-info">
                    <div class="type-name">{{ type.name }}</div>
                  </div>
                </div>
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="description" label="描述" class="form-item">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入数据源描述"
                size="large"
              />
            </el-form-item>
          </div>
        </div>

        <!-- HTTP 配置 -->
        <div class="form-section">
          <div class="section-title">
            <el-icon class="section-icon"><Monitor /></el-icon>
            <span>HTTP 配置</span>
          </div>

          <div class="form-row">
            <el-form-item prop="http.url" label="连接地址" class="form-item">
              <el-input v-model="formData.http.url" placeholder="请输入数据源连接地址" size="large" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <div class="form-col-group">
              <el-form-item prop="http.timeout" label="超时时间(秒)" class="form-item">
                <el-input-number v-model="formData.http.timeout" :min="1" :max="300" size="large" style="width: 100%" />
              </el-form-item>
              <el-form-item prop="http.dial_timeout" label="连接超时(秒)" class="form-item">
                <el-input-number
                  v-model="formData.http.dial_timeout"
                  :min="1"
                  :max="60"
                  size="large"
                  style="width: 100%"
                />
              </el-form-item>
            </div>
          </div>

          <div class="form-row">
            <div class="connection-options-grid">
              <el-form-item prop="http.tls.skip_tls_verify" class="form-item option-form-item">
                <div
                  class="connection-option-card"
                  :class="{ active: formData.http.tls.skip_tls_verify }"
                  @click="setTlsVerify(!formData.http.tls.skip_tls_verify)"
                >
                  <div class="connection-option-main">
                    <span class="connection-option-icon">
                      <el-icon><Lock /></el-icon>
                    </span>
                    <div class="connection-option-text">
                      <strong>跳过 TLS 验证</strong>
                      <span>证书异常时仍允许连接</span>
                    </div>
                  </div>
                  <el-switch v-model="formData.http.tls.skip_tls_verify" @click.stop />
                </div>
              </el-form-item>

              <el-form-item prop="auth.basic_auth" class="form-item option-form-item">
                <div
                  class="connection-option-card"
                  :class="{ active: formData.auth.basic_auth }"
                  @click="setBasicAuth(!formData.auth.basic_auth)"
                >
                  <div class="connection-option-main">
                    <span class="connection-option-icon">
                      <el-icon><Key /></el-icon>
                    </span>
                    <div class="connection-option-text">
                      <strong>基础认证</strong>
                      <span>使用用户名和密码访问</span>
                    </div>
                  </div>
                  <el-switch v-model="formData.auth.basic_auth" @change="setBasicAuth" @click.stop />
                </div>
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 认证配置 -->
        <div v-if="formData.auth.basic_auth" class="form-section auth-section">
          <div class="section-title">
            <el-icon class="section-icon"><Key /></el-icon>
            <span>认证配置</span>
          </div>

          <div class="form-row">
            <el-form-item prop="auth.basic_auth_user" label="用户名" class="form-item">
              <el-input v-model="formData.auth.basic_auth_user" placeholder="请输入用户名" size="large" clearable />
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="auth.basic_auth_password" label="密码" class="form-item">
              <el-input
                v-model="formData.auth.basic_auth_password"
                type="password"
                placeholder="请输入密码"
                show-password
                size="large"
                clearable
              />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleTestAndSave" :loading="submitLoading">
        {{ isEdit ? "测试并更新" : "测试并保存" }}
      </el-button>
    </template>
  </CustomDrawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue"
import { ElMessage, type FormInstance, type FormRules } from "element-plus"
import { Setting, Monitor, Lock, Key } from "@element-plus/icons-vue"
import type { Datasource, DatasourceType } from "@/api/alert/datasource/types/datasource"
import { DatasourceTypeEnum } from "@/api/alert/datasource/types/datasource"
import { createDatasourceApi, updateDatasourceApi } from "@/api/alert/datasource"
import CustomDrawer from "@@/components/Dialogs/Drawer/index.vue"
import { getDatasourceTypeIcon } from "@/pages/alert/utils/datasourceMeta"

interface Props {
  modelValue: boolean
  datasource?: Datasource | null
  datasourceTypes: DatasourceType[]
}

interface Emits {
  (e: "update:modelValue", value: boolean): void
  (e: "success"): void
}

const props = withDefaults(defineProps<Props>(), {
  datasource: null
})

const emit = defineEmits<Emits>()

// 表单引用
const formRef = ref<FormInstance>()

// 加载状态
const submitLoading = ref(false)

// 是否编辑模式
const isEdit = computed(() => !!props.datasource)

// 抽屉显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value)
})

// 表单数据
const formData = reactive({
  name: "",
  enabled: true,
  type: "" as DatasourceTypeEnum | "",
  description: "",
  http: {
    timeout: 30,
    dial_timeout: 10,
    tls: {
      skip_tls_verify: false
    },
    url: "",
    headers: {}
  },
  auth: {
    basic_auth: false,
    basic_auth_user: "",
    basic_auth_password: ""
  }
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: "请输入数据源名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  type: [{ required: true, message: "请选择数据源类型", trigger: "change" }],
  "http.url": [
    { required: true, message: "请输入连接地址", trigger: "blur" },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value) {
          callback()
          return
        }
        // 支持 http/https 协议，支持 DNS 域名、IP 地址、端口号和路径
        // 示例: https://victoria-metrics:8428/
        const urlPattern =
          /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(:[0-9]{1,5})?(\/.*)?$/
        if (!urlPattern.test(value)) {
          callback(new Error("请输入有效的 URL 地址（支持 DNS 域名和端口号）"))
        } else {
          callback()
        }
      },
      trigger: "blur"
    }
  ],
  "http.timeout": [{ required: true, message: "请输入超时时间", trigger: "blur" }],
  "http.dial_timeout": [{ required: true, message: "请输入连接超时时间", trigger: "blur" }],
  "auth.basic_auth_user": [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
      validator: (rule, value, callback) => {
        if (formData.auth.basic_auth && !value) {
          callback(new Error("启用基础认证时，用户名不能为空"))
        } else {
          callback()
        }
      }
    }
  ],
  "auth.basic_auth_password": [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
      validator: (rule, value, callback) => {
        if (formData.auth.basic_auth && !value) {
          callback(new Error("启用基础认证时，密码不能为空"))
        } else {
          callback()
        }
      }
    }
  ]
}

// 监听抽屉显示状态，初始化表单数据
watch(visible, (newVal) => {
  if (newVal) {
    initFormData()
  }
})

// 初始化表单数据
const initFormData = () => {
  if (isEdit.value && props.datasource) {
    // 编辑模式，填充现有数据
    Object.assign(formData, {
      name: props.datasource.name,
      enabled: props.datasource.enabled,
      type: props.datasource.type,
      description: props.datasource.description,
      http: {
        timeout: props.datasource.http.timeout,
        dial_timeout: props.datasource.http.dial_timeout,
        tls: {
          skip_tls_verify: props.datasource.http.tls.skip_tls_verify
        },
        url: props.datasource.http.url,
        headers: props.datasource.http.headers
      },
      auth: {
        basic_auth: props.datasource.auth.basic_auth,
        basic_auth_user: props.datasource.auth.basic_auth_user,
        basic_auth_password: props.datasource.auth.basic_auth_password
      }
    })
  } else {
    // 新增模式，重置表单
    resetFormData()
  }
}

// 重置表单数据
const resetFormData = () => {
  Object.assign(formData, {
    name: "",
    enabled: true,
    type: "",
    description: "",
    http: {
      timeout: 30,
      dial_timeout: 10,
      tls: {
        skip_tls_verify: false
      },
      url: "",
      headers: {}
    },
    auth: {
      basic_auth: false,
      basic_auth_user: "",
      basic_auth_password: ""
    }
  })
}

// 数据源类型选择处理
const handleTypeSelect = (type: DatasourceTypeEnum) => {
  formData.type = type

  // 根据类型设置默认URL
  const defaultUrls = {
    [DatasourceTypeEnum.PROMETHEUS]: "http://localhost:9090",
    [DatasourceTypeEnum.VICTORIA_METRICS]: "http://localhost:8428",
    [DatasourceTypeEnum.LOKI]: "http://localhost:3100"
  }

  if (defaultUrls[type] && !formData.http.url) {
    formData.http.url = defaultUrls[type]
  }
}

// 获取数据源类型 Logo
const getTypeLogo = (type: DatasourceTypeEnum) => {
  return getDatasourceTypeIcon(type)
}

const setTlsVerify = (enabled: boolean) => {
  formData.http.tls.skip_tls_verify = enabled
}

const setBasicAuth = (value: boolean | string | number) => {
  const enabled = Boolean(value)
  formData.auth.basic_auth = enabled
  if (!enabled) {
    formData.auth.basic_auth_user = ""
    formData.auth.basic_auth_password = ""
    formRef.value?.clearValidate(["auth.basic_auth_user", "auth.basic_auth_password"])
  }
}

// 测试并保存
const handleTestAndSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    submitLoading.value = true

    const submitData = {
      ...(isEdit.value && props.datasource ? { id: props.datasource.id } : {}),
      name: formData.name,
      enabled: formData.enabled,
      type: formData.type as DatasourceTypeEnum,
      description: formData.description,
      http: formData.http,
      auth: formData.auth
    }

    if (isEdit.value) {
      await updateDatasourceApi(submitData)
    } else {
      await createDatasourceApi(submitData)
    }

    ElMessage.success(isEdit.value ? "测试连接成功并更新完成" : "测试连接成功并保存完成")
    emit("success")
    handleClose()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitLoading.value = false
  }
}

// 关闭前处理
const handleBeforeClose = (done: () => void) => {
  if (submitLoading.value) {
    ElMessage.warning("请等待操作完成")
    return
  }
  done()
}

// 关闭抽屉
const handleClose = () => {
  visible.value = false
}

// 抽屉关闭后处理
const handleClosed = () => {
  // 重置表单
  setTimeout(() => {
    formRef.value?.resetFields()
  }, 300)
}
</script>

<style lang="scss" scoped>
.drawer-content {
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 0;
  box-shadow: none;
  height: 100%;
  overflow-y: auto;
}

.datasource-form {
  .form-section {
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.625rem 0.875rem;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-radius: 0.375rem;
    border: 0.0625rem solid #e2e8f0;
    border-left: 0.25rem solid #3b82f6;

    .section-icon {
      margin-right: 0.375rem;
      font-size: 1rem;
      color: #3b82f6;
    }

    span {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
  }

  .form-row {
    margin-bottom: 0.75rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .form-col-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-item {
    margin-bottom: 0;

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.375rem;
      font-size: 0.8125rem;
    }

    :deep(.el-input__wrapper) {
      border-radius: 0.375rem;
      border: 0.0625rem solid #d1d5db;
      box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 0.125rem rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-select__wrapper) {
      border-radius: 0.375rem;
      border: 0.0625rem solid #d1d5db;
      box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
      }

      &.is-focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 0.125rem rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-input-number) {
      width: 100%;

      .el-input__wrapper {
        border-radius: 0.375rem;
        border: 0.0625rem solid #d1d5db;
        box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05);
        transition: all 0.2s ease;

        &:hover {
          border-color: #9ca3af;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.125rem rgba(59, 130, 246, 0.1);
        }
      }
    }

    :deep(.el-textarea__inner) {
      border-radius: 0.375rem;
      border: 0.0625rem solid #d1d5db;
      box-shadow: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;

      &:hover {
        border-color: #9ca3af;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
      }

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 0.125rem rgba(59, 130, 246, 0.1);
      }
    }

    :deep(.el-switch) {
      --el-switch-on-color: #3b82f6;
      --el-switch-off-color: #d1d5db;
    }
  }

  .status-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    min-height: 3.5rem;
    padding: 0.875rem 1rem;
    background: #f8fafc;
    border: 0.0625rem solid #e2e8f0;
    border-radius: 0.625rem;

    div {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    strong {
      color: #1e293b;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    span {
      color: #64748b;
      font-size: 0.75rem;
    }
  }

  .connection-options-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    width: 100%;
  }

  .option-form-item {
    min-width: 0;
  }

  .connection-option-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.875rem;
    width: 100%;
    min-height: 4.25rem;
    padding: 0.875rem 1rem;
    background: #ffffff;
    border: 0.0625rem solid #e2e8f0;
    border-radius: 0.625rem;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      background 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      background: #f8fbff;
      border-color: #bfdbfe;
      box-shadow: 0 0.25rem 0.75rem rgba(15, 23, 42, 0.04);
    }

    &.active {
      background: #eff6ff;
      border-color: #93c5fd;

      .connection-option-icon {
        color: #2563eb;
        background: #dbeafe;
        border-color: #bfdbfe;
      }
    }
  }

  .connection-option-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .connection-option-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 2rem;
    height: 2rem;
    color: #64748b;
    background: #f8fafc;
    border: 0.0625rem solid #e2e8f0;
    border-radius: 0.5rem;
    transition:
      color 0.2s ease,
      background 0.2s ease,
      border-color 0.2s ease;

    .el-icon {
      font-size: 1rem;
    }
  }

  .connection-option-text {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;

    strong {
      color: #1e293b;
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.2;
    }

    span {
      color: #64748b;
      font-size: 0.75rem;
      line-height: 1.35;
    }
  }

  .type-selector {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 0.5rem;
    width: 100%;
  }

  .type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0.75rem 0.5rem;
    border: 0.125rem solid #e2e8f0;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #ffffff;
    min-width: 0;
    min-height: 5rem;
    width: 100%;
    justify-content: center;

    &:hover {
      border-color: #3b82f6;
      box-shadow: 0 0.125rem 0.5rem rgba(59, 130, 246, 0.15);
      transform: translateY(-0.0625rem);
    }

    &.active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0.125rem 0.5rem rgba(59, 130, 246, 0.25);
      transform: translateY(-0.0625rem);
    }

    .type-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      background: #f8fafc;
      border-radius: 0.375rem;
      margin-bottom: 0.375rem;
      padding: 0.125rem;

      .type-logo {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 0.25rem;
      }
    }

    .type-info {
      flex: 1;

      .type-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: #374151;
        line-height: 1.2;
      }
    }
  }
}

@media (max-width: 640px) {
  .datasource-form {
    .form-col-group,
    .connection-options-grid {
      grid-template-columns: 1fr;
    }
  }
}

// 大屏幕优化
@media (min-width: 2000px) {
  .datasource-form {
    .type-selector {
      gap: 0.75rem;
    }

    .type-card {
      padding: 1rem 0.75rem;
      min-height: 5.5rem;

      .type-icon {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        padding: 0.25rem;
      }

      .type-info {
        .type-name {
          font-size: 0.875rem;
        }
      }
    }
  }
}
</style>
