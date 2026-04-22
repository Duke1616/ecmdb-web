<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { Plus, Delete } from "@element-plus/icons-vue"
import PremiumList from "@/common/components/PremiumList/index.vue"
import type { Role } from "@/api/iam/role/type"

const router = useRouter()
const selection = defineModel<Role[]>("selection", { default: () => [] })
const roleType = ref<number>()

defineProps<{
  loading: boolean
  data: Role[]
  total: number
  currentPage: number
  pageSize: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  add: []
  unbind: [row: Role]
  batchUnbind: []
  search: [keyword: string]
  filterChange: [type?: number]
}>()

const handleViewRole = (row: Role) => {
  router.push({
    name: "RoleDetail",
    query: { code: row.code }
  })
}
</script>

<template>
  <PremiumList
    v-model:selection="selection"
    title="分配角色"
    search-placeholder="搜索角色名称或标识符"
    :data="data"
    :total="total"
    :loading="loading"
    :current-page="currentPage"
    :page-size="pageSize"
    indicator-color="#3b82f6"
    show-selection
    @page-change="emit('pageChange', $event)"
    @search="emit('search', $event)"
  >
    <!-- 表头定义：统一字体样式 -->
    <template #column-header>
      <div class="role-cols header-label-font">
        <span>角色实体</span>
        <span>权限边界描述</span>
        <span class="align-center">类型</span>
        <span class="align-center">操作</span>
      </div>
    </template>

    <!-- 检索扩展 -->
    <template #extra-filters>
      <el-select
        v-model="roleType"
        placeholder="全部类型"
        clearable
        class="role-type-filter"
        @change="emit('filterChange', $event)"
      >
        <el-option label="系统内置" :value="1" />
        <el-option label="自定义" :value="2" />
      </el-select>
    </template>

    <!-- 头部操作 -->
    <template #header-actions>
      <el-button plain class="toolbar-action-btn" @click="emit('add')">
        <el-icon><Plus /></el-icon>
        <span>关联更多角色</span>
      </el-button>
    </template>

    <!-- 批量操作 -->
    <template #batch-actions>
      <el-button type="danger" size="small" @click="emit('batchUnbind')">批量解绑角色</el-button>
    </template>

    <!-- 列表项内容 -->
    <template #item="{ item: row }">
      <div class="role-grid-row">
        <div class="cell-identity">
          <div class="dual-line-info">
            <el-link type="primary" :underline="false" class="main-title" @click="handleViewRole(row)">
              {{ row.name }}
            </el-link>
            <div class="sub-detail">
              <code>{{ row.code }}</code>
            </div>
          </div>
        </div>

        <div class="cell-description">
          <span class="desc-text" :title="row.desc">
            {{ row.desc || "此角色决定了主体的核心访问边界及资源操作权限。" }}
          </span>
        </div>

        <div class="cell-type">
          <el-tag :type="row.type === 1 ? 'info' : 'success'" size="small" effect="plain" class="type-tag">
            {{ row.type === 1 ? "内置" : "自定义" }}
          </el-tag>
        </div>

        <div class="cell-actions">
          <el-button type="danger" link size="small" class="delete-btn" @click.stop="emit('unbind', row)">
            <el-icon><Delete /></el-icon>
            <span>移除</span>
          </el-button>
        </div>
      </div>
    </template>
  </PremiumList>
</template>

<style lang="scss" scoped>
.toolbar-action-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 9px;
  border-color: #3b82f6;
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;

  :deep(.el-icon) {
    margin-right: 6px;
    font-size: 14px;
  }

  &:hover {
    border-color: #2563eb;
    background: #2563eb;
    color: #ffffff;
  }
}

.role-type-filter {
  width: 124px;
}

/* 表头字体统一规范 */
.header-label-font {
  font-size: 12px;
  font-weight: 600;
  color: #8a99ad;
  letter-spacing: 0.01em;
}

.role-cols {
  display: grid;
  grid-template-columns: minmax(260px, 1.3fr) minmax(240px, 1.5fr) 92px 92px;
  gap: 24px;
  width: 100%;
  align-items: center;

  .align-center {
    text-align: center;
  }
}

.role-grid-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.3fr) minmax(240px, 1.5fr) 92px 92px;
  align-items: center;
  gap: 24px;
  min-height: 76px;
  padding: 0 16px;
  margin: 0 -16px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: #f8fafc;
  }
}

.cell-identity {
  display: flex;
  align-items: center;
  min-width: 0;

  .dual-line-info {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    gap: 4px;
    min-width: 0;

    .main-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.15s ease;

      &:hover {
        color: #3b82f6;
      }
    }

    .sub-detail {
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 6px;

      .type-text {
        color: #94a3b8;
        font-weight: 500;
      }

      .divider {
        color: #e2e8f0;
        transform: scaleY(0.8);
      }

      code {
        font-family: ui-monospace, SFMono-Regular, monospace;
        letter-spacing: -0.01em;
      }
    }
  }
}

.cell-description {
  min-width: 0;
  .desc-text {
    font-size: 13px;
    color: #64748b;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.cell-type {
  display: flex;
  justify-content: center;
  .type-tag {
    min-width: 52px;
    border-radius: 999px;
    font-weight: 500;
  }
}

.cell-actions {
  display: flex;
  justify-content: center;
  .delete-btn {
    color: #94a3b8;
    &:hover {
      color: #ef4444;
    }
  }
}

@media (max-width: 1200px) {
  .role-cols,
  .role-grid-row {
    grid-template-columns: minmax(220px, 1.2fr) minmax(200px, 1.4fr) 80px 80px;
    gap: 16px;
  }
}
</style>
