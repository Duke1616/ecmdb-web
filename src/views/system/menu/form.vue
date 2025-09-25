<template>
  <div>
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="menu-form"
      label-position="left"
    >
      <!-- 基础设置区域 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><InfoFilled /></el-icon>
          <span>基础设置</span>
        </div>

        <div class="form-row">
          <el-form-item label="菜单类型" prop="type" class="form-item required">
            <el-radio-group v-model="currentType" size="default" class="form-radio-group">
              <el-radio-button
                v-for="item in typeOptions"
                :key="item.label"
                :name="item.name"
                :value="item.label"
                :disabled="item.disabled"
              >
                {{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="上级目录" prop="pid" class="form-item">
            <el-tree-select
              v-model="formData.pid"
              :data="props.menuData"
              node-key="id"
              :render-after-expand="false"
              :expand-on-click-node="false"
              show-checkbox
              check-strictly
              check-on-click-node
              :props="defaultProps"
              placeholder="请选择上级目录"
              clearable
              class="form-input modern-select"
            />
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item :label="showLableName(formData.type)" prop="title" class="form-item required">
            <el-input
              v-model="formData.meta.title"
              :placeholder="`请输入${showLableName(formData.type)}`"
              clearable
              class="form-input"
            />
          </el-form-item>

          <el-form-item v-if="formData.type !== 3" label="菜单图标" prop="icon" class="form-item">
            <el-input v-model="formData.meta.icon" placeholder="请输入菜单图标" clearable class="form-input" />
          </el-form-item>

          <el-form-item v-if="formData.type == 3" label="按钮标识" prop="icon" class="form-item required">
            <el-input v-model="formData.name" placeholder="请输入按钮标识" clearable class="form-input" />
          </el-form-item>
        </div>

        <div class="form-row" v-if="formData.type !== 3">
          <el-form-item label="路由地址" prop="path" class="form-item">
            <el-input v-model="formData.path" placeholder="请输入路由地址" clearable class="form-input" />
          </el-form-item>

          <el-form-item label="路由名称" prop="name" class="form-item">
            <el-input v-model="formData.name" placeholder="请输入路由名称" clearable class="form-input" />
          </el-form-item>
        </div>

        <div class="form-row" v-if="formData.type === 1">
          <el-form-item label="菜单布局" prop="component" class="form-item">
            <el-input v-model="formData.component" placeholder="请输入菜单布局" clearable class="form-input" />
          </el-form-item>

          <el-form-item label="默认跳转" prop="redirect" class="form-item">
            <el-input v-model="formData.redirect" placeholder="请输入默认跳转地址" clearable class="form-input" />
          </el-form-item>
        </div>

        <div class="form-row" v-if="formData.type === 2">
          <el-form-item label="组件路径" prop="component" class="form-item">
            <el-input v-model="formData.component" placeholder="请输入组件路径" clearable class="form-input" />
          </el-form-item>
        </div>
      </div>

      <!-- 功能设置区域 -->
      <div class="form-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>功能设置</span>
        </div>

        <div class="form-row">
          <el-form-item label="菜单排序" prop="sort" class="form-item">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              :max="999"
              placeholder="请输入排序值"
              class="form-input-number"
            />
          </el-form-item>

          <el-form-item label="菜单状态" prop="status" class="form-item required">
            <el-radio-group v-model="currentStatus" class="form-radio-group">
              <el-radio-button
                v-for="item in statusOptions"
                :key="item.label"
                :name="item.name"
                :value="item.label"
                :disabled="item.disabled"
              >
                {{ item.name }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <div class="form-row">
          <el-form-item label="所属平台" prop="meta.platforms" class="form-item required">
            <el-select
              v-model="formData.meta.platforms"
              placeholder="请选择所属平台（可多选）"
              multiple
              clearable
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="2"
              class="form-input modern-select"
            >
              <el-option v-for="platform in platforms" :key="platform.id" :label="platform.name" :value="platform.id">
                <div class="platform-option">
                  <el-icon class="platform-icon" v-if="(platform as any).icon">
                    <component :is="(platform as any).icon" />
                  </el-icon>
                  <span class="platform-name">{{ platform.name }}</span>
                  <span class="platform-desc" v-if="(platform as any).description">{{
                    (platform as any).description
                  }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </div>

        <el-form-item v-if="formData.type !== 3" label="高级选项" prop="meta" class="form-item full-width">
          <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange" class="form-checkbox-group">
            <el-checkbox
              v-for="option in metaOptions"
              :key="option.label"
              :value="option.label"
              :name="option.name"
              :disabled="option.disabled"
            >
              {{ option.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </div>

      <!-- 接口设置区域 -->
      <div class="form-section">
        <div class="section-title">
          <div class="section-left">
            <el-icon><Connection /></el-icon>
            <span>接口设置</span>
          </div>
          <div class="section-actions">
            <el-button type="primary" size="small" @click="openAddApiDialog" :icon="Plus" class="add-api-btn">
              添加接口
            </el-button>
            <el-button
              v-if="selectedEndpoints.length > 0"
              type="danger"
              size="small"
              @click="handleBatchDelete"
              :icon="Delete"
              class="batch-delete-btn"
            >
              批量删除 ({{ selectedEndpoints.length }})
            </el-button>
          </div>
        </div>

        <div class="api-table-container">
          <DataTable
            :data="apiEndpoints"
            :columns="apiTableColumns"
            :actions="apiTableActions"
            :show-pagination="false"
            :show-selection="true"
            @action="(action, row, index) => removeEndpoint(index)"
            @selection-change="handleSelectionChange"
          >
            <!-- 接口方法插槽 -->
            <template #method="{ row }">
              <el-tag :type="getMethodTagType(row.method)" size="small">
                {{ row.method || "N/A" }}
              </el-tag>
            </template>
          </DataTable>
        </div>
      </div>
    </el-form>

    <!-- 添加接口对话框 -->
    <FormDialog
      v-model="dialogVisible"
      title="添加接口"
      subtitle="选择需要添加的接口"
      width="800px"
      header-icon="Connection"
      confirm-text="确认添加"
      cancel-text="取消"
      @confirm="handleDialogConfirm"
      @cancel="closeApiPermission"
      @closed="closeApiPermission"
    >
      <Api ref="apiRef" />
    </FormDialog>
  </div>
</template>

<script lang="ts" setup>
import { createOrUpdateMenuReq, endpoint as menuEndpoint, menu } from "@/api/menu/types/menu"
import { endpoint as apiEndpoint } from "@/api/endpoint/types/endpoint"
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus"
import { ref, computed } from "vue"
import { cloneDeep } from "lodash-es"
import { createMenuApi, updateMenuApi } from "@/api/menu"
import { changeMenuEndpoints } from "@/api/menu/utils"
import { InfoFilled, Setting, Connection, Plus, Delete } from "@element-plus/icons-vue"
import Api from "./api.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import { FormDialog } from "@@/components/Dialogs"
import { getPlatformsForMenu } from "@/common/constants/platforms"

const apiRef = ref<InstanceType<typeof Api>>()
const defaultProps = ref<any>({
  children: "children",
  label: (node: menu) => node.meta.title,
  key: "id"
})

const emits = defineEmits(["listMenusTreeData", "closed"])

interface Props {
  menuData: menu[]
}

const props = defineProps<Props>()

const statusOptions = ref([
  { label: 1, name: "开启", disabled: false },
  { label: 2, name: "停用", disabled: true }
])

const typeOptions = ref([
  { label: 1, name: "目录", disabled: false },
  { label: 2, name: "菜单", disabled: false },
  { label: 3, name: "按钮", disabled: false }
])

const metaOptions = ref([
  { label: "hidden", name: "隐藏菜单", disabled: false },
  { label: "affix", name: "页签固定", disabled: false },
  { label: "keepalive", name: "缓存路由", disabled: false }
])

const platforms = ref(getPlatformsForMenu())

const DEFAULT_FORM_DATA: createOrUpdateMenuReq = {
  type: 1,
  redirect: "",
  path: "",
  status: 1,
  name: "",
  component: "",
  sort: 0,
  meta: {
    title: "",
    is_hidden: false,
    is_affix: false,
    platforms: [],
    is_keepalive: false,
    buttons: []
  },
  endpoints: []
}

const showLableName = (type: number) => {
  if (type === 1) {
    return "目录名称"
  } else if (type === 2) {
    return "菜单名称"
  } else if (type === 3) {
    return "按钮名称"
  }
}

// 获取接口方法标签类型
const getMethodTagType = (method: string | undefined): "success" | "primary" | "warning" | "info" | "danger" => {
  if (!method) return "info"

  const methodMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info"
  }
  return methodMap[method.toUpperCase()] || "info"
}

const closeApiPermission = () => {
  apiRef.value?.resetFilterInput()
  dialogVisible.value = false
}
const checkedCities = ref<string[]>([])
const handleCheckedCitiesChange = (value: any) => {
  metaOptions.value.forEach((option) => {
    switch (option.label) {
      case "hidden":
        formData.value.meta.is_hidden = value.includes(option.label)
        break
      case "affix":
        formData.value.meta.is_affix = value.includes(option.label)
        break
      case "keepalive":
        formData.value.meta.is_keepalive = value.includes(option.label)
        break
    }
  })
}

// API 表格配置
const apiTableColumns = [
  { prop: "path", label: "接口路径", minWidth: 200 },
  { prop: "method", label: "接口方法", width: 120, slot: "method" },
  { prop: "resource", label: "资源标识", minWidth: 150 },
  { prop: "desc", label: "接口介绍", minWidth: 150 }
]

const apiTableActions = [
  {
    key: "delete",
    type: "danger" as const,
    size: "small" as const,
    text: true,
    label: "删除",
    icon: "Delete"
  }
]

// 接口管理
const apiEndpoints = ref<menuEndpoint[]>([])
const selectedEndpoints = ref<menuEndpoint[]>([])

// 初始化接口数据
const initEndpoints = (endpoints: menuEndpoint[] = []) => {
  apiEndpoints.value = [...endpoints]
  selectedEndpoints.value = []
}

// 添加接口
const addEndpoints = async (newEndpoints: apiEndpoint[]) => {
  if (!newEndpoints || newEndpoints.length === 0) {
    ElMessage.warning("请选择要添加的接口")
    return
  }

  if (!formData.value.id) {
    ElMessage.error("请先保存菜单基本信息")
    return
  }

  const convertedEndpoints = newEndpoints.map(convertApiEndpointToMenuEndpoint)
  const uniqueEndpoints = convertedEndpoints.filter((endpoint) => {
    return !apiEndpoints.value.some((existing) => {
      return endpoint.path === existing.path && endpoint.name === existing.name
    })
  })

  if (uniqueEndpoints.length === 0) {
    ElMessage.warning("所选接口已存在，无需重复添加")
    return
  }

  try {
    // 直接调用 change_endpoints 接口新增端点
    await changeMenuEndpoints.add(formData.value.id, uniqueEndpoints)

    // 更新本地数据
    apiEndpoints.value.push(...uniqueEndpoints)
    ElMessage.success("端点添加成功")

    // 触发回调，通知父组件刷新数据
    emits("listMenusTreeData")
  } catch (error) {
    console.error("添加端点失败:", error)
    ElMessage.error("添加端点失败")
  }
}

// 删除接口
const removeEndpoint = async (index: number) => {
  if (!formData.value.id) {
    ElMessage.error("请先保存菜单基本信息")
    return
  }

  const endpointToRemove = apiEndpoints.value[index]
  if (!endpointToRemove) return

  try {
    // 确保被删除的端点包含完整的字段
    const endpointToDelete = {
      name: endpointToRemove.name || "",
      path: endpointToRemove.path || "",
      method: endpointToRemove.method || "",
      resource: endpointToRemove.resource || "",
      desc: endpointToRemove.desc || ""
    }

    // 调用 change_endpoints 接口，传递被删除的端点
    await changeMenuEndpoints.replace(formData.value.id, [endpointToDelete])

    // 从本地数据中移除
    apiEndpoints.value.splice(index, 1)
    ElMessage.success("端点删除成功")

    // 触发回调，通知父组件刷新数据
    emits("listMenusTreeData")
  } catch (error) {
    console.error("删除端点失败:", error)
    ElMessage.error("删除端点失败")
  }
}

// 处理选择变化
const handleSelectionChange = (selection: menuEndpoint[]) => {
  selectedEndpoints.value = selection
}

// 批量删除
const handleBatchDelete = async () => {
  if (!formData.value.id) {
    ElMessage.error("请先保存菜单基本信息")
    return
  }

  if (selectedEndpoints.value.length === 0) {
    ElMessage.warning("请选择要删除的端点")
    return
  }

  try {
    // 确认删除
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedEndpoints.value.length} 个端点吗？`, "批量删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    // 构建要删除的端点列表
    const endpointsToDelete = selectedEndpoints.value.map((endpoint) => ({
      name: endpoint.name || "",
      path: endpoint.path || "",
      method: endpoint.method || "",
      resource: endpoint.resource || "",
      desc: endpoint.desc || ""
    }))

    // 调用 change_endpoints 接口，传递要删除的端点
    await changeMenuEndpoints.replace(formData.value.id, endpointsToDelete)

    // 从本地数据中移除选中的端点
    selectedEndpoints.value.forEach((selected) => {
      const index = apiEndpoints.value.findIndex((ep) => ep.path === selected.path && ep.resource === selected.resource)
      if (index !== -1) {
        apiEndpoints.value.splice(index, 1)
      }
    })

    // 清空选择
    selectedEndpoints.value = []
    ElMessage.success(`成功删除 ${endpointsToDelete.length} 个端点`)

    // 触发回调，通知父组件刷新数据
    emits("listMenusTreeData")
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量删除端点失败:", error)
      ElMessage.error("批量删除端点失败")
    }
  }
}

// 转换 API 接口格式
const convertApiEndpointToMenuEndpoint = (apiEndpoint: apiEndpoint): menuEndpoint => {
  console.log("api", apiEndpoint)
  return {
    name: apiEndpoint.resource || apiEndpoint.path,
    path: apiEndpoint.path,
    method: apiEndpoint.method,
    resource: apiEndpoint.resource,
    desc: apiEndpoint.desc
  }
}

// 打开添加接口对话框
const openAddApiDialog = () => {
  dialogVisible.value = true
}

// 处理对话框确认
const handleDialogConfirm = async () => {
  const selectedEndpoints = apiRef.value?.getSelectionTableData() || []
  await addEndpoints(selectedEndpoints)
  apiRef.value?.clearSelection()
  dialogVisible.value = false
}

const formData = ref<createOrUpdateMenuReq>(cloneDeep(DEFAULT_FORM_DATA))
const formRef = ref<FormInstance | null>(null)
const formRules: FormRules = {
  // title: [{ required: true, message: "名称不能为空" }],
  "meta.platforms": [
    { required: true, message: "请选择所属平台", trigger: "change" },
    { type: "array", min: 1, message: "至少选择一个平台", trigger: "change" }
  ]
}

// 计算属性确保数据同步
const currentType = computed({
  get: () => formData.value.type,
  set: (value) => {
    formData.value.type = value
  }
})

const currentStatus = computed({
  get: () => formData.value.status,
  set: (value) => {
    formData.value.status = value
  }
})

const submitUpdateForm = async () => {
  formRef.value?.validate(async (valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 确保 platforms 字段被正确设置
    if (formData.value.meta) {
      formData.value.meta.platforms = formData.value.meta.platforms || ["cmdb"]
    }

    try {
      // 只更新菜单基本信息，不处理端点
      await updateMenuApi(formData.value)

      ElMessage.success("保存成功")
      resetForm()
      emits("listMenusTreeData")
    } catch (error) {
      console.error("保存失败:", error)
      ElMessage.error("保存失败")
    }
  })
}

const submitCreateForm = async () => {
  formRef.value?.validate(async (valid: boolean, fields: any) => {
    if (!valid) return console.error("表单校验不通过", fields)

    // 确保 platforms 字段被正确设置
    if (formData.value.meta) {
      formData.value.meta.platforms = formData.value.meta.platforms || ["cmdb"]
    }

    try {
      // 1. 创建菜单基本信息
      const response = await createMenuApi(formData.value)
      const menuId = response.data

      // 2. 如果有端点，调用 change_endpoints 接口创建端点
      if (apiEndpoints.value.length > 0 && menuId) {
        await changeMenuEndpoints.create(menuId, apiEndpoints.value)
      }

      ElMessage.success("保存成功")
      resetForm()
      emits("closed", menuId)
      emits("listMenusTreeData")
    } catch (error) {
      console.error("保存失败:", error)
      ElMessage.error("保存失败")
    }
  })
}

// 控制添加API接口的dialog
const dialogVisible = ref<boolean>(false)

// 重置表单
const resetForm = () => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  checkedCities.value = []
  apiEndpoints.value = []
}

// 设置菜单数据
const setMenuData = (form: menu) => {
  formRef.value?.clearValidate()
  formData.value = cloneDeep(form)

  // 确保 type 和 status 是数字类型
  formData.value.type = Number(formData.value.type)
  formData.value.status = Number(formData.value.status)

  // 处理平台数据：如果是单个平台字符串，转换为数组
  if (formData.value.meta) {
    const meta = formData.value.meta as any
    if (typeof meta.platform === "string") {
      formData.value.meta.platforms = [meta.platform]
      delete meta.platform
    } else if (!formData.value.meta.platforms) {
      formData.value.meta.platforms = ["cmdb"]
    }
  }

  // 初始化接口数据
  initEndpoints(formData.value.endpoints || [])

  // 清理空值
  Object.keys(formData.value).forEach((key) => {
    const typedKey = key as keyof typeof formData.value
    if (formData.value[typedKey] === 0 || formData.value[typedKey] === null || formData.value[typedKey] === "") {
      delete formData.value[typedKey]
    }
  })

  // 初始化高级选项的选中状态
  const checkedOptions: string[] = []
  if (formData.value.meta?.is_hidden) checkedOptions.push("hidden")
  if (formData.value.meta?.is_affix) checkedOptions.push("affix")
  if (formData.value.meta?.is_keepalive) checkedOptions.push("keepalive")
  checkedCities.value = checkedOptions
}

// 设置菜单类型
const setMenuType = (type: number) => {
  formData.value.type = type
}

// 设置上级目录
const setFromForPid = (pid: number) => {
  formData.value.pid = pid
}

defineExpose({
  submitCreateForm,
  submitUpdateForm,
  resetForm,
  setMenuData,
  setMenuType,
  setFromForPid,
  initEndpoints
})
</script>

<style lang="scss" scoped>
.menu-form {
  .form-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

      .section-left {
        display: flex;
        align-items: center;
        gap: 6px;

        .el-icon {
          font-size: 14px;
          color: #3b82f6;
        }

        span {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }
      }

      .section-actions {
        display: flex;
        gap: 8px;
        align-items: center;

        .add-api-btn,
        .batch-delete-btn {
          height: 28px;
          font-size: 12px;
          padding: 6px 8px;
          border-radius: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .batch-delete-btn {
          background: #ef4444;
          border-color: #ef4444;
          color: white;

          &:hover {
            background: #dc2626;
            border-color: #dc2626;
          }
        }
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .form-item {
      margin-bottom: 0;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-form-item__label) {
        font-weight: 500;
        color: #374151;
        font-size: 13px;
        position: relative;
        display: flex;
        align-items: center;

        &::before {
          content: "";
          display: inline-block;
          width: 16px;
          flex-shrink: 0;
        }
      }

      &.required {
        :deep(.el-form-item__label) {
          &::before {
            content: "*";
            color: #ef4444;
            font-size: 14px;
            font-weight: 600;
            margin-right: 0;
            display: inline-block;
            width: 16px;
            text-align: center;
          }
        }
      }

      .form-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }

        :deep(.el-input__inner) {
          font-size: 13px;
          color: #374151;
        }
      }

      .form-input-number {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;

          &:hover {
            border-color: #9ca3af;
          }

          &.is-focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
        }
      }

      .form-radio-group {
        :deep(.el-radio-button__inner) {
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #374151;
          font-size: 13px;
          padding: 8px 16px;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3b82f6;
            color: #3b82f6;
          }
        }

        :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
          background: #409eff !important;
          border-color: #409eff !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }

        :deep(.el-radio-button.is-active .el-radio-button__inner) {
          background: #409eff !important;
          border-color: #409eff !important;
          color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }
      }

      .form-checkbox-group {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;

        :deep(.el-checkbox) {
          .el-checkbox__label {
            font-size: 13px;
            color: #374151;
          }
        }
      }

      // 只保留圆角样式
      .modern-select :deep(.el-select__wrapper) {
        border-radius: 10px;
      }

      // 平台选项样式
      .platform-option {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;

        .platform-icon {
          font-size: 16px;
          color: #6366f1;
          flex-shrink: 0;
        }

        .platform-name {
          font-weight: 500;
          color: #374151;
          flex: 1;
        }

        .platform-desc {
          font-size: 12px;
          color: #9ca3af;
          flex-shrink: 0;
        }
      }

      // 多选平台选择器样式
      .modern-select {
        :deep(.el-select__tags) {
          .el-tag {
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            border: 1px solid #bae6fd;
            color: #0369a1;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            padding: 2px 8px;
            margin: 2px 4px 2px 0;

            .el-tag__close {
              color: #0369a1;
              font-size: 12px;
              margin-left: 4px;

              &:hover {
                background: #0369a1;
                color: white;
              }
            }
          }
        }

        :deep(.el-select__placeholder) {
          color: #9ca3af;
          font-size: 13px;
        }

        :deep(.el-select__input) {
          color: #374151;
          font-size: 13px;
        }
      }
    }
  }
}

.api-table-container {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .menu-form-container {
    padding: 0;
  }

  .menu-form {
    .form-section {
      margin-bottom: 24px;
    }
  }
}
</style>
