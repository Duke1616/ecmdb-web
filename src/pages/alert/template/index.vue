<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader title="消息通知模板" subtitle="管理告警通知模板" @refresh="loadTemplates">
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建模板 </el-button>
      </template>
    </ManagerHeader>

    <!-- 数据表格 -->
    <DataTable
      :data="templates"
      :columns="tableColumns"
      :show-selection="false"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="tableProps"
      v-loading="loading"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 模板名称插槽 -->
      <template #name="{ row }">
        <div class="template-name-cell">
          <h4 class="name-text">{{ row.name }}</h4>
        </div>
      </template>

      <!-- 渠道类型插槽 -->
      <template #channel="{ row }">
        <div class="channel-cell">
          <el-tag :type="getChannelType(row.channel)" size="small">
            {{ getChannelLabel(row.channel) }}
          </el-tag>
        </div>
      </template>

      <!-- 版本信息插槽 -->
      <template #version="{ row }">
        <div class="version-cell">
          <div class="version-name">{{ getCurrentVersion(row)?.name || "暂无版本" }}</div>
        </div>
      </template>

      <!-- 模板详情插槽 -->
      <template #details="{ row }">
        <div class="details-cell">
          <div class="description-text">
            {{ row.description || "暂无描述" }}
          </div>
        </div>
      </template>

      <!-- 版本数量插槽 -->
      <template #versionCount="{ row }">
        <div class="version-count-cell">
          <el-tag type="info" size="small"> {{ row.versions?.length || 0 }} 个版本 </el-tag>
        </div>
      </template>

      <!-- 操作插槽 -->
      <template #actions="{ row }">
        <OperateBtn :items="getOperateItems(row)" :operate-item="row" :max-length="2" @route-event="operateEvent" />
      </template>
    </DataTable>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { listTemplatesApi, deleteTemplateApi } from "@/api/alert/template"
import type { ChannelTemplate } from "@/api/alert/template/types"
import { usePagination } from "@/common/composables/usePagination"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@/common/components/DataTable/index.vue"
import OperateBtn from "@/common/components/OperateBtn/index.vue"
import { getChannelLabel, getChannelType } from "./config/channels"

// 路由
const router = useRouter()

// 分页
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

// 响应式数据
const templates = ref<ChannelTemplate[]>([])
const loading = ref(false)

// 表格列配置
const tableColumns = [
  {
    prop: "name",
    label: "模板信息",
    slot: "name"
  },
  {
    prop: "channel",
    label: "渠道类型",
    slot: "channel"
  },
  {
    prop: "version",
    label: "当前版本",
    slot: "version"
  },
  {
    prop: "versionCount",
    label: "版本数量",
    slot: "versionCount"
  },
  {
    prop: "details",
    label: "模板详情",
    slot: "details"
  }
]

// 表格属性
const tableProps = {
  height: "calc(100vh - 200px)"
}

// 加载模板数据
const loadTemplates = async () => {
  try {
    loading.value = true
    const response = await listTemplatesApi({
      offset: (paginationData.currentPage - 1) * paginationData.pageSize,
      limit: paginationData.pageSize
    })

    templates.value = response.data.templates || []
    paginationData.total = response.data.total || 0
  } catch (error) {
    console.error("加载模板失败:", error)
    templates.value = []
    paginationData.total = 0
  } finally {
    loading.value = false
  }
}

// 获取当前版本（当前使用版本）
const getCurrentVersion = (template: ChannelTemplate) => {
  if (!template.versions || template.versions.length === 0) return null
  return template.versions.find((v) => v.id === template.activeVersionId) || template.versions[0]
}

// 获取操作按钮配置
const getOperateItems = (_template: ChannelTemplate) => {
  return [
    { name: "编辑", code: "edit", type: "primary" },
    { name: "复制", code: "copy", type: "info" },
    { name: "删除", code: "delete", type: "danger" }
  ]
}

// 操作事件处理
const operateEvent = (template: ChannelTemplate, action: string) => {
  switch (action) {
    case "edit":
      handleEdit(template)
      break
    case "copy":
      handleCopy(template)
      break
    case "delete":
      handleDelete(template)
      break
    default:
      ElMessage.info(`未知操作: ${action}`)
  }
}

// 创建模板
const handleCreate = () => {
  router.push("/alert/template/create")
}

// 编辑模板
const handleEdit = (template: ChannelTemplate) => {
  router.push(`/alert/template/edit/${template.id}`)
}

// 复制模板
const handleCopy = (template: ChannelTemplate) => {
  // 可以通过 query 参数传递复制数据，或者跳转到创建页面并预填充数据
  router.push({
    path: "/alert/template/create",
    query: {
      copy: template.id
    }
  })
}

// 删除模板
const handleDelete = async (template: ChannelTemplate) => {
  try {
    await ElMessageBox.confirm(`确定要删除模板 "${template.name}" 吗？`, "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    })

    await deleteTemplateApi(template.id)

    ElMessage.success("删除成功")
    loadTemplates()
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

// 监听分页变化
watch(
  () => [paginationData.currentPage, paginationData.pageSize],
  () => {
    loadTemplates()
  }
)

// 初始化加载数据
loadTemplates()
</script>

<style lang="scss" scoped>
// 模板名称样式
.template-name-cell {
  .name-text {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.4;
  }

  .description-text {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.3;
  }
}

// 渠道样式
.channel-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 版本样式
.version-cell {
  .version-name {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    margin-bottom: 2px;
  }

  .version-remark {
    font-size: 12px;
    color: #6b7280;
  }
}

// 模板详情样式
.details-cell {
  .description-text {
    font-size: 13px;
    color: #374151;
    line-height: 1.4;
    word-break: break-word;
  }
}

// 版本数量样式
.version-count-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 时间样式
.time-cell {
  font-size: 14px;
  color: #1f2937;
}

// 对话框样式
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
