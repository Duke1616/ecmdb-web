<template>
  <div class="api-manager">
    <!-- 头部区域 -->
    <ManagerHeader title="API 管理" subtitle="管理系统接口和权限配置" @refresh="handleRefresh">
      <template #actions>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 主内容区域 -->
    <DataTable
      :data="endpointsData"
      :columns="tableColumns"
      :show-selection="true"
      :show-pagination="true"
      :total="paginationData.total"
      :page-size="paginationData.pageSize"
      :current-page="paginationData.currentPage"
      :page-sizes="paginationData.pageSizes"
      :pagination-layout="paginationData.layout"
      :table-props="{}"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { usePagination } from "@/common/composables/usePagination"
import { listEndpointApi } from "@/api/endpoint"
import { endpoint } from "@/api/endpoint/types/endpoint"
import { RefreshRight } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

/** 查询模版列表 */
const endpointsData = ref<endpoint[]>([])
const listEndpointsData = () => {
  listEndpointApi({
    path: "",
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      endpointsData.value = data.endpoints
    })
    .catch(() => {
      endpointsData.value = []
    })
    .finally(() => {})
}

/** 刷新数据 */
const handleRefresh = () => {
  listEndpointsData()
  ElMessage.success("数据已刷新")
}

/** 表格列配置 */
const tableColumns = [
  { prop: "path", label: "路径", width: 300, align: "left" as const },
  { prop: "method", label: "方法", align: "center" as const },
  { prop: "is_auth", label: "是否登录", align: "center" as const },
  { prop: "is_permission", label: "是否鉴权", align: "center" as const },
  { prop: "is_audit", label: "是否审计", align: "center" as const },
  { prop: "desc", label: "接口介绍", align: "center" as const }
]

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listEndpointsData, { immediate: true })
</script>

<style lang="scss" scoped>
/* API 管理器容器 */
.api-manager {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  overflow: hidden;
  padding: 20px;
}

/* 按钮样式 */
.refresh-btn {
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(180deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .api-manager {
    padding: 16px;
  }
}
</style>
