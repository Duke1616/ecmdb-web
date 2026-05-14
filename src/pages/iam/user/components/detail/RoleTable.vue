<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import type { Role } from "@/api/iam/role/type"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"

const { hasPermission } = usePermission()

const selection = defineModel<Role[]>("selection", { default: () => [] })

withDefaults(
  defineProps<{
    loading: boolean
    data: Role[]
    total: number
    currentPage: number
    pageSize: number
    formatTimestamp: (ts: string | number) => string
    // 权限控制
    selectable?: (row: Role) => boolean
    canAdd?: boolean
    canUnbind?: boolean
    canBatchUnbind?: boolean
  }>(),
  {
    canAdd: true,
    canUnbind: true,
    canBatchUnbind: true
  }
)

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: Role]
  batchUnbind: []
  search: [keyword: string]
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="关联角色列表"
    search-placeholder="搜索角色名称或标识码..."
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-search="true"
    indicator-color="#3b82f6"
    show-selection
    :selectable="selectable"
    row-key="id"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义 -->
    <template #column-header>
      <div class="gov-table-grid is-header u-gov-label">
        <span>角色名称 / 标识</span>
        <span>角色描述</span>
        <span>关联时间</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 顶部操作 -->
    <template #header-actions>
      <el-button class="u-gov-btn" :disabled="!canAdd" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>分派角色</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button class="u-gov-btn is-danger" :disabled="!canBatchUnbind" @click="emit('batchUnbind')">
        <el-icon><Delete /></el-icon>
        <span>批量移除</span>
      </el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="gov-table-grid is-row">
        <!-- 角色标识 (使用共享组件) -->
        <div class="cell-identity">
          <AssetIdentityCell
            :title="row.name"
            :sub-title="row.code"
            :link-to="
              hasPermission(IAM_CAPABILITIES.Role.Detail)
                ? { name: 'RoleDetail', query: { code: row.code } }
                : undefined
            "
          />
        </div>

        <div class="cell-desc">
          <el-tooltip :content="row.desc" placement="top" :show-after="500" :disabled="!row.desc">
            <span class="desc-text">{{ row.desc || "—" }}</span>
          </el-tooltip>
        </div>

        <div class="cell-time">
          <span class="time-text">{{ row.ctime ? formatTimestamp(row.ctime) : "—" }}</span>
        </div>

        <div class="cell-actions">
          <el-button
            type="danger"
            link
            size="small"
            class="delete-btn"
            :disabled="!canUnbind"
            @click.stop="emit('unbind', row)"
          >
            <el-icon><Delete /></el-icon>
            <span>移除</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>
