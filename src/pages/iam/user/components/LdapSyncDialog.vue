<template>
  <FormDialog
    v-model="visible"
    title="AD/LDAP 域账号镜像与同步"
    width="880px"
    top="10vh"
    :full-height="true"
    :confirm-text="activeSyncText"
    :confirm-loading="syncing"
    :confirm-disabled="selectedUsers.length === 0"
    @confirm="handleSync"
    @cancel="visible = false"
  >
    <div class="ldap-sync-dashboard">
      <!-- 控制台顶部工具条 -->
      <div class="dashboard-toolbar">
        <div class="search-module">
          <el-input
            v-model="searchKeyword"
            placeholder="输入 sAMAccountName 或邮箱进行精确检索"
            class="datagrid-search"
            clearable
            @keyup.enter="handleSearch(true)"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button color="#1e40af" :loading="searching" @click="handleSearch(true)">检索域信息</el-button>
        </div>

        <div class="tools-module">
          <el-tooltip content="重新从 AD/LDAP 服务器拉取基础树" placement="top">
            <el-button plain type="info" :icon="Refresh" @click="handleRefreshCache" :loading="refreshing">
              重建缓存字典
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 数据网格区域 -->
      <div class="datagrid-container">
        <el-table
          ref="tableRef"
          v-loading="searching"
          :data="userList"
          height="100%"
          style="width: 100%"
          :header-cell-style="{
            background: '#f8fafc',
            color: '#64748b',
            fontSize: '11px',
            fontWeight: 700,
            height: '44px'
          }"
          :row-style="{ height: '56px' }"
          row-key="username"
          @selection-change="handleSelectionChange"
        >
          <!-- 选择列 -->
          <el-table-column type="selection" width="50" align="center" reserve-selection />

          <!-- 账号溯源列 -->
          <el-table-column label="平台标识 (Identity)" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="identity-card">
                <div class="avatar-block">{{ row.username.charAt(0).toUpperCase() }}</div>
                <div class="identity-data">
                  <div class="login-id mono">{{ row.username }}</div>
                  <div class="status-indicator">
                    <span class="status-dot" :class="row.is_synced ? 'bg-slate-300' : 'bg-emerald-400'" />
                    <span class="status-text" :class="row.is_synced ? 'text-slate-500' : 'text-emerald-600'">
                      {{ row.is_synced ? "库内已存在 (可更新)" : "新域账号 (待迁入)" }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 个人名片列 -->
          <el-table-column prop="nickname" label="业务名片 (Profile)" min-width="160">
            <template #default="{ row }">
              <span class="profile-name">{{ row.nickname }}</span>
            </template>
          </el-table-column>

          <!-- 邮箱列 -->
          <el-table-column prop="email" label="联系邮箱 (Contact)" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="profile-email">{{ row.email || "--" }}</span>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="在域控制器中未匹配到此身份..." />
          </template>
        </el-table>

        <!-- 扁平化分页器 -->
        <div class="flat-pagination">
          <span class="total-metrics"
            >数据源总量: <strong>{{ total }}</strong> 记录</span
          >
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="sizes, prev, pager, next"
            small
            @size-change="handleSearch(false)"
            @current-change="handleSearch(false)"
          />
        </div>
      </div>
    </div>
  </FormDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { ElMessage } from "element-plus"
import { Search, Refresh } from "@element-plus/icons-vue"
import { FormDialog } from "@@/components/Dialogs"
import { searchLdapUserApi, syncLdapUserApi, refreshLdapCacheApi } from "@/api/iam/user"
import type { LdapSyncUser } from "@/api/iam/user/type"

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: "update:modelValue", val: boolean): void; (e: "success"): void }>()

// 状态映射
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
})

// UI & 加载态
const searching = ref(false)
const syncing = ref(false)
const refreshing = ref(false)

