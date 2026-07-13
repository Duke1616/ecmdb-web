<template>
  <FormDialog
    v-model="visible"
    title="新增资源池授权"
    :subtitle="`为 ${poolName || '-'} 配置租户可访问的执行能力`"
    width="540px"
    header-icon="Connection"
    confirm-text="保存授权"
    :confirm-loading="submitLoading"
    :confirm-disabled="bindingLoading || bindingError || isDedicatedOccupied"
    :show-footer-info="false"
    @confirm="handleConfirm"
    @cancel="visible = false"
  >
    <el-form ref="formRef" :model="formModel" :rules="rules" label-position="top">
      <el-alert
        v-if="bindingError"
        title="授权数据加载失败，暂时不能保存。"
        type="error"
        :closable="false"
        show-icon
        class="binding-error-alert"
      >
        <template #default>
          <el-button link type="primary" @click="emit('retry')">重新加载</el-button>
        </template>
      </el-alert>
      <el-alert
        v-if="isDedicatedOccupied"
        title="该专属资源池已授权给其他租户，不能再新增授权。"
        type="warning"
        :closable="false"
        show-icon
        class="dedicated-alert"
      />
      <el-form-item label="授权租户" prop="tenant_id">
        <TenantPicker
          v-model="tenantId"
          :tenants="tenantOptions"
          :search-api="searchTenants"
          :resolve-api="resolveTenant"
          :allow-create="false"
          :disabled="bindingLoading || bindingError"
          placeholder="选择租户或搜索租户 ID"
          variant="element"
          size="default"
        />
      </el-form-item>

      <el-form-item label="Handler" prop="handler_names">
        <el-select
          v-model="handlerNames"
          allow-create
          collapse-tags
          collapse-tags-tooltip
          filterable
          multiple
          class="full-width"
          :disabled="!selectedTenantId || bindingLoading || bindingError"
          :loading="bindingLoading"
          :placeholder="selectedTenantId ? '* 表示整池授权' : '请先选择租户'"
          size="default"
          @change="handleHandlerChange"
        >
          <el-option label="*（整池授权）" value="*" :disabled="isHandlerDisabled('*')" />
          <el-option
            v-for="handler in handlers"
            :key="handler.name"
            :label="handler.name"
            :value="handler.name"
            :disabled="isHandlerDisabled(handler.name)"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="说明">
        <el-input v-model="desc" type="textarea" :rows="3" placeholder="说明这条授权的使用场景" />
      </el-form-item>
    </el-form>
  </FormDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import type { FormInstance, FormRules } from "element-plus"
import { FormDialog } from "@@/components/Dialogs"
import { TenantPicker } from "@@/components/Pickers"
import type { Tenant } from "@/api/iam/user/type"
import type { ExecutionPoolBinding } from "@/api/task/pool/type"
import type { PoolHandler, TenantSelectValue } from "../types"
import { isValidTenantId, normalizeTenantId } from "../utils"

const props = defineProps<{
  poolName: string
  isDedicated: boolean
  handlers: PoolHandler[]
  bindings: ExecutionPoolBinding[]
  bindingLoading: boolean
  bindingError: boolean
  tenantOptions: Tenant[]
  searchTenants: (params: {
    keyword: string
    offset: number
    limit: number
  }) => Promise<{ total: number; data: Tenant[] }>
  resolveTenant: (tenantId: number) => Promise<Tenant | null>
  submitLoading: boolean
}>()

const visible = defineModel<boolean>("modelValue", { required: true })
const tenantId = defineModel<TenantSelectValue>("tenantId", { required: true })
const handlerNames = defineModel<string[]>("handlerNames", { required: true })
const desc = defineModel<string>("desc", { required: true })

const emit = defineEmits<{
  submit: []
  retry: []
}>()

const formRef = ref<FormInstance>()
const formModel = computed(() => ({
  tenant_id: tenantId.value,
  handler_names: handlerNames.value,
  desc: desc.value
}))

