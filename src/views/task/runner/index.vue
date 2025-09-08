<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listRunnerData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="runnersData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="worker_name" label="工作节点" align="center" />
          <el-table-column prop="codebook_uid" label="绑定模版" align="center" />
          <el-table-column prop="tags" label="标签" align="center">
            <template #default="scope">
              <el-tag
                v-for="tag in scope.row.tags"
                :key="tag"
                :style="{ marginRight: '5px' }"
                effect="plain"
                type="primary"
              >
                {{ tag }}
              </el-tag>
            </template>
          </el-table-column>
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
    <el-drawer
      class="drawer-header"
      v-model="dialogVisible"
      :show-close="false"
      :with-header="false"
      size="35%"
      @closed="onClosed"
    >
      <!-- 注册Runner -->
      <reigsterRunner ref="runnerApiRef" @callback="listRunnerData" @closed="onClosed" />
      <template #footer>
        <div class="drawer-footer">
          <el-button size="large" @click="dialogVisible = false" class="cancel-btn">
            <el-icon><Close /></el-icon>
            取消
          </el-button>
          <el-button type="primary" size="large" @click="handlerCreateOrUpdagte" class="save-btn">
            <el-icon><Check /></el-icon>
            保存
          </el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { h, nextTick, ref, watch } from "vue"
import { CirclePlus, RefreshRight, Close, Check } from "@element-plus/icons-vue"
import { usePagination } from "@/common/composables/usePagination"
import { runner } from "@/api/runner/types/runner"
import { deleteRunnerApi, listRunnerApi } from "@/api/runner"
import reigsterRunner from "./registerOrUpdate.vue"
import { ElMessage, ElMessageBox } from "element-plus"
const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const runnerApiRef = ref<InstanceType<typeof reigsterRunner>>()
const dialogVisible = ref<boolean>(false)
const title = ref<string>("")

const handlerCreate = () => {
  title.value = "添加执行器"
  dialogVisible.value = true
}

const onClosed = () => {
  runnerApiRef.value?.resetForm()
  dialogVisible.value = false
}

/** 查询模版列表 */
const runnersData = ref<runner[]>([])
const listRunnerData = () => {
  listRunnerApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      runnersData.value = data.runners
    })
    .catch(() => {
      runnersData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: runner) => {
  dialogVisible.value = true
  title.value = "修改执行器"
  nextTick(() => {
    runnerApiRef.value?.setFrom(row)
  })
}

const handlerCreateOrUpdagte = () => {
  runnerApiRef.value?.submitForm()
}

const handleDelete = (row: runner) => {
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
    deleteRunnerApi(row.id).then(() => {
      ElMessage.success("删除成功")
      listRunnerData()
    })
  })
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRunnerData, { immediate: true })
</script>

<style lang="scss">
.drawer-header {
  .el-drawer__header {
    margin: 0;
  }

  .el-drawer__footer {
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
    background: #f8fafc;
  }
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;

  .cancel-btn {
    min-width: 100px;
    height: 44px;
    border-radius: 8px;
    font-weight: 500;
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #6b7280;
    transition: all 0.2s ease;

    &:hover {
      border-color: #9ca3af;
      color: #374151;
      background: #f9fafb;
    }

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }
  }

  .save-btn {
    min-width: 100px;
    height: 44px;
    border-radius: 8px;
    font-weight: 500;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    border: none;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    .el-icon {
      margin-right: 6px;
      font-size: 16px;
    }
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

// 响应式设计
@media (max-width: 768px) {
  .drawer-footer {
    flex-direction: column;
    gap: 8px;

    .cancel-btn,
    .save-btn {
      width: 100%;
      min-width: auto;
    }
  }
}
</style>