// 数据态
const searchKeyword = ref("")
const userList = ref<LdapSyncUser[]>([])
const selectedUsers = ref<LdapSyncUser[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const tableRef = ref()

// 计算属性
const activeSyncText = computed(() => {
  return selectedUsers.value.length > 0
    ? `确认推送并同步选中的 ${selectedUsers.value.length} 个基准点`
    : "请至少勾选一条数据"
})

// 生命周期与监控
watch(visible, (isOpen) => {
  if (isOpen) {
    if (userList.value.length === 0) handleSearch(true)
  } else {
    // 弹窗关闭时延迟清理状态
    setTimeout(resetState, 300)
  }
})

// 业务方法
const resetState = () => {
  searchKeyword.value = ""
  selectedUsers.value = []
  if (tableRef.value) tableRef.value.clearSelection()
}

const handleSearch = async (resetPage = false) => {
  if (resetPage) currentPage.value = 1
  searching.value = true

  try {
    const { data } = await searchLdapUserApi({
      keywords: searchKeyword.value,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    })
    userList.value = data.users || []
    total.value = data.total || 0
  } catch (error) {
    console.error("LDAP 域检索异常:", error)
  } finally {
    searching.value = false
  }
}

const handleRefreshCache = async () => {
  refreshing.value = true
  try {
    await refreshLdapCacheApi()
    ElMessage.success("底层目录字典已全量更新！")
    handleSearch(true) // 字典更新后强制回溯首页
  } catch (error) {
    console.error("字典重建战队:", error)
  } finally {
    refreshing.value = false
  }
}

const handleSelectionChange = (selection: LdapSyncUser[]) => {
  selectedUsers.value = selection
}

const handleSync = async () => {
  if (selectedUsers.value.length === 0) return
  syncing.value = true

  try {
    await syncLdapUserApi({ users: selectedUsers.value })
    ElMessage.success(`IAM 系统已成功接管 ${selectedUsers.value.length} 个域实体`)
    emit("success")
    visible.value = false
  } catch (error) {
    console.error("实体接管流产:", error)
  } finally {
    syncing.value = false
  }
}
</script>

<style lang="scss" scoped>
.ldap-sync-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding: 4px 0;

  /* 强制锁定 FormDialog 内部 body 行为，使其与内容同步 */
  :deep(.el-dialog__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 24px;
  }

  /* 工具条 UI */
  .dashboard-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;

    .search-module {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 60%;

      .datagrid-search {
        :deep(.el-input__wrapper) {
          box-shadow: none !important;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          &:focus-within {
            border-color: #3b82f6;
            background: #ffffff;
          }
        }
      }
    }
  }

  /* 数据网格 UI */
  .datagrid-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0; /* 关键修复：允许 Flex 子项在受限高度下收缩 */
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;

    :deep(.el-table) {
      /* 移除粗劣边框，采用淡色分割 */
      --el-table-border-color: #f1f5f9;

      .el-table__inner-wrapper::before {
        display: none;
      }

      td.el-table__cell {
        border-bottom: 1px solid #f1f5f9;
      }

      .el-table__row:hover > td.el-table__cell {
        background-color: #f8fafc !important;
      }
    }

    /* 身份组合卡片 */
    .identity-card {
      display: flex;
      align-items: center;
      gap: 12px;

      .avatar-block {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: #1e40af;
        color: white;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
      }

      .identity-data {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .login-id.mono {
          font-family: "Fira Code", monospace;
          font-weight: 700;
          color: #0f172a;
          font-size: 13px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;

          .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
          }
          .status-text {
            font-size: 10px;
            font-weight: 600;
          }

          /* Tailwind-like utils specifically mapped for UI-UX-PRO-MAX */
          .bg-slate-300 {
            background-color: #cbd5e1;
          }
          .bg-emerald-400 {
            background-color: #34d399;
          }
          .text-slate-500 {
            color: #64748b;
          }
          .text-emerald-600 {
            color: #059669;
          }
        }
      }
    }

    /* 基础字段 */
    .profile-name {
      font-weight: 600;
      color: #334155;
    }

    .profile-email {
      font-size: 13px;
      color: #64748b;
    }

    /* 扁平分页器 */
    .flat-pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;

      .total-metrics {
        font-size: 12px;
        color: #64748b;
        strong {
          color: #0f172a;
          font-family: "Fira Code", monospace;
        }
      }
    }
  }
}
</style>
