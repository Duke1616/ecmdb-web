<template>
  <PageContainer>
    <!-- 头部区域 -->
    <ManagerHeader
      title="策略管理"
      subtitle="管理系统访问控制策略与权限定义"
      add-button-text="创建策略"
      @add="handleCreate"
      @refresh="handleRefresh"
    >
      <template #actions>
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleCreate"> 创建策略 </el-button>
        <el-tooltip content="刷新数据">
          <el-button type="primary" :icon="RefreshRight" circle class="refresh-btn" @click="handleRefresh" />
        </el-tooltip>
      </template>
    </ManagerHeader>

    <!-- 列表区域 -->
    <DataTable
      :data="policies"
      :columns="tableColumns"
      :show-pagination="true"
      :total="total"
      :page-size="pageSize"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
      <!-- 策略名称 -->
      <template #policyName="{ row }">
        <div class="policy-info">
          <el-icon class="policy-icon" :color="row.type === 1 ? '#409EFF' : '#67C23A'">
            <Lock v-if="row.type === 1" />
            <Document v-else />
          </el-icon>
          <span class="name-text">{{ row.name }}</span>
        </div>
      </template>

      <!-- 标识码 -->
      <template #policyCode="{ row }">
        <el-tag type="info" effect="plain" class="mono-tag">{{ row.code }}</el-tag>
      </template>

      <!-- 类型 -->
      <template #policyType="{ row }">
        <el-tag :type="row.type === 1 ? 'primary' : 'success'" effect="light">
          {{ row.type === 1 ? "系统预设" : "自定义" }}
        </el-tag>
      </template>

      <!-- 操作列 -->
      <template #actions="{ row }">
        <el-button-group>
          <el-tooltip content="编辑策略" placement="top">
            <el-button
              type="primary"
              :icon="Edit"
              circle
              size="small"
              @click="handleEdit(row, (r) => formRef?.setForm(r))"
            />
          </el-tooltip>
          <el-tooltip content="详情 JSON" placement="top">
            <el-button type="info" :icon="View" circle size="small" @click="handleViewJson(row)" />
          </el-tooltip>
          <el-tooltip v-if="row.type !== 1" content="删除策略" placement="top">
            <el-button type="danger" :icon="Delete" circle size="small" @click="handleDelete(row)" />
          </el-tooltip>
        </el-button-group>
      </template>
    </DataTable>

    <!-- 策略编辑弹窗 -->
    <el-drawer
      v-model="drawerVisible"
      :title="isEdit ? '修改权限策略' : '创建权限策略'"
      size="650px"
      direction="rtl"
      destroy-on-close
    >
      <PolicyForm ref="formRef" :is-edit="isEdit" @success="handleSuccess" @cancel="drawerVisible = false" />
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="formRef?.submit()">
            {{ isEdit ? "保存修改" : "立即创建" }}
          </el-button>
        </div>
      </template>
    </el-drawer>

    <!-- JSON 详情弹窗 -->
    <el-dialog v-model="jsonVisible" title="策略详情 (JSON)" width="600px">
      <div class="json-viewer">
        <pre><code>{{ JSON.stringify(selectedPolicy, null, 2) }}</code></pre>
      </div>
    </el-dialog>
  </PageContainer>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { Plus, RefreshRight, Edit, Delete, View, Document, Lock } from "@element-plus/icons-vue"
import PageContainer from "@/common/components/PageContainer/index.vue"
import ManagerHeader from "@/common/components/ManagerHeader/index.vue"
import DataTable from "@@/components/DataTable/index.vue"
import type { Column } from "@@/components/DataTable/types"
import PolicyForm from "./form.vue"
import { usePolicyList } from "./composables/usePolicyList"

const {
  policies,
  total,
  currentPage,
  pageSize,
  drawerVisible,
  isEdit,
  submitting,
  jsonVisible,
  selectedPolicy,
  handleRefresh,
  handleCreate,
  handleEdit,
  handleDelete,
  handleViewJson,
  handleSizeChange,
  handleCurrentChange,
  handleSuccess
} = usePolicyList()

const formRef = ref<InstanceType<typeof PolicyForm>>()

// 表格配置
const tableColumns: Column[] = [
  { label: "策略名称", prop: "", slot: "policyName", minWidth: 180 },
  { label: "标识码", prop: "code", slot: "policyCode", width: 180 },
  { label: "类型", prop: "type", slot: "policyType", width: 120 },
  { label: "描述", prop: "desc", minWidth: 200, showOverflowTooltip: true },
  { label: "操作", prop: "", slot: "actions", width: 150, fixed: "right" as const, align: "center" as const }
]
</script>

<style lang="scss" scoped>
.policy-info {
  display: flex;
  align-items: center;
  gap: 12px;
  .policy-icon {
    font-size: 18px;
  }
  .name-text {
    font-weight: 500;
  }
}

.mono-tag {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f0f0f0;
}

.json-viewer {
  background: #282c34;
  padding: 15px;
  border-radius: 8px;
  max-height: 500px;
  overflow: auto;
  pre {
    margin: 0;
    color: #abb2bf;
    line-height: 1.5;
  }
}
</style>
