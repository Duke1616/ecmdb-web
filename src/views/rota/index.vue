<template>
  <div class="app-container">
    <el-card shadow="never">
      <div class="toolbar-wrapper">
        <div>
          <el-button type="primary" :icon="CirclePlus" @click="handlerCreate">新增</el-button>
        </div>
        <div>
          <el-tooltip content="刷新当前页">
            <el-button type="primary" :icon="RefreshRight" circle @click="listRotasData" />
          </el-tooltip>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="rotasData">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="name" label="名称" align="center" />
          <el-table-column prop="enabled" label="状态" align="center">
            <template #default="scope">
              <el-tag v-if="scope.row.enabled === true" effect="plain" type="primary">启用</el-tag>
              <el-tag v-else type="info" effect="plain">禁用</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="owner" label="管理员" align="center" />
          <el-table-column prop="desc" label="描述" align="center" />
          <el-table-column fixed="right" label="操作" width="150" align="center">
            <template #default="scope">
              <el-button type="primary" text bg size="small" @click="handleDetailClick(scope.row)">详情</el-button>
              <el-button type="danger" text bg size="small" @click="handleUpdate(scope.row)">删除</el-button>
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

    <div>
      <el-dialog v-model="dialogVisible" title="添加排班" :before-close="onClosed" width="500">
        <createOrUpdate ref="apiRef" @callback="listRotasData" @closed="onClosed" />
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="onClosed">取消</el-button>
            <el-button type="primary" @click="handlerSubmitRota"> 保存 </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue"
import { usePagination } from "@/hooks/usePagination"
import { CirclePlus, RefreshRight } from "@element-plus/icons-vue"
import { rota } from "@/api/rota/types/rota"
import { listRotasApi } from "@/api/rota"
import createOrUpdate from "./createOrUpdate.vue"
import router from "@/router"

const { paginationData, handleCurrentChange, handleSizeChange } = usePagination()

const dialogVisible = ref<boolean>(false)
const apiRef = ref<InstanceType<typeof createOrUpdate>>()

const handleDetailClick = (row: rota) => {
  router.push({
    path: "/cmdb/rota/detail",
    query: { id: row.id }
  })
}

const onClosed = () => {
  apiRef.value?.resetForm()
  dialogVisible.value = false
}

const handlerSubmitRota = () => {
  apiRef.value?.submitForm()
}

const handlerCreate = () => {
  dialogVisible.value = true

  nextTick(() => {
    apiRef.value?.setOwnerForm()
  })
}

/** 查询模版列表 */
const rotasData = ref<rota[]>([])
const listRotasData = () => {
  listRotasApi({
    offset: (paginationData.currentPage - 1) * paginationData.pageSize,
    limit: paginationData.pageSize
  })
    .then(({ data }) => {
      paginationData.total = data.total
      rotasData.value = data.rotas
    })
    .catch(() => {
      rotasData.value = []
    })
    .finally(() => {})
}

const handleUpdate = (row: rota) => {
  console.log(row)
}

/** 监听分页参数的变化 */
watch([() => paginationData.currentPage, () => paginationData.pageSize], listRotasData, { immediate: true })
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
</style>
