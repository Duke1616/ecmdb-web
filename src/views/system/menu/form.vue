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

        <el-form-item label="所属平台" prop="meta.platforms" class="form-item required full-width">
          <el-checkbox-group v-model="formData.meta.platforms" class="platform-checkbox-group">
            <el-checkbox
              v-for="platform in platforms"
              :key="platform.id"
              :label="platform.id"
              class="platform-checkbox"
            >
              <div class="platform-option">
                <el-icon class="platform-icon" v-if="(platform as any).icon">
                  <component :is="(platform as any).icon" />
                </el-icon>
                <span class="platform-name">{{ platform.name }}</span>
                <span class="platform-desc" v-if="(platform as any).description">{{
                  (platform as any).description
                }}</span>
              </div>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

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
      <ApiManagement
        ref="apiManagementRef"
        :menu-id="formData.id"
        :endpoints="apiEndpoints"
        :is-edit-mode="!!formData.id"
        @update:endpoints="handleEndpointsUpdate"
        @refresh="handleApiRefresh"
      />
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { createOrUpdateMenuReq, endpoint as menuEndpoint, menu } from "@/api/menu/types/menu"
import { ElMessage, FormInstance, FormRules } from "element-plus"
import { ref, computed } from "vue"
import { cloneDeep } from "lodash-es"
import { createMenuApi, updateMenuApi } from "@/api/menu"
import { changeMenuEndpoints } from "@/api/menu/utils"
import { InfoFilled, Setting } from "@element-plus/icons-vue"
import { getPlatformsForMenu } from "@/common/constants/platforms"
import ApiManagement from "./components/ApiManagement.vue"

const apiManagementRef = ref<InstanceType<typeof ApiManagement>>()
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
    is_keepalive: false,
    icon: undefined,
    platforms: ["cmdb"],
    buttons: []
  }
}

// 计算属性用于双向绑定
const currentType = computed({
  get: () => formData.value.type,
  set: (value) => {
    if (formData.value.type !== value) {
      formData.value.type = value
      handleTypeChange(value)
    }
  }
})

const currentStatus = computed({
  get: () => formData.value.status,
  set: (value) => {
    if (formData.value.status !== value) {
      formData.value.status = value
    }
  }
})

// 表单数据
const formData = ref<createOrUpdateMenuReq>(cloneDeep(DEFAULT_FORM_DATA))

// 表单引用
const formRef = ref<FormInstance>()

// 菜单树数据
const menuTreeData = ref<menu[]>([])

// 接口管理
const apiEndpoints = ref<menuEndpoint[]>([])

// 表单验证规则
const formRules: FormRules = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入菜单路径", trigger: "blur" }],
  component: [{ required: true, message: "请输入组件路径", trigger: "blur" }],
  "meta.title": [{ required: true, message: "请输入菜单标题", trigger: "blur" }]
}

// 初始化菜单树数据
const initMenuTreeData = (data: menu[]) => {
  menuTreeData.value = data
}

// 初始化表单数据
const initFormData = (data: createOrUpdateMenuReq) => {
  formData.value = cloneDeep(data)
  // 初始化接口数据
  if (data.endpoints) {
    apiEndpoints.value = [...data.endpoints]
  }
  // 初始化 API 管理组件
  apiManagementRef.value?.initEndpoints(data.endpoints || [])
}

// 设置菜单数据
const setMenuData = (form: menu) => {
  formRef.value?.clearValidate()

  // 先克隆数据，避免直接修改原始数据
  const clonedForm = cloneDeep(form)

  // 确保 type 和 status 是数字类型
  clonedForm.type = Number(clonedForm.type)
  clonedForm.status = Number(clonedForm.status)

  // 处理平台数据：如果是单个平台字符串，转换为数组
  if (clonedForm.meta) {
    const meta = clonedForm.meta as any
    if (typeof meta.platform === "string") {
      clonedForm.meta.platforms = [meta.platform]
      delete meta.platform
    } else if (!clonedForm.meta.platforms) {
      clonedForm.meta.platforms = ["cmdb"]
    }
  }

  // 清理空值
  Object.keys(clonedForm).forEach((key) => {
    const typedKey = key as keyof typeof clonedForm
    if (clonedForm[typedKey] === 0 || clonedForm[typedKey] === null || clonedForm[typedKey] === "") {
      delete clonedForm[typedKey]
    }
  })

  // 最后一次性设置 formData，避免循环更新
  formData.value = clonedForm

  // 初始化接口数据
  if (clonedForm.endpoints) {
    apiEndpoints.value = [...clonedForm.endpoints]
    apiManagementRef.value?.initEndpoints(clonedForm.endpoints)
  } else {
    apiEndpoints.value = []
    apiManagementRef.value?.initEndpoints([])
  }
}

// 重置表单
const resetForm = () => {
  formData.value = cloneDeep(DEFAULT_FORM_DATA)
  apiEndpoints.value = []
  apiManagementRef.value?.initEndpoints([])
}

// 处理类型变化
const handleTypeChange = (type: string | number | boolean | undefined) => {
  const typeNum = Number(type)
  if (typeNum === 1) {
    // 目录
    formData.value.component = ""
    formData.value.redirect = ""
  } else if (typeNum === 2) {
    // 菜单
    formData.value.redirect = ""
  } else if (typeNum === 3) {
    // 按钮
    formData.value.component = ""
    formData.value.redirect = ""
  }
}

// 显示标签名称
const showLableName = (type: number) => {
  if (type === 1) {
    return "目录名称"
  } else if (type === 2) {
    return "菜单名称"
  } else if (type === 3) {
    return "按钮名称"
  }
  return "名称"
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

// 处理接口数据更新
const handleEndpointsUpdate = (endpoints: menuEndpoint[]) => {
  apiEndpoints.value = endpoints
}

// 处理接口刷新
const handleApiRefresh = () => {
  emits("listMenusTreeData")
}

// 设置菜单类型
const setMenuType = (type: number) => {
  formData.value.type = type
}

// 设置父级菜单ID
const setFromForPid = (pid: number) => {
  formData.value.pid = pid
}

// 提交更新表单
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
    }
  })
}

// 提交创建表单
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
    }
  })
}

// 暴露方法给父组件
defineExpose({
  initFormData,
  initMenuTreeData,
  resetForm,
  submitUpdateForm,
  submitCreateForm,
  setMenuData,
  setMenuType,
  setFromForPid
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
      align-items: center;
      gap: 6px;
      margin-bottom: 16px;
      padding: 10px 14px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 6px;
      border-left: 3px solid #3b82f6;

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

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
