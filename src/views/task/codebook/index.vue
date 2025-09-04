<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listCodebooksData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="codebooksData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="identifier" label="唯一标识" align="center" />
          <el-table-column prop="secret" label="密钥" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleUpdate(scope.row)">修改</el-button>
              <el-button type="danger" text bg size="small" @click="handleDelete(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pager-wrapper">
        <el-pagination
          background
          :layout="paginationData.layout"
          :page-sizes="paginationData.pageSizes"
          :total="paginationData.total"
          :page-size="paginationData.pageSize"
          :currentPage="paginationData.currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    <!-- 新增/编辑模版 -->
    <el-card v-show="addDialogDrawer">
      <WizardContainer
        :steps="codebookSteps"
        :formData="formData"
        :formRules="formRules"
        @update:formData="updateFormData"
        @close="onClosed"
        @save="saveCodebook"
        ref="wizardRef"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { h, ref, watch, computed, nextTick } from "vue"
import { CirclePlus, RefreshRight, Document, Edit } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import WizardContainer from "@@/components/WizardContainer/index.vue"
import { codebook, type createOrUpdateCodebookReq } from "@/api/codebook/types/codebook"
import { cloneDeep } from "lodash-es"
import { deleteCodebookApi, listCodebookApi, createCodebookApi, updateCodebookApi } from "@/api/codebook"
import { ElMessage, ElMessageBox } from "element-plus"
import { findByUsernameApi, findByUserIdApi } from "@/api/user"
import InfoPage from "./modal/info.vue"
import CodePage from "./modal/code.vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()
const addDialogDrawer = ref<boolean>(false)

const wizardRef = ref()

// 向导步骤配置
const codebookSteps = [
  {
    title: "基本信息",
    description: "填写脚本基本信息",
    icon: Document,
    component: InfoPage
  },
  {
    title: "代码编写",
    description: "编写脚本代码",
    icon: Edit,
    component: CodePage
  }
]

// 表单数据
const formData = ref<createOrUpdateCodebookReq>({
  name: "",
  code: "",
  language: "shell",
  owner: 0,
  identifier: ""
})

// 表单验证规则
const formRules = computed(() => {
  const currentStep = wizardRef.value?.currentStep || 0
  if (currentStep === 0) {
    // 基本信息页面验证规则
    return {
      name: [{ required: true, message: "必须输入名称", trigger: "blur" }],
      owner: [{ required: true, message: "必须输入管理员", trigger: "blur" }],
      identifier: [{ required: true, message: "必须输入唯一标识", trigger: "blur" }],
      language: [{ required: true, message: "必须选择脚本语言", trigger: "change" }]
    }
  }
  return {}
})

const codebookRow = ref<codebook>({
  id: 0,
  name: "",
  owner: 0,
  code: "",
  language: "",
  identifier: "",
  secret: ""
})

// 监听弹窗显示状态
watch(
  () => addDialogDrawer.value,
  (val) => {
    if (val) {
      // 重置到第一步
      nextTick(() => {
        wizardRef.value?.setStep(0)
      })
    }
  }
)

// 监听编辑数据
watch(
  () => codebookRow.value,
  async (val) => {
    if (val && addDialogDrawer.value) {
      // 使用 nextTick 避免循环更新
      nextTick(async () => {
        const newFormData = cloneDeep(val)
        // 将用户ID转换为用户名
        if (typeof val.owner === "number") {
          try {
            const userResponse = await findByUserIdApi(val.owner)
            newFormData.owner = userResponse.data.username as any
          } catch (error) {
            console.error("获取用户信息失败:", error)
          }
        }
        formData.value = newFormData
      })
    } else if (!val) {
      // 重置表单数据
      formData.value = {
        name: "",
        code: "",
        language: "shell",
        owner: 0,
        identifier: ""
      }
    }
  },
  { immediate: true }
)

const handlerCreate = () => {
  codebookRow.value = {
    id: 0,
    name: "",
    owner: 0,
    code: "",
    language: "shell",
    identifier: "",
    secret: ""
  }
  addDialogDrawer.value = true
}

const handleUpdate = (row: codebook) => {
  codebookRow.value = cloneDeep(row)
  addDialogDrawer.value = true
}

const onClosed = () => {
  addDialogDrawer.value = false
  listCodebooksData()
}

// 向导相关方法
const updateFormData = (data: createOrUpdateCodebookReq) => {
  formData.value = { ...formData.value, ...data }
}

const saveCodebook = async () => {
  try {
    // 将用户名转换为用户ID
    let ownerId = formData.value.owner
    if (typeof formData.value.owner === "string" && formData.value.owner) {
      const userResponse = await findByUsernameApi(formData.value.owner)
      ownerId = userResponse.data.id
    }

    // 准备提交数据
    const submitData: createOrUpdateCodebookReq = {
      ...formData.value,
      owner: ownerId as number
    }

    const api = formData.value.id ? updateCodebookApi : createCodebookApi
    await api(submitData)

    ElMessage.success("保存成功")
    onClosed()
  } catch (error) {
    console.error("保存失败:", error)
    ElMessage.error("保存失败，请重试")
  }
}

/** 查询模版列表 */
const codebooksData = ref<codebook[]>([])
const listCodebooksData = () => {
  listCodebookApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      codebooksData.value = data.codebooks
    })
    .catch(() => {
      codebooksData.value = []
    })
    .finally(() => {})
}

const handleDelete = (row: codebook) => {
  ElMessageBox({
    title: "删除确认",
    message: h("p", null, [
      h("span", null, "正在删除名称: "),
      h("i", { style: "color: red" }, `${row.name}`),
      h("span", null, " 确认删除？")
    ]),
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    deleteCodebookApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listCodebooksData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listCodebooksData, { immediate: true })
</script>

<style lang="scss">
.add-drawer {
  .el-drawer__header {
    margin: 0;
  }
}
</style>

<style lang="scss" scoped>
.toolbar-wrapper {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.pager-wrapper {
  display: flex;
  justify-content: flex-end;
}

/* WizardContainer 现在自动处理全屏覆盖，无需额外样式 */
</style>