const selectedTenantId = computed(() => normalizeTenantId(tenantId.value))

const boundHandlers = computed(() => {
  if (!selectedTenantId.value) return new Set<string>()
  const names = props.bindings
    .filter((binding) => Number(binding.tenant_id) === Number(selectedTenantId.value))
    .map((binding) => binding.handler_name || "*")
  return new Set(names)
})

const hasAnyTenantBinding = computed(() => boundHandlers.value.size > 0)

const isDedicatedOccupied = computed(
  () =>
    props.isDedicated &&
    !!selectedTenantId.value &&
    props.bindings.some((binding) => Number(binding.tenant_id) !== Number(selectedTenantId.value))
)

const rules: FormRules = {
  tenant_id: [
    { required: true, message: "请选择租户", trigger: "change" },
    {
      validator: (_rule, value, callback) => {
        if (!isValidTenantId(value)) {
          callback(new Error("租户 ID 必须是有效数字"))
          return
        }

        void props
          .resolveTenant(Number(value))
          .then((tenant) => callback(tenant ? undefined : new Error("租户不存在或当前账号不可见")))
          .catch(() => callback(new Error("租户校验失败，请稍后重试")))
      },
      trigger: "change"
    }
  ],
  handler_names: [
    {
      validator: (_rule, value, callback) => {
        if (!Array.isArray(value) || value.length === 0) {
          callback(new Error("请选择 Handler"))
          return
        }
        const disabledName = value.find((item) => isHandlerDisabled(item))
        if (disabledName) {
          callback(new Error(`${disabledName} 已授权，请选择其它 Handler`))
          return
        }
        callback()
      },
      trigger: "change"
    }
  ]
}

const handleHandlerChange = (value: string[]) => {
  if (!value.includes("*") || value.length <= 1) return
  const lastValue = value[value.length - 1]
  handlerNames.value = lastValue === "*" ? ["*"] : value.filter((item) => item !== "*")
}

const isHandlerDisabled = (handlerName: string) => {
  if (isDedicatedOccupied.value) return true
  const normalizedName = handlerName || "*"
  if (!selectedTenantId.value) return false
  if (normalizedName === "*") return hasAnyTenantBinding.value
  return boundHandlers.value.has("*") || boundHandlers.value.has(normalizedName)
}

watch([selectedTenantId, boundHandlers], () => {
  handlerNames.value = handlerNames.value.filter((handlerName) => !isHandlerDisabled(handlerName))
  if (selectedTenantId.value && handlerNames.value.length === 0 && !isHandlerDisabled("*")) {
    handlerNames.value = ["*"]
  }
})

const handleConfirm = async () => {
  await formRef.value?.validate()
  emit("submit")
}
</script>

<style scoped lang="scss">
.full-width {
  width: 100%;
}

.dedicated-alert,
.binding-error-alert {
  margin-bottom: 16px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-form-item__label) {
  padding-bottom: 6px;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

:deep(.form-dialog-header .header-icon) {
  color: #2563eb;
  background: #eef4ff;
  border: 1px solid #bfdbfe;
  box-shadow: none;
}

:deep(.form-dialog-header .header-text h3) {
  color: #111827;
  font-weight: 700;
}

:deep(.form-dialog-footer .footer-actions .cancel-btn),
:deep(.form-dialog-footer .footer-actions .confirm-btn) {
  height: 38px;
  border-radius: 6px;
  box-shadow: none;
  transform: none;
}

:deep(.form-dialog-footer .footer-actions .cancel-btn:hover),
:deep(.form-dialog-footer .footer-actions .confirm-btn:hover) {
  transform: none;
}

:deep(.form-dialog-footer .footer-actions .confirm-btn) {
  background: #2563eb;
  border: 1px solid #2563eb;
}

:deep(.form-dialog-footer .footer-actions .confirm-btn:hover) {
  background: #1d4ed8;
  border-color: #1d4ed8;
  box-shadow: none;
}
</style>
