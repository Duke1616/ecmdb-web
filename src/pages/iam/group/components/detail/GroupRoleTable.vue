<script setup lang="ts">
import { Delete, Plus } from "@element-plus/icons-vue"
import PremiumList from "@@/components/PremiumList/index.vue"
import AssetIdentityCell from "@@/components/AssetIdentityCell/index.vue"
import { usePermission } from "@/common/composables/usePermission"
import { IAM_CAPABILITIES } from "@/common/auth/capability"
import type { GroupRole } from "@/api/iam/group/type"

const { hasPermission } = usePermission()
const selection = defineModel<GroupRole[]>("selection", { default: () => [] })

withDefaults(
  defineProps<{
    loading: boolean
    data: GroupRole[]
    total: number
    currentPage: number
    pageSize: number
    selectable?: (row: GroupRole) => boolean
    canAdd?: boolean
    canRemove?: boolean
    canBatchRemove?: boolean
  }>(),
  {
    canAdd: true,
    canRemove: true,
    canBatchRemove: true
  }
)

const emit = defineEmits<{
  pageChange: [page: number]
  search: [keyword: string]
  add: []
  remove: [row: GroupRole]
  batchRemove: []
}>()
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="绑定角色"
    search-placeholder="搜索角色名称、标识码或描述"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-search="true"
    indicator-color="#3b82f6"
    show-selection
    row-key="code"
    :selectable="selectable"
    empty-text="该用户组暂未绑定角色"
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <template #column-header>
      <div class="role-cols u-gov-label">
        <span>角色名称 / 标识</span>
        <span>角色描述</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <template #header-actions>
      <el-button class="u-gov-btn" :disabled="!canAdd" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>绑定角色</span>
      </el-button>
    </template>

    <template #batch-actions>
      <el-button class="u-gov-btn is-danger" :disabled="!canBatchRemove" @click="emit('batchRemove')">
        <el-icon><Delete /></el-icon>
        <span>批量解绑</span>
      </el-button>
    </template>

    <template #item="{ item: row }">
      <div class="role-grid-row">
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

        <div class="cell-actions">
          <el-button
            type="danger"
            link
            size="small"
            class="delete-btn"
            :disabled="!canRemove"
            @click.stop="emit('remove', row)"
          >
            <el-icon><Delete /></el-icon>
            <span>解绑</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.role-cols,
.role-grid-row {
  display: grid;
  grid-template-columns: 220px minmax(240px, 1fr) 100px;
  gap: 24px;
  width: 100%;
  align-items: center;
}

.role-grid-row {
  min-height: 72px;
}

.align-center,
.cell-actions {
  text-align: center;
}

.desc-text {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}
</style>
